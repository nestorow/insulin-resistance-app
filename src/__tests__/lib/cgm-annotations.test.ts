import {
  MAX_NOTE_LEN,
  clearCgmAnnotations,
  getCgmAnnotations,
  setCgmAnnotation,
} from "@/lib/cgm-annotations";

beforeEach(() => {
  window.localStorage.clear();
});

describe("cgm-annotations", () => {
  it("starts empty", () => {
    expect(getCgmAnnotations()).toEqual({});
  });

  it("setCgmAnnotation persists and round-trips", () => {
    const ts = "2026-05-20T08:30:00.000Z";
    setCgmAnnotation(ts, "банан + кафе", { skipServer: true });
    expect(getCgmAnnotations()[ts]).toBe("банан + кафе");
  });

  it("empty string deletes the entry (clears the row)", () => {
    const ts = "2026-05-20T08:30:00.000Z";
    setCgmAnnotation(ts, "пица", { skipServer: true });
    setCgmAnnotation(ts, "", { skipServer: true });
    expect(getCgmAnnotations()[ts]).toBeUndefined();
  });

  it("whitespace-only is treated as delete", () => {
    const ts = "2026-05-20T08:30:00.000Z";
    setCgmAnnotation(ts, "пица", { skipServer: true });
    setCgmAnnotation(ts, "   ", { skipServer: true });
    expect(getCgmAnnotations()[ts]).toBeUndefined();
  });

  it("trims and caps at MAX_NOTE_LEN", () => {
    const ts = "2026-05-20T08:30:00.000Z";
    const longNote = "x".repeat(MAX_NOTE_LEN + 50);
    setCgmAnnotation(ts, `  ${longNote}  `, { skipServer: true });
    const stored = getCgmAnnotations()[ts];
    expect(stored.length).toBe(MAX_NOTE_LEN);
  });

  it("supports multiple annotations on different spikes", () => {
    setCgmAnnotation("2026-05-20T08:00:00.000Z", "сутрешно кафе", {
      skipServer: true,
    });
    setCgmAnnotation("2026-05-20T13:00:00.000Z", "обяд — ориз", {
      skipServer: true,
    });
    const all = getCgmAnnotations();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["2026-05-20T08:00:00.000Z"]).toBe("сутрешно кафе");
    expect(all["2026-05-20T13:00:00.000Z"]).toBe("обяд — ориз");
  });

  it("clearCgmAnnotations wipes the map", () => {
    setCgmAnnotation("2026-05-20T08:00:00.000Z", "x", { skipServer: true });
    clearCgmAnnotations();
    expect(getCgmAnnotations()).toEqual({});
  });
});
