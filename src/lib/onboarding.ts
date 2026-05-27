// Onboarding domain logic — pure, UI-free, testable.
// Content ported from the legacy MVP (see /legacy/components-reference/
// QuizModule.tsx and /legacy/data/protocol.ts).

export type Lens = "medical" | "educational" | "biohacker";
export type DietTier = "none" | "moderate" | "keto";

export interface LensDef {
  id: Lens;
  title_bg: string;
  blurb_bg: string;
  pick_bg: string; // what the user is telling us by choosing this
}

export const LENSES: LensDef[] = [
  {
    id: "medical",
    title_bg: "Имам диагноза",
    blurb_bg: "Преддиабет или диабет тип 2. Клиничен тон с препратки.",
    pick_bg: "Акцент върху HbA1c, инсулин на гладно и кръвни показатели.",
  },
  {
    id: "educational",
    title_bg: "Имам симптоми",
    blurb_bg: "Умора, наднормено, brain fog — без поставена диагноза.",
    pick_bg: "Обяснително: симптом → причина → действие.",
  },
  {
    id: "biohacker",
    title_bg: "Оптимизирам се",
    blurb_bg: "Здрав съм и искам да оптимизирам метаболизма си.",
    pick_bg: "Data-driven: HOMA-IR, гладуване, графики.",
  },
];

// 8-question IR self-assessment (legacy QuizModule `questions`).
export const QUIZ_QUESTIONS: string[] = [
  "Имате ли повече мазнини около корема, отколкото бихте искали?",
  "Имате ли високо кръвно налягане?",
  "Имате ли фамилна история на сърдечно заболяване?",
  "Имате ли високи нива на триглицериди в кръвта?",
  "Задържате ли лесно вода?",
  "Имате ли тъмни петна по кожата (акантозис нигриканс) или кожни тагове?",
  "Имате ли роднина с инсулинова резистентност или диабет тип 2?",
  "Имате ли PCOS (за жени) или еректилна дисфункция (за мъже)?",
];

export interface TierInfo {
  tier: DietTier;
  risk_bg: string;
  recommendation_bg: string;
  macros_bg: string;
  carbCap: number | null; // grams/day
}

// Legacy `getRecommendation`: 0 -> low risk, 1 -> moderate, 2+ -> keto.
export function tierFromYesCount(yesCount: number): TierInfo {
  if (yesCount <= 0) {
    return {
      tier: "none",
      risk_bg: "Нисък риск",
      recommendation_bg:
        "Засега нисък риск — продължавай да се грижиш за метаболитното си здраве.",
      macros_bg: "Балансирано хранене, ограничи рафинираните въглехидрати.",
      carbCap: null,
    };
  }
  if (yesCount === 1) {
    return {
      tier: "moderate",
      risk_bg: "Вероятна инсулинова резистентност",
      recommendation_bg: "Умерено нисковъглехидратен подход.",
      macros_bg: "~55% мазнини · 25% протеин · 20% въглехидрати (под 100 г/ден)",
      carbCap: 100,
    };
  }
  return {
    tier: "keto",
    risk_bg: "Почти сигурна инсулинова резистентност",
    recommendation_bg: "Кетогенен подход за бързо сваляне на инсулина.",
    macros_bg: "~70% мазнини · 25% протеин · 5% въглехидрати (под 50 г/ден)",
    carbCap: 50,
  };
}

// Day-1 task template (subset of legacy protocol.ts, by period).
export interface DayTask {
  id: string;
  text_bg: string;
  period: "morning" | "day" | "evening";
}

export const DAY1_TASKS: DayTask[] = [
  { id: "m_acv", text_bg: "Ябълков оцет: 1-2 с.л. в чаша вода", period: "morning" },
  { id: "m_fast", text_bg: "Без закуска (12-16ч гладуване) или нисковъглехидратна закуска", period: "morning" },
  { id: "d_carbs_last", text_bg: "Въглехидратите последни в хранението", period: "day" },
  { id: "d_no_seed_oils", text_bg: "Без семенни олиа и сокове", period: "day" },
  { id: "d_walk", text_bg: "10-15 мин разходка след основно хранене", period: "day" },
  { id: "e_dinner", text_bg: "Вечеря преди 19:00 (начало на 12ч гладуване)", period: "evening" },
  { id: "e_sleep", text_bg: "7-9 часа сън, без екрани 1 час преди това", period: "evening" },
];

// Lens-specific emphasis for the day-1 screen (tone + what to highlight).
export const LENS_DAY1_FOCUS: Record<Lens, string> = {
  medical:
    "Запиши изходните си показатели (HbA1c, инсулин на гладно), за да следиш напредъка обективно.",
  educational:
    "Всяко действие тук цели едно: да свали инсулина ти. Започни с малките навици.",
  biohacker:
    "Маркирай ден 1 като baseline. Гладуването и разходките след хранене дават най-бързия сигнал.",
};

export interface OnboardingResult {
  lens: Lens;
  quizAnswers: boolean[];
  quizYesCount: number;
  tier: DietTier;
  tgHdlRatio: number | null;
  whr: number | null;
  completedAt: string;
}

export const ONBOARDING_VERSION = 1;
