// Program-phase progression for the 90-day protocol.
//
// The protocol is split into 4 cumulative phases — items unlock as the user
// moves through them, and some items escalate in intensity (e.g. fasting
// window 12h → 14h → 16h → 18h). This mirrors Bikman's clinical pattern
// of staged adaptation rather than a flat checklist from day 1.

export type ProgramPhaseIndex = 1 | 2 | 3 | 4;

export interface ProgramPhase {
  index: ProgramPhaseIndex;
  name_bg: string;        // short label, e.g. "Адаптация"
  range_bg: string;       // human range, e.g. "Дни 1-14"
  goal_bg: string;        // one-line WHY for this phase
  from: number;           // inclusive
  to: number;             // inclusive
}

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    index: 1,
    name_bg: "Адаптация",
    range_bg: "Дни 1-14",
    goal_bg: "Премахваме рафинираните въглехидрати и въвеждаме 12-часов нощен прозорец без храна.",
    from: 1,
    to: 14,
  },
  {
    index: 2,
    name_bg: "Стесняване",
    range_bg: "Дни 15-30",
    goal_bg: "Удължаваме гладуването до 14:10, прибавяме разходки след хранене и седмично измерване на талията.",
    from: 15,
    to: 30,
  },
  {
    index: 3,
    name_bg: "Оптимизация",
    range_bg: "Дни 31-60",
    goal_bg: "Преминаваме към 16:8 и силови тренировки 3 пъти седмично — мускулите стават главната „insulin sink“.",
    from: 31,
    to: 60,
  },
  {
    index: 4,
    name_bg: "Закотвяне",
    range_bg: "Дни 61-90",
    goal_bg: "18:6 в повечето дни, по избор 24-часово гладуване веднъж месечно — навикът става твой по подразбиране.",
    from: 61,
    to: 90,
  },
];

export function programPhase(day: number): ProgramPhase {
  const d = Math.max(1, Math.min(90, Math.floor(day)));
  for (const p of PROGRAM_PHASES) {
    if (d >= p.from && d <= p.to) return p;
  }
  // Unreachable given the clamp above, but TS needs a fallback.
  return PROGRAM_PHASES[PROGRAM_PHASES.length - 1];
}

// Milestone days that deserve a small celebration banner on /plan.
// Kept short — only the first week, end-of-phase-1, end-of-phase-2, end-of-3,
// and the final day.
export const MILESTONE_DAYS = new Set<number>([7, 14, 30, 60, 90]);

export function milestoneMessage(day: number): string | null {
  switch (day) {
    case 7:
      return "Първа седмица завършена. Тялото вече започва да понижава инсулина на гладно.";
    case 14:
      return "Две седмици — фаза Адаптация е завършена. От утре стесняваме.";
    case 30:
      return "Един месец. Време е за 16:8 и силови тренировки.";
    case 60:
      return "Два месеца — последна третина. От утре навикът става твой.";
    case 90:
      return "90 дни завършени. Виж тренда в Дневник и Показатели.";
    default:
      return null;
  }
}
