import { queryCacheKey, _internal } from "@/lib/anthropic";

describe("queryCacheKey", () => {
  it("returns a stable sha256 hash for the same input", () => {
    const a = queryCacheKey("Мога ли да ям банан?", "keto");
    const b = queryCacheKey("Мога ли да ям банан?", "keto");
    expect(a.hash).toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normalizes whitespace + case", () => {
    const a = queryCacheKey("Мога ли да ям банан?", "keto");
    const b = queryCacheKey("  МОГА ЛИ  ДА ЯМ  БАНАН?  ", "keto");
    expect(a.normalized).toBe("мога ли да ям банан?");
    expect(a.hash).toBe(b.hash);
  });

  it("different tiers → different hashes (so cache splits)", () => {
    const keto = queryCacheKey("Мога ли да ям банан?", "keto");
    const none = queryCacheKey("Мога ли да ям банан?", "none");
    const moderate = queryCacheKey("Мога ли да ям банан?", "moderate");
    expect(keto.hash).not.toBe(none.hash);
    expect(keto.hash).not.toBe(moderate.hash);
    expect(none.hash).not.toBe(moderate.hash);
  });

  it("different queries → different hashes", () => {
    const a = queryCacheKey("Мога ли да ям банан?", "keto");
    const b = queryCacheKey("Мога ли да ям ябълка?", "keto");
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("systemPrompt", () => {
  it("includes the tier-specific carb cap", () => {
    const keto = _internal.systemPrompt("keto");
    expect(keto).toMatch(/under 50 g\/day net carbs/);

    const moderate = _internal.systemPrompt("moderate");
    expect(moderate).toMatch(/under 100 g\/day net carbs/);

    const none = _internal.systemPrompt("none");
    expect(none).toMatch(/without a strict cap/);
  });

  it("always instructs Bulgarian output", () => {
    const p = _internal.systemPrompt("keto");
    expect(p).toMatch(/ALWAYS respond in Bulgarian/);
  });

  it("forbids medical diagnosis", () => {
    const p = _internal.systemPrompt("keto");
    expect(p).toMatch(/NEVER give a medical diagnosis/);
  });

  it("references Bikman's 4 pillars", () => {
    const p = _internal.systemPrompt("keto");
    expect(p).toMatch(/Bikman/);
    expect(p).toMatch(/4 pillars/);
  });
});

describe("constants", () => {
  it("MAX_QUERY_LENGTH protects against pasted articles", () => {
    expect(_internal.MAX_QUERY_LENGTH).toBeLessThanOrEqual(500);
    expect(_internal.MAX_QUERY_LENGTH).toBeGreaterThanOrEqual(100);
  });

  it("MAX_TOKENS caps Claude output budget", () => {
    expect(_internal.MAX_TOKENS).toBeLessThanOrEqual(1000);
  });

  it("model is a Haiku 4.5 variant (cheap + fast)", () => {
    expect(_internal.MODEL).toMatch(/haiku-4-5/);
  });

  it("MAX_CONVERSATION_TURNS caps multi-turn cost growth", () => {
    expect(_internal.MAX_CONVERSATION_TURNS).toBeGreaterThanOrEqual(5);
    expect(_internal.MAX_CONVERSATION_TURNS).toBeLessThanOrEqual(20);
  });
});
