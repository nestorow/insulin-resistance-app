import {
  getDayChecks,
  toggleDayCheck,
  setDayChecks,
  todayKey,
} from "@/lib/daily-plan-storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("daily-plan-storage", () => {
  it("empty by default", () => {
    expect(getDayChecks("2026-01-15")).toEqual({});
  });

  it("toggleDayCheck flips an item from absent → true → false", () => {
    const date = "2026-01-15";

    const a = toggleDayCheck(date, "morning_acv");
    expect(a).toEqual({ morning_acv: true });

    const b = toggleDayCheck(date, "morning_acv");
    expect(b).toEqual({ morning_acv: false });
  });

  it("isolates checks per date", () => {
    toggleDayCheck("2026-01-15", "morning_acv");
    toggleDayCheck("2026-01-16", "day_water");
    expect(getDayChecks("2026-01-15")).toEqual({ morning_acv: true });
    expect(getDayChecks("2026-01-16")).toEqual({ day_water: true });
  });

  it("setDayChecks replaces the full day map", () => {
    toggleDayCheck("2026-01-15", "morning_acv");
    setDayChecks(
      "2026-01-15",
      { day_water: true, eve_sleep: true },
      { skipServer: true }
    );
    expect(getDayChecks("2026-01-15")).toEqual({
      day_water: true,
      eve_sleep: true,
    });
  });

  it("todayKey returns YYYY-MM-DD for the current date", () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const expected = now.toISOString().slice(0, 10);
    expect(todayKey()).toBe(expected);
  });

  it("survives a corrupted store (treats as empty)", () => {
    window.localStorage.setItem("ir-daily-plan-v1", "not-json{");
    expect(getDayChecks("2026-01-15")).toEqual({});
  });
});
