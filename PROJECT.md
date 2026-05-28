# PROJECT.md — insulin-resistance-app

> 90-дневен интерактивен протокол за обръщане на инсулинова резистентност,
> базиран на работата на д-р Benjamin Bikman (*"Why We Get Sick"*).
> Research-backed, peer-reviewed, медицински сериозен тон. Bulgarian UI.

**Repo:** `nestorow/insulin-resistance-app` · **Deploy:** `insulin-resistance-app.vercel.app`
**Бранд:** InsulinReset
**Статус:** Phase 2 завършена — всичките 8 модула + onboarding в production, Google sign-in работи, DB persistence за логнати потребители (Turso), localStorage остава cache за анонимни.

---

## Визия

Персонализиран асистент, който води потребителя през 90-дневен протокол с
4-те стълба на Bikman: контрол на въглехидратите, приоритет на протеина,
естествени мазнини, и гладуване — подсилени с тренировки, проследяване на
кръвни показатели и добавки.

## Аудитория — три lens-а, един продукт

Onboarding-ът разклонява потребителя в режим, който влияе на **копито и
подредбата** (не на архитектурата):

| Lens | Кой | Тон | Акцент |
|---|---|---|---|
| **Medical** | Диагноза преддиабет/T2D | Клиничен, с препратки | HbA1c, fasting insulin |
| **Educational** | Симптоми без диагноза | Обяснителен: симптом→причина→действие | Образование |
| **Biohacker** | Оптимизатори | Data-driven | CGM, HOMA-IR графики, A/B |

## Дизайн

- Светла **teal** естетика (унифицирана с `thyroid-rehab`): teal `#1B7A6E`,
  mint `#F0FAF6`, warm `#F5D060`.
- Mobile-first, PWA, готовност за TWA (Phase 8+).
- Шрифтове: Montserrat (заглавия) + Nunito Sans (текст), кирилица.

## Tech stack

| Слой | Избор | Бележка |
|---|---|---|
| Framework | Next.js 15 (App Router) | "latest" — запазен от MVP |
| Runtime | React 19, Node 24.x | |
| Styling | Tailwind v4 (CSS-first `@theme`) | палитра портната от thyroid-rehab v3 |
| DB | Turso (libsql) `@libsql/client` | lazy proxy + идемпотентни миграции |
| Auth | NextAuth v4 — Google OAuth | патърн от thyroid-rehab |
| State | localStorage (cache) + Turso (DB при логнат) | dual-mode през seam-ове + SyncOnLogin merge |

> **Решение за stack (Phase 0):** thyroid-rehab е на Next 14 / Tailwind v3 /
> React 18. insulin-app е вече на Next 15 / Tailwind v4 / React 19 и kickoff-ът
> иска "latest". → Наследяваме **патърните и логиката** на thyroid-rehab, но
> върху модерния stack. Палитрата се портва в Tailwind v4 формат.

## Модули (8 + onboarding)

| # | Модул | Източник на съдържание |
|---|---|---|
| — | **Onboarding** (тест → lens + diet tier) | legacy QuizModule (8 въпр. + TG/HDL + WHR) |
| 1 | **Дневен план** (закуска/обяд/вечеря + IF, прогресивен) | legacy protocol.ts |
| 2 | **Дневник симптоми** (енергия, brain fog, тегло, талия, кр. захар) | нов |
| 3 | **Тракер показатели** (HOMA-IR, fasting insulin, HbA1c, TG/HDL) | нов |
| 4 | **Хранителен справочник** (low-carb, GI/GL, BG продукти) | legacy foods.ts |
| 5 | **Тренировки** (resistance + post-meal walks) | legacy ExerciseModule |
| 6 | **Гладуване** (16:8 → 18:6 → 24h прогресия) | legacy FastingModule |
| 7 | **Добавки** (berberine, magnesium, chromium, ALA — evidence-graded) | ⚠️ нов, съдържание TBD |
| 8 | **Образование** (заболявания + Bikman глави) | legacy diseases.ts + knowledge.ts |

---

## Phase roadmap

| Phase | Цел | Статус |
|---|---|---|
| **0** | Audit, legacy preservation, изхвърляне на старо UI, инфра (Turso+NextAuth), светла teal основа, deploy verify, onboarding blueprint | ✅ готов |
| 1 | Onboarding flow (welcome → тест → lens + tier → day-1) | ✅ UI готов* |
| 2 | Дневен план (90-дневен, прогресивен, lens-aware) | ✅ UI готов* (tier-aware чеклист) |
| 3 | Дневник симптоми + Тракер показатели (графики) | ✅ UI готов* (recharts) |
| 4 | Хранителен справочник (foods.ts → DB/UI) | ✅ read-only UI |
| 5 | Тренировки + Гладуване | ✅ read-only UI |
| 6 | Образование (заболявания + Bikman) | ✅ read-only UI |
| 7 | Добавки (съдържание + evidence grading) | ✅ UI готов (консервативно съдържание, прегледано) |
| 8+ | PWA полиране, TWA / Play Store, OG generator, custom домейн | по-късно |

\* Фази 1-3 работят **и за анонимни, и за логнати потребители**: localStorage
е primary cache; при логнат потребител writes се mirror-ват към Turso
fire-and-forget, а `SyncOnLogin` прави bidirectional merge при login.
Seam-ове: `lib/onboarding-storage.ts`, `daily-plan-storage.ts`,
`tracking-storage.ts` — всеки с `{skipServer}` опция за hydration пътя.

## Phase 2 — резултат

Цялата DB + auth верига е жива и потвърдена end-to-end:

- ✅ **Turso DB** активна с 6 таблици (`users, onboarding, daily_plan,
  symptom_log, blood_markers, food_bookmarks`); миграциите са идемпотентни
  и се пускат лениво при първа заявка.
- ✅ **Google OAuth** работи на production; user upsert в `users` при първи
  login, `last_login_at` се обновява при следващи.
- ✅ **6-те env vars** са настроени във Vercel (production + development).
- ✅ **Server actions** (`src/lib/actions/*`) за всичките 4 типа данни —
  всички с `getServerSession` gate и UPSERT-by-(user_id, date) семантика.
- ✅ **SyncOnLogin** — еднократен bidirectional sync при логин (server →
  localStorage за hydration, после localStorage → server за всичко само
  локално налично).
- ✅ **lens mirror на users.lens** — onboarding writes го синхронизират
  към session JWT (бърз достъп без join).

**Архитектурна гаранция:** анонимният потребител не вижда auth gate; нищо
не се чупи без env vars (server actions тихо връщат `null`).

## Извън обхвата (засега)

- ❌ TWA / Play Store · ❌ custom domain · ❌ OG image generator
- ❌ Тестове (jest setup не е портнат от thyroid-rehab)
- ❌ Криптиране на чувствителни кръвни данни (thyroid-rehab има `blood_markers.encrypted_data` — преценка дали ни трябва за GDPR)
- ❌ Email обобщения / push notifications

## Стил на работа

- Phase-based: всяка фаза приключва с `docs(phase-N): evolve PROJECT.md`
- Conventional commits, малки и четими, `Co-Authored-By: Claude Opus 4.7`
- При продуктова несигурност — питай преди имплементация

## Env vars (нужни за пълна функционалност)

```
TURSO_DATABASE_URL=        # libsql://...turso.io
TURSO_AUTH_TOKEN=
NEXTAUTH_URL=              # http://localhost:3000 (dev) / https://insulin-resistance-app.vercel.app (prod)
NEXTAUTH_SECRET=          # openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
