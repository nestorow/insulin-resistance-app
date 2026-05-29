"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import type { CgmReading } from "@/lib/cgm";

// GDPR Article 20 ("right to data portability") + general user-trust:
// one server action that bundles everything we know about the user
// into a single JSON document. Decrypts every encrypted blob server-
// side so the export is human-readable and doesn't require the user
// to re-derive the AES key.
//
// What's NOT included:
//   - Anthropic API key (sensitive credential; the user holds it
//     elsewhere and can re-enter on a new account)
//   - Audit log (administrative; not "their data" in the GDPR sense)
//   - Push subscription endpoints (device-specific, not portable)
//
// Versioned shape so a future import path can detect format drift.
// Note: in a "use server" file only async functions can be exported,
// so the version constant is defined locally and inlined into the
// response payload below.

const EXPORT_VERSION = 1;

export interface UserExport {
  version: number;
  exportedAt: string;
  userEmail: string;
  onboarding: unknown;
  symptoms: unknown[];
  markers: unknown[];
  dailyPlan: { date: string; tasks: unknown }[];
  cgmReadings: CgmReading[];
  cgmAnnotations: Record<string, string>;
  dayAnnotations: Record<string, string>;
  gamification: {
    currentStreak: number;
    longestStreak: number;
    totalXp: number;
    badgesEarned: string[];
    xpLog: { event: string; points: number; date: string; createdAt: string }[];
  };
}

export async function exportUserDataAction(): Promise<UserExport | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [
    userRow,
    onboardingRow,
    symptomsRows,
    markersRows,
    planRows,
    cgmRows,
    cgmAnnRow,
    dayAnnRow,
    streakRow,
    badgeRows,
    xpRows,
  ] = await Promise.all([
    db.execute({
      sql: "SELECT email FROM users WHERE id = ?",
      args: [userId],
    }),
    db.execute({
      sql: `SELECT lens, quiz_yes_count, quiz_answers, diet_tier,
                   tg_hdl_ratio, whr, recommended_sequence, created_at
              FROM onboarding WHERE user_id = ?
             ORDER BY created_at DESC LIMIT 1`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT date, energy, brain_fog, weight, waist, blood_sugar, notes
              FROM symptom_log WHERE user_id = ? ORDER BY date ASC`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT date, encrypted_data,
                   homa_ir, fasting_insulin, hba1c, triglycerides, hdl
              FROM blood_markers WHERE user_id = ? ORDER BY date ASC`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT date, tasks_completed FROM daily_plan
             WHERE user_id = ? ORDER BY date ASC`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT date, encrypted_payload FROM cgm_readings
             WHERE user_id = ? ORDER BY date ASC`,
      args: [userId],
    }),
    db.execute({
      sql: "SELECT encrypted_payload FROM cgm_annotations WHERE user_id = ?",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT encrypted_payload FROM day_annotations WHERE user_id = ?",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT current_streak, longest_streak, total_xp FROM user_streaks WHERE user_id = ?",
      args: [userId],
    }),
    db.execute({
      sql: "SELECT badge_id FROM user_badges WHERE user_id = ?",
      args: [userId],
    }),
    db.execute({
      sql: `SELECT event_kind, points, date, created_at FROM xp_log
             WHERE user_id = ? ORDER BY created_at ASC`,
      args: [userId],
    }),
  ]);

  const onboarding = onboardingRow.rows[0]
    ? {
        lens: onboardingRow.rows[0].lens,
        quizYesCount: onboardingRow.rows[0].quiz_yes_count,
        quizAnswers: tryParse(onboardingRow.rows[0].quiz_answers as string),
        dietTier: onboardingRow.rows[0].diet_tier,
        tgHdlRatio: onboardingRow.rows[0].tg_hdl_ratio,
        whr: onboardingRow.rows[0].whr,
        recommendedSequence: tryParse(
          onboardingRow.rows[0].recommended_sequence as string
        ),
        createdAt: onboardingRow.rows[0].created_at,
      }
    : null;

  const symptoms = symptomsRows.rows.map((r) => ({
    date: r.date,
    energy: r.energy,
    brainFog: r.brain_fog,
    weight: r.weight,
    waist: r.waist,
    bloodSugar: r.blood_sugar,
    notes: r.notes,
  }));

  const markers = markersRows.rows.map((r) => {
    if (r.encrypted_data) {
      try {
        const p = JSON.parse(decrypt(String(r.encrypted_data)));
        return { date: r.date, ...p };
      } catch {
        // fall through to plaintext
      }
    }
    return {
      date: r.date,
      homaIr: r.homa_ir,
      fastingInsulin: r.fasting_insulin,
      hba1c: r.hba1c,
      triglycerides: r.triglycerides,
      hdl: r.hdl,
    };
  });

  const dailyPlan = planRows.rows.map((r) => ({
    date: String(r.date),
    tasks: tryParse((r.tasks_completed as string) ?? "{}"),
  }));

  const cgmReadings: CgmReading[] = [];
  for (const row of cgmRows.rows) {
    try {
      const day = JSON.parse(
        decrypt(String(row.encrypted_payload))
      ) as CgmReading[];
      cgmReadings.push(...day);
    } catch {
      /* skip undecryptable */
    }
  }
  cgmReadings.sort((a, b) => a.ts.localeCompare(b.ts));

  const cgmAnnotations = cgmAnnRow.rows[0]
    ? safeDecryptMap(String(cgmAnnRow.rows[0].encrypted_payload))
    : {};
  const dayAnnotations = dayAnnRow.rows[0]
    ? safeDecryptMap(String(dayAnnRow.rows[0].encrypted_payload))
    : {};

  // Best-effort audit; never block the export on logging.
  void logAudit({
    userId,
    action: "data.export",
    metadata: { date: new Date().toISOString().slice(0, 10) },
  });

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    userEmail: String(userRow.rows[0]?.email ?? ""),
    onboarding,
    symptoms,
    markers,
    dailyPlan,
    cgmReadings,
    cgmAnnotations,
    dayAnnotations,
    gamification: {
      currentStreak: Number(streakRow.rows[0]?.current_streak ?? 0),
      longestStreak: Number(streakRow.rows[0]?.longest_streak ?? 0),
      totalXp: Number(streakRow.rows[0]?.total_xp ?? 0),
      badgesEarned: badgeRows.rows.map((r) => String(r.badge_id)),
      xpLog: xpRows.rows.map((r) => ({
        event: String(r.event_kind),
        points: Number(r.points),
        date: String(r.date),
        createdAt: String(r.created_at),
      })),
    },
  };
}

function tryParse(s: string | null | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function safeDecryptMap(blob: string): Record<string, string> {
  try {
    return JSON.parse(decrypt(blob)) as Record<string, string>;
  } catch {
    return {};
  }
}
