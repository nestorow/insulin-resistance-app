# /legacy/ — архив на MVP скелета (преди пренаписването)

Снимка на **съдържанието**, което си заслужава да се пренесе от стария
dark-theme MVP (commit `6c0c24c`) в новата Phase-based архитектура.

> Целта на тази папка е **бърза справка по време на по-късните фази** — не е
> жив код. Пълният стар код остава в git историята (`git show 6c0c24c`).
> UI слоят (тъмна тема, side nav, tab-switcher) е **изхвърлен** нарочно.

## Какво има тук

| Път | Произход | Стойност | Бъдещ дом |
|---|---|---|---|
| `data/diseases.ts` | `src/data/diseases.ts` | ⭐ 30+ заболявания → ИР, BG, статистики | Модул **Образование** |
| `data/knowledge.ts` | `src/data/knowledge.ts` | ⭐ Bikman: 15 глави, key facts, 4 стълба | Модул **Образование** |
| `data/foods.ts` | `src/data/foods.ts` | ⭐ BG храни: GL+макроси, ферментирали, мазнини | **Хранителен справочник** |
| `data/protocol.ts` | `src/data/protocol.ts` | Дневен/седмичен/месечен чеклист | **Дневен план** |
| `components-reference/QuizModule.tsx` | `src/components/quiz/` | ⭐ 8-въпр. IR тест + tier logic, TG/HDL, WHR | **Onboarding** |
| `components-reference/FastingModule.tsx` | `src/components/fasting/` | 6-фазна физиология (0→24ч), таргети | **Гладуване** |
| `components-reference/ExerciseModule.tsx` | `src/components/exercise/` | Принципи + 7-дневен план + типове | **Тренировки** |
| `useStore.ts` | `src/store/` | zustand типове → reference за Turso schema | — (виж `schema-reference.md`) |

## Какво НЕ е пренесено (и защо)

- **UI обвивката** — тъмна тема (`#0F172A`), `Navigation.tsx`, tab-switcher
  `page.tsx`. Заменя се със светла teal естетика + routing.
- **zustand persist (localStorage)** — заменя се с Turso + NextAuth.
- **Модул „Добавки"** — в стария код няма реално съдържание (само бегли
  споменавания в чеклиста: магнезий, D3, хром, цинк). Berberine / ALA /
  chromium с evidence-grading трябва да се **напишат от нула** в по-късна фаза.

## Карта стар → нов модул

```
СТАРО (7 таба)              НОВО (8 модула + onboarding)
─────────────              ────────────────────────────
Quiz              ───────► Onboarding (тест → tier)
DiseaseMap        ───┐
Knowledge         ───┴───► 8. Образование
Food              ───────► 4. Хранителен справочник
Fasting           ───────► 6. Гладуване
Exercise          ───────► 5. Тренировки
Protocol          ───────► 1. Дневен план
                           2. Дневник симптоми   (нов)
                           3. Тракер показатели  (нов)
                           7. Добавки            (нов, съдържание TBD)
```
