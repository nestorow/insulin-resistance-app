import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDigest, type DigestData } from "@/lib/email";
import { getProgress } from "@/lib/gamification";
import { BADGES } from "@/lib/gamification";

// Weekly digest cron — runs Sundays at 16:00 UTC (≈ 18-19 BG).
// Same bearer-token gate as the morning push cron; deny-by-default
// when CRON_SECRET is unset.

export const runtime = "nodejs"; // resend SDK + db client want Node

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "https://insulin-resistance-app.vercel.app";

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
