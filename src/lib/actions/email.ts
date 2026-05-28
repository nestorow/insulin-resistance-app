"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// Email digest opt-in preference. Stored as a 0/1 column on users so
// the weekly cron can join email + opt-in in one SELECT.

export async function getEmailDigestPreferenceAction(): Promise<boolean | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const r = await db.execute({
    sql: "SELECT email_digest_opt_in FROM users WHERE id = ?",
    args: [session.user.id],
  });
  return Number(r.rows[0]?.email_digest_opt_in ?? 0) === 1;
}

export async function setEmailDigestPreferenceAction(
  enabled: boolean
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return null;

  await db.execute({
    sql: "UPDATE users SET email_digest_opt_in = ? WHERE id = ?",
    args: [enabled ? 1 : 0, session.user.id],
  });
  return { ok: true };
}
