import {
  saveOnboarding,
  loadOnboarding,
  clearOnboarding,
} from "@/lib/onboarding-storage";
import type { OnboardingResult } from "@/lib/onboarding";

function sample(yesCount = 2): OnboardingResult {
  return {
    lens: "educational",
    quizAnswers: [true, true, false, false, false, false, false, false],
    quizYesCount: yesCount,
    tier: "keto",
    tgHdlRatio: null,
    whr: null,
    completedAt: "2026-01-15T00:00:00.000Z",
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("onboarding-storage", () => {
  it("returns null when nothing saved", () => {
    expect(loadOnboarding()).toBeNull();
  });

  it("round-trips a saved result", () => {
    const r = sample();
    saveOnboarding(r, { skipServer: true });
    expect(loadOnboarding()).toEqual(r);
  });

  it("clearOnboarding empties the cache", () => {
    saveOnboarding(sample(), { skipServer: true });
    clearOnboarding();
    expect(loadOnboarding()).toBeNull();
  });

  it("uses a versioned key (current: v1)", () => {
    saveOnboarding(sample(), { skipServer: true });
    expect(window.localStorage.getItem("ir-onboarding-v1")).not.toBeNull();
  });

  it("recovers gracefully from a corrupted payload", () => {
    window.localStorage.setItem("ir-onboarding-v1", "not-json{");
    expect(loadOnboarding()).toBeNull();
  });

  it("overwrites previous result on save", () => {
    saveOnboarding(sample(1), { skipServer: true });
    saveOnboarding(sample(5), { skipServer: true });
    expect(loadOnboarding()?.quizYesCount).toBe(5);
  });
});
