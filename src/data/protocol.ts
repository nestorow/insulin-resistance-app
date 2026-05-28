import type { ProgramPhaseIndex } from "@/lib/program-phases";

export interface ChecklistItem {
  id: string;
  /** Default label — shown in phase 1 unless `text_by_phase` overrides. */
  text_bg: string;
  category: "morning" | "day" | "evening" | "weekly" | "monthly";
  /** Day on which the item first becomes part of the daily plan (default 1). */
  availableFromDay?: number;
  /** Optional per-phase rewording — pulled from `program-phases.ts` indices. */
  text_by_phase?: Partial<Record<ProgramPhaseIndex, string>>;
}

// Items are ordered as they should appear in the UI. Progression rules:
// - `availableFromDay` unlocks an item from that day onward (cumulative).
// - `text_by_phase` rewords an item as the program tightens — fasting
//   windows, training intensity, dinner cut-off, etc.
// Day-1 reads as the legacy basics; phase 4 reads as full protocol.

export const checklistItems: ChecklistItem[] = [
  // ── Morning ──────────────────────────────────────────────────────────
  {
    id: "morning_acv",
    text_bg: "Ябълков оцет: 1-2 с.л. в чаша вода",
    category: "morning",
  },
  {
    id: "morning_meal",
    text_bg: "Нисковъглехидратна закуска до 9:00",
    category: "morning",
    text_by_phase: {
      2: "Лека нисковъглехидратна закуска ИЛИ пропусни (ако вече си гладувал 14ч)",
      3: "Пропусни закуска — обяд в 12:00 (16:8 прозорец)",
      4: "Пропусни закуска — обяд в 13:00 (18:6 прозорец)",
    },
  },
  {
    id: "morning_supps",
    text_bg: "Суплементи: Магнезий, Витамин D3 (4000 IU)",
    category: "morning",
  },
  {
    id: "morning_exercise",
    text_bg: "Движение: 10-15 мин разходка или лека гимнастика",
    category: "morning",
    text_by_phase: {
      2: "Движение или лека тренировка (тренировъчен ден)",
      3: "Силова тренировка или HIIT (тренировъчен ден)",
      4: "Силова тренировка или HIIT (тренировъчен ден)",
    },
  },

  // ── Day ──────────────────────────────────────────────────────────────
  {
    id: "day_breaks",
    text_bg: "Прекъсване на седенето на всеки 20-30 мин",
    category: "day",
  },
  {
    id: "day_meals",
    text_bg: "Хранения: протеин + мазнини + нискоGL зеленчуци",
    category: "day",
  },
  {
    id: "day_carbs_last",
    text_bg: "Въглехидратите ПОСЛЕДНИ в хранението",
    category: "day",
  },
  {
    id: "day_post_meal_walk",
    text_bg: "10-15 мин разходка след обяд",
    category: "day",
    availableFromDay: 15, // unlocks in phase 2
    text_by_phase: {
      3: "10-15 мин разходка след всяко основно хранене",
      4: "10-15 мин разходка след всяко основно хранене",
    },
  },
  {
    id: "day_fermented",
    text_bg: "Ферментирала храна с поне 1 хранене",
    category: "day",
    availableFromDay: 15, // introduce in phase 2 to avoid day-1 overload
  },
  {
    id: "day_no_juice",
    text_bg: "Без сокове — яж плодовете цели",
    category: "day",
  },
  {
    id: "day_no_seed_oils",
    text_bg: "Без семенни олиа",
    category: "day",
  },
  {
    id: "day_water",
    text_bg: "Достатъчно вода",
    category: "day",
  },

  // ── Evening ──────────────────────────────────────────────────────────
  {
    id: "eve_acv",
    text_bg: "Ябълков оцет: 1-2 с.л. в чаша вода",
    category: "evening",
  },
  {
    id: "eve_dinner",
    text_bg: "Вечеря преди 20:00 (12-часов прозорец без храна за нощта)",
    category: "evening",
    text_by_phase: {
      2: "Вечеря преди 19:00 (14-часов прозорец)",
      3: "Вечеря преди 18:00 (16-часов прозорец — 16:8)",
      4: "Вечеря преди 17:00 (18-часов прозорец — 18:6)",
    },
  },
  {
    id: "eve_supps",
    text_bg: "Суплементи: Хром (400 µg), Цинк (30 mg)",
    category: "evening",
  },
  {
    id: "eve_screens",
    text_bg: "Без екрани 1 час преди сън",
    category: "evening",
    availableFromDay: 15,
  },
  {
    id: "eve_cold",
    text_bg: "Студен душ (по избор)",
    category: "evening",
    availableFromDay: 31,
  },
  {
    id: "eve_sleep",
    text_bg: "7-9 часа сън",
    category: "evening",
  },

  // ── Weekly ───────────────────────────────────────────────────────────
  {
    id: "week_fasting",
    text_bg: "1 ден с 14-часово гладуване",
    category: "weekly",
    text_by_phase: {
      2: "2 дни с 14-16 часа гладуване",
      3: "3 дни с 16:8 гладуване",
      4: "2-3 дни с 18:6 гладуване",
    },
  },
  {
    id: "week_exercise",
    text_bg: "Минимум 2 часа движение (разходки + лека гимнастика)",
    category: "weekly",
    text_by_phase: {
      2: "Минимум 2.5 часа — поне 1 силова тренировка",
      3: "Минимум 3 часа — 3 силови тренировки в седмицата",
      4: "Минимум 3 часа — 3 силови + 1 HIIT",
    },
  },
  {
    id: "week_sweets",
    text_bg: "Максимум 1 сладко/десерт за седмицата",
    category: "weekly",
  },
  {
    id: "week_waist",
    text_bg: "Измерване: обиколка на талията",
    category: "weekly",
    availableFromDay: 15,
  },

  // ── Monthly ──────────────────────────────────────────────────────────
  {
    id: "month_24h",
    text_bg: "1x 24-часово гладуване (по избор)",
    category: "monthly",
    availableFromDay: 61, // phase 4 only
  },
  {
    id: "month_tghdl",
    text_bg: "Преглед на TG/HDL (ако има кръвни резултати)",
    category: "monthly",
  },
];

/** Resolve the visible text for an item given the current program phase. */
export function itemText(item: ChecklistItem, phase: ProgramPhaseIndex): string {
  return item.text_by_phase?.[phase] ?? item.text_bg;
}
