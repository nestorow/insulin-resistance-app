// Client-side full-text search for the /education page.
//
// Bulgarian is mostly Cyrillic but the corpus mixes in English terms
// (HOMA-IR, insulin sink, GLP-1), so a robust normaliser folds case,
// strips diacritics, and collapses whitespace. No external lib —
// the corpus is small (~50 items), brute force scan + scoring is fine.

const DIACRITICS_RE = /[̀-ͯ]/g;

/** Lowercase + NFD-strip + whitespace-collapse. Idempotent. */
export function normalizeQuery(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Match when every whitespace-separated token of `query` is a
 *  substring of `haystack`. Empty query matches everything. */
export function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  const h = normalizeQuery(haystack);
  const tokens = q.split(" ");
  for (const t of tokens) {
    if (!h.includes(t)) return false;
  }
  return true;
}

/**
 * Build a single searchable text blob for a record by concatenating
 * its searchable fields. The blob is normalized so per-query checks
 * just call `normalizeQuery(query)` once and `includes` per token.
 */
export function buildSearchBlob(fields: (string | undefined | null)[]): string {
  return normalizeQuery(fields.filter((f): f is string => !!f).join(" "));
}
