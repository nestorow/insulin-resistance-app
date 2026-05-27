// Exercise + fasting reference content, extracted from the legacy MVP
// (/legacy/components-reference/ExerciseModule.tsx + FastingModule.tsx)
// and Bikman chapter 13/14 takeaways (/legacy/data/knowledge.ts).

export const EXERCISE_PRINCIPLES: string[] = [
  "Минута по минута, силовите тренировки може да са по-ефективни от аеробните за подобряване на ИР",
  "Интензивността е по-важна от продължителността",
  "HIIT за 20 мин е поне толкова ефективно, колкото 45+ мин умерено",
  "Работа до отказ (failure) на всеки сет при силови",
  "Не пий спортни напитки след тренировка",
  "Прекъсвай седенето на всеки 20-30 минути",
  "10-15 мин разходка след хранене сваля кръвната захар (insulin sink)",
];

export interface WeeklyDay {
  day_bg: string;
  activity_bg: string;
  kind: "strength" | "hiit" | "rest" | "cold";
}

export const WEEKLY_PLAN: WeeklyDay[] = [
  { day_bg: "Понеделник", activity_bg: "Силови — горна част (до отказ)", kind: "strength" },
  { day_bg: "Вторник", activity_bg: "HIIT — 20 мин интервали", kind: "hiit" },
  { day_bg: "Сряда", activity_bg: "Почивка или лека разходка", kind: "rest" },
  { day_bg: "Четвъртък", activity_bg: "Силови — долна част (до отказ)", kind: "strength" },
  { day_bg: "Петък", activity_bg: "HIIT или аеробна", kind: "hiit" },
  { day_bg: "Събота", activity_bg: "Силови — цяло тяло", kind: "strength" },
  { day_bg: "Неделя", activity_bg: "Почивка, студова експозиция", kind: "cold" },
];

export interface FastingPhase {
  minHours: number;
  maxHours: number;
  label_bg: string;
  color: string;
}

export const FASTING_PHASES: FastingPhase[] = [
  { minHours: 0, maxHours: 4, label_bg: "Хранене — инсулинът е повишен", color: "#f97316" },
  { minHours: 4, maxHours: 8, label_bg: "Ранно гладуване — инсулинът намалява", color: "#eab308" },
  { minHours: 8, maxHours: 12, label_bg: "Гладуване — мазнините се мобилизират", color: "#84cc16" },
  { minHours: 12, maxHours: 16, label_bg: "Оптимално гладуване — глюкагонът доминира", color: "#14b8a6" },
  { minHours: 16, maxHours: 18, label_bg: "Удължено гладуване — засилена автофагия", color: "#06b6d4" },
  { minHours: 18, maxHours: 24, label_bg: "Дълбоко гладуване — максимална инсулинова чувствителност", color: "#10b981" },
];

export interface FastingTarget {
  hours: number;
  cadence_bg: string;
  note_bg: string;
}

// 90-day progression: build from daily 12h toward periodic 24h.
export const FASTING_TARGETS: FastingTarget[] = [
  { hours: 12, cadence_bg: "Ежедневно", note_bg: "Минимумът — вечеря до 19:00, закуска след 7:00" },
  { hours: 16, cadence_bg: "Повечето дни", note_bg: "16:8 — пропусни закуската или вечерята" },
  { hours: 18, cadence_bg: "2-3 пъти седмично", note_bg: "Автофагията се активира след 16+ часа" },
  { hours: 24, cadence_bg: "1 път месечно", note_bg: "Максимална инсулинова чувствителност" },
];
