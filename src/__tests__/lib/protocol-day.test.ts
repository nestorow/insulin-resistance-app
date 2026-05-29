import { PROTOCOL_LENGTH_DAYS, protocolDay } from "@/lib/protocol-day";

const START = "2026-01-01T08:30:00.000Z"; // day 1

describe("protocolDay", () => {
  it("day 1 on the completion day itself", () => {
    const p = protocolDay(START, new Date("2026-01-01T22:00:00.000Z"));
    expect(p.day).toBe(1);
    expect(p.rawDays).toBe(1);
    expect(p.pct).toBe(Math.round((1 / 90) * 100));
  });

  it("day 14 thirteen calendar days later (UTC)", () => {
    const p = protocolDay(START, new Date("2026-01-14T08:00:00.000Z"));
    expect(p.day).toBe(14);
    expect(p.phase.index).toBe(1); // last day of phase 1
  });

  it("day 15 crosses into phase 2", () => {
    const p = protocolDay(START, new Date("2026-01-15T00:01:00.000Z"));
    expect(p.day).toBe(15);
    expect(p.phase.index).toBe(2);
  });

  it("clamps at PROTOCOL_LENGTH_DAYS when past the protocol", () => {
    // 200 days in — capped to 90
    const p = protocolDay(START, new Date("2026-07-20T00:00:00.000Z"));
    expect(p.day).toBe(PROTOCOL_LENGTH_DAYS);
    expect(p.rawDays).toBeGreaterThan(PROTOCOL_LENGTH_DAYS);
    expect(p.phase.index).toBe(4); // closing phase
  });

  it("pct progresses 0→100 across the window", () => {
    const day7 = protocolDay(START, new Date("2026-01-07T00:00:00.000Z"));
    expect(day7.pct).toBe(Math.round((7 / 90) * 100));
    const day90 = protocolDay(START, new Date("2026-03-31T00:00:00.000Z"));
    expect(day90.day).toBe(90);
    expect(day90.pct).toBe(100);
  });

  describe("milestones", () => {
    it("flags milestoneCrossedToday on milestone days", () => {
      const day7 = protocolDay(START, new Date("2026-01-07T00:00:00.000Z"));
      expect(day7.milestoneCrossedToday).toBe(7);
      const day14 = protocolDay(START, new Date("2026-01-14T00:00:00.000Z"));
      expect(day14.milestoneCrossedToday).toBe(14);
      const day30 = protocolDay(START, new Date("2026-01-30T00:00:00.000Z"));
      expect(day30.milestoneCrossedToday).toBe(30);
    });

    it("non-milestone days have null milestoneCrossedToday", () => {
      const day5 = protocolDay(START, new Date("2026-01-05T00:00:00.000Z"));
      expect(day5.milestoneCrossedToday).toBeNull();
    });

    it("nextMilestone + daysToNextMilestone", () => {
      // Day 8 — next milestone is 14, 6 days away
      const p = protocolDay(START, new Date("2026-01-08T00:00:00.000Z"));
      expect(p.nextMilestone).toBe(14);
      expect(p.daysToNextMilestone).toBe(6);
    });

    it("nextMilestone is null past day 90", () => {
      const p = protocolDay(START, new Date("2026-04-30T00:00:00.000Z"));
      expect(p.nextMilestone).toBeNull();
      expect(p.daysToNextMilestone).toBeNull();
    });
  });
});
