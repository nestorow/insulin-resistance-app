"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// Per-user Anthropic API key — stored encrypted-at-rest using the same
// AES-256-GCM scheme as blood markers. The plaintext key never leaves
// the server process after `setAnthropicKeyAction`; the UI only ever
// sees a masked hint ("sk-ant-...xxxx").

// Anthropic key format check. Real keys start with `sk-ant-api` followed
// by a version digit + suffix. Loose match: we don't want to break if
// they rotate the version prefix; we just want to reject obvious typos
// + commits of `<your-key>` placeholders.
const KEY_PATTERN = /^sk-ant-api[0-9]{1,3}-[A-Za-z0-9_-]{20,}$/;

export type KeyOutcome =
  | { ok: true }
  | { ok: false; reason: "auth" | "rate" | "invalid" };

export async function setAnthropicKeyAction(
  rawKey: string
): Promise<KeyOutcome> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, reason: "auth" };

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return { ok: false, reason: "rate" };

  const key = rawKey.trim();
  if (!KEY_PATTERN.test(key)) {
    return { ok: false, reason: "invalid" };
  }

  // Encrypt before the value touches the DB. Uses ENCRYPTION_KEY env
  // (shared with blood markers). Format: iv:ct:tag hex.
  const encrypted = encrypt(key);

  await db.execute({
    sql: "UPDATE users SET anthropic_api_key_encrypted = ? WHERE id = ?",
    args: [encrypted, session.user.id],
  });

  // Audit: record the fact of a key write. No content — just \"a key was set\".
  await logAudit({
    userId: session.user.id,
    action: "onboarding.save", // closest existing category; future: dedicated 'key.set'
    metadata: { date: new Date().toISOString().slice(0, 10) },
  });

  return { ok: true };
}

/** Boolean check — used by the UI to decide which state to render. */
export async function hasAnthropicKeyAction(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;
  const r = await db.execute({
    sql: "SELECT anthropic_api_key_encrypted FROM users WHERE id = ?",
    args: [session.user.id],
  });
  return r.rows[0]?.anthropic_api_key_encrypted != null;
}

/** Returns the masked tail ("…XYZ4") if a key exists, null otherwise. */
export async function maskedAnthropicKeyAction(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const r = await db.execute({
    sql: "SELECT anthropic_api_key_encrypted FROM users WHERE id = ?",
    args: [session.user.id],
  });
  const blob = r.rows[0]?.anthropic_api_key_encrypted;
  if (blob == null) return null;
  // The mask is derived from the encrypted blob's last hex chars so we
  // don't have to decrypt just for display. It's a non-reversible hint;
  // for stronger uniqueness we'd need to decrypt + show last 4, which
  // we deliberately avoid to minimize plaintext key exposure.
  return `key-${String(blob).slice(-6)}`;
}

export async function clearAnthropicKeyAction(): Promise<KeyOutcome> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, reason: "auth" };
  await db.execute({
    sql: "UPDATE users SET anthropic_api_key_encrypted = NULL WHERE id = ?",
    args: [session.user.id],
  });
  return { ok: true };
}
