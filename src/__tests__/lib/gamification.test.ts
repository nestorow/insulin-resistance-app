// Gamification engine — streak math + XP awarding + badge gates.
// The db module is mocked so the tests are deterministic; we drive
// SELECT results via the queue below and assert the resulting writes.

const executeMock = jest.fn();
jest.mock("@/lib/db", () => ({
  db: { execute: (...args: unknown[]) => executeMock(...args) },
}));

import {
  recordEvent,
  getProgress,
  BADGES,
  _internal,
} from "@/lib/gamification";

type DbResult = { rows: Record<string, unknown>[] };

/** Queue successive SELECT results in order; each execute() call dequeues. */
function queueResults(results: DbResult[]) {
  executeMock.mockReset();
  let i = 0;
  executeMock.mockImplementation(async (call: { sql: string }) => {
    // INSERT/UPDATE statements return { rows: [] } by default; SELECTs
    // dequeue the next result. We pattern-match on `SELECT` to decide.
    if (/^\s*SELECT/i.test(call.sql)) {
      const r = results[i++] ?? { rows: [] };
      return r;
    }
    return { rows: [] };
  });
}

describe("level curve", () => {
  it("levelFromXp grows with sqrt — level 1 at 0 XP, 2 at 30, 3 at 120", () => {
    expect(_internal.levelFromXp(0)).toBe(1);
    expect(_internal.levelFromXp(29)).toBe(1);
    expect(_internal.levelFromXp(30)).toBe(2);
    expect(_internal.levelFromXp(120)).toBe(3);
    expect(_internal.levelFromXp(270)).toBe(4);
  });

  it("xpForLevel and levelFromXp are inverses at level boundaries", () => {
    for (const lvl of [1, 2, 3, 5, 10]) {
      expect(_internal.levelFromXp(_internal.xpForLevel(lvl))).toBe(lvl);
    }
  });
});

describe("recordEvent — streak math", () => {
  it("first-ever event creates a streak row with current=1, longest=1", async () => {
    queueResults([
      { rows: [] }, // bumpStreak: no row yet
      { rows: [] }, // awardXp todayCheckXp: 0
      { rows: [] }, // awardEarnedBadges owned
      // BADGES.length checks follow — return empty
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 1);

    const insert = executeMock.mock.calls.find((c) => {
      const sql = (c[0] as { sql: string }).sql;
      return /INSERT INTO user_streaks/.test(sql) && /current_streak/.test(sql);
    });
    expect(insert).toBeDefined();
    // current_streak + longest_streak are SQL literals (1, 1); args carry
    // only the dynamic values [user_id, date].
    expect((insert![0] as { sql: string }).sql).toMatch(/VALUES \(\?, 1, 1, \?\)/);
    expect((insert![0] as { args: unknown[] }).args[0]).toBe("user-1");
    expect((insert![0] as { args: unknown[] }).args[1]).toBe("2026-05-28");
  });

  it("consecutive day increments current_streak by 1", async () => {
    queueResults([
      {
        rows: [
          {
            current_streak: 3,
            longest_streak: 3,
            last_active_date: "2026-05-27",
          },
        ],
      },
      { rows: [] }, // awardXp todayCheckXp: 0
      { rows: [] }, // awardEarnedBadges owned
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 1);

    const update = executeMock.mock.calls.find((c) =>
      /UPDATE user_streaks/.test((c[0] as { sql: string }).sql)
    );
    expect(update).toBeDefined();
    expect((update![0] as { args: unknown[] }).args[0]).toBe(4); // current
    expect((update![0] as { args: unknown[] }).args[1]).toBe(4); // longest grew
  });

  it("gap > 1 day resets streak to 1", async () => {
    queueResults([
      {
        rows: [
          {
            current_streak: 5,
            longest_streak: 10,
            last_active_date: "2026-05-20",
          },
        ],
      },
      { rows: [] },
      { rows: [] },
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 1);

    const update = executeMock.mock.calls.find((c) =>
      /UPDATE user_streaks/.test((c[0] as { sql: string }).sql)
    );
    expect((update![0] as { args: unknown[] }).args[0]).toBe(1); // reset
    expect((update![0] as { args: unknown[] }).args[1]).toBe(10); // longest preserved
  });

  it("same-day repeated event does not double-count", async () => {
    queueResults([
      {
        rows: [
          {
            current_streak: 3,
            longest_streak: 3,
            last_active_date: "2026-05-28",
          },
        ],
      },
      // No further queries — bumpStreak short-circuits, so awardXp
      // proceeds (still awards XP — same-day cap handles farming).
      { rows: [] },
      { rows: [] },
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 1);

    // No UPDATE user_streaks for streak fields when same-day.
    const update = executeMock.mock.calls.find(
      (c) =>
        /UPDATE user_streaks\s+SET current_streak/.test(
          (c[0] as { sql: string }).sql
        )
    );
    expect(update).toBeUndefined();
  });
});

describe("recordEvent — XP awarding", () => {
  it("respects PLAN_CHECK_DAILY_CAP", async () => {
    queueResults([
      { rows: [] }, // no streak row
      // todayCheckXp returns at-cap value
      { rows: [{ total: _internal.PLAN_CHECK_DAILY_CAP }] },
      { rows: [] },
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 5);

    const xpInsert = executeMock.mock.calls.find((c) =>
      /INSERT INTO xp_log/.test((c[0] as { sql: string }).sql)
    );
    // Cap was already hit, so no xp_log insert at all
    expect(xpInsert).toBeUndefined();
  });

  it("trims overspend to remaining cap", async () => {
    queueResults([
      { rows: [] },
      // 13 of 15 already used today; request 5 more → award only 2
      { rows: [{ total: 13 }] },
      { rows: [] },
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "plan.check", "2026-05-28", 5);

    const xpInsert = executeMock.mock.calls.find((c) =>
      /INSERT INTO xp_log/.test((c[0] as { sql: string }).sql)
    );
    expect(xpInsert).toBeDefined();
    expect((xpInsert![0] as { args: unknown[] }).args[3]).toBe(2);
  });

  it("0-point events (onboarding.save) skip xp_log entirely", async () => {
    queueResults([
      { rows: [] },
      { rows: [] },
      ...BADGES.map(() => ({ rows: [] })),
    ]);
    await recordEvent("user-1", "onboarding.save", "2026-05-28");

    const xpInsert = executeMock.mock.calls.find((c) =>
      /INSERT INTO xp_log/.test((c[0] as { sql: string }).sql)
    );
    expect(xpInsert).toBeUndefined();
  });
});

describe("recordEvent — error swallowing", () => {
  it("never throws when the DB fails", async () => {
    executeMock.mockReset();
    executeMock.mockRejectedValue(new Error("db down"));
    await expect(
      recordEvent("user-1", "plan.check", "2026-05-28", 1)
    ).resolves.toBeUndefined();
  });
});

describe("cgm.upload event + new badges", () => {
  it("awards 10 XP per cgm.upload (POINTS table)", () => {
    expect(_internal.POINTS["cgm.upload"]).toBe(10);
  });

  it("first_cgm badge predicate hits xp_log for event_kind='cgm.upload'", async () => {
    const first = BADGES.find((b) => b.id === "first_cgm");
    expect(first).toBeDefined();
    executeMock.mockReset();
    executeMock.mockResolvedValueOnce({ rows: [{ "1": 1 }] }); // any non-empty
    const ok = await first!.check("user-1");
    expect(ok).toBe(true);
    expect(executeMock.mock.calls[0][0]).toMatchObject({
      sql: expect.stringContaining("event_kind = ?"),
      args: ["user-1", "cgm.upload"],
    });
  });

  it("cgm_week badge requires ≥7 distinct days in cgm_readings", async () => {
    const week = BADGES.find((b) => b.id === "cgm_week");
    expect(week).toBeDefined();

    executeMock.mockReset();
    executeMock.mockResolvedValueOnce({ rows: [{ days: 6 }] });
    expect(await week!.check("user-1")).toBe(false);

    executeMock.mockReset();
    executeMock.mockResolvedValueOnce({ rows: [{ days: 7 }] });
    expect(await week!.check("user-1")).toBe(true);

    executeMock.mockReset();
    executeMock.mockResolvedValueOnce({ rows: [{ days: 21 }] });
    expect(await week!.check("user-1")).toBe(true);
  });
});

describe("getProgress", () => {
  it("returns zeros when no rows exist yet", async () => {
    queueResults([{ rows: [] }, { rows: [] }]);
    const p = await getProgress("user-1");
    expect(p.currentStreak).toBe(0);
    expect(p.longestStreak).toBe(0);
    expect(p.totalXp).toBe(0);
    expect(p.level).toBe(1);
    expect(p.badgesEarned).toEqual([]);
  });

  it("composes level + xp + badges from the rows", async () => {
    queueResults([
      {
        rows: [{ current_streak: 5, longest_streak: 10, total_xp: 120 }],
      },
      { rows: [{ badge_id: "first_check" }, { badge_id: "week_streak" }] },
    ]);
    const p = await getProgress("user-1");
    expect(p.currentStreak).toBe(5);
    expect(p.longestStreak).toBe(10);
    expect(p.totalXp).toBe(120);
    expect(p.level).toBe(3); // sqrt(120/30) + 1 = 3
    expect(p.badgesEarned.sort()).toEqual(["first_check", "week_streak"]);
  });
});
