// CGM (continuous glucose monitor) domain types.
//
// A reading is a single timestamped glucose value in mg/dL — the unit used
// by the AGP standard and by every CGM analytics library, regardless of
// what the original export was in. The parser converts mmol/L to mg/dL on
// ingest so downstream code never branches on units. (mg/dL = mmol/L ×
// 18.0182, rounded to 1 decimal.)

export type CgmSource = "libre" | "dexcom" | "manual" | "demo";

export interface CgmReading {
  /** ISO-8601 UTC timestamp, e.g. "2026-05-20T14:32:00.000Z". */
  ts: string;
  /** Glucose in mg/dL. Range guard: 30–600 — anything outside is dropped. */
  mgdl: number;
  /** Which path delivered the reading; used for de-dup hints + UI badges. */
  source: CgmSource;
}

export const MGDL_PER_MMOL = 18.0182;

/** Clinical reference range used by the TIR metric (ADA / AGP consensus). */
export const TIR_LOW = 70;
export const TIR_HIGH = 180;

/** Sanity bounds for a single reading. Outside → dropped by the parser. */
export const MGDL_MIN = 30;
export const MGDL_MAX = 600;

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * MGDL_PER_MMOL * 10) / 10;
}
