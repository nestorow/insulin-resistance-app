// Canonical physiological ranges for the tracked health metrics. Single
// source of truth shared by the entry-form validators (journal + markers),
// the on-read sanitizer, the one-time localStorage migration, and the
// server-side trends fetch — so a value the form rejects can never sneak
// back into a chart via an old record or a stale server row.

export interface Range {
  min: number;
  max: number;
  unit: string;
}

export const SYMPTOM_RANGES = {
  weight: { min: 30, max: 300, unit: "кг" },
  waist: { min: 40, max: 200, unit: "см" },
  bloodSugar: { min: 2, max: 30, unit: "mmol/L" },
} as const satisfies Record<string, Range>;

export const MARKER_RANGES = {
  homaIr: { min: 0, max: 50, unit: "" },
  fastingInsulin: { min: 0, max: 100, unit: "µU/mL" },
  hba1c: { min: 3, max: 15, unit: "%" },
  tg: { min: 0, max: 2000, unit: "mg/dL" },
  hdl: { min: 0, max: 200, unit: "mg/dL" },
} as const satisfies Record<string, Range>;

/** True when `v` is a finite number within [min, max] (inclusive). */
export function inRange(v: unknown, r: Range): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= r.min && v <= r.max;
}

// Type-only imports (erased at build) — keeps this module neutral so it can
// be used from both client storage and the server-side trends fetch without
// dragging the "use client" tracking-storage module into the server bundle.
import type { SymptomEntry, MarkerEntry } from "./tracking-storage";

/** Null out any out-of-range numeric fields; keeps the date + valid fields. */
export function sanitizeSymptomEntry(e: SymptomEntry): SymptomEntry {
  return {
    ...e,
    weight: inRange(e.weight, SYMPTOM_RANGES.weight) ? e.weight : undefined,
    waist: inRange(e.waist, SYMPTOM_RANGES.waist) ? e.waist : undefined,
    bloodSugar: inRange(e.bloodSugar, SYMPTOM_RANGES.bloodSugar)
      ? e.bloodSugar
      : undefined,
  };
}

export function sanitizeMarkerEntry(e: MarkerEntry): MarkerEntry {
  return {
    ...e,
    homaIr: inRange(e.homaIr, MARKER_RANGES.homaIr) ? e.homaIr : undefined,
    fastingInsulin: inRange(e.fastingInsulin, MARKER_RANGES.fastingInsulin)
      ? e.fastingInsulin
      : undefined,
    hba1c: inRange(e.hba1c, MARKER_RANGES.hba1c) ? e.hba1c : undefined,
    triglycerides: inRange(e.triglycerides, MARKER_RANGES.tg)
      ? e.triglycerides
      : undefined,
    hdl: inRange(e.hdl, MARKER_RANGES.hdl) ? e.hdl : undefined,
  };
}
