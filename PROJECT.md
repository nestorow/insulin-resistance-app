# PROJECT.md — insulin-resistance-app

> 90-дневен интерактивен протокол за обръщане на инсулинова резистентност,
> базиран на работата на д-р Benjamin Bikman (*"Why We Get Sick"*).
> Research-backed, peer-reviewed, медицински сериозен тон. Bulgarian UI.

**Repo:** `nestorow/insulin-resistance-app` · **Deploy:** `insulin-resistance-app.vercel.app`
**Бранд:** InsulinReset
**Статус:** Phase 2 завършена + полирано + Phase 2.6 (conversion / прогресия / SEO) + Phase 2.7 (UX полиране) — всичките 8 модула + onboarding в production, Google sign-in работи, DB persistence за логнати потребители (Turso), localStorage остава cache за анонимни. PWA manifest деплойнат и инсталируем (потвърдено живо). Landing-ът има conversion scaffolding, дневният план е **прогресивен** в 4 фази, сайтът е discoverable (OG + sitemap + robots + MedicalWebPage + chapter/disease JSON-LD). Re-test опция, бележки в дневник, и физиологични clamp-и на всички числови inputs.

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

## Полиране (направено в Phase 2.5)

- ✅ **`app/error.tsx`** — branded fallback за uncaught грешки, retry + back-to-home, показва `error.digest`
- ✅ **`app/not-found.tsx`** — локализирана 404 страница в teal стила
- ✅ **Empty/encouragement states** в `/journal` + `/markers` — карта с подсещане при 0/1 записа
- ✅ **`clearAllLocalData()`** при sign-out — privacy на споделени машини
- ✅ **`mounted` gate** за `/journal` + `/markers` — empty cards не блясват, ако имаш данни
- ✅ **Toast при save** — минимален event-bus toast (lib/toast.ts + components/Toast.tsx), показва се при save в journal/markers
- ✅ **PWA manifest** + apple-touch-icon — приложението е инсталируемо, **потвърдено живо**

## Phase 2.6 — conversion + прогресия + SEO

Три fokus-а от backlog-а, които заедно дават най-голям impact:

### Landing conversion scaffolding (frontend-only)
- ✅ **Hero copy** — заменено „Персонализиран асистент…“ с конкретно обещание: „Свали инсулина си — преди да стане диабет“; добавен timer hint под CTA („⏱ Тестът отнема около 3 минути“)
- ✅ **4-те стълба** под hero-то (`components/landing/FourPillars.tsx`) — карти с lucide иконки (WheatOff / Beef / EggFried / Clock) и едноредово обяснение
- ✅ **Как работи за 90 дни** (`components/landing/HowItWorks.tsx`) — 3-стъпкова секция с номерирани teal badge-и (Тест → План → Проследяване)
- ✅ Reorder на страницата: hero → WHAT → HOW → WHERE (модули) → secondary CTA

### Прогресивен 90-дневен план
- ✅ **`lib/program-phases.ts`** — `programPhase(day)` връща една от 4 фази (Адаптация 1-14 / Стесняване 15-30 / Оптимизация 31-60 / Закотвяне 61-90) с `name_bg`, `range_bg`, `goal_bg`; `milestoneMessage(day)` за дни 7/14/30/60/90
- ✅ **`data/protocol.ts`** — `ChecklistItem` разширен с `availableFromDay?` (unlock ден) и `text_by_phase?` (per-phase wording); items като пост-meal walk, fermented food, screens curfew, cold shower, 24h fast се отключват при правилния етап; гладуването и тренировките **ескалират** в текста (12h → 14h → 16h → 18h, движение → лека тренировка → силови + HIIT)
- ✅ **`DailyPlanModule.tsx`** — нов `Фаза N · <Name>` pill в status strip-а, нова phase-explainer карта (диапазон + цел), milestone банер на точния ден; items филтрирани по `availableFromDay`, текстът разрешен през `itemText(item, phase.index)`
- ⚠️ Бележка: `dayNumber` все още се изчислява от `onboarding.completedAt` — без миграция

### SEO discoverability
- ✅ **`app/opengraph-image.tsx`** — site-wide 1200×630 PNG card (teal gradient + hero line + Bikman attribution); Next.js auto-инжектира meta тага навсякъде
- ✅ **`app/sitemap.ts`** — `sitemap.xml` с 6-те публични content маршрута (изключва user-data routes + onboarding funnel)
- ✅ **`app/robots.ts`** — `robots.txt` allow/disallow + sitemap pointer
- ✅ **`layout.tsx`** — добавени `metadataBase`, `openGraph` + `twitter` метадата (bg_BG, summary_large_image), inline JSON-LD `MedicalWebPage` schema (назовава condition-а, цитира Bikman, declares medical audience)

## Phase 2.7 — UX полиране (retention-driving)

Тристранен следващ слой след Phase 2.6:

### Re-test опция
- ✅ **Нов `/settings` маршрут** — текущ профил (lens, quiz score, tier, начална дата) + бутон „Преоцени теста" с Radix confirm dialog; добавен и в `ModuleNav`
- ✅ **`clearOnboardingAction()`** — session-gated DELETE на onboarding ред (за логнати); local `clearOnboarding()` се вика синхронно преди това
- ✅ **Flow**: confirm → clear local → fire-and-forget сървър → toast → redirect към `/onboarding`; новият save презаписва ред → `completedAt = now` → нов Ден 1 / 90, Фаза 1; дневник + маркери остават нетронати

### Бележки в дневник + form sanity
- ✅ **Notes UI в `/journal`** — textarea (max 280 символа, live counter), показва се под точката на всеки запис в italic + muted; сървърното поле `notes` беше там, само UI липсваше
- ✅ **`clampedNum()` guard** — за всеки числов input в `/journal` и `/markers`: out-of-range стойности тихо стават `undefined` (тегло 20-400 кг, талия 30-300 см, кр. захар 0-30, HOMA-IR 0-50, инсулин 0-500, HbA1c 3-20, TG 0-2000, HDL 0-200); добавени също HTML5 `min` / `max` / `step` за по-добър mobile keypad + arrow stepping

### Per-page JSON-LD на /education
- ✅ **`lib/education-schema.ts`** — изграждa `@graph` от 15 глави като `MedicalScholarlyArticle` (с `isPartOf` Bikman книгата + ISBN) и 30+ заболявания като `MedicalCondition` (с bilingual имена и `riskFactor`); injects-ва се през `<script type="application/ld+json">` в `/education/page.tsx`

## Backlog — идеи за следващи итерации

### Полиране (продължение)
- [x] ~~**Form sanity**~~ → `clampedNum()` + HTML5 min/max/step (Phase 2.7)
- [ ] **PNG apple-icon (180×180)** — за iOS Safari, който не приема SVG за touch icon; иска build-time rasterization (sharp script в `scripts/`)
- [ ] **Loading skeleton CSS shimmer** — за по-дълги loads (SyncOnLogin при голяма история)
- [ ] **Optimistic UI rollback** — при server action fail, връщай локалното състояние + покажи tiny error toast

### Социално + SEO
- [x] ~~**Per-page JSON-LD**~~ → chapters като `MedicalScholarlyArticle`, diseases като `MedicalCondition` (Phase 2.7)

### Съдържание / продукт
- [x] ~~**Re-test опция**~~ → `/settings` + `clearOnboardingAction` (Phase 2.7)
- [x] ~~**Бележки в дневник**~~ → textarea в `SymptomJournalModule` (Phase 2.7)
- [ ] **Tier-specific правила** — освен `carbCap`, някои items да са само за keto tier (напр. „без плодове“)
- [ ] **Inferred lens** в onboarding — пред-избор на lens спрямо отговори преди потвърждение

### Инфраструктура
- [ ] **Тестове** — jest setup портнат от thyroid-rehab, поне unit за tier logic + storage seams
- [ ] **Encryption-at-rest** за blood_markers (thyroid-rehab pattern с `encrypted_data`) — преценка дали GDPR го изисква
- [ ] **Rate limiting** — Upstash redis за server actions (thyroid-rehab има)
- [ ] **Audit log** — кой/кога/какво update-ва onboarding/markers; за trust

### Engagement
- [ ] **Push notifications** — сутрешен reminder за чеклиста; web-push (thyroid-rehab има инфра)
- [ ] **Email обобщения** — седмичен прогрес по симптоми/маркери (resend.com например)
- [ ] **Streak / XP / badges** — gamification (thyroid-rehab има user_streaks, user_badges, xp_log)

### Бъдещи фази (Phase 8+)
- [ ] TWA build → Play Store
- [ ] Custom домейн (insulin-reset.bg?)
- [ ] CGM integration за biohacker lens
- [ ] AI асистент за хранителни въпроси (thyroid-rehab има `food_search_cache`)

## Стил на работа

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
