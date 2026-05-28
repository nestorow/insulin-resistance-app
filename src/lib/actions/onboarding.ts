"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Lens, DietTier, OnboardingResult } from "@/lib/onboarding";

// Phase 2b — server-side persistence for the IR self-assessment.
// All actions silently return null when there's no session — the caller's
// fire-and-forget pattern means we don't surface auth errors to the UI.

export async function saveOnboardingAction(
  result: OnboardingResult
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // One onboarding row per user — replace any previous result.
  await db.execute({
    sql: "DELETE FROM onboarding WHERE user_id = ?",
    args: [session.user.id],
  });
  await db.execute({
    sql: `INSERT INTO onboarding
            (id, user_id, lens, quiz_yes_count, quiz_answers, diet_tier,
             tg_hdl_ratio, whr)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      uuid(),
      session.user.id,
      result.lens,
      result.quizYesCount,
      JSON.stringify(result.quizAnswers),
      result.tier,
      result.tgHdlRatio,
      result.whr,
    ],
  });
  // Mirror lens on users row for quick session/JWT hydration.
  await db.execute({
    sql: "UPDATE users SET lens = ? WHERE id = ?",
    args: [result.lens, session.user.id],
  });

  return { ok: true };
}

export async function clearOnboardingAction(): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // Re-test flow — drop the onboarding row so the next save starts a fresh
  // 90-day cycle (Day N derives from onboarding.created_at). Journal +
  // markers + daily_plan history are intentionally preserved; only the
  // tier + completedAt anchor are reset.
  await db.execute({
    sql: "DELETE FROM onboarding WHERE user_id = ?",
    args: [session.user.id],
  });
  // Lens mirror on users is rewritten on the next save; leaving it stale
  // for the brief gap between clear and re-complete is harmless.
  return { ok: true };
}

export async function loadOnboardingAction(): Promise<OnboardingResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: `SELECT lens, quiz_yes_count, quiz_answers, diet_tier,
                 tg_hdl_ratio, whr, created_at
            FROM onboarding
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
    args: [session.user.id],
  });
  if (res.rows.length === 0) return null;

  const r = res.rows[0];
  return {
    lens: r.lens as Lens,
    quizAnswers: JSON.parse(r.quiz_answers as string) as boolean[],
    quizYesCount: Number(r.quiz_yes_count),
    tier: r.diet_tier as DietTier,
    tgHdlRatio: r.tg_hdl_ratio === null ? null : Number(r.tg_hdl_ratio),
    whr: r.whr === null ? null : Number(r.whr),
    completedAt: String(r.created_at),
  };
}
