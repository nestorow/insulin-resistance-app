import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDigest, type CgmDigestStats, type DigestData } from "@/lib/email";
import { getProgress } from "@/lib/gamification";
import { BADGES } from "@/lib/gamification";
import { siteUrl } from "@/lib/site-url";
import { decrypt } from "@/lib/encryption";
import type { CgmReading } from "@/lib/cgm";
import { detectSpikes, timeInRange, variability } from "@/lib/cgm-stats";

// Weekly digest cron — runs Sundays at 16:00 UTC (≈ 18-19 BG).
// Same bearer-token gate as the morning push cron; deny-by-default
// when CRON_SECRET is unset.

export const runtime = "nodejs"; // resend SDK + db client want Node

const SITE_URL = siteUrl();

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Recipients: users who opted in AND have an email.
  const recipients = await db.execute({
    sql: `SELECT id, email, name FROM users
           WHERE email_digest_opt_in = 1 AND email IS NOT NULL`,
  });

  // Map badge_id → name_bg so the email can list earned ones by name
  // without recomputing the registry on every iteration.
  const badgeNames = new Map(BADGES.map((b) => [b.id, b.name_bg]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of recipients.rows) {
    const userId = String(r.id);
    const email = String(r.email);
    const name = r.name == null ? null : String(r.name);

    try {
      const progress = await getProgress(userId);

      // Count symptom log entries in the last 7 days for an "engagement"
      // hint in the email. Cheap query — uses the existing user_date index.
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const symRes = await db.execute({
        sql: `SELECT COUNT(*) AS n FROM symptom_log
               WHERE user_id = ? AND date >= ?`,
        args: [userId, sevenDaysAgo],
      });
      const symptomEntriesLast7d = Number(symRes.rows[0]?.n ?? 0);

      // "New badges this week" = those earned since 7 days ago.
      const badgeRes = await db.execute({
        sql: `SELECT badge_id FROM user_badges
               WHERE user_id = ? AND earned_at >= datetime('now', '-7 days')`,
        args: [userId],
      });
      const newBadges = badgeRes.rows
        .map((b) => badgeNames.get(String(b.badge_id)) ?? null)
        .filter((x): x is string => x !== null);

      // CGM block is optional — fetchCgmStats returns null when the user
      // has no readings in the last 7 days, and the template renders no
      // CGM row in that case.
      const cgm = await fetchCgmStats(userId, sevenDaysAgo);

      const data: DigestData = {
        to: email,
        name,
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        totalXp: progress.totalXp,
        level: progress.level,
        symptomEntriesLast7d,
        newBadges,
        appUrl: SITE_URL,
        cgm: cgm ?? undefined,
      };

      const result = await sendDigest(data);
      if (result.ok) sent++;
      else if ("skipped" in result) skipped++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}

/**
 * Pull encrypted CGM blobs for the last 7 days, decrypt, then run the
 * pure-function stat helpers from cgm-stats.ts. Returns null when the
 * user has no readings in the window — the email simply omits the CGM
 * row, no special-casing in the template.
 *
 * Cheap query — the (user_id, date DESC) index makes it a small scan.
 */
async function fetchCgmStats(
  userId: string,
  sinceDate: string
): Promise<CgmDigestStats | null> {
  const res = await db.execute({
    sql: `SELECT encrypted_payload
            FROM cgm_readings
           WHERE user_id = ? AND date >= ?`,
    args: [userId, sinceDate],
  });
  if (res.rows.length === 0) return null;

  const readings: CgmReading[] = [];
  for (const row of res.rows) {
    try {
      const day = JSON.parse(
        decrypt(String(row.encrypted_payload))
      ) as CgmReading[];
      for (const r of day) readings.push(r);
    } catch {
      // skip bad rows — never block the digest on one corrupt blob
    }
  }
  if (readings.length === 0) return null;
  readings.sort((a, b) => a.ts.localeCompare(b.ts));

  const t = timeInRange(readings);
  const v = variability(readings);
  const spikes = detectSpikes(readings);
  const daysCovered = new Set(readings.map((r) => r.ts.slice(0, 10))).size;

  return {
    tirPct: t.tir,
    meanMgdl: Math.round(v.mean),
    cvPct: Math.round(v.cv),
    spikeCount: spikes.length,
    daysCovered,
  };
}
