import {
  clearOnboardingDraft,
  isDraftSubstantive,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/onboarding-draft";

const KEY = "ir-onboarding-draft-v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("saveOnboardingDraft + loadOnboardingDraft", () => {
  it("starts null when no draft is stored", () => {
    expect(loadOnboardingDraft()).toBeNull();
  });

  it("round-trips a draft", () => {
    saveOnboardingDraft({
      step: "quiz",
      answers: [true, false, null, true, null, null, null, null],
      lens: null,
      tg: "",
      hdl: "",
      waist: "",
      hip: "",
    });
    const d = loadOnboardingDraft();
    expect(d?.step).toBe("quiz");
    expect(d?.answers[0]).toBe(true);
    expect(d?.answers[2]).toBeNull();
    expect(typeof d?.savedAt).toBe("string");
  });

  it("overwrites the previous draft", () => {
    saveOnboardingDraft({
      step: "quiz",
      answers: [true, null, null, null, null, null, null, null],
      lens: null,
      tg: "",
      hdl: "",
      waist: "",
      hip: "",
    });
    saveOnboardingDraft({
      step: "lens",
      answers: [true, true, true, null, null, null, null, null],
      lens: "medical",
      tg: "",
      hdl: "",
      waist: "",
      hip: "",
    });
    const d = loadOnboardingDraft();
    expect(d?.step).toBe("lens");
    expect(d?.lens).toBe("medical");
  });

  it("drops drafts older than 7 days on read", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        step: "quiz",
        answers: [true, null, null, null, null, null, null, null],
        lens: null,
        tg: "",
        hdl: "",
        waist: "",
        hip: "",
        savedAt: eightDaysAgo.toISOString(),
      })
    );
    expect(loadOnboardingDraft()).toBeNull();
    // ...and the stale draft is purged on the same read so it doesn't
    // accumulate in localStorage forever.
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("survives malformed JSON without throwing", () => {
    window.localStorage.setItem(KEY, "not json");
    expect(loadOnboardingDraft()).toBeNull();
  });
});

describe("clearOnboardingDraft", () => {
  it("wipes the draft", () => {
    saveOnboardingDraft({
      step: "lens",
      answers: Array(8).fill(null),
      lens: "biohacker",
      tg: "",
      hdl: "",
      waist: "",
      hip: "",
    });
    clearOnboardingDraft();
    expect(loadOnboardingDraft()).toBeNull();
  });
});

describe("isDraftSubstantive", () => {
  function draft(over: Partial<Parameters<typeof saveOnboardingDraft>[0]> = {}) {
    return {
      step: "quiz" as const,
      answers: Array(8).fill(null),
      lens: null,
      tg: "",
      hdl: "",
      waist: "",
      hip: "",
      savedAt: new Date().toISOString(),
      ...over,
    };
  }

  it("false for null", () => {
    expect(isDraftSubstantive(null)).toBe(false);
  });

  it("false for an entirely empty draft", () => {
    expect(isDraftSubstantive(draft())).toBe(false);
  });

  it("true when any quiz answer is set", () => {
    expect(
      isDraftSubstantive(
        draft({ answers: [true, ...Array(7).fill(null)] as (boolean | null)[] })
      )
    ).toBe(true);
  });

  it("true when lens is picked", () => {
    expect(isDraftSubstantive(draft({ lens: "medical" }))).toBe(true);
  });

  it("true when any optional input is filled", () => {
    expect(isDraftSubstantive(draft({ tg: "150" }))).toBe(true);
    expect(isDraftSubstantive(draft({ hdl: "45" }))).toBe(true);
    expect(isDraftSubstantive(draft({ waist: "92" }))).toBe(true);
    expect(isDraftSubstantive(draft({ hip: "98" }))).toBe(true);
  });
});
