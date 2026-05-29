import {
  TRENDS_WINDOW_DAYS,
  aggregateCgmDaily,
  buildAxis,
  computeSummary,
  isoDay,
  mergeCgm,
  mergeMarkers,
  mergePlan,
  mergeSymptoms,
  type TrendDay,
} from "@/lib/trends";
import type { CgmReading } from "@/lib/cgm";

describe("isoDay + buildAxis", () => {
  it("isoDay returns UTC YYYY-MM-DD", () => {
    expect(isoDay(new Date("2026-05-20T23:45:00.000Z"))).toBe("2026-05-20");
  });

  it("buildAxis returns 90 dense slots ending today", () => {
    const axis = buildAxis(new Date("2026-05-20T00:00:00.000Z"));
    expect(axis).toHaveLength(TRENDS_WINDOW_DAYS);
    expect(axis[0].date).toBe("2026-02-20"); // 89 days before May 20
    expect(axis[axis.length - 1].date).toBe("2026-05-20");
  });

  it("axis slots are date-only — no other fields populated", () => {
    const axis = buildAxis(new Date("2026-05-20T00:00:00.000Z"));
    for (const d of axis) {
      expect(Object.keys(d)).toEqual(["date"]);
    }
  });
});

describe("mergeMarkers", () => {
  it("populates only the matching dates, leaves others untouched", () => {
    const axis: TrendDay[] = [
      { date: "2026-05-18" },
      { date: "2026-05-19" },
      { date: "2026-05-20" },
    ];
    const merged = mergeMarkers(axis, [
      { date: "2026-05-19", homaIr: 2.1, hba1c: 5.4 },
    ]);
    expect(merged[0]).toEqual({ date: "2026-05-18" });
    expect(merged[1]).toMatchObject({
      date: "2026-05-19",
      homaIr: 2.1,
      hba1c: 5.4,
    });
    expect(merged[2]).toEqual({ date: "2026-05-20" });
  });
});

describe("mergeSymptoms", () => {
  it("copies energy / brainFog / weight / waist", () => {
    const axis: TrendDay[] = [{ date: "2026-05-19" }];
    const merged = mergeSymptoms(axis, [
      { date: "2026-05-19", energy: 7, brainFog: 3, weight: 78 },
    ]);
    expect(merged[0]).toMatchObject({
      energy: 7,
      brainFog: 3,
      weight: 78,
    });
  });
});

describe("aggregateCgmDaily", () => {
  function r(ts: string, mgdl: number): CgmReading {
    return { ts, mgdl, source: "libre" };
  }

  it("groups readings by UTC date", () => {
    const aggs = aggregateCgmDaily([
      r("2026-05-19T22:00:00.000Z", 100),
      r("2026-05-20T08:00:00.000Z", 110),
      r("2026-05-20T14:00:00.000Z", 130),
    ]);
    expect(aggs.size).toBe(2);
    expect(aggs.get("2026-05-20")?.cgmCount).toBe(2);
    expect(aggs.get("2026-05-19")?.cgmCount).toBe(1);
  });

  it("computes TIR/mean/CV per day", () => {
    const aggs = aggregateCgmDaily([
      r("2026-05-20T08:00:00.000Z", 100),
      r("2026-05-20T12:00:00.000Z", 120),
      r("2026-05-20T18:00:00.000Z", 140),
    ]);
    const d = aggs.get("2026-05-20")!;
    expect(d.cgmCount).toBe(3);
    expect(d.cgmMean).toBeCloseTo(120, 1);
    expect(d.cgmTir).toBe(100); // all in 70-180 → 100%
  });
});

describe("mergeCgm", () => {
  it("inlines the daily aggregates into the matching axis slots", () => {
    const axis: TrendDay[] = [
      { date: "2026-05-19" },
      { date: "2026-05-20" },
    ];
    const merged = mergeCgm(axis, [
      { ts: "2026-05-20T08:00:00.000Z", mgdl: 100, source: "libre" },
      { ts: "2026-05-20T12:00:00.000Z", mgdl: 140, source: "libre" },
    ]);
    expect(merged[0]).toEqual({ date: "2026-05-19" }); // untouched
    expect(merged[1]).toMatchObject({
      date: "2026-05-20",
      cgmCount: 2,
      cgmTir: 100,
    });
  });
});

describe("mergePlan", () => {
  it("computes completion % from boolean map", () => {
    const axis: TrendDay[] = [
      { date: "2026-05-18" },
      { date: "2026-05-19" },
      { date: "2026-05-20" },
    ];
    const merged = mergePlan(axis, {
      "2026-05-19": { a: true, b: true, c: false, d: false },
      "2026-05-20": { a: true, b: true },
    });
    expect(merged[0]).toEqual({ date: "2026-05-18" });
    expect(merged[1]).toMatchObject({ planCompletePct: 50 });
    expect(merged[2]).toMatchObject({ planCompletePct: 100 });
  });

  it("ignores empty maps (returns no planCompletePct)", () => {
    const axis: TrendDay[] = [{ date: "2026-05-19" }];
    const merged = mergePlan(axis, { "2026-05-19": {} });
    expect(merged[0].planCompletePct).toBeUndefined();
  });
});

describe("computeSummary", () => {
  it("latest values reflect the most recent non-null per metric", () => {
    const days: TrendDay[] = [
      { date: "2026-01-01", homaIr: 4.2 },
      { date: "2026-02-01", homaIr: 3.8 },
      { date: "2026-03-01" }, // no data
      { date: "2026-04-01", hba1c: 5.5 },
    ];
    const s = computeSummary(days);
    expect(s.latest.homaIr).toEqual({ value: 3.8, date: "2026-02-01" });
    expect(s.latest.hba1c).toEqual({ value: 5.5, date: "2026-04-01" });
    expect(s.latest.cgmTir).toBeUndefined();
  });

  it("delta.homaIr computes pct change first → last", () => {
    const days: TrendDay[] = [
      { date: "2026-01-01", homaIr: 4.0 },
      { date: "2026-02-01", homaIr: 3.5 },
      { date: "2026-03-01", homaIr: 2.8 },
    ];
    const s = computeSummary(days);
    expect(s.delta.homaIr?.from).toBe(4.0);
    expect(s.delta.homaIr?.to).toBe(2.8);
    // (2.8 - 4.0) / 4.0 = -0.30 → -30%
    expect(s.delta.homaIr?.pctChange).toBe(-30);
  });

  it("delta.weight computes kg delta first → last", () => {
    const days: TrendDay[] = [
      { date: "2026-01-01", weight: 85 },
      { date: "2026-02-01", weight: 81.5 },
    ];
    const s = computeSummary(days);
    expect(s.delta.weight?.deltaKg).toBe(-3.5);
  });

  it("delta is undefined when only one data point", () => {
    const days: TrendDay[] = [{ date: "2026-01-01", homaIr: 4.0 }];
    const s = computeSummary(days);
    expect(s.delta.homaIr).toBeUndefined();
  });

  it("activeDays counts only days with at least one non-date field", () => {
    const days: TrendDay[] = [
      { date: "2026-01-01" },
      { date: "2026-01-02", energy: 7 },
      { date: "2026-01-03", weight: 80 },
      { date: "2026-01-04" },
    ];
    const s = computeSummary(days);
    expect(s.activeDays).toBe(2);
  });

  it("windowStart/End from axis bounds", () => {
    const days: TrendDay[] = [
      { date: "2026-01-01" },
      { date: "2026-01-02" },
      { date: "2026-01-03" },
    ];
    const s = computeSummary(days);
    expect(s.windowStart).toBe("2026-01-01");
    expect(s.windowEnd).toBe("2026-01-03");
  });
});
