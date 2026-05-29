"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPush, publicVapidKey } from "@/lib/web-push";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// Push notification subscription management. The client subscribes via
// PushManager.subscribe() and hands us the {endpoint, keys} blob; we
// store it keyed by endpoint (globally unique per device/browser).

interface ClientSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function getVapidPublicKeyAction(): Promise<string | null> {
  try {
    return publicVapidKey();
  } catch {
    return null;
  }
}

export async function savePushSubscriptionAction(
  sub: ClientSubscription,
  userAgent: string | null
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return null;

  // INSERT OR REPLACE by endpoint — a user reinstalling re-uses the same
  // browser endpoint; this both creates and refreshes.
  await db.execute({
    sql: `INSERT INTO push_subscriptions
            (endpoint, user_id, keys_p256dh, keys_auth, user_agent)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(endpoint) DO UPDATE SET
            user_id = excluded.user_id,
            keys_p256dh = excluded.keys_p256dh,
            keys_auth = excluded.keys_auth,
            user_agent = excluded.user_agent`,
    args: [
      sub.endpoint,
      session.user.id,
      sub.keys.p256dh,
      sub.keys.auth,
      userAgent,
    ],
  });

  await logAudit({
    userId: session.user.id,
    action: "onboarding.save", // closest existing category; could add 'push.subscribe' later
    metadata: { date: new Date().toISOString().slice(0, 10) },
  });

  return { ok: true };
}

export async function deletePushSubscriptionAction(
  endpoint: string
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // Scope the delete to the requesting user so users can't unsubscribe
  // someone else's device by endpoint guessing.
  await db.execute({
    sql: `DELETE FROM push_subscriptions
           WHERE endpoint = ? AND user_id = ?`,
    args: [endpoint, session.user.id],
  });
  return { ok: true };
}

/**
 * Send a test push to all of the calling user's subscriptions — useful
 * from the settings page so the user can verify notifications work
 * before relying on the daily cron.
 */
export async function sendTestPushAction(): Promise<{
  ok: true;
  sent: number;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return null;

  const subs = await db.execute({
    sql: `SELECT endpoint, keys_p256dh, keys_auth
            FROM push_subscriptions
           WHERE user_id = ?`,
    args: [session.user.id],
  });

  let sent = 0;
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
          title: "InsulinReset",
          body: "Push известията работят. Очаквай сутрешен reminder в 8:00.",
          url: "/plan",
        }
      );
      if (result.ok) {
        sent++;
      } else if (result.gone) {
        // Endpoint stale — clean it up so the next test doesn't hit it.
        await db.execute({
          sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
          args: [endpoint],
        });
      }
    } catch {
      // Skip this endpoint, continue with others.
    }
  }

  return { ok: true, sent };
}
