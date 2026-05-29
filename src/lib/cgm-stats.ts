// CGM analytics — pure functions over an array of `CgmReading`.
//
// All metrics here mirror the AGP (Ambulatory Glucose Profile) standard
// used by clinical CGM reports — Battelino et al. 2019 ("Clinical targets
// for CGM data interpretation"). Defaults are the consensus ranges:
//   - TIR target: 70–180 mg/dL, ≥70% of time
//   - CV target:  ≤36% (≤33% sometimes cited for tighter control)
//   - GMI:        eAG → estimated A1C via Bergenstal 2018 formula
//
// AGP percentile bands (p10/p25/p50/p75/p90) are bucketed by hour-of-day
// across all days in the input. Hour 0 is local UTC of the timestamp
// (parsers already normalize to UTC; see comment in cgm-parser.ts).

import { CgmReading, TIR_HIGH, TIR_LOW } from "./cgm";

export interface TirBreakdown {
  /** Percent of readings strictly below `lowAt` (default 70). */
  veryLow: number; // <54
  low: number; // 54–69
  inRange: number; // 70–180
  high: number; // 181–250
  veryHigh: number; // >250
  /** Convenience: `inRange` rounded for display. */
  tir: number;
}

export function timeInRange(
  readings: CgmReading[],
  low = TIR_LOW,
  high = TIR_HIGH
): TirBreakdown {
  if (!readings.length) {
    return { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, tir: 0 };
  }
  let vl = 0,
    lo = 0,
    ir = 0,
    hi = 0,
    vh = 0;
  for (const r of readings) {
    if (r.mgdl < 54) vl++;
    else if (r.mgdl < low) lo++;
    else if (r.mgdl <= high) ir++;
    else if (r.mgdl <= 250) hi++;
    else vh++;
  }
  const n = readings.length;
  const round = (x: number) => Math.round((x / n) * 1000) / 10;
  return {
    veryLow: round(vl),
    low: round(lo),
    inRange: round(ir),
    high: round(hi),
    veryHigh: round(vh),
    tir: Math.round((ir / n) * 100),
  };
}

export interface Variability {
  mean: number;
  sd: number;
  /** Coefficient of variation = sd/mean ×100. Target ≤36% (Battelino). */
  cv: number;
  /** Glucose Management Indicator — estimated A1C from mean glucose. */
  gmi: number;
  count: number;
}

export function variability(readings: CgmReading[]): Variability {
  const n = readings.length;
  if (!n) return { mean: 0, sd: 0, cv: 0, gmi: 0, count: 0 };
  let sum = 0;
  for (const r of readings) sum += r.mgdl;
  const mean = sum / n;
  let ss = 0;
  for (const r of readings) {
    const d = r.mgdl - mean;
    ss += d * d;
  }
  // Sample SD (n-1) matches what every CGM analytics tool reports.
  const sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  // GMI (%) = 3.31 + 0.02392 × mean_glucose_mg_dL — Bergenstal 2018.
  const gmi = 3.31 + 0.02392 * mean;
  return {
    mean: round1(mean),
    sd: round1(sd),
    cv: round1(cv),
    gmi: round1(gmi),
    count: n,
  };
}

export interface HourBand {
  hour: number; // 0–23, UTC
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  count: number;
}

/**
 * Group readings by hour-of-day, then compute the 5-percentile AGP band
 * per hour. Empty hours are returned with all percentiles = 0 and
 * `count: 0` so the consuming chart can render gap-aware axes without
 * special-casing missing buckets.
 */
export function agpProfile(readings: CgmReading[]): HourBand[] {
  const buckets: number[][] = Array.from({ length: 24 }, () => []);
  for (const r of readings) {
    const d = new Date(r.ts);
    const h = d.getUTCHours();
    buckets[h].push(r.mgdl);
  }
  return buckets.map((vals, hour) => {
    if (!vals.length) {
      return { hour, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, count: 0 };
    }
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      hour,
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
      count: vals.length,
    };
  });
}

/** Linear-interpolation percentile on an already-sorted ascending array. */
function percentile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return round1(sorted[0]);
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return round1(sorted[lo]);
  const frac = pos - lo;
  return round1(sorted[lo] + (sorted[hi] - sorted[lo]) * frac);
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────
// Spike detection
// ─────────────────────────────────────────────────────────────────────

export interface GlucoseSpike {
  /** ISO timestamp of the peak reading. */
  peakTs: string;
  peakMgdl: number;
  /** Baseline = lowest reading in the 60 min before the peak. */
  baselineMgdl: number;
  /** Rise from baseline to peak, in mg/dL. */
  riseMgdl: number;
  /** Minutes from baseline trough to peak. */
  riseDurationMin: number;
}

interface SpikeOpts {
  /** Minimum rise from local baseline to qualify as a spike (mg/dL). */
  minRise?: number;
  /** Lookback window for baseline trough, in minutes. */
  baselineMin?: number;
  /** Cooldown after a spike before another can fire, in minutes. */
  cooldownMin?: number;
}

/**
 * Find post-prandial-style spikes: local maxima where glucose rises ≥40
 * mg/dL above the trough of the prior 60 min. This is the threshold used
 * in most CGM-driven studies (e.g., Hall 2018, glycemic signatures) and
 * also corresponds to the rule-of-thumb biohacker target ("keep peaks
 * <40 mg/dL above baseline"). After a spike, we enforce a 90-min
 * cooldown so a slow descent from one peak doesn't re-trigger.
 */
export function detectSpikes(
  readings: CgmReading[],
  opts: SpikeOpts = {}
): GlucoseSpike[] {
  const minRise = opts.minRise ?? 40;
  const baselineMin = opts.baselineMin ?? 60;
  const cooldownMin = opts.cooldownMin ?? 90;

  if (readings.length < 3) return [];

  const out: GlucoseSpike[] = [];
  let lastSpikeMs = -Infinity;

  for (let i = 1; i < readings.length - 1; i++) {
    const r = readings[i];
    const prev = readings[i - 1];
    const next = readings[i + 1];
    // Local maximum (or plateau peak — equal to prev, strictly > next).
    if (r.mgdl < prev.mgdl || r.mgdl <= next.mgdl) continue;

    const peakMs = Date.parse(r.ts);
    if (peakMs - lastSpikeMs < cooldownMin * 60_000) continue;

    // Walk backwards within the baseline window to find the trough.
    const windowStartMs = peakMs - baselineMin * 60_000;
    let trough = r.mgdl;
    let troughIdx = i;
    for (let j = i - 1; j >= 0; j--) {
      const m = Date.parse(readings[j].ts);
      if (m < windowStartMs) break;
      if (readings[j].mgdl < trough) {
        trough = readings[j].mgdl;
        troughIdx = j;
      }
    }

    const rise = r.mgdl - trough;
    if (rise < minRise) continue;

    const durationMin = Math.round(
      (peakMs - Date.parse(readings[troughIdx].ts)) / 60_000
    );
    out.push({
      peakTs: r.ts,
      peakMgdl: r.mgdl,
      baselineMgdl: trough,
      riseMgdl: Math.round(rise),
      riseDurationMin: durationMin,
    });
    lastSpikeMs = peakMs;
  }
  return out;
}
