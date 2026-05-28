import {
  programPhase,
  milestoneMessage,
  MILESTONE_DAYS,
  PROGRAM_PHASES,
} from "@/lib/program-phases";

describe("programPhase boundaries", () => {
  it("day 1 → phase 1 (Адаптация)", () => {
    const p = programPhase(1);
    expect(p.index).toBe(1);
    expect(p.from).toBe(1);
    expect(p.to).toBe(14);
  });

  it("day 14 still phase 1 (inclusive upper)", () => {
    expect(programPhase(14).index).toBe(1);
  });

  it("day 15 → phase 2 (Стесняване)", () => {
    expect(programPhase(15).index).toBe(2);
  });

  it("day 30 still phase 2", () => {
    expect(programPhase(30).index).toBe(2);
  });

  it("day 31 → phase 3 (Оптимизация)", () => {
    expect(programPhase(31).index).toBe(3);
  });

  it("day 60 still phase 3", () => {
    expect(programPhase(60).index).toBe(3);
  });

  it("day 61 → phase 4 (Закотвяне)", () => {
    expect(programPhase(61).index).toBe(4);
  });

  it("day 90 still phase 4", () => {
    expect(programPhase(90).index).toBe(4);
  });

  it("clamps below 1 to phase 1", () => {
    expect(programPhase(0).index).toBe(1);
    expect(programPhase(-5).index).toBe(1);
  });

  it("clamps above 90 to phase 4", () => {
    expect(programPhase(91).index).toBe(4);
    expect(programPhase(9999).index).toBe(4);
  });
});

describe("PROGRAM_PHASES integrity", () => {
  it("exactly 4 phases", () => {
    expect(PROGRAM_PHASES).toHaveLength(4);
  });

  it("phases cover days 1-90 contiguously with no gaps", () => {
    for (let i = 1; i < PROGRAM_PHASES.length; i++) {
      expect(PROGRAM_PHASES[i].from).toBe(PROGRAM_PHASES[i - 1].to + 1);
    }
    expect(PROGRAM_PHASES[0].from).toBe(1);
    expect(PROGRAM_PHASES[PROGRAM_PHASES.length - 1].to).toBe(90);
  });

  it("each phase has a non-empty Bulgarian name + goal", () => {
    for (const p of PROGRAM_PHASES) {
      expect(p.name_bg.length).toBeGreaterThan(0);
      expect(p.goal_bg.length).toBeGreaterThan(10);
    }
  });
});

describe("milestoneMessage", () => {
  it("returns a string on milestone days", () => {
    for (const d of MILESTONE_DAYS) {
      const m = milestoneMessage(d);
      expect(typeof m).toBe("string");
      expect((m ?? "").length).toBeGreaterThan(0);
    }
  });

  it("returns null on non-milestone days", () => {
    for (const d of [1, 2, 8, 13, 15, 29, 45, 59, 89]) {
      expect(milestoneMessage(d)).toBeNull();
    }
  });

  it("MILESTONE_DAYS contains expected anchors", () => {
    expect(MILESTONE_DAYS.has(7)).toBe(true);
    expect(MILESTONE_DAYS.has(14)).toBe(true);
    expect(MILESTONE_DAYS.has(30)).toBe(true);
    expect(MILESTONE_DAYS.has(60)).toBe(true);
    expect(MILESTONE_DAYS.has(90)).toBe(true);
  });
});
