import {
  agpProfile,
  detectSpikes,
  timeInRange,
  variability,
} from "@/lib/cgm-stats";
import { CgmReading } from "@/lib/cgm";

function r(ts: string, mgdl: number): CgmReading {
  return { ts, mgdl, source: "libre" };
}

describe("timeInRange", () => {
  it("buckets across the AGP 5-zone scheme", () => {
    const readings = [
      r("2026-05-20T08:00:00.000Z", 50), // veryLow
      r("2026-05-20T08:15:00.000Z", 60), // low
      r("2026-05-20T08:30:00.000Z", 90), // inRange
      r("2026-05-20T08:45:00.000Z", 140), // inRange
      r("2026-05-20T09:00:00.000Z", 220), // high
      r("2026-05-20T09:15:00.000Z", 300), // veryHigh
    ];
    const t = timeInRange(readings);
    // 6 readings: 1/6, 1/6, 2/6, 1/6, 1/6 → 16.7, 16.7, 33.3, 16.7, 16.7
    expect(t.veryLow).toBeCloseTo(16.7, 1);
    expect(t.low).toBeCloseTo(16.7, 1);
    expect(t.inRange).toBeCloseTo(33.3, 1);
    expect(t.high).toBeCloseTo(16.7, 1);
    expect(t.veryHigh).toBeCloseTo(16.7, 1);
    expect(t.tir).toBe(33);
  });

  it("returns zeros for empty input", () => {
    const t = timeInRange([]);
    expect(t.tir).toBe(0);
    expect(t.inRange).toBe(0);
  });

  it("respects custom low/high bounds", () => {
    const readings = [
      r("2026-05-20T08:00:00.000Z", 100),
      r("2026-05-20T08:15:00.000Z", 150),
    ];
    const tight = timeInRange(readings, 80, 140);
    // 100 in range; 150 is high. So TIR = 50%.
    expect(tight.tir).toBe(50);
  });
});

describe("variability", () => {
  it("computes mean / sd / cv / gmi", () => {
    const readings = [
      r("2026-05-20T08:00:00.000Z", 100),
      r("2026-05-20T08:15:00.000Z", 120),
      r("2026-05-20T08:30:00.000Z", 140),
    ];
    const v = variability(readings);
    expect(v.mean).toBeCloseTo(120, 1);
    // Sample SD of {100,120,140}: sqrt(800/2) = 20
    expect(v.sd).toBeCloseTo(20, 1);
    expect(v.cv).toBeCloseTo(16.7, 1);
    // GMI = 3.31 + 0.02392 × 120 = 6.18
    expect(v.gmi).toBeCloseTo(6.2, 1);
    expect(v.count).toBe(3);
  });

  it("returns zeros for empty input", () => {
    expect(variability([])).toEqual({ mean: 0, sd: 0, cv: 0, gmi: 0, count: 0 });
  });

  it("sd = 0 for a single reading (no sample variance)", () => {
    const v = variability([r("2026-05-20T08:00:00.000Z", 100)]);
    expect(v.sd).toBe(0);
    expect(v.cv).toBe(0);
  });
});

describe("agpProfile", () => {
  it("buckets readings by UTC hour-of-day across days", () => {
    // Two days of readings at 08:00 UTC: 100 and 140.
    const readings = [
      r("2026-05-20T08:00:00.000Z", 100),
      r("2026-05-21T08:00:00.000Z", 140),
      // A single reading at 14:00 the second day.
      r("2026-05-21T14:00:00.000Z", 90),
    ];
    const profile = agpProfile(readings);
    expect(profile).toHaveLength(24);

    const h8 = profile[8];
    expect(h8.count).toBe(2);
    expect(h8.p50).toBeCloseTo(120, 1); // median of {100, 140}

    const h14 = profile[14];
    expect(h14.count).toBe(1);
    expect(h14.p50).toBe(90);

    // Empty hours come back zero-filled with count: 0.
    expect(profile[3].count).toBe(0);
    expect(profile[3].p50).toBe(0);
  });
});

describe("detectSpikes", () => {
  it("flags a clear +60 mg/dL rise as a spike", () => {
    // Synthetic post-prandial curve: 90 → 150 over 30 min, then settling.
    const readings = [
      r("2026-05-20T08:00:00.000Z", 90),
      r("2026-05-20T08:15:00.000Z", 95),
      r("2026-05-20T08:30:00.000Z", 130),
      r("2026-05-20T08:45:00.000Z", 150), // peak
      r("2026-05-20T09:00:00.000Z", 120),
      r("2026-05-20T09:15:00.000Z", 105),
    ];
    const spikes = detectSpikes(readings);
    expect(spikes).toHaveLength(1);
    expect(spikes[0].peakMgdl).toBe(150);
    expect(spikes[0].baselineMgdl).toBe(90);
    expect(spikes[0].riseMgdl).toBe(60);
    // 90 → 150 = 45 min from trough to peak.
    expect(spikes[0].riseDurationMin).toBe(45);
  });

  it("ignores rises below the threshold", () => {
    // +30 mg/dL — under the default 40 cutoff.
    const readings = [
      r("2026-05-20T08:00:00.000Z", 90),
      r("2026-05-20T08:15:00.000Z", 110),
      r("2026-05-20T08:30:00.000Z", 120), // peak
      r("2026-05-20T08:45:00.000Z", 100),
    ];
    expect(detectSpikes(readings)).toHaveLength(0);
  });

  it("enforces cooldown — back-to-back peaks don't double-fire", () => {
    // Two peaks 30 min apart. With 90-min cooldown only the first wins.
    const readings = [
      r("2026-05-20T08:00:00.000Z", 90),
      r("2026-05-20T08:15:00.000Z", 95),
      r("2026-05-20T08:30:00.000Z", 150), // peak A
      r("2026-05-20T08:45:00.000Z", 100),
      r("2026-05-20T09:00:00.000Z", 145), // would be peak B
      r("2026-05-20T09:15:00.000Z", 100),
    ];
    const spikes = detectSpikes(readings);
    expect(spikes).toHaveLength(1);
    expect(spikes[0].peakMgdl).toBe(150);
  });

  it("returns [] for fewer than 3 readings", () => {
    expect(
      detectSpikes([
        r("2026-05-20T08:00:00.000Z", 90),
        r("2026-05-20T08:15:00.000Z", 150),
      ])
    ).toEqual([]);
  });
});
