import { checklistItems, itemText } from "@/data/protocol";

describe("checklistItems integrity", () => {
  it("every id is unique", () => {
    const ids = checklistItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every category is one of the allowed values", () => {
    const allowed = new Set([
      "morning",
      "day",
      "evening",
      "weekly",
      "monthly",
    ]);
    for (const i of checklistItems) {
      expect(allowed.has(i.category)).toBe(true);
    }
  });

  it("availableFromDay (when set) is between 1 and 90", () => {
    for (const i of checklistItems) {
      if (i.availableFromDay !== undefined) {
        expect(i.availableFromDay).toBeGreaterThanOrEqual(1);
        expect(i.availableFromDay).toBeLessThanOrEqual(90);
      }
    }
  });

  it("text_by_phase keys (when set) are 1..4", () => {
    for (const i of checklistItems) {
      if (i.text_by_phase) {
        for (const k of Object.keys(i.text_by_phase)) {
          const n = Number(k);
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it("tiers (when set) only contain known DietTier values", () => {
    const allowed = new Set(["none", "moderate", "keto"]);
    for (const i of checklistItems) {
      if (i.tiers) {
        for (const t of i.tiers) {
          expect(allowed.has(t)).toBe(true);
        }
      }
    }
  });
});

describe("itemText resolver", () => {
  // Pick a stable item that has phase-varying text.
  const eveDinner = checklistItems.find((i) => i.id === "eve_dinner")!;

  it("falls back to text_bg when phase has no override", () => {
    expect(itemText({ id: "x", text_bg: "default", category: "day" }, 2)).toBe(
      "default"
    );
  });

  it("uses text_by_phase override when present", () => {
    expect(eveDinner.text_by_phase?.[2]).toBeDefined();
    expect(itemText(eveDinner, 2)).toBe(eveDinner.text_by_phase![2]);
    expect(itemText(eveDinner, 4)).toBe(eveDinner.text_by_phase![4]);
  });

  it("phase-1 reads use the base text_bg (no phase-1 override pattern)", () => {
    // Convention in protocol.ts: phase 1 = text_bg, overrides start at 2.
    expect(itemText(eveDinner, 1)).toBe(eveDinner.text_bg);
  });
});
