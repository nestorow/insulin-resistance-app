// Bulgarian date formatting — ДД.ММ.ГГГГ (zero-padded), the convention for
// BG users. Centralizes what used to be ad-hoc toLocaleDateString("bg-BG")
// calls (which render an unpadded "21.6.2026") and raw ISO (YYYY-MM-DD)
// displays across journal / markers / settings.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

function fromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * Format a date as ДД.ММ.ГГГГ.
 *
 * Accepts a `Date`, a date-only string ("YYYY-MM-DD") or a full ISO
 * timestamp. Date-only strings are formatted by their parts to avoid the
 * timezone off-by-one that `new Date("2026-06-21")` (parsed as UTC) causes
 * in negative-offset zones. Returns the input unchanged if unparseable.
 */
export function formatDateBg(input: string | Date): string {
  if (typeof input === "string") {
    const m = DATE_ONLY.exec(input);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}.${mo}.${y}`;
    }
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? input : fromDate(parsed);
  }
  return Number.isNaN(input.getTime()) ? "" : fromDate(input);
}

/**
 * Compact "ДД.ММ" — for dense chart axes / inline labels where the year is
 * implied. Same Bulgarian day-first order as formatDateBg, no year. Parses
 * date-only strings by parts to dodge the UTC off-by-one.
 */
export function formatDayMonthBg(input: string | Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (typeof input === "string") {
    const m = DATE_ONLY.exec(input);
    if (m) return `${m[3]}.${m[2]}`;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return input;
    return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}`;
  }
  return Number.isNaN(input.getTime())
    ? ""
    : `${pad(input.getDate())}.${pad(input.getMonth() + 1)}`;
}
