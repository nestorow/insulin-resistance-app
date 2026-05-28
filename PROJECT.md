# PROJECT.md — insulin-resistance-app

> 90-дневен интерактивен протокол за обръщане на инсулинова резистентност,
> базиран на работата на д-р Benjamin Bikman (*"Why We Get Sick"*).
> Research-backed, peer-reviewed, медицински сериозен тон. Bulgarian UI.

**Repo:** `nestorow/insulin-resistance-app` · **Deploy:** `insulin-resistance-app.vercel.app`
**Бранд:** InsulinReset
**Статус:** Phase 2 завършена + полирано + Phase 2.6 (conversion / прогресия / SEO) + Phase 2.7 (UX полиране + security + engagement) — всичките 8 модула + onboarding в production, Google sign-in работи, DB persistence за логнати потребители (Turso), localStorage остава cache за анонимни. PWA manifest + iOS PNG icons. Landing-ът има conversion scaffolding, дневният план е **прогресивен** в 4 фази, сайтът е discoverable (OG + sitemap + robots + MedicalWebPage + chapter/disease JSON-LD). Re-test опция, бележки в дневник, физиологични clamp-и, shimmer skeletons. **Trust layer**: blood markers AES-256-GCM enkriptirani at rest, Upstash rate limiting (30 writes/мин), append-only audit_log. **Push notifications**: VAPID + service worker + opt-in UI + Vercel Cron сутрешен reminder. **Email digest**: Resend + opt-in + неделен HTML email с прогрес + Vercel Cron. **Gamification**: streak/XP/badge engine с 5 badges, ProgressCard на /plan, BadgeGallery в /settings. **Optimistic rollback** при rate-limit. **Phase 8 започната**: AI food assistant (Claude Haiku 4.5, per-tier cache, 5/мин rate limit) в /foods. **150 unit + component test покритие.**

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

### Tier-specific правила
- ✅ **`ChecklistItem.tiers?: DietTier[]`** — items с tier ограничение се рендерират само за съответния tier; default (omitted) = за всички
- ✅ **Реално приложение**: `week_sweets` сега е само за `moderate`+`keto` (low risk не се нуждае); нов `week_fruit_keto` „плодове само горски, малки порции" (keto only); нов `week_grains_moderate` „зърнени само пълнозърнести, ≤1 порция/ден" (moderate only)
- ✅ **`DailyPlanModule`** филтрира по tier паралелно с `availableFromDay`; анонимни → tier = `none`

### Inferred lens в onboarding
- ✅ **Пренареждане**: quiz сега идва **преди** lens — потребителят отговаря на въпросите ПЪРВО, после избира lens с pre-selection (`welcome → quiz → lens → result → day1`)
- ✅ **`inferredLens(yesCount)` в `lib/onboarding.ts`** — heuristic: yesCount ≥5 → medical, 2-4 → educational, 0-1 → biohacker
- ✅ **„Препоръчано" badge** (warm-жълто) на инферираната lens карта; pre-select се случва при изход от quiz step; user може да избере друга — не е заключено

### Тестово покритие (jest setup от thyroid-rehab)
- ✅ **`jest.config.ts`** — `next/jest` wrapper, jsdom env, `@/` path alias; SWC transforms (без ts-jest)
- ✅ **`jest.setup.ts`** — `@testing-library/jest-dom`
- ✅ **npm scripts**: `test`, `test:watch`
- ✅ **Dev deps**: jest 30, jest-environment-jsdom 30, @types/jest 30, @testing-library/jest-dom 6
- ✅ **Refactor**: `clampedNum()` extract-нат от journal+markers в `src/lib/numbers.ts` — single source of truth
- ✅ **86 теста / 10 suite-а / 5.3s runtime**:
  - `lib/onboarding.test.ts` (11): `tierFromYesCount`, `inferredLens`, QUIZ_QUESTIONS shape
  - `lib/program-phases.test.ts` (17): phase boundaries, day clamping, PROGRAM_PHASES contiguity, milestoneMessage
  - `lib/numbers.test.ts` (8): `clampedNum` edge cases
  - `lib/onboarding-storage.test.ts` (6): round-trip, versioned key, corrupted payload recovery, overwrite
  - `lib/daily-plan-storage.test.ts` (6): toggle, per-date isolation, setDayChecks, todayKey, corruption recovery
  - `lib/tracking-storage.test.ts` (8): symptom/marker upsert-by-date, ascending sort, notes preservation, log isolation
  - `data/protocol.test.ts` (9): id uniqueness, category whitelist, `tiers` ⊆ DietTier, `itemText` resolver
  - `components/DailyPlanModule.test.tsx` (12): day/phase derivation, progression unlocks, tier filtering, milestone banner
  - `components/OnboardingFlow.test.tsx` (5): step order, redirect, inferred lens „Препоръчано" badge
  - `components/SettingsModule.test.tsx` (4): профил рендер, nudge, re-test happy path + cancel
- ✅ **Bonus refactor**: storage seams (`onboarding-storage`, `daily-plan-storage`, `tracking-storage`) сега lazy-import-ват server actions — auth/DB chunks се товарят само при първи signed-in write, не на cold start за анонимни

### Optimistic UI rollback (UX полиране)
- ✅ **Server actions** (`saveSymptomLogAction`, `saveMarkerLogAction`) — нов discriminated return: `{ ok: true } | { ok: false; reason: 'auth' | 'rate' }`; запазва съществуващите session-gate + rate-limit семантики, но дава по-конкретен signal на client-а
- ✅ **Storage seams** (`addSymptomLog`, `addMarkerLog`) — нов return shape `{ local: T[]; pending: Promise<'ok'|'rejected'|'offline'> }`; добавени са `removeSymptomLog` / `removeMarkerLog` като rollback inverse
- ✅ **`SymptomJournalModule` + `MarkersModule`** save handlers — capture-ват previous list, optimistic write, await pending → ако `rejected` (rate limit hit): drop new entry + restore prior (за UPDATE cases) + tiny error toast „Сървърът отказа — записът е върнат"; `offline` outcomes остават locally (SyncOnLogin ще reconcile-не)
- ✅ **Тестове**: обновени за новия `{ local }` shape + 2 нови случая (removeSymptomLog/Marker, skipServer→'ok' immediately)

### Email обобщения (engagement)
- ✅ **`lib/email.ts`** — Resend SDK lazy-import wrapper; `sendDigest(data)` връща discriminated outcome (`ok` / `skipped: 'no-config'` / `failed`); HTML template inline-styled в teal/mint палитрата, 3 stat tiles (Поредни дни / Ниво / Записи), conditional „Нови значки" row; `digestSubject()` избира най-интересния факт за subject-а; `escapeHtml` на user-controlled полета
- ✅ **`lib/actions/email.ts`** — `getEmailDigestPreferenceAction` + `setEmailDigestPreferenceAction` (session-gated + rate-limited)
- ✅ **DB**: `users.email_digest_opt_in INTEGER DEFAULT 0` чрез `ensureColumn` (opt-in default off)
- ✅ **`/api/cron/weekly-digest`** — Bearer-gated; joins opted-in users с прогрес + 7-day symptom count + значки спечелени тази седмица; връща `{ sent, skipped, failed }`; `vercel.json` schedule `0 16 * * 0` UTC (неделя ≈ 18-19 ч BG)
- ✅ **`EmailDigestOptIn.tsx`** в `/settings` — 3 UI състояния (signed-out/off/on); lazy-import за actions; показва email адреса на потребителя в копито
- ✅ **`.env.example`** документиран: `RESEND_API_KEY` + `DIGEST_FROM_EMAIL` с пример
- ✅ **Тестове**: 17 нови (email lib config gate, subject branches, HTML render + escaping + URLs; cron auth + skip vs failed counters)

### Streak / XP / badges (gamification layer)
- ✅ **DB**: три нови таблици — `user_streaks` (1 ред/user; current_streak, longest_streak, total_xp, last_active_date), `xp_log` (append-only, recomputable), `user_badges` (UNIQUE (user_id, badge_id) — идемпотентно awarding)
- ✅ **`lib/gamification.ts`** — engine:
  - `POINTS` registry: plan.check=1, plan.dayComplete=10, symptom.save=5, marker.save=20
  - `PLAN_CHECK_DAILY_CAP=15` за да не може checkbox-mashing да фарми XP
  - Level curve: `level = floor(sqrt(xp/30)) + 1` (gentle, frequent level-ups)
  - 5 badges: first_check, first_marker, week_streak (7), month_streak (30), ninety_streak (90)
  - `bumpStreak()` логика: same-day no-op, gap=1 → +1, gap>1 → reset, out-of-order ignored
  - `recordEvent()` fire-and-forget от server actions; swallows errors
  - `getProgress()` single read за UI
- ✅ **`lib/actions/gamification.ts`** → `getProgressAction()` session-gated
- ✅ **Wire-нати в 3 server actions**: plan.setDayChecksAction (XP × checkedCount), symptom.save (5 XP), marker.save (20 XP)
- ✅ **`components/plan/ProgressCard.tsx`** — 3-stat tile (streak / level + XP bar / badges count) под phase explainer-а; lazy-import за gamification action; крие се за anonymous + при totalXp=0+streak=0
- ✅ **`components/settings/BadgeGallery.tsx`** — 5-card grid в `/settings`; earned glow teal, unearned slate
- ✅ **Тестове**: 12 нови (level curve inverses, streak math 4 случая, XP cap edge cases, error swallow, getProgress composition)

### Push notifications + сутрешен cron reminder
- ✅ **`lib/web-push.ts`** — `sendPush(sub, payload)` wrapper над `web-push` library; VAPID lazy-config; връща `{ ok: false, gone: true }` при 404/410 за GC на stale endpoints; TTL 24h
- ✅ **`lib/actions/push.ts`** — `getVapidPublicKeyAction`, `savePushSubscriptionAction` (rate-limited + audited), `deletePushSubscriptionAction` (user-scoped), `sendTestPushAction` (verification от Settings)
- ✅ **DB**: нова `push_subscriptions` таблица — `endpoint` PK (globally unique), `keys_p256dh`/`keys_auth`, `user_agent` за device UX, индекс по user_id
- ✅ **`/api/cron/morning-reminder`** route — Vercel Cron entry с Bearer token gate (deny-by-default ако `CRON_SECRET` не е set); fanout + auto-GC на stale endpoints; `runtime = "nodejs"` (web-push нужна е Node crypto); `vercel.json` schedule `0 5 * * *` UTC (≈7-8 ч BG)
- ✅ **`public/sw.js`** — минимален service worker: `push` event показва notification с tag `insulinreset-daily` (заменя предишен вместо stack); `notificationclick` фокусира съществуващ таб или отваря /plan
- ✅ **`components/settings/PushOptIn.tsx`** — 5 UI състояния (unsupported/denied/signed-out/off/on); lazy-import за server actions; test push бутон за verification
- ✅ **`jest.setup.ts`** глобален mock на `next-auth/react` за component test render-ване без SessionProvider
- ✅ **`.env.example`** документиран изцяло: ENCRYPTION_KEY, UPSTASH_*, VAPID_*, CRON_SECRET с generation команди
- ✅ **Тестове**: 5 нови (cron auth: missing/wrong/none → 401, success → 200, stale endpoint GC)

### Rate limiting + Audit log (trust layer)
- ✅ **`lib/rate-limit.ts`** — Upstash Redis sliding-window, два limiter-а: `write` (30/мин) и `auth` (10/мин); SDK-овете lazy-import-ват се; bypass когато env vars не са set (local dev); fail-open при network blip
- ✅ **`lib/audit.ts`** — append-only `audit_log` таблица; `AuditAction` enum (onboarding.save/clear, markers.save, symptoms.save, plan.update); `AuditMetadata` = counts + dates only, **никога стойности**; `crypto.randomUUID()` за да не пуска ESM uuid
- ✅ **DB миграция**: нова таблица `audit_log` с индекс по (user_id, created_at DESC)
- ✅ **Wire-нати във всеки sensitive write**: 4-те server actions проверяват rate limit (тихо връщат null при exceeded) + логват audit ред след успешен write
- ✅ **`jest.setup.ts`** глобален mock на `@libsql/client` за тестове, които транзитивно тоVa-чат db
- ✅ **Тестове**: 3 за rate-limit (bypass behavior), 4 за audit (INSERT shape, JSON metadata, null когато omitted, swallows DB errors)

### Encryption-at-rest за blood markers (GDPR)
- ✅ **`lib/encryption.ts`** — AES-256-GCM, 12-byte IV, authenticated; формат `iv:ct:tag` hex; ENCRYPTION_KEY от env (64-char hex)
- ✅ **DB миграция**: нов `ensureColumn()` helper (PRAGMA + idempotent ADD COLUMN); `blood_markers.encrypted_data TEXT` се добавя автоматично при първи DB hit
- ✅ **`saveMarkerLogAction`**: enkriptiraną JSON payload {homaIr, …} → `encrypted_data`; UPDATE-ите wipе-ват plaintext колоните (lazy migration на legacy редове)
- ✅ **`getMarkerLogsAction`**: чете encrypted-first, fallback към plaintext за legacy редове
- ✅ **Тестове**: 6 case-а (round-trip, fresh IV, wire format, GCM tamper detection, malformed input)
- ✅ **jest.setup.ts** seed-ва детерминистичен test key (`a`×64)

### PWA icons + UI hydration polish
- ✅ **`scripts/rasterize-icons.mjs`** — sharp script: чете `src/app/icon.svg`, пише `public/apple-icon-180.png` (180×180, iOS standard) и `public/icon-192.png` (192×192, legacy Android); density 384 за crisp curve рендеринг
- ✅ **`layout.tsx`** + **`manifest.ts`** wired към PNG-тата (iOS home-screen install вече показва бранд иконата, не page screenshot)
- ✅ **`components/ui/Skeleton.tsx`** — `<SkeletonRows rows={n}>` + `<SkeletonBar>`; shimmer keyframe в `globals.css` (teal-50 base, 1.4s loop)
- ✅ **Wired в Journal + Markers** — преди `mounted` рендерира 3 placeholder rows; премахва „blank → suddenly full" flash при hydration / SyncOnLogin

## Backlog — идеи за следващи итерации

### Полиране (продължение)
- [x] ~~**Form sanity**~~ → `clampedNum()` + HTML5 min/max/step (Phase 2.7)
- [x] ~~**PNG apple-icon (180×180)**~~ → `scripts/rasterize-icons.mjs` + sharp (Phase 2.7)
- [x] ~~**Loading skeleton CSS shimmer**~~ → `components/ui/Skeleton.tsx`, wired в Journal+Markers (Phase 2.7)
- [x] ~~**Optimistic UI rollback**~~ → `{ local, pending }` seam shape + rollback при `rejected` outcome (Phase 2.7)

### Социално + SEO
- [x] ~~**Per-page JSON-LD**~~ → chapters като `MedicalScholarlyArticle`, diseases като `MedicalCondition` (Phase 2.7)

### Съдържание / продукт
- [x] ~~**Re-test опция**~~ → `/settings` + `clearOnboardingAction` (Phase 2.7)
- [x] ~~**Бележки в дневник**~~ → textarea в `SymptomJournalModule` (Phase 2.7)
- [x] ~~**Tier-specific правила**~~ → `tiers?: DietTier[]` + 3 нови tier-specific items (Phase 2.7)
- [x] ~~**Inferred lens** в onboarding~~ → пренареждане quiz→lens + `inferredLens()` heuristic + „Препоръчано" badge (Phase 2.7)

### Инфраструктура
- [x] ~~**Тестове**~~ → jest 30 + `next/jest` setup, **86 теста / 10 suite-а** (Phase 2.7)
- [x] ~~**Component tests**~~ → DailyPlanModule (12), OnboardingFlow (5), SettingsModule (4) — Phase 2.7
- [x] ~~**Storage seam tests**~~ → onboarding-storage (6), daily-plan-storage (6), tracking-storage (8) — Phase 2.7
- [x] ~~**Encryption-at-rest** за blood_markers~~ → AES-256-GCM в `encrypted_data` (Phase 2.7)
- [x] ~~**Rate limiting**~~ → Upstash sliding-window, 30 writes/мин (Phase 2.7)
- [x] ~~**Audit log**~~ → append-only audit_log table, counts-only metadata (Phase 2.7)

### Engagement
- [x] ~~**Push notifications**~~ → web-push + VAPID + service worker + opt-in UI + Vercel Cron `0 5 * * *` (Phase 2.7)
- [x] ~~**Email обобщения**~~ → Resend + weekly cron + opt-in UI + HTML template (Phase 2.7)
- [x] ~~**Streak / XP / badges**~~ → engine + 5 badges + ProgressCard + BadgeGallery (Phase 2.7)

### Бъдещи фази (Phase 8+)
- [ ] TWA build → Play Store
- [ ] Custom домейн (insulin-reset.bg?)
- [ ] CGM integration за biohacker lens
- [x] ~~AI асистент за хранителни въпроси~~ → Claude Haiku 4.5 + per-{tier, query} cache + 5/min rate limit, /foods (Phase 8)

## Phase 8 — Privacy Policy + Terms of Use
- ✅ **`/privacy`** — 12 секции на български: кои сме, какви данни събираме (с encryption mention), как ги ползваме, кои трети страни (Google, Turso, Vercel, Anthropic, Resend, Upstash, push providers), security posture, retention, GDPR права (вкл. жалба до КЗЛД), cookies, възраст, контакт; кратка версия card в началото
- ✅ **`/terms`** — медицински дисклеймер в **warning-colored card в началото** (списък с условията, при които потребителят ТРЯБВА да се консултира с лекар); 11 секции: скоуп, точност, акаунт, допустимо ползване, IP, AS IS отговорност, прекратяване, българско право
- ✅ **`components/GlobalFooter.tsx`** — site-wide footer от layout.tsx; sticky-footer behavior с `flex min-h-dvh flex-col`; премахнат стария inline footer от landing
- ✅ **Sitemap**: добавени с priority 0.3, yearly change frequency
- ✅ Build: /privacy + /terms по 176 B (почти server-only)

## Phase 8 — AI multi-turn conversation
- ✅ **`lib/anthropic.ts`**: `askClaude(query, tier, history?)` сега приема optional `ChatTurn[]` array; нов `MAX_CONVERSATION_TURNS = 10` cap (throws ако се надвиши)
- ✅ **`lib/actions/food-ai.ts`**: `askFoodAssistantAction(query, history)` приема history параметър; **cache strategy**: само single-turn (празно history) се cache-ва — multi-turn винаги вика Claude fresh (отговорите зависят от context); rate-limit все още се прилага на всеки Claude call
- ✅ **`FoodAiAssistant.tsx`** chat UI: scrollable history (max 420px), user/assistant bubbles с icons, optimistic render + rollback при server fail, auto-scroll, „Започни нов" button, turn counter „Разговор · 3/10", persistent disclaimer под conversation
- ✅ **Тест**: bounds check за MAX_CONVERSATION_TURNS

## Phase 8 — AI асистент за храни
- ✅ **`lib/anthropic.ts`** — Claude SDK lazy-import wrapper; `askClaude(query, tier)`; system prompt е bilingual (English с инструкции, Bulgarian output), tier-aware (включва конкретния carb cap), 3-5 sentence limit, Bikman 4-pillar reference, refuses medical diagnosis; `queryCacheKey(raw, tier)` sha256 на `tier|normalized`
- ✅ **`lib/food-cache.ts`** — `food_search_cache` table reader/writer; INSERT OR IGNORE race-safe; hit counter bump fire-and-forget
- ✅ **`lib/actions/food-ai.ts`** — `askFoodAssistantAction(query)` с layered cost defense: cache lookup първо (cheapest), rate-limit прилаган само на misses, max_tokens 500, max query 200 chars
- ✅ **Rate limit** нов kind `ai`: 5/мин/user (най-тесният — всеки call е реални пари към Anthropic)
- ✅ **DB**: `food_search_cache` таблица — query_hash PK, query, tier, response, model, hits, last_hit_at
- ✅ **`components/foods/FoodAiAssistant.tsx`** — single-turn Q&A в /foods; 200-char limit; 3 suggestion chips; loader spinner; cached hint badge; lazy-import за server action
- ✅ **Anonymous state** — sign-in CTA banner (value prop виден дори преди login)
- ✅ **.env.example**: `ANTHROPIC_API_KEY` с console URL
- ✅ **Тестове**: 14 нови (queryCacheKey stability/whitespace/tier-split, system prompt tier carb cap + Bulgarian + medical guard + Bikman ref, MAX constants bounds, food-cache miss/hit/race-safe write)

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
