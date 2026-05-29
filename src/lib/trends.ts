// Trends domain — pure types + aggregation helpers.
//
// The trends dashboard reads from four modules at once (markers, journal,
// CGM, daily plan) and projects them onto a single daily timeline. The
// helpers here are UI-free and synchronous so they're trivially testable;
// `actions/trends.ts` is the server-side glue that fetches + decrypts
// + calls these.
//
// Window: last 90 days, matching the protocol length. The timeline is
// dense (one slot per day) even when most days have no data — this lets
// the UI render uniform sparklines without gap-aware math.

import type { CgmReading } from "./cgm";
import type { MarkerEntry, SymptomEntry } from "./tracking-storage";
import { detectSpikes, timeInRange, variability } from "./cgm-stats";

export const TRENDS_WINDOW_DAYS = 90;

export interface TrendDay {
  date: string; // YYYY-MM-DD
  // Blood markers (monthly cadence)
  homaIr?: number;
  hba1c?: number;
  fastingInsulin?: number;
  triglycerides?: number;
  hdl?: number;
  // Symptoms (daily cadence)
  energy?: number;
  brainFog?: number;
  weight?: number;
  waist?: number;
  // CGM daily aggregates (computed from individual readings)
  cgmTir?: number;
  cgmMean?: number;
  cgmCv?: number;
  cgmSpikes?: number;
  cgmCount?: number;
  // Plan completion % (0..100) — derived from tasks_completed map
  planCompletePct?: number;
}

export interface TrendsSummary {
  windowStart: string;
  windowEnd: string;
  /** Latest non-null value per metric — what to show in the hero strip. */
  latest: {
    homaIr?: { value: number; date: string };
    hba1c?: { value: number; date: string };
    weight?: { value: number; date: string };
    cgmTir?: { value: number; date: string };
  };
  /** First→last delta for the two slow movers that earn an arrow. */
  delta: {
    homaIr?: { from: number; to: number; pctChange: number };
    weight?: { from: number; to: number; deltaKg: number };
  };
  /** Count of days in the window where at least one metric was recorded. */
  activeDays: number;
}

export interface TrendsData {
  days: TrendDay[];
  summary: TrendsSummary;
}

// ─────────────────────────────────────────────────────────────────────
// Daily-axis builder
// ─────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD for a UTC date, no formatter dep. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generate the dense daily axis ending on `endDay` (UTC), length =
 * TRENDS_WINDOW_DAYS. Empty TrendDay rows are returned for every slot;
 * `mergeByDate` then fills them.
 */
export function buildAxis(endDay: Date = new Date()): TrendDay[] {
  const out: TrendDay[] = [];
  for (let i = TRENDS_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(endDay);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ date: isoDay(d) });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Per-source mergers — each one is pure: takes the axis + source data,
// returns a new axis with the relevant fields populated.
// ─────────────────────────────────────────────────────────────────────

export function mergeMarkers(
  axis: TrendDay[],
  markers: MarkerEntry[]
): TrendDay[] {
  const byDate = new Map(markers.map((m) => [m.date, m]));
  return axis.map((d) => {
    const m = byDate.get(d.date);
    if (!m) return d;
    return {
      ...d,
      homaIr: m.homaIr,
      hba1c: m.hba1c,
      fastingInsulin: m.fastingInsulin,
      triglycerides: m.triglycerides,
      hdl: m.hdl,
    };
  });
}

export function mergeSymptoms(
  axis: TrendDay[],
  symptoms: SymptomEntry[]
): TrendDay[] {
  const byDate = new Map(symptoms.map((s) => [s.date, s]));
  return axis.map((d) => {
    const s = byDate.get(d.date);
    if (!s) return d;
    return {
      ...d,
      energy: s.energy,
      brainFog: s.brainFog,
      weight: s.weight,
      waist: s.waist,
    };
  });
}

/**
 * Group CGM readings by date and compute the four per-day aggregates
 * the trends view cares about: TIR%, mean glucose, CV%, spike count.
 * Days with <12 readings (≈3 hours of coverage) get aggregates but the
 * `cgmCount` field lets the UI dim or hide them as low-confidence.
 */
export function aggregateCgmDaily(
  readings: CgmReading[]
): Map<string, Pick<TrendDay, "cgmTir" | "cgmMean" | "cgmCv" | "cgmSpikes" | "cgmCount">> {
  const byDay = new Map<string, CgmReading[]>();
  for (const r of readings) {
    const day = r.ts.slice(0, 10);
    const arr = byDay.get(day);
    if (arr) arr.push(r);
    else byDay.set(day, [r]);
  }

  const out = new Map<
    string,
    Pick<TrendDay, "cgmTir" | "cgmMean" | "cgmCv" | "cgmSpikes" | "cgmCount">
  >();
  for (const [day, rs] of byDay) {
    const t = timeInRange(rs);
    const v = variability(rs);
    // Spike detection is meaningful at ≥12 readings (≥3h) but cheap
    // either way; we let detectSpikes self-gate via its 3-reading min.
    const spikes = detectSpikes(rs);
    out.set(day, {
      cgmTir: t.tir,
      cgmMean: v.mean,
      cgmCv: v.cv,
      cgmSpikes: spikes.length,
      cgmCount: rs.length,
    });
  }
  return out;
}

export function mergeCgm(axis: TrendDay[], readings: CgmReading[]): TrendDay[] {
  const aggs = aggregateCgmDaily(readings);
  return axis.map((d) => {
    const a = aggs.get(d.date);
    return a ? { ...d, ...a } : d;
  });
}

export function mergePlan(
  axis: TrendDay[],
  byDate: Record<string, Record<string, boolean>>
): TrendDay[] {
  return axis.map((d) => {
    const tasks = byDate[d.date];
    if (!tasks) return d;
    const keys = Object.keys(tasks);
    if (keys.length === 0) return d;
    const completed = keys.filter((k) => tasks[k]).length;
    return {
      ...d,
      planCompletePct: Math.round((completed / keys.length) * 100),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// Summary computation
// ─────────────────────────────────────────────────────────────────────

function findLatest<K extends keyof TrendDay>(
  days: TrendDay[],
  key: K
): { value: number; date: string } | undefined {
  for (let i = days.length - 1; i >= 0; i--) {
    const v = days[i][key];
    if (typeof v === "number") return { value: v, date: days[i].date };
  }
  return undefined;
}

function findFirstAndLast<K extends keyof TrendDay>(
  days: TrendDay[],
  key: K
): { from: { value: number; date: string }; to: { value: number; date: string } } | null {
  let first: { value: number; date: string } | null = null;
  let last: { value: number; date: string } | null = null;
  for (const d of days) {
    const v = d[key];
    if (typeof v !== "number") continue;
    if (!first) first = { value: v, date: d.date };
    last = { value: v, date: d.date };
  }
  // Distinct entries only — first === last (single point) yields no delta.
  if (!first || !last || first.date === last.date) return null;
  return { from: first, to: last };
}

export function computeSummary(days: TrendDay[]): TrendsSummary {
  const homaIrLatest = findLatest(days, "homaIr");
  const hba1cLatest = findLatest(days, "hba1c");
  const weightLatest = findLatest(days, "weight");
  const tirLatest = findLatest(days, "cgmTir");

  const homaIrPair = findFirstAndLast(days, "homaIr");
  const weightPair = findFirstAndLast(days, "weight");

  const activeDays = days.filter((d) =>
    Object.keys(d).some((k) => k !== "date" && d[k as keyof TrendDay] != null)
  ).length;

  return {
    windowStart: days[0]?.date ?? "",
    windowEnd: days[days.length - 1]?.date ?? "",
    latest: {
      homaIr: homaIrLatest,
      hba1c: hba1cLatest,
      weight: weightLatest,
      cgmTir: tirLatest,
    },
    delta: {
      homaIr: homaIrPair
        ? {
            from: homaIrPair.from.value,
            to: homaIrPair.to.value,
            pctChange:
              Math.round(
                ((homaIrPair.to.value - homaIrPair.from.value) /
                  homaIrPair.from.value) *
                  1000
              ) / 10,
          }
        : undefined,
      weight: weightPair
        ? {
            from: weightPair.from.value,
            to: weightPair.to.value,
            deltaKg:
              Math.round((weightPair.to.value - weightPair.from.value) * 10) /
              10,
          }
        : undefined,
    },
    activeDays,
  };
}
