import {
  MAX_ANNOTATION_LEN,
  clearDayAnnotations,
  getDayAnnotations,
  setDayAnnotation,
} from "@/lib/day-annotations";

beforeEach(() => {
  window.localStorage.clear();
});

describe("day-annotations", () => {
  it("starts empty", () => {
    expect(getDayAnnotations()).toEqual({});
  });

  it("setDayAnnotation persists and round-trips", () => {
    setDayAnnotation("2026-03-01", "започнах кето", { skipServer: true });
    expect(getDayAnnotations()["2026-03-01"]).toBe("започнах кето");
  });

  it("empty string deletes the entry", () => {
    setDayAnnotation("2026-03-01", "x", { skipServer: true });
    setDayAnnotation("2026-03-01", "", { skipServer: true });
    expect(getDayAnnotations()["2026-03-01"]).toBeUndefined();
  });

  it("whitespace-only is treated as delete", () => {
    setDayAnnotation("2026-03-01", "x", { skipServer: true });
    setDayAnnotation("2026-03-01", "   ", { skipServer: true });
    expect(getDayAnnotations()["2026-03-01"]).toBeUndefined();
  });

  it("trims and caps at MAX_ANNOTATION_LEN", () => {
    const long = "a".repeat(MAX_ANNOTATION_LEN + 30);
    setDayAnnotation("2026-03-01", `  ${long}  `, { skipServer: true });
    expect(getDayAnnotations()["2026-03-01"].length).toBe(MAX_ANNOTATION_LEN);
  });

  it("supports multiple distinct dates", () => {
    setDayAnnotation("2026-03-01", "започнах кето", { skipServer: true });
    setDayAnnotation("2026-04-15", "ваканция", { skipServer: true });
    setDayAnnotation("2026-04-20", "бях болен", { skipServer: true });
    expect(Object.keys(getDayAnnotations())).toHaveLength(3);
  });

  it("clearDayAnnotations wipes the map", () => {
    setDayAnnotation("2026-03-01", "x", { skipServer: true });
    clearDayAnnotations();
    expect(getDayAnnotations()).toEqual({});
  });
});
