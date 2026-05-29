import { db } from "@/lib/db";

// Gamification engine — streak + XP + badges, called fire-and-forget
// from the four sensitive write paths (plan.check, symptoms.save,
// markers.save, onboarding.save). Never throws to the caller; on
// transient DB errors the engine silently no-ops and the next event
// re-computes correctly (everything is derived from append-only state
// plus the current streak row).

// ── Point values ────────────────────────────────────────────────────
// Tuned so that the most common action (checking a daily item) is the
// baseline and rarer / more impactful actions (logging blood markers)
// are worth materially more. All values stable so xp_log entries are
// reconstructible into a fresh total_xp.
const POINTS = {
  "plan.check": 1,           // per individual checkbox flip — capped daily below
  "plan.dayComplete": 10,    // bonus when all daily items done
  "symptom.save": 5,         // per day saved
  "marker.save": 20,         // per day of marker data (rare, valuable)
  "onboarding.save": 0,      // not user-earned XP; just a streak ping
  "cgm.upload": 10,          // per CGM batch (CSV upload OR manual entry)
} as const;

export type XpEventKind = keyof typeof POINTS;

// Daily cap on plan.check so a user fiddling with the checkboxes
// doesn't farm XP. 15 is roughly the visible item count in phase 4.
const PLAN_CHECK_DAILY_CAP = 15;

// XP-per-level curve. Bikman protocol is 90 days; keep the curve gentle
// so the user sees frequent level-ups without explicit numbers.
function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 30)) + 1;
}
function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 30;
}

// ── Badge registry ──────────────────────────────────────────────────
// Each badge has a stable id (don't rename — it lives in user_badges)
// and a `check(userId)` predicate that returns true when the user has
// earned it. The engine queries the predicate after each event and
// inserts on first true.
export interface BadgeDef {
  id: string;
  name_bg: string;
  description_bg: string;
  /** Lucide icon name; UI maps it to the actual component. */
  icon: string;
  check: (userId: string) => Promise<boolean>;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first_check",
    name_bg: "Първа крачка",
    description_bg: "Първа отметка в дневния план.",
    icon: "Footprints",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT 1 FROM xp_log WHERE user_id = ? AND event_kind = ? LIMIT 1",
        args: [userId, "plan.check"],
      });
      return r.rows.length > 0;
    },
  },
  {
    id: "first_marker",
    name_bg: "Първа кръв",
    description_bg: "Първи запис на кръвни маркери.",
    icon: "TestTube",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT 1 FROM xp_log WHERE user_id = ? AND event_kind = ? LIMIT 1",
        args: [userId, "marker.save"],
      });
      return r.rows.length > 0;
    },
  },
  {
    id: "week_streak",
    name_bg: "7 дни в ред",
    description_bg: "Една седмица без прекъсване.",
    icon: "CalendarCheck",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT current_streak FROM user_streaks WHERE user_id = ?",
        args: [userId],
      });
      const s = r.rows[0]?.current_streak;
      return typeof s === "number" && s >= 7;
    },
  },
  {
    id: "month_streak",
    name_bg: "30 дни в ред",
    description_bg: "Един месец постоянство.",
    icon: "Trophy",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT current_streak FROM user_streaks WHERE user_id = ?",
        args: [userId],
      });
      const s = r.rows[0]?.current_streak;
      return typeof s === "number" && s >= 30;
    },
  },
  {
    id: "first_cgm",
    name_bg: "Първи CGM",
    description_bg: "Първи запис на CGM данни — реален или ръчно въведен.",
    icon: "Activity",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT 1 FROM xp_log WHERE user_id = ? AND event_kind = ? LIMIT 1",
        args: [userId, "cgm.upload"],
      });
      return r.rows.length > 0;
    },
  },
  {
    id: "cgm_week",
    name_bg: "CGM седмица",
    description_bg: "7 различни дни с CGM покритие.",
    icon: "LineChart",
    check: async (userId) => {
      // Coverage is computed from cgm_readings directly (one row per day),
      // not from xp_log — a single upload that brought in 14 days of
      // history should immediately count.
      const r = await db.execute({
        sql: "SELECT COUNT(*) AS days FROM cgm_readings WHERE user_id = ?",
        args: [userId],
      });
      return Number(r.rows[0]?.days ?? 0) >= 7;
    },
  },
  {
    id: "ninety_streak",
    name_bg: "Финал",
    description_bg: "Цял 90-дневен протокол без прекъсване.",
    icon: "Award",
    check: async (userId) => {
      const r = await db.execute({
        sql: "SELECT longest_streak FROM user_streaks WHERE user_id = ?",
        args: [userId],
      });
      const s = r.rows[0]?.longest_streak;
      return typeof s === "number" && s >= 90;
    },
  },
];

// ── Streak math ─────────────────────────────────────────────────────
function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

/**
 * Bump the user's streak for `date`. Pure-ish: reads the current row,
 * decides new streak based on the gap, writes back.
 * - Same day as last_active → no-op (no double-increment)
 * - 1 day after last_active → +1
 * - Older gap → reset to 1 (today started a new streak)
 * - First-ever activity → 1
 */
async function bumpStreak(userId: string, date: string): Promise<void> {
  const cur = await db.execute({
    sql: "SELECT current_streak, longest_streak, last_active_date FROM user_streaks WHERE user_id = ?",
    args: [userId],
  });

  if (cur.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO user_streaks
              (user_id, current_streak, longest_streak, last_active_date)
            VALUES (?, 1, 1, ?)`,
      args: [userId, date],
    });
    return;
  }

  const row = cur.rows[0];
  const last = row.last_active_date as string | null;
  const currentStreak = Number(row.current_streak) || 0;
  const longestStreak = Number(row.longest_streak) || 0;

  let nextCurrent: number;
  if (!last) {
    nextCurrent = 1;
  } else {
    const gap = diffDays(last, date);
    if (gap === 0) return; // already counted today
    if (gap === 1) nextCurrent = currentStreak + 1;
    else if (gap < 0) return; // out-of-order write, ignore
    else nextCurrent = 1; // streak broken, restart at 1
  }

  const nextLongest = Math.max(longestStreak, nextCurrent);

  await db.execute({
    sql: `UPDATE user_streaks
            SET current_streak = ?, longest_streak = ?,
                last_active_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?`,
    args: [nextCurrent, nextLongest, date, userId],
  });
}

// ── XP awarding ─────────────────────────────────────────────────────
async function todayCheckXp(userId: string, date: string): Promise<number> {
  const r = await db.execute({
    sql: `SELECT COALESCE(SUM(points), 0) AS total
            FROM xp_log
           WHERE user_id = ? AND event_kind = 'plan.check' AND date = ?`,
    args: [userId, date],
  });
  return Number(r.rows[0]?.total ?? 0);
}

async function awardXp(
  userId: string,
  kind: XpEventKind,
  date: string,
  pointsOverride?: number
): Promise<void> {
  let points = pointsOverride ?? POINTS[kind];
  if (points === 0) return;

  // Daily cap on plan.check so checkbox-mashing doesn't farm XP.
  if (kind === "plan.check") {
    const todaySoFar = await todayCheckXp(userId, date);
    if (todaySoFar >= PLAN_CHECK_DAILY_CAP) return;
    points = Math.min(points, PLAN_CHECK_DAILY_CAP - todaySoFar);
  }

  await db.execute({
    sql: `INSERT INTO xp_log (id, user_id, event_kind, points, date)
          VALUES (?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), userId, kind, points, date],
  });
  await db.execute({
    sql: `INSERT INTO user_streaks (user_id, total_xp, last_active_date)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            total_xp = COALESCE(user_streaks.total_xp, 0) + excluded.total_xp`,
    args: [userId, points, date],
  });
}

// ── Badge awarding ──────────────────────────────────────────────────
async function awardEarnedBadges(userId: string): Promise<void> {
  const owned = await db.execute({
    sql: "SELECT badge_id FROM user_badges WHERE user_id = ?",
    args: [userId],
  });
  const ownedIds = new Set(owned.rows.map((r) => String(r.badge_id)));

  for (const badge of BADGES) {
    if (ownedIds.has(badge.id)) continue;
    if (await badge.check(userId)) {
      try {
        await db.execute({
          sql: `INSERT INTO user_badges (user_id, badge_id)
                VALUES (?, ?)
                ON CONFLICT(user_id, badge_id) DO NOTHING`,
          args: [userId, badge.id],
        });
      } catch {
        /* race: another write awarded the same badge — fine */
      }
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────
/**
 * Called fire-and-forget from server actions after a successful write.
 * Updates streak + XP + checks badges; swallows any error so a
 * gamification glitch never breaks the user's primary write.
 */
export async function recordEvent(
  userId: string,
  kind: XpEventKind,
  date: string,
  // Optional override (e.g. number of items checked → multiply check points)
  pointsOverride?: number
): Promise<void> {
  try {
    await bumpStreak(userId, date);
    await awardXp(userId, kind, date, pointsOverride);
    await awardEarnedBadges(userId);
  } catch {
    /* silent — engine is observability + reward, not a correctness gate */
  }
}

export interface ProgressSnapshot {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badgesEarned: string[]; // badge ids
}

/**
 * Single read for the UI. Returns a zeroed snapshot when the user has
 * no rows yet (new account / anonymous → caller skips the call).
 */
export async function getProgress(userId: string): Promise<ProgressSnapshot> {
  const [streakRes, badgeRes] = await Promise.all([
    db.execute({
      sql: "SELECT current_streak, longest_streak, total_xp FROM user_streaks WHERE user_id = ?",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT badge_id FROM user_badges WHERE user_id = ?",
      args: [userId],
    }),
  ]);

  const s = streakRes.rows[0];
  const totalXp = Number(s?.total_xp ?? 0);
  const level = levelFromXp(totalXp);

  return {
    currentStreak: Number(s?.current_streak ?? 0),
    longestStreak: Number(s?.longest_streak ?? 0),
    totalXp,
    level,
    xpForCurrentLevel: xpForLevel(level),
    xpForNextLevel: xpForLevel(level + 1),
    badgesEarned: badgeRes.rows.map((r) => String(r.badge_id)),
  };
}

// Re-exported for tests so the level curve doesn't drift silently.
export const _internal = { levelFromXp, xpForLevel, POINTS, PLAN_CHECK_DAILY_CAP };
