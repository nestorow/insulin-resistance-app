// Small numeric helpers shared across journal + markers entry forms.

/**
 * Parse a numeric string and clamp it to a physiological range. Returns
 * `undefined` for empty input, non-finite values, OR out-of-range values
 * (so the caller stores `undefined`/null instead of poisoning charts with
 * nonsense like HbA1c = 999 or weight = -5).
 *
 * Inclusive bounds.
 */
export function clampedNum(
  raw: string,
  min: number,
  max: number
): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n < min || n > max) return undefined;
  return n;
}
