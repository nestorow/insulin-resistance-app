// Cache reader/writer behavior. The db module is mocked so the test
// just verifies the SQL shape + return contract.

const executeMock = jest.fn();
jest.mock("@/lib/db", () => ({
  db: { execute: (...args: unknown[]) => executeMock(...args) },
}));

import { getCachedAnswer, setCachedAnswer } from "@/lib/food-cache";

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockResolvedValue({ rows: [] });
});

describe("getCachedAnswer", () => {
  it("returns null when the row doesn't exist", async () => {
    executeMock.mockResolvedValueOnce({ rows: [] });
    const r = await getCachedAnswer("hash-1");
    expect(r).toBeNull();
  });

  it("returns the cached payload and fires a hit-counter bump", async () => {
    executeMock.mockResolvedValueOnce({
      rows: [
        {
          query: "мога ли да ям банан?",
          response: "Не за keto — ~24g.",
          model: "claude-haiku-4-5",
          hits: 3,
          created_at: "2026-05-28T10:00:00Z",
        },
      ],
    });
    const r = await getCachedAnswer("hash-1");
    expect(r).toEqual({
      query: "мога ли да ям банан?",
      response: "Не за keto — ~24g.",
      model: "claude-haiku-4-5",
      hits: 3,
      createdAt: "2026-05-28T10:00:00Z",
    });

    // Second execute call should be the UPDATE bump.
    const calls = executeMock.mock.calls;
    const bumpCall = calls.find((c) =>
      /UPDATE food_search_cache/.test((c[0] as { sql: string }).sql)
    );
    expect(bumpCall).toBeDefined();
    expect((bumpCall![0] as { sql: string }).sql).toMatch(/hits = hits \+ 1/);
  });
});

describe("setCachedAnswer", () => {
  it("inserts with INSERT OR IGNORE (race-safe)", async () => {
    await setCachedAnswer({
      queryHash: "h",
      query: "q",
      tier: "keto",
      response: "answer",
      model: "claude-haiku-4-5",
    });
    expect(executeMock).toHaveBeenCalledTimes(1);
    const call = executeMock.mock.calls[0][0] as {
      sql: string;
      args: unknown[];
    };
    expect(call.sql).toMatch(/INSERT OR IGNORE INTO food_search_cache/);
    expect(call.args).toEqual(["h", "q", "keto", "answer", "claude-haiku-4-5"]);
  });
});
