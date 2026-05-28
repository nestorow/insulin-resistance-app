// Web push wrapper — sets VAPID identity on first use, exposes a small
// `sendPush()` API. The `web-push` library handles the encryption,
// content-encoding, and the JWT signing for each push provider.
//
// We deliberately do NOT export the raw `web-push` module — keeps the
// VAPID setup centralized and the surface area small (only one place
// reads the env vars).

import webpush from "web-push";

let configured = false;

function configure(): void {
  if (configured) return;
  const subject = process.env.VAPID_SUBJECT;       // e.g. "mailto:nestorow@gmail.com"
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "VAPID env vars missing. Generate with: npx web-push generate-vapid-keys"
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string; // path to open on click (default: "/plan")
}

/**
 * Send one push. Returns `{ ok: true }` on success or `{ ok: false,
 * gone: true }` if the subscription is stale (404/410) and the caller
 * should delete it. Other errors are re-thrown.
 */
export async function sendPush(
  sub: PushSubscription,
  payload: PushPayload
): Promise<{ ok: true } | { ok: false; gone: true }> {
  configure();
  try {
    await webpush.sendNotification(
      sub as unknown as Parameters<typeof webpush.sendNotification>[0],
      JSON.stringify(payload),
      { TTL: 24 * 60 * 60 } // a missed morning is stale by the next morning
    );
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e.statusCode === 404 || e.statusCode === 410) {
      return { ok: false, gone: true };
    }
    throw err;
  }
}

/** Public VAPID key for the client to use when calling PushManager.subscribe. */
export function publicVapidKey(): string {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error("VAPID_PUBLIC_KEY not configured");
  }
  return key;
}
