import { clampedNum } from "@/lib/numbers";

describe("clampedNum", () => {
  it("returns undefined for empty string", () => {
    expect(clampedNum("", 0, 100)).toBeUndefined();
  });

  it("returns undefined for non-numeric input", () => {
    expect(clampedNum("abc", 0, 100)).toBeUndefined();
    expect(clampedNum("--12", 0, 100)).toBeUndefined();
  });

  it("returns undefined for NaN / Infinity", () => {
    expect(clampedNum("NaN", 0, 100)).toBeUndefined();
    expect(clampedNum("Infinity", 0, 100)).toBeUndefined();
  });

  it("accepts values inside the range", () => {
    expect(clampedNum("5", 0, 10)).toBe(5);
    expect(clampedNum("5.5", 0, 10)).toBe(5.5);
    expect(clampedNum("0", 0, 10)).toBe(0);
    expect(clampedNum("10", 0, 10)).toBe(10);
  });

  it("drops values below min", () => {
    expect(clampedNum("-1", 0, 10)).toBeUndefined();
    expect(clampedNum("19", 20, 400)).toBeUndefined(); // weight = 19 kg
  });

  it("drops values above max", () => {
    expect(clampedNum("11", 0, 10)).toBeUndefined();
    expect(clampedNum("999", 3, 20)).toBeUndefined(); // HbA1c = 999 %
  });

  it("handles negative ranges (defensive)", () => {
    expect(clampedNum("-5", -10, -1)).toBe(-5);
    expect(clampedNum("0", -10, -1)).toBeUndefined();
  });

  it("HbA1c case — accepts plausible, rejects garbage", () => {
    expect(clampedNum("5.4", 3, 20)).toBe(5.4);
    expect(clampedNum("12", 3, 20)).toBe(12);
    expect(clampedNum("2.9", 3, 20)).toBeUndefined();
    expect(clampedNum("100", 3, 20)).toBeUndefined();
  });
});
