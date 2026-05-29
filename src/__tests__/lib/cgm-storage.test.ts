import {
  addCgmReadings,
  clearCgmReadings,
  getCgmReadings,
  mergeReadings,
} from "@/lib/cgm-storage";
import { CgmReading } from "@/lib/cgm";

function r(ts: string, mgdl: number, source: CgmReading["source"] = "libre"): CgmReading {
  return { ts, mgdl, source };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("mergeReadings", () => {
  it("dedupes by ts (incoming wins)", () => {
    const a = [r("2026-05-20T08:00:00.000Z", 100, "libre")];
    const b = [r("2026-05-20T08:00:00.000Z", 145, "libre")];
    const out = mergeReadings(a, b);
    expect(out).toHaveLength(1);
    expect(out[0].mgdl).toBe(145);
  });

  it("sorts ascending", () => {
    const a = [r("2026-05-20T09:00:00.000Z", 110)];
    const b = [
      r("2026-05-20T08:00:00.000Z", 100),
      r("2026-05-20T10:00:00.000Z", 120),
    ];
    const out = mergeReadings(a, b);
    expect(out.map((x) => x.ts)).toEqual([
      "2026-05-20T08:00:00.000Z",
      "2026-05-20T09:00:00.000Z",
      "2026-05-20T10:00:00.000Z",
    ]);
  });

  it("returns existing untouched on empty incoming", () => {
    const a = [r("2026-05-20T08:00:00.000Z", 100)];
    expect(mergeReadings(a, [])).toBe(a);
  });

  it("caps at MAX_READINGS keeping the most recent", () => {
    // Construct 12_001 readings: oldest should be evicted.
    const huge: CgmReading[] = Array.from({ length: 12_001 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 0, 1) + i * 5 * 60_000);
      return r(d.toISOString(), 100 + (i % 50));
    });
    const out = mergeReadings([], huge);
    expect(out).toHaveLength(12_000);
    // First reading should now be at index 1 of the original (oldest dropped).
    expect(out[0].ts).toBe(huge[1].ts);
  });
});

describe("addCgmReadings (skipServer)", () => {
  it("starts empty", () => {
    expect(getCgmReadings()).toEqual([]);
  });

  it("persists batch to localStorage", () => {
    const { local } = addCgmReadings(
      [
        r("2026-05-20T08:00:00.000Z", 95),
        r("2026-05-20T08:15:00.000Z", 110),
      ],
      { skipServer: true }
    );
    expect(local).toHaveLength(2);
    expect(getCgmReadings()).toHaveLength(2);
  });

  it("repeated calls merge instead of replace", () => {
    addCgmReadings([r("2026-05-20T08:00:00.000Z", 95)], { skipServer: true });
    addCgmReadings([r("2026-05-20T08:15:00.000Z", 110)], { skipServer: true });
    expect(getCgmReadings()).toHaveLength(2);
  });

  it("idempotent on duplicate ts", () => {
    addCgmReadings([r("2026-05-20T08:00:00.000Z", 95)], { skipServer: true });
    addCgmReadings([r("2026-05-20T08:00:00.000Z", 95)], { skipServer: true });
    expect(getCgmReadings()).toHaveLength(1);
  });

  it("empty incoming → resolves 'ok' without server call", async () => {
    const { local, pending } = addCgmReadings([], { skipServer: true });
    expect(local).toEqual([]);
    await expect(pending).resolves.toBe("ok");
  });
});

describe("clearCgmReadings", () => {
  it("removes the localStorage key", () => {
    addCgmReadings([r("2026-05-20T08:00:00.000Z", 95)], { skipServer: true });
    clearCgmReadings();
    expect(getCgmReadings()).toEqual([]);
  });
});
