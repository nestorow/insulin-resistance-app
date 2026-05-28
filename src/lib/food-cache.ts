import { db } from "@/lib/db";

// food_search_cache reader/writer. Keyed on the {tier + query} hash so
// the same question from different tiers gets distinct answers. Hits
// counter + last_hit_at help us decide later if we should add an LRU
// eviction; for now the table just grows.

export interface CachedAnswer {
  query: string;
  response: string;
  model: string;
  hits: number;
  createdAt: string;
}

/** Returns the cached answer if present (and increments hit counter). */
export async function getCachedAnswer(
  queryHash: string
): Promise<CachedAnswer | null> {
  const res = await db.execute({
    sql: `SELECT query, response, model, hits, created_at
            FROM food_search_cache
           WHERE query_hash = ?`,
    args: [queryHash],
  });
  if (res.rows.length === 0) return null;

  const r = res.rows[0];
  // Fire-and-forget the hit counter bump — we don't want it to slow the
  // user's response, but we do want it to record eventually for analytics.
  db.execute({
    sql: `UPDATE food_search_cache
            SET hits = hits + 1, last_hit_at = CURRENT_TIMESTAMP
          WHERE query_hash = ?`,
    args: [queryHash],
  }).catch(() => {});

  return {
    query: String(r.query),
    response: String(r.response),
    model: String(r.model),
    hits: Number(r.hits),
    createdAt: String(r.created_at),
  };
}

export async function setCachedAnswer(opts: {
  queryHash: string;
  query: string;
  tier: string;
  response: string;
  model: string;
}): Promise<void> {
  // INSERT OR IGNORE: a concurrent request might race us; the existing
  // row wins (cheap; identical content for the same key anyway).
  await db.execute({
    sql: `INSERT OR IGNORE INTO food_search_cache
            (query_hash, query, tier, response, model)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      opts.queryHash,
      opts.query,
      opts.tier,
      opts.response,
      opts.model,
    ],
  });
}
