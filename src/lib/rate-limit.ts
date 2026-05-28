// Per-user rate limiting on sensitive server actions.
// Backed by Upstash Redis (sliding-window). When the env vars aren't
// configured (local dev, preview deploys without secrets), every check
// passes — code paths stay identical, no special-casing in actions.
//
// Upstash SDKs ship ESM; they are dynamically imported on first use so
// this module stays jest-friendly and the chunks don't load unless rate
// limiting is actually active in production.

type LimiterKind = "write" | "auth";

interface LimiterConfig {
  tokens: number;
  window: `${number}${"s" | "m" | "h"}`;
}

// Tuned for normal solo use: a user shouldn't be writing markers /
// onboarding more than 30× / min even pasting from a clipboard. Auth
// pathway (sign-in callback) is tighter to deter credential probing.
const LIMITS: Record<LimiterKind, LimiterConfig> = {
  write: { tokens: 30, window: "1m" },
  auth: { tokens: 10, window: "1m" },
};

// Cached limiters keyed by kind. `null` = not configured; we cache that
// too to avoid re-checking env on every call.
const cache: Partial<Record<LimiterKind, unknown | null>> = {};

async function getLimiter(kind: LimiterKind): Promise<unknown | null> {
  if (kind in cache) return cache[kind] ?? null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cache[kind] = null;
    return null;
  }

  // Lazy-load the upstash modules only once we know we'll use them.
  const [{ Redis }, { Ratelimit }] = await Promise.all([
    import("@upstash/redis"),
    import("@upstash/ratelimit"),
  ]);

  const redis = new Redis({ url, token });
  const { tokens, window } = LIMITS[kind];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "ir:rl",
    analytics: false,
  });
  cache[kind] = limiter;
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  /** Unix ms when the limit resets (only meaningful when ok=false). */
  resetAt?: number;
  /** True iff Upstash is not configured — useful for tests/log messages. */
  bypassed?: boolean;
}

/**
 * Returns ok=true if the call is allowed; ok=false (with resetAt) when
 * the per-user limit is exhausted. Identifier should be the user id;
 * for anonymous flows, a stable surrogate (session id, IP) can be used.
 */
export async function checkRateLimit(
  kind: LimiterKind,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = (await getLimiter(kind)) as
    | { limit: (key: string) => Promise<{ success: boolean; reset: number }> }
    | null;
  if (!limiter) return { ok: true, bypassed: true };

  try {
    const res = await limiter.limit(`${kind}:${identifier}`);
    return { ok: res.success, resetAt: res.reset };
  } catch {
    // Network blip → fail OPEN. The primary defense is still session
    // gating + user-id scoping at the DB layer.
    return { ok: true, bypassed: true };
  }
}
