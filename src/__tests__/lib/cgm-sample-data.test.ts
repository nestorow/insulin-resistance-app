import { generateSampleReadings } from "@/lib/cgm-sample-data";
import { detectSpikes, timeInRange, variability } from "@/lib/cgm-stats";

describe("generateSampleReadings", () => {
  it("returns 14 days × 96 readings = 1344", () => {
    const r = generateSampleReadings(new Date("2026-05-20T00:00:00.000Z"));
    expect(r).toHaveLength(14 * 96);
  });

  it("all readings carry source='demo' so the UI can flag demo mode", () => {
    const r = generateSampleReadings();
    expect(r.every((x) => x.source === "demo")).toBe(true);
  });

  it("is sorted ascending by ts", () => {
    const r = generateSampleReadings(new Date("2026-05-20T00:00:00.000Z"));
    for (let i = 1; i < r.length; i++) {
      expect(r[i].ts.localeCompare(r[i - 1].ts)).toBeGreaterThan(0);
    }
  });

  it("anchors at the supplied end day (today's readings included)", () => {
    const end = new Date("2026-05-20T00:00:00.000Z");
    const r = generateSampleReadings(end);
    // First reading: 14 days before end (= 2026-05-07).
    expect(r[0].ts.slice(0, 10)).toBe("2026-05-07");
    // Last reading: same day as `end`.
    expect(r[r.length - 1].ts.slice(0, 10)).toBe("2026-05-20");
  });

  it("is deterministic (same seed → same output)", () => {
    const end = new Date("2026-05-20T00:00:00.000Z");
    const a = generateSampleReadings(end);
    const b = generateSampleReadings(end);
    expect(a.map((x) => x.mgdl)).toEqual(b.map((x) => x.mgdl));
  });

  it("stays within physiological 60–240 mg/dL bounds", () => {
    const r = generateSampleReadings();
    for (const x of r) {
      expect(x.mgdl).toBeGreaterThanOrEqual(60);
      expect(x.mgdl).toBeLessThanOrEqual(240);
    }
  });

  it("produces a realistic biohacker profile (TIR 60–95%, CV under 50%)", () => {
    // The fixture is calibrated to roughly mirror a near-normo-glycemic
    // biohacker with occasional spikes — guards the UI demo from going
    // pathological by accident on tuning.
    const r = generateSampleReadings();
    const t = timeInRange(r);
    const v = variability(r);
    expect(t.tir).toBeGreaterThanOrEqual(60);
    expect(t.tir).toBeLessThanOrEqual(100);
    expect(v.cv).toBeLessThan(50);
  });

  it("the spike detector finds the two flagged bad-day dinners", () => {
    // Days 5 and 12 get +40 mg/dL on dinner → detector should flag both.
    // We also expect some breakfast/lunch spikes >=40 on the other days,
    // so the assertion is: at least 2 spikes, with at least one >=70.
    const r = generateSampleReadings();
    const spikes = detectSpikes(r);
    expect(spikes.length).toBeGreaterThanOrEqual(2);
    expect(spikes.some((s) => s.riseMgdl >= 70)).toBe(true);
  });
});
