import {
  normalizeQuery,
  matchesQuery,
  buildSearchBlob,
} from "@/lib/education-search";

describe("normalizeQuery", () => {
  it("lowercases ASCII and Cyrillic", () => {
    expect(normalizeQuery("HOMA-IR")).toBe("homa-ir");
    expect(normalizeQuery("МОЗЪК")).toBe("мозък");
  });

  it("collapses internal whitespace and trims", () => {
    expect(normalizeQuery("  insulin   sink  ")).toBe("insulin sink");
  });

  it("strips Latin diacritics", () => {
    expect(normalizeQuery("café")).toBe("cafe");
  });

  it("is idempotent", () => {
    const once = normalizeQuery("  Café  HOMA-IR  ");
    expect(normalizeQuery(once)).toBe(once);
  });

  it("returns empty for whitespace-only input", () => {
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("matchesQuery", () => {
  it("matches everything for empty query", () => {
    expect(matchesQuery("anything", "")).toBe(true);
    expect(matchesQuery("anything", "   ")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(matchesQuery("PCOS и инсулин", "pcos")).toBe(true);
    expect(matchesQuery("pcos и инсулин", "PCOS")).toBe(true);
  });

  it("requires every token to be present (AND)", () => {
    expect(matchesQuery("мозък и инсулин", "мозък инсулин")).toBe(true);
    expect(matchesQuery("мозък", "мозък инсулин")).toBe(false);
  });

  it("substring matches inside a longer word", () => {
    expect(matchesQuery("гладуване", "глад")).toBe(true);
  });

  it("returns false when no token hits", () => {
    expect(matchesQuery("Алцхаймер", "рак")).toBe(false);
  });
});

describe("buildSearchBlob", () => {
  it("joins truthy fields with a space and normalizes", () => {
    expect(buildSearchBlob(["PCOS", "Инсулин", "Жени"])).toBe(
      "pcos инсулин жени"
    );
  });

  it("drops null/undefined/empty entries", () => {
    expect(buildSearchBlob(["A", null, undefined, "", "B"])).toBe("a b");
  });

  it("returns empty string when nothing usable is passed", () => {
    expect(buildSearchBlob([null, undefined, ""])).toBe("");
  });

  it("output is already normalized — matchesQuery skips a pass", () => {
    const blob = buildSearchBlob(["HOMA-IR", "  Мозък  "]);
    expect(blob).toBe("homa-ir мозък");
    expect(matchesQuery(blob, "мозък")).toBe(true);
  });
});
