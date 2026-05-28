import crypto from "crypto";
import type { DietTier } from "@/lib/onboarding";

// Anthropic Claude wrapper for the food AI assistant.
//
// Cost protection (in order):
//   1. Query length cap (200 chars) — rejected client-side, enforced here
//   2. Cache (per query_hash + tier) — primary defense; food advice is stable
//   3. Per-user rate limit (separate 'ai' kind, tight cap) — at call site
//   4. max_tokens cap on the Claude response (500)
//   5. Model: claude-haiku-4-5 — cheapest current Haiku, fast
//
// Tier-awareness: same question from a 'keto' user vs a 'none' user
// should get different answers (carb cap differs), so the cache key
// includes tier.

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 500;
const MAX_QUERY_LENGTH = 200;

const TIER_CARB_CAP: Record<DietTier, string> = {
  none: "without a strict cap — moderate refined carbs",
  moderate: "under 100 g/day net carbs",
  keto: "under 50 g/day net carbs",
};

/**
 * System prompt — bilingual, tier-aware, and conservative on medical
 * claims. The user-facing language is Bulgarian but the prompt itself
 * is in English so Claude reasons about the constraints clearly.
 */
function systemPrompt(tier: DietTier): string {
  return `You are a friendly Bulgarian-language food assistant for InsulinReset,
a 90-day insulin-resistance reversal protocol based on Dr. Benjamin Bikman's
work ("Why We Get Sick"). The user is on the ${tier} tier (${TIER_CARB_CAP[tier]}).

ALWAYS respond in Bulgarian.
ALWAYS keep responses short — 3-5 sentences. The user is checking quickly,
not reading an article.
ALWAYS frame advice around insulin, not just calories or weight.
ALWAYS respect the user's carb cap: ${TIER_CARB_CAP[tier]}.

When the user asks about a specific food, give:
1. A clear yes / no / careful verdict for their tier
2. Why — the insulin / GL / carb angle in one sentence
3. A practical tip (timing, portion, pairing) if relevant

NEVER give a medical diagnosis. NEVER recommend medication changes.
NEVER cite specific clinical numbers you're not certain about — be
qualitative when uncertain.
If the question is medical (not food-related), redirect to consulting
a doctor + the /education page.

Reference Bikman's 4 pillars when relevant: carb control, protein priority,
natural fats, fasting. Bulgarian foods (баница, шопска, кисело мляко,
кашкавал, ракия) come up often — handle them naturally.`;
}

/** Stable lowercase + whitespace-normalized query, hashed with tier. */
export function queryCacheKey(rawQuery: string, tier: DietTier): {
  hash: string;
  normalized: string;
} {
  const normalized = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
  const hash = crypto
    .createHash("sha256")
    .update(`${tier}|${normalized}`)
    .digest("hex");
  return { hash, normalized };
}

export interface AskResult {
  text: string;
  model: string;
}

/**
 * Ask Claude. Throws on input violations; returns text + model on success.
 * The actual rate-limit / cache plumbing lives in the server action;
 * this is the thin SDK adapter.
 */
export async function askClaude(
  query: string,
  tier: DietTier
): Promise<AskResult> {
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query too long (>${MAX_QUERY_LENGTH} chars)`);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Lazy-load the SDK so the chunk doesn't load on every request to /foods.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt(tier),
    messages: [{ role: "user", content: query }],
  });

  // Concatenate all text blocks (Claude may return multiple). Skip
  // non-text blocks defensively.
  const text = res.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n")
    .trim();

  return { text, model: MODEL };
}

export const _internal = {
  systemPrompt,
  MODEL,
  MAX_TOKENS,
  MAX_QUERY_LENGTH,
};
