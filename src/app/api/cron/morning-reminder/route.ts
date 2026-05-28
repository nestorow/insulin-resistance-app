import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPush } from "@/lib/web-push";

// Daily morning reminder — invoked by Vercel Cron once per day.
// Vercel Cron requests carry an `Authorization: Bearer <CRON_SECRET>`
// header; we verify it so the endpoint isn't a public push-blaster.

export const runtime = "nodejs"; // web-push needs Node crypto, not Edge

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const subs = await db.execute({
    sql: `SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions`,
  });

  let sent = 0;
  let gone = 0;
  const stale: string[] = [];

  for (const r of subs.rows) {
    const endpoint = String(r.endpoint);
    try {
      const result = await sendPush(
        {
          endpoint,
          keys: {
            p256dh: String(r.keys_p256dh),
            auth: String(r.keys_auth),
          },
        },
        {
          title: "InsulinReset · Добро утро",
          body: "Време за дневния чеклист. Първа стъпка: ябълков оцет в чаша вода.",
          url: "/plan",
        }
      );
      if (result.ok) {
        sent++;
      } else if (result.gone) {
        gone++;
        stale.push(endpoint);
      }
    } catch {
      // Skip — endpoint may be temporarily flaky; next cron will retry.
    }
  }

  // Garbage-collect stale subscriptions so the cron doesn't grow O(forever).
  for (const endpoint of stale) {
    try {
      await db.execute({
        sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
        args: [endpoint],
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, sent, gone });
}
