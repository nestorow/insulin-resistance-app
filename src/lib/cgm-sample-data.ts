// Synthetic CGM dataset for the "Зареди примерни данни" affordance.
// 14 days × 96 readings (15-min cadence, matches FreeStyle Libre) =
// 1344 readings — enough to populate a meaningful AGP without
// over-flooding the chart.
//
// Pattern shape (Bikman-aware, normo-glycemic-with-spikes biohacker
// profile):
//   - nightly baseline ~85–92 mg/dL
//   - dawn phenomenon ~+12 at 05:00–07:00
//   - breakfast spike 08:00 +50 over baseline, settles by 10:30
//   - lunch spike 13:00 +35
//   - dinner spike 19:30 +40
//   - evening descent back to baseline by 23:00
// Two "bad" days (Sat/Sun analogue — days 5 and 12) get extra +40 mg/dL
// on dinner so the spike detector + meal-labeled feedback loop has
// something to flag in the empty state.
//
// Deterministic — uses a seeded LCG (Park-Miller "minstd") so the demo
// looks the same every reload. Anchored relative to "now" so the chart
// always shows recent dates.

import type { CgmReading } from "./cgm";

const DAYS = 14;
const STEP_MIN = 15;
const STEPS_PER_DAY = (24 * 60) / STEP_MIN; // 96
const SEED = 0x5BD1E995;

/** Park-Miller LCG — pure, deterministic, no Math.random pollution. */
function makeRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

interface SpikeWindow {
  startHr: number; // start hour (decimal, UTC)
  durHr: number; // duration in hours
  peakRise: number; // peak mg/dL above baseline
}

/** Cosine-shaped post-meal bump within `[start, start+dur]`. */
function spikeContribution(hour: number, w: SpikeWindow): number {
  if (hour < w.startHr || hour > w.startHr + w.durHr) return 0;
  const t = (hour - w.startHr) / w.durHr; // 0..1
  // peak around t=0.35 (rises ~30 min, descends ~90 min) — matches the
  // physiological glucose curve better than a symmetric bell.
  const x = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65;
  return w.peakRise * Math.sin((Math.PI / 2) * x);
}

/** Build the readings for a single day given its base + spike windows. */
function dayReadings(
  baseDate: Date,
  baseline: number,
  windows: SpikeWindow[],
  rng: () => number
): CgmReading[] {
  const out: CgmReading[] = [];
  for (let step = 0; step < STEPS_PER_DAY; step++) {
    const hour = (step * STEP_MIN) / 60;
    // Dawn phenomenon: linear bump 04:30 → 07:00 then back.
    let dawn = 0;
    if (hour >= 4.5 && hour < 7) dawn = ((hour - 4.5) / 2.5) * 12;
    else if (hour >= 7 && hour < 9) dawn = (1 - (hour - 7) / 2) * 12;

    let value = baseline + dawn;
    for (const w of windows) value += spikeContribution(hour, w);
    // ± noise in mg/dL — looks like real sensor jitter.
    value += (rng() - 0.5) * 6;
    value = Math.max(60, Math.min(240, Math.round(value)));

    const ts = new Date(baseDate);
    ts.setUTCHours(0, 0, 0, 0);
    ts.setUTCMinutes(step * STEP_MIN);
    out.push({ ts: ts.toISOString(), mgdl: value, source: "demo" });
  }
  return out;
}

/**
 * Generate the 14-day synthetic dataset anchored at `endDay` (defaults
 * to today UTC, so the chart always shows recent dates). The result is
 * sorted ascending by ts.
 */
export function generateSampleReadings(endDay: Date = new Date()): CgmReading[] {
  const rng = makeRng(SEED);
  const out: CgmReading[] = [];

  // Cursor walks backwards: dayIdx = 0 is today, 13 is two weeks ago.
  for (let dayIdx = DAYS - 1; dayIdx >= 0; dayIdx--) {
    const d = new Date(endDay);
    d.setUTCDate(d.getUTCDate() - dayIdx);

    const isBad = dayIdx === 5 || dayIdx === 12; // two flagged "bad" days
    const baseline = 86 + Math.round((rng() - 0.5) * 4);

    const windows: SpikeWindow[] = [
      // Breakfast 08:00, dur 2.5h, +50
      { startHr: 8.0, durHr: 2.5, peakRise: 48 + Math.round(rng() * 6) },
      // Lunch 13:00, dur 2.5h, +35
      { startHr: 13.0, durHr: 2.5, peakRise: 32 + Math.round(rng() * 6) },
      // Dinner 19:30, dur 3h, +40 (+40 more on bad days)
      {
        startHr: 19.5,
        durHr: 3.0,
        peakRise: 38 + Math.round(rng() * 6) + (isBad ? 40 : 0),
      },
    ];

    out.push(...dayReadings(d, baseline, windows, rng));
  }

  return out;
}
