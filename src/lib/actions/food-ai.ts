"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  askClaude,
  queryCacheKey,
  MAX_CONVERSATION_TURNS,
  type ChatTurn,
} from "@/lib/anthropic";
import { getCachedAnswer, setCachedAnswer } from "@/lib/food-cache";
import { logAudit } from "@/lib/audit";
import type { DietTier } from "@/lib/onboarding";

// Food AI assistant — BYOK edition.
//
// Cost model:
//   - Cache lookup runs FIRST, before we check the user's key at all.
//     If the answer is cached (from any user with the same {tier,
//     conversation}), we serve it for free. The user who originally
//     paid for the API call has implicitly subsidized everyone who
//     follows. This is intentional — it maximizes hit rate and gives
//     users a reason to ask common questions early.
//   - On a cache miss the user's own ANTHROPIC API key is decrypted
//     and used. The user is billed by Anthropic directly. We never
//     hold a server-side key in production.
//   - The answer is stored in the cache regardless of which user paid,
//     so future identical {tier, conversation} questions hit it.

export type AskOutcome =
  | { ok: true; text: string; cached: boolean }
  | {
      ok: false;
      reason:
        | "auth"
        | "rate"
        | "no-key"
        | "too-long"
        | "too-many-turns"
        | "error";
      message?: string;
    };

const MAX_QUERY_LENGTH = 200;

export async function askFoodAssistantAction(
  rawQuery: string,
  history: ChatTurn[] = []
): Promise<AskOutcome> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, reason: "auth" };
  }

  const query = rawQuery.trim();
  if (query.length === 0) {
    return { ok: false, reason: "too-long", message: "Празна заявка" };
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      reason: "too-long",
      message: `Въпросът е твърде дълъг (max ${MAX_QUERY_LENGTH} символа)`,
    };
  }
  if (history.length + 1 > MAX_CONVERSATION_TURNS * 2) {
    return {
      ok: false,
      reason: "too-many-turns",
      message: "Разговорът стана дълъг — започни нов",
    };
  }

  // Pull the user's tier + encrypted API key in one round-trip — both
  // join on user_id; cheap to read together.
  const profile = await db.execute({
    sql: `SELECT u.anthropic_api_key_encrypted, o.diet_tier
            FROM users u
            LEFT JOIN onboarding o ON o.user_id = u.id
           WHERE u.id = ?
           ORDER BY o.created_at DESC
           LIMIT 1`,
    args: [session.user.id],
  });
  const profileRow = profile.rows[0];
  const tier = String(profileRow?.diet_tier ?? "none") as DietTier;
  const encryptedKey = profileRow?.anthropic_api_key_encrypted as
    | string
    | null
    | undefined;

  // Cache lookup — same key for single-turn AND multi-turn now.
  // Hit means no API call for anyone; no key required for the user
  // either, since we're not calling Anthropic.
  const { hash, normalized } = queryCacheKey(query, tier, history);
  const cached = await getCachedAnswer(hash);
  if (cached) {
    return { ok: true, text: cached.response, cached: true };
  }

  // From here we'll need to call Claude. Now require the user's key.
  if (!encryptedKey) {
    return { ok: false, reason: "no-key" };
  }

  // Rate limit only on actual API spend (cache hits don't burn budget).
  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.ok) {
    return { ok: false, reason: "rate" };
  }

  let apiKey: string;
  try {
    apiKey = decrypt(encryptedKey);
  } catch {
    // Decrypt failure means the ENCRYPTION_KEY rotated since the key was
    // stored (operator-side issue). Surface a clear error so the user
    // re-saves the key in /settings.
    return {
      ok: false,
      reason: "no-key",
      message: "Запазеният API key вече не може да бъде разшифрован — въведи нов в Настройки.",
    };
  }

  try {
    const { text, model } = await askClaude(apiKey, query, tier, history);

    // Write to cache for everyone's future benefit, including multi-turn.
    await setCachedAnswer({
      queryHash: hash,
      query: normalized,
      tier,
      response: text,
      model,
    });

    await logAudit({
      userId: session.user.id,
      action: "markers.save", // re-using existing AuditAction enum; future: 'food.ai'
      metadata: { tier, fieldsPresent: history.length + 1 },
    });

    return { ok: true, text, cached: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { ok: false, reason: "error", message: msg };
  }
}
