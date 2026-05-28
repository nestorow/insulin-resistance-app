"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { askClaude, queryCacheKey } from "@/lib/anthropic";
import { getCachedAnswer, setCachedAnswer } from "@/lib/food-cache";
import { logAudit } from "@/lib/audit";
import type { DietTier } from "@/lib/onboarding";

// Single server-action entry for the food AI assistant. Layered cost
// defense: cache → rate limit → Claude. Anonymous users are turned
// away — AI access requires a logged-in user_id so we have an identity
// to rate-limit and audit.

export type AskOutcome =
  | { ok: true; text: string; cached: boolean }
  | { ok: false; reason: "auth" | "rate" | "config" | "too-long" | "error"; message?: string };

const MAX_QUERY_LENGTH = 200;

export async function askFoodAssistantAction(
  rawQuery: string
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

  // Pull the user's tier so the response respects their carb cap. Also
  // becomes part of the cache key.
  const tierRow = await db.execute({
    sql: "SELECT diet_tier FROM onboarding WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    args: [session.user.id],
  });
  const tier = (String(tierRow.rows[0]?.diet_tier ?? "none") as DietTier);

  const { hash, normalized } = queryCacheKey(query, tier);

  // Cache lookup first — cheapest path. Increments hit counter inside.
  const cached = await getCachedAnswer(hash);
  if (cached) {
    return { ok: true, text: cached.response, cached: true };
  }

  // Rate limit only applies to misses (cache hits don't burn the budget).
  const rate = await checkRateLimit("ai", session.user.id);
  if (!rate.ok) {
    return { ok: false, reason: "rate" };
  }

  try {
    const { text, model } = await askClaude(query, tier);
    await setCachedAnswer({
      queryHash: hash,
      query: normalized,
      tier,
      response: text,
      model,
    });

    // Audit: record the fact + tier; the query string itself is OK to
    // log (it's not medical PII — it's a food question), but we still
    // keep audit body minimal.
    await logAudit({
      userId: session.user.id,
      action: "markers.save", // re-using existing AuditAction enum; can split into 'food.ai' later
      metadata: { tier, fieldsPresent: 1 },
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
