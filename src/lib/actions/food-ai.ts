"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
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

// Single server-action entry for the food AI assistant. Layered cost
// defense: cache (single-turn only) → rate limit → Claude. Anonymous
// users are turned away — AI access requires a logged-in user_id so
// we have an identity to rate-limit and audit.

export type AskOutcome =
  | { ok: true; text: string; cached: boolean }
  | {
      ok: false;
      reason: "auth" | "rate" | "config" | "too-long" | "too-many-turns" | "error";
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

  // Multi-turn cap: prevent unbounded context growth (cost + drift).
  // history pairs go user→assistant; +1 for the new user message.
  if (history.length + 1 > MAX_CONVERSATION_TURNS * 2) {
    return {
      ok: false,
      reason: "too-many-turns",
      message: "Разговорът стана дълъг — започни нов",
    };
  }

  // Pull the user's tier so the response respects their carb cap. Also
  // becomes part of the cache key.
  const tierRow = await db.execute({
    sql: "SELECT diet_tier FROM onboarding WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    args: [session.user.id],
  });
  const tier = String(tierRow.rows[0]?.diet_tier ?? "none") as DietTier;

  // Cache strategy: ONLY single-turn (history empty) is cached. Multi-
  // turn responses depend on prior conversation context, so caching
  // would risk crossed-over answers; we always call Claude fresh.
  const isSingleTurn = history.length === 0;
  if (isSingleTurn) {
    const { hash } = queryCacheKey(query, tier);
    const cached = await getCachedAnswer(hash);
    if (cached) {
      return { ok: true, text: cached.response, cached: true };
    }
  }

  // Rate limit only applies when we're about to call Claude (not on
  // cache hits — those don't burn the budget).
  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.ok) {
    return { ok: false, reason: "rate" };
  }

  try {
    const { text, model } = await askClaude(query, tier, history);

    // Persist to cache only for single-turn paths. Multi-turn answers
    // depend on context that isn't part of the cache key.
    if (isSingleTurn) {
      const { hash, normalized } = queryCacheKey(query, tier);
      await setCachedAnswer({
        queryHash: hash,
        query: normalized,
        tier,
        response: text,
        model,
      });
    }

    await logAudit({
      userId: session.user.id,
      action: "markers.save", // re-using existing AuditAction enum; can split into 'food.ai' later
      metadata: { tier, fieldsPresent: history.length + 1 },
    });

    return { ok: true, text, cached: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("not configured")) {
      return { ok: false, reason: "config" };
    }
    return { ok: false, reason: "error", message: msg };
  }
}
