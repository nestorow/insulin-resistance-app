// CSV parsers for the two CGMs that cover ~99% of European users.
//
// LibreView (FreeStyle Libre 2 / 3): exports from libreview.com → user
// downloads "Glucose history" as CSV. The first 1-3 lines are device
// metadata; the real header starts with "Device,Serial Number,Device
// Timestamp,Record Type,...". `Record Type = 0` is the 15-minute interval
// reading (column "Historic Glucose mg/dL" or "...mmol/L"); type 1 is a
// manual scan; types 4-6 are insulin/food notes which we ignore here.
//
// Dexcom Clarity (G6 / G7): exports as ISO-8601 timestamps with an
// "Event Type" column where "EGV" = Estimated Glucose Value. Glucose can
// arrive as literal strings "High" (>400) or "Low" (<40) — these are
// out-of-bounds for analytics, so we drop them rather than imputing.
//
// Both parsers are unit-aware (mg/dL vs mmol/L) and lenient about minor
// whitespace and trailing commas. They return readings sorted ascending
// by timestamp with out-of-range values filtered out.

import {
  CgmReading,
  MGDL_MAX,
  MGDL_MIN,
  mmolToMgdl,
} from "./cgm";

export type CgmFormat = "libre" | "dexcom" | "unknown";

/** Cheap content sniff so the upload UI can route to the right parser. */
export function detectFormat(csv: string): CgmFormat {
  const head = csv.slice(0, 600).toLowerCase();
  if (head.includes("device timestamp") && head.includes("record type")) {
    return "libre";
  }
  if (head.includes("event type") && head.includes("glucose value")) {
    return "dexcom";
  }
  return "unknown";
}

/** Public entry point — sniffs format then dispatches. */
export function parseCgm(csv: string): {
  format: CgmFormat;
  readings: CgmReading[];
} {
  const format = detectFormat(csv);
  if (format === "libre") return { format, readings: parseLibreView(csv) };
  if (format === "dexcom") return { format, readings: parseDexcomClarity(csv) };
  return { format: "unknown", readings: [] };
}

// ─────────────────────────────────────────────────────────────────────
// LibreView
// ─────────────────────────────────────────────────────────────────────

export function parseLibreView(csv: string): CgmReading[] {
  const lines = csv.split(/\r?\n/);
  // Skip device-metadata preamble: scan for the first line that starts
  // with "Device,Serial Number" — that's the real header.
  const headerIdx = lines.findIndex((l) =>
    /^Device,\s*Serial Number/i.test(l)
  );
  if (headerIdx < 0) return [];

  const header = splitCsvLine(lines[headerIdx]);
  const tsIdx = header.findIndex((h) => /Device Timestamp/i.test(h));
  const typeIdx = header.findIndex((h) => /^Record Type$/i.test(h));
  const histIdx = header.findIndex((h) =>
    /Historic Glucose (mg\/dL|mmol\/L)/i.test(h)
  );
  const scanIdx = header.findIndex((h) =>
    /Scan Glucose (mg\/dL|mmol\/L)/i.test(h)
  );
  if (tsIdx < 0 || typeIdx < 0 || (histIdx < 0 && scanIdx < 0)) return [];

  const mmolMode =
    (histIdx >= 0 && /mmol\/L/i.test(header[histIdx])) ||
    (scanIdx >= 0 && /mmol\/L/i.test(header[scanIdx]));

  const out: CgmReading[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const cols = splitCsvLine(raw);
    const recordType = cols[typeIdx]?.trim();
    // Type 0 = 15-min historic, type 1 = manual scan. Both are real glucose
    // values — keep both; ignore food/insulin/note rows (types 4-6).
    if (recordType !== "0" && recordType !== "1") continue;

    const valueRaw =
      (recordType === "0" ? cols[histIdx] : cols[scanIdx])?.trim() ?? "";
    if (!valueRaw) continue;

    const numeric = Number(valueRaw.replace(",", "."));
    if (!Number.isFinite(numeric)) continue;

    const mgdl = mmolMode ? mmolToMgdl(numeric) : numeric;
    if (mgdl < MGDL_MIN || mgdl > MGDL_MAX) continue;

    const ts = parseLibreTimestamp(cols[tsIdx]);
    if (!ts) continue;

    out.push({ ts, mgdl, source: "libre" });
  }
  return sortAndDedupe(out);
}

/**
 * LibreView timestamps come as `DD-MM-YYYY HH:mm` (EU) or
 * `MM-DD-YYYY hh:mm AM/PM` (US). Both are documented as "local time of
 * the reader" — we treat them as UTC because we have no other info, and
 * the AGP profile is local-time-shaped anyway (hour-of-day buckets), so
 * a fixed offset doesn't distort the pattern.
 */
function parseLibreTimestamp(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // EU: "20-05-2026 14:32"
  let m = s.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m;
    return new Date(`${yyyy}-${mm}-${dd}T${pad(hh)}:${mi}:00.000Z`).toISOString();
  }
  // US: "05-20-2026 02:32 PM"
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
  if (m) {
    const [, mm, dd, yyyy, hh, mi, ap] = m;
    let h = Number(hh) % 12;
    if (ap.toUpperCase() === "PM") h += 12;
    return new Date(
      `${yyyy}-${mm}-${dd}T${pad(String(h))}:${mi}:00.000Z`
    ).toISOString();
  }
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function pad(s: string) {
  return s.length === 1 ? `0${s}` : s;
}

// ─────────────────────────────────────────────────────────────────────
// Dexcom Clarity
// ─────────────────────────────────────────────────────────────────────

export function parseDexcomClarity(csv: string): CgmReading[] {
  const lines = csv.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) =>
    /Event Type/i.test(l) && /Timestamp/i.test(l)
  );
  if (headerIdx < 0) return [];

  const header = splitCsvLine(lines[headerIdx]);
  const tsIdx = header.findIndex((h) => /Timestamp/i.test(h));
  const eventIdx = header.findIndex((h) => /Event Type/i.test(h));
  const glucoseIdx = header.findIndex((h) =>
    /Glucose Value \((mg\/dL|mmol\/L)\)/i.test(h)
  );
  if (tsIdx < 0 || eventIdx < 0 || glucoseIdx < 0) return [];

  const mmolMode = /mmol\/L/i.test(header[glucoseIdx]);

  const out: CgmReading[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const cols = splitCsvLine(raw);
    const eventType = cols[eventIdx]?.trim();
    // EGV = "Estimated Glucose Value" — the 5-minute interval reading.
    // Other events (Calibration, Insulin, Carbs, Exercise) are skipped.
    if (eventType !== "EGV") continue;

    const valueRaw = cols[glucoseIdx]?.trim() ?? "";
    if (!valueRaw) continue;
    // Dexcom emits literal "High" / "Low" for out-of-sensor-range values
    // — these aren't usable for analytics; drop rather than impute.
    if (/^(High|Low)$/i.test(valueRaw)) continue;

    const numeric = Number(valueRaw.replace(",", "."));
    if (!Number.isFinite(numeric)) continue;

    const mgdl = mmolMode ? mmolToMgdl(numeric) : numeric;
    if (mgdl < MGDL_MIN || mgdl > MGDL_MAX) continue;

    const tsRaw = cols[tsIdx]?.trim();
    if (!tsRaw) continue;
    // Dexcom is ISO-8601 (no zone): "2026-05-20T14:32:00".
    const d = new Date(tsRaw.endsWith("Z") ? tsRaw : `${tsRaw}Z`);
    if (Number.isNaN(d.getTime())) continue;

    out.push({ ts: d.toISOString(), mgdl, source: "dexcom" });
  }
  return sortAndDedupe(out);
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimal CSV splitter — handles quoted fields with embedded commas, which
 * Dexcom uses for the Device Info column. Not a full RFC-4180 parser; if
 * we ever hit edge cases we can swap in `papaparse`.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      // Doubled quote inside a quoted field → literal quote.
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (c === "," && !quoted) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * Sort ascending by ts and drop exact-timestamp duplicates (CGMs
 * occasionally emit two rows for the same minute when scan + historic
 * coincide). Last write wins so the manual scan beats the historic.
 */
function sortAndDedupe(rs: CgmReading[]): CgmReading[] {
  rs.sort((a, b) => a.ts.localeCompare(b.ts));
  const out: CgmReading[] = [];
  let last = "";
  for (const r of rs) {
    if (r.ts === last) out[out.length - 1] = r;
    else out.push(r);
    last = r.ts;
  }
  return out;
}
