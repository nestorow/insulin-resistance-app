# Schema reference — стари zustand типове → Turso кандидати

Извлечено от `useStore.ts` (стар localStorage модел) + адаптирано спрямо
schema патърна на thyroid-rehab (`../thyroid-rehab/src/lib/db.ts`).
Това е **reference за бъдещите фази**, не финален schema.

## Стар модел (zustand persist, localStorage)

| Тип | Полета |
|---|---|
| `UserSettings` | gender, weight, height, age, waist, hip |
| `QuizResult` | date, yesCount, answers[], recommendation |
| `FastingSession` | id, startTime, endTime?, targetHours, completed |
| `ExerciseLog` | id, date, type, name, duration, intensity, sets[], notes |
| `DailyChecklist` | date, items: Record<string, boolean> |
| `tgHdlHistory` | date, tg, hdl, ratio |
| `bookmarkedFoods` | string[] |

## Кандидати за Turso таблици (нов модел)

Phase 0 създава само **минималния** набор (users, onboarding, daily_plan).
Останалите идват с модулите си в следващи фази.

```sql
-- PHASE 0 (заимствано от thyroid-rehab, адаптирано за ИР)

users            -- id, email, name, image, role, lens, created_at
                 -- lens = 'medical' | 'educational' | 'biohacker'

onboarding       -- user_id, lens, quiz_yes_count, quiz_answers (JSON),
                 -- diet_tier ('moderate' <100g | 'keto' <50g),
                 -- tg_hdl_ratio, whr, recommended_sequence, created_at

daily_plan       -- user_id, day_number (1..90), plan_variant, date,
                 -- tasks_completed (JSON), notes, completed_at

-- ПО-КЪСНИ ФАЗИ (per модул)

symptom_log      -- user_id, date, energy, brain_fog, weight, waist,
                 -- blood_sugar, mood, notes        (Дневник симптоми)

blood_markers    -- user_id, date, homa_ir, fasting_insulin, hba1c,
                 -- triglycerides, hdl, tg_hdl_ratio (Тракер показатели)

fasting_session  -- user_id, start_time, end_time, target_hours, completed
                                                    (Гладуване)

exercise_log     -- user_id, date, type, duration, intensity, sets (JSON)
                                                    (Тренировки)

user_supplements -- user_id, supplement_id, active, schedule, dosage
                                                    (Добавки)

food_bookmarks   -- user_id, food_id            (Хранителен справочник)
```

## Бележки по миграцията

- **`quizResult.yesCount` → `diet_tier`**: старата логика (виж
  `components-reference/QuizModule.tsx::getRecommendation`):
  `0 → нисък риск`, `1 → moderate (~100g ВХ)`, `2+ → keto (<50g ВХ)`.
- **`tgHdlHistory` / `whr`** вече са в onboarding (като част от теста) и в
  `blood_markers` (за месечно проследяване през 90-те дни).
- thyroid-rehab пази чувствителни кръвни данни в `blood_markers.encrypted_data`
  — да се прецени дали ИР показателите изискват същото криптиране (GDPR).
