import {
  tierFromYesCount,
  inferredLens,
  LENSES,
  QUIZ_QUESTIONS,
} from "@/lib/onboarding";

describe("tierFromYesCount", () => {
  it("yesCount 0 → none tier, null carb cap", () => {
    const t = tierFromYesCount(0);
    expect(t.tier).toBe("none");
    expect(t.carbCap).toBeNull();
  });

  it("yesCount 1 → moderate tier, 100g cap", () => {
    const t = tierFromYesCount(1);
    expect(t.tier).toBe("moderate");
    expect(t.carbCap).toBe(100);
  });

  it.each([2, 3, 5, 8])("yesCount %i → keto tier, 50g cap", (count) => {
    const t = tierFromYesCount(count);
    expect(t.tier).toBe("keto");
    expect(t.carbCap).toBe(50);
  });

  it("provides a Bulgarian risk label for every tier", () => {
    for (const count of [0, 1, 2, 4]) {
      expect(tierFromYesCount(count).risk_bg).toMatch(/.{4,}/);
    }
  });
});

describe("inferredLens", () => {
  it("low scores → biohacker", () => {
    expect(inferredLens(0)).toBe("biohacker");
    expect(inferredLens(1)).toBe("biohacker");
  });

  it("mid scores → educational", () => {
    expect(inferredLens(2)).toBe("educational");
    expect(inferredLens(3)).toBe("educational");
    expect(inferredLens(4)).toBe("educational");
  });

  it("high scores → medical", () => {
    expect(inferredLens(5)).toBe("medical");
    expect(inferredLens(8)).toBe("medical");
  });

  it("inferred lens is always one of the defined LENSES", () => {
    for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
      const id = inferredLens(count);
      expect(LENSES.some((l) => l.id === id)).toBe(true);
    }
  });
});

describe("QUIZ_QUESTIONS", () => {
  it("has 8 questions (legacy parity)", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(8);
  });

  it("all questions end with a Bulgarian question mark", () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.endsWith("?")).toBe(true);
    }
  });
});
