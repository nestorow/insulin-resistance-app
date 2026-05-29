# PROJECT.md — insulin-resistance-app

> 90-дневен интерактивен протокол за обръщане на инсулинова резистентност,
> базиран на работата на д-р Benjamin Bikman (*"Why We Get Sick"*).
> Research-backed, peer-reviewed, медицински сериозен тон. Bulgarian UI.

**Repo:** `nestorow/insulin-resistance-app` · **Deploy:** `insulin-resistance-app.vercel.app`
**Бранд:** InsulinReset
**Статус:** Phase 2 завършена + полирано + Phase 2.6 (conversion / прогресия / SEO) + Phase 2.7 (UX полиране + security + engagement) — всичките 8 модула + onboarding в production, Google sign-in работи, DB persistence за логнати потребители (Turso), localStorage остава cache за анонимни. PWA manifest + iOS PNG icons. Landing-ът има conversion scaffolding, дневният план е **прогресивен** в 4 фази, сайтът е discoverable (OG + sitemap + robots + MedicalWebPage + chapter/disease JSON-LD). Re-test опция, бележки в дневник, физиологични clamp-и, shimmer skeletons. **Trust layer**: blood markers AES-256-GCM enkriptirani at rest, Upstash rate limiting (30 writes/мин), append-only audit_log. **Push notifications**: VAPID + service worker + opt-in UI + Vercel Cron сутрешен reminder. **Email digest**: Resend + opt-in + неделен HTML email с прогрес + Vercel Cron. **Gamification**: streak/XP/badge engine с 5 badges, ProgressCard на /plan, BadgeGallery в /settings. **Optimistic rollback** при rate-limit. **Phase 8 в ход**: AI food assistant (Claude Haiku 4.5 BYOK + multi-turn + per-tier cache, 5/мин rate limit) в /foods; legal pages (/privacy + /terms); custom-domain prep + security headers; **CGM integration в /cgm** — LibreView + Dexcom Clarity CSV import, AGP analytics (TIR + CV + GMI + 24h profile), auto spike detection с meal labels, encrypted at rest; **CGM polish bundle (Phase 8.1)** — sample dataset demo button, ръчно single-reading въвеждане, CGM section в weekly email digest, два нови CGM badges (first_cgm + cgm_week); **Trends дашборд (`/trends`)** — cross-module 90-day timeline с phase progress card + hero strip + 8 sparkline grid + 6-rule insight engine + day annotations overlay; **Performance pass** (recharts lazy-load на 4 route-а, -50% First Load); **GDPR export** (JSON dump в /settings + /trends/print за лекар); **Landing conversion** (TrustStrip + 5-question FAQ + sharper hero); **Component test + a11y pass** (44 нови component тест-а за CGM + Trends, skip link, aria-pressed на plan checks). **Education search** (client-side диагнози+глави, английски заявки match-ват). **Onboarding save+resume** (draft auto-persist mid-flow, 7-day TTL). **357 unit + component теста (40 suites).** **UI редизайн**: app shell навигация (десктоп sidebar + мобилна долна лента с „Още"), всички емоджита заменени с lucide икони (вкл. имейли + push), по-дискретна геймификация.

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
- [ ] TWA build → Play Store — assetlinks endpoint готов (`/.well-known/assetlinks.json`, env-driven); останалото е Android-side (Bubblewrap + signing + Play Console); чеклист: `docs/twa-playstore.md`
- [ ] Custom домейн → **insulin-reset.bg** (apex канон, www→apex) — cutover-ът е account-side (registrar + Vercel + Google OAuth); чеклист: `docs/custom-domain-cutover.md`
- [x] ~~CGM integration за biohacker lens~~ → /cgm + LibreView/Dexcom CSV parsers, AGP analytics, meal-annotated spikes (Phase 8)
- [x] ~~AI асистент за хранителни въпроси~~ → Claude Haiku 4.5 + per-{tier, query} cache + 5/min rate limit, /foods (Phase 8)

## Phase 8 — CGM integration (biohacker lens)

- ✅ **`lib/cgm.ts`** — `CgmReading { ts, mgdl, source }` тип + AGP константи (TIR_LOW=70, TIR_HIGH=180, MGDL_MIN/MAX); `mmolToMgdl` (×18.0182)
- ✅ **`lib/cgm-parser.ts`** — sniff + parse за FreeStyle LibreView (EU `DD-MM-YYYY` + US `MM-DD-YYYY hh:mm AM/PM`, Record Type 0+1 only) и Dexcom Clarity (ISO-8601, EGV само, dropва literal `High`/`Low`); unit-aware (mg/dL vs mmol/L); квазит RFC-4180 quoted-fields splitter; dedupe по ts (scan beat-ва historic)
- ✅ **`lib/cgm-stats.ts`** — TIR breakdown (5 зони: <54, 54-69, 70-180, 181-250, >250); вариативност (mean, sample SD, CV%, GMI по Bergenstal 2018); 24-час AGP profile с p10/p25/p50/p75/p90 linear-interpolation percentile-и; spike detector (≥40 mg/dL rise над 60-min trough + 90-min cooldown)
- ✅ **DB**: `cgm_readings` таблица (id, user_id, date UTC, encrypted_payload, count, source, updated_at, UNIQUE(user_id, date)) — AES-256-GCM blob per ден; `cgm_annotations` (1 ред/user, encrypted blob с `{peakTs → label}`)
- ✅ **`actions/cgm.ts`** — `saveCgmBatchAction`: groups by day → decrypt+merge+encrypt → UPSERT; 1 rate-limit check per CSV upload; `source: 'mixed'` когато денят има readings от >1 device; audit: `cgm.save` с daysWritten/readingCount (counts, не values)
- ✅ **`actions/cgm-annotations.ts`** — single-row-per-user blob; read-modify-write; празен note = delete
- ✅ **`lib/cgm-storage.ts`** — localStorage seam `ir-cgm-readings-v1`, capped at 12K readings (~90 дни × 12/h), oldest evicted; `mergeReadings(existing, incoming)` exposed за testing
- ✅ **`lib/cgm-annotations.ts`** — `ir-cgm-annotations-v1` seam с MAX_NOTE_LEN=80, trim+slice
- ✅ **`/cgm` route** + `ModuleNav` entry: 30-дневен rolling window (AGP consensus minimum за clinical interpretation); `CgmUploader` файлово picker с 20MB cap; `CgmStatsCards` — 4 stat карти (TIR / CV / GMI / count) с AGP-consensus threshold colors (TIR≥70 → teal, ≥50 amber, <50 rose; CV≤36 → teal); 5-зонов stacked TIR bar; `CgmAgpChart` (recharts) — p10-p90 + p25-p75 ribbon-и (invisible-base + visible-band stacked-area trick) + медиана линия + 70-180 reference band; `CgmSpikeList` с inline label editor (Enter/Esc, autoFocus), severity badges (+80 rose, +60 amber, иначе teal)
- ✅ **SyncOnLogin**: 2 нови sync функции — CGM readings (push local-only ts, dedupe server-side) + annotations (server wins на ключови колизии)
- ✅ **Privacy policy** обновен с нова т.2 секция за CGM данните (CSV се обработва в браузъра, не качваме сурови файлове; readings+notes криптирани at rest)
- ✅ **`local-data.ts`** — двата нови localStorage ключа добавени към `clearAllLocalData()` за wipe-on-signOut

### Polish bundle (Phase 8.1)
- ✅ **Sample dataset** (`cgm-sample-data.ts`) — 14 синтетични дни × 96 readings = 1344 rows, Park-Miller LCG seed=0x5BD1E995 за детерминизъм; биохакерски profile (baseline 86, dawn phenomenon 04:30–09:00, 3 meal spikes с физиологична asymmetric curve, 2 „bad" дни с +40 dinner); `CgmSource` добавя `'demo'`; CSV uploader-ът има пил „Зареди примерни данни" → `skipServer:true` → синтетичните readings никога не достигат сървъра; амбър banner „Демо данни" + dedicated „Изтрий демо" бутон когато всички readings са source=demo
- ✅ **`CgmManualEntry`** — datetime-local picker (TZ-shifted local → UTC ISO storage) + numeric input + mg/dL ⇄ mmol/L unit toggle (auto-convert); Enter submits; range validation срещу MGDL_MIN/MAX; reset на стойност, ts остава „now" за бързи повтарящи се записи; source='manual', минава през същия storage seam
- ✅ **Weekly digest CGM block** — `DigestData.cgm?: CgmDigestStats { tirPct, meanMgdl, cvPct, spikeCount, daysCovered }`; cron route `fetchCgmStats(userId, sevenDaysAgo)` pull-ва encrypted blob-овете → decrypt per-row → reuse-ва pure cgm-stats helpers; row omitted entirely когато няма данни; AGP-consensus color coding (TIR≥70 teal background, ≥50 amber, иначе rose); TIR-framed subject ("InsulinReset · TIR 84% тази седмица 📈") когато TIR≥80 и няма нови badges
- ✅ **Gamification**: нов event kind `cgm.upload` (10 XP), извикван от `saveCgmBatchAction` срещу today's date (XP кредитът пада на upload-ия ден, не на историческата дата); 2 нови badges: `first_cgm` (Activity icon, predicate hits xp_log за event_kind='cgm.upload') + `cgm_week` (LineChart icon, predicate: ≥7 distinct days в cgm_readings — single bulk upload веднага брои); `BadgeGallery` mirror обновен
- ✅ **Тестове** (+20): sample-data shape/determinism/bounds/TIR calibration/spike coverage (8); email CGM block render variants + subject branches (9); cgm.upload POINTS + first_cgm + cgm_week predicates (3) — общо 233 тест-а

## Phase 8 — Trends дашборд (`/trends`)

Cross-module view, който проектира 4 модула върху обща 90-дневна
времева линия.

- ✅ **`lib/trends.ts`** — `TrendDay` (15 optional metric полета), `TrendsSummary` (latest per metric + first→last delta за homaIr/weight + activeDays count), `TrendsData` wrapper. Pure mergers: `buildAxis` (dense 90-day UTC axis), `mergeMarkers` / `mergeSymptoms` / `mergePlan` (date→entry dictionary lookup), `aggregateCgmDaily` (groups CgmReading[] by UTC day → runs `timeInRange` / `variability` / `detectSpikes` per ден → { cgmTir, cgmMean, cgmCv, cgmSpikes, cgmCount }), `mergeCgm`. `computeSummary` scan-ва days от края за latest non-null per metric; first→last delta изисква ≥2 distinct dates.
- ✅ **`lib/actions/trends.ts`** — `getTrendsAction` server action: `Promise.all` parallel fetch на 4-те източника с `date >= cutoff` filter SQL-side (cheaper than client-side trim); per-row try/catch на decrypt-а (blood_markers + cgm_readings) така че един corrupt blob не blank-ва дашборда; chain-ва mergers в детерминистичен ред (markers → symptoms → cgm → plan).
- ✅ **`/trends` route** + `ModuleNav` entry „Тренд". `TrendsModule` auth gate (sign-in required) — anonymous viewer-ите виждат CTA nudge вместо empty dashboard; dynamic-imports `getTrendsAction` за да не вади next-auth chunk-а при anonymous; skeleton on hydrate; empty-state (activeDays===0) linkва към /journal + /markers за първи стъпки.
- ✅ **`TrendsHero`** — 4 stat карти (HOMA-IR / HbA1c / CGM TIR / Тегло) с Lucide arrow icons (`ArrowUpRight` / `ArrowDownRight` / `Minus`) които стават teal когато delta-та върви в правилната посока (down за HOMA-IR + weight), rose иначе. HbA1c + TIR не получават arrow — 90-day delta-ите за тях рядко са meaningful.
- ✅ **`TrendsSparkGrid`** — 8 small-multiples (HOMA-IR, HbA1c, CGM TIR, CGM mean, Енергия, Brain fog, Тегло, Изпълнен план); всеки със собствен Y-scale; shared 90-day X-axis с interval=14 за ~6 tick labels; `connectNulls` stitch-ва sparse series; metric с zero data се drop-ва (first-week user с само план чек-вания вижда само план sparkline, не 7 празни кутии).
- ✅ **`lib/trend-insights.ts`** — 6 pure rules over TrendDay[]:
  - `homaIrTrend`: ≥10% delta first→last → improvement (drop) или concern (rise); под 10% drop-ва (intra-assay CV ~5-8%)
  - `weightTrend`: ≥1kg движение с ≥5 readings; gain framed-нат neutrally като observation (no shaming)
  - `cgmTirRule`: avg TIR ≥70% → improvement, <50% → concern, иначе observation; изисква ≥7 CGM дни
  - `tirVsBrainFog`: ≥10 paired дни, ≥3 в всеки tail bucket (brainFog≥7 vs ≤4); flag-ва само при ≥10 пр.п. TIR gap
  - `planVsEnergy`: ≥10 paired дни, ≥3 в всеки plan bucket (≥80% vs <50%); flag-ва само при ≥1 точка енергия gap
  - `activitySnapshot`: factual „N of 90 дни" coverage observation
- ✅ **`TrendsInsights`** — kind-coded card list (improvement teal / concern rose / correlation amber / observation slate) с Lucide icons (TrendingUp / AlertTriangle / LineChart / Eye); короткий detail collapses ако omitted
- ✅ **Тестове** (+33): trends pure helpers (axis shape, isoDay UTC, mergers, CGM daily agg, plan %, summary latest/delta/coverage/window bounds) = 16; insight rules — всяко правило positive case + min-N gate + min-effect gate = 17

## Phase 8 — Trends polish: phase progress + day annotations + export + landing + perf

Четири паралелни workstream-а, обединени в едно итерация.

### Performance pass
- ✅ Recharts (≈80kB) dynamic-import-нат на 4-те chart route-а през `next/dynamic` с `ssr:false` + skeleton fallback-и: `/cgm` (`CgmAgpChart`), `/trends` (`TrendsSparkGrid`), `/journal` (нов `JournalTrendChart`), `/markers` (нов `MarkersTrendChart`)
- ✅ **Bundle deltas** (First Load JS): /cgm 234→115kB (-51%), /trends 231→121kB (-48%), /journal 224→110kB (-51%), /markers 224→110kB (-51%) — recharts вече не пада на initial paint

### Trends polish — phase progress card
- ✅ **`lib/protocol-day.ts`** — pure `protocolDay(completedAtIso, now?)` → `{ day (clamped 1-90), rawDays (uncapped), phase, pct, milestoneCrossedToday, nextMilestone, daysToNextMilestone }`; UTC-day math за да не desync-ва с daily-plan checkbox grid-а
- ✅ **`TrendsPhaseCard`** — „Ден X от 90" counter + phase name + range; 4-segment progress bar (един segment per program phase, fill within current phase) — показва едновременно progress и фазови граници; phase goal copy; milestone proximity (Следващ etap, или 🎯 при milestone днес)
- ✅ +9 тестове за protocol-day математиката (day boundary, clamping, phase transitions, milestones)

### Trends polish — day annotations
- ✅ **`lib/day-annotations.ts`** + **`actions/day-annotations.ts`** + DB table `day_annotations` (1 ред/user, AES-256-GCM blob); { date → ≤60 char label } map; trim+slice, empty=delete; rate-limit wired
- ✅ **`TrendsAnnotationsEditor`** — collapsed-by-default panel; inline date+text+Enter; saved annotations като removable amber chips
- ✅ **`TrendsSparkGrid`** приема optional `annotations` prop; `ReferenceLine` overlay (amber dashed strokes с label above) на всеки sparkline; `ifOverflow="extendDomain"` за gracefully clipping near edge
- ✅ SyncOnLogin: 7-та sync функция (server wins on key collision)
- ✅ `local-data.ts` wipe-on-signOut обновен
- ✅ +7 тестове (trim/cap/empty-delete/multi-date)

### Export — JSON dump + doctor PDF
- ✅ **`lib/actions/export.ts`** — `exportUserDataAction` обединява 11 parallel queries (user, onboarding, symptoms, markers, plan, cgm readings, cgm annotations, day annotations, streak, badges, xp log) в един `UserExport` blob с version=1; server-side decryption на blood markers + CGM readings + двата annotation map-а; excludes Anthropic API key (credential), audit log (administrative), push subscriptions (device-specific); audit: нов `data.export` action
- ✅ **`DataExportCard`** в /settings — blob → Object URL → anchor click → revoke pattern; browser-side, никакво server storage на export-а
- ✅ **`/trends/print`** route + `TrendsPrintView` — A4-shaped single-column print-friendly изглед; robots:noindex; header с период + ден-от-90 + lens; key-numbers таблица; enumerated insights с BG labels (Подобрение / За преглед / Корелация / Наблюдение); methodology footer (AGP, Bergenstal, Bikman); window.print() бутон + back link, hidden чрез print: utility класове
- ✅ TrendsModule header сега има „PDF за лекар →" pill

### Landing conversion
- ✅ **`TrustStrip`** под hero CTA — 4-signal row (Безплатно · Изцяло на български · Криптирано в покой · GDPR-friendly); адресира silent objections преди потребителя да скрол-не до pillars
- ✅ **`LandingFaq`** — 5-question accordion преди closing CTA, ordered by frequency: medical disclaimer, hardware requirements, data handling, 90-day rationale, offline use; всеки отговор споменава релевантния feature (CGM optional, AES-256-GCM, GDPR export, 4 phases, PWA install)
- ✅ Hero sub-copy преработено да описва конкретните mechanics („3-min тест → персонален план → следиш с маркери, CGM или симптоми") вместо generic „научно обоснован"
- ✅ Нова page структура: hero → pillars → how → features → FAQ → closing CTA

**Общо:** +6 commit-а в тази итерация; 266 → 282 unit + component тестове; всичките 7 chart route-а под 130kB First Load JS.

## Phase 8 — Component test coverage + a11y

Защитна работа след поредицата feature commits — не променя поведение
за крайния потребител, но повишава пода на качеството.

### Component test coverage (+44)
- ✅ **CGM** (+20): `CgmManualEntry` (7 — render, disable-until-typed, mg/dL submit shape, mmol/L→mg/dL auto-convert, out-of-range reject, value reset, Enter commit), `CgmStatsCards` (5 — 4 stat values, 5-zone breakdown labels, AGP-consensus color coding), `CgmSpikeList` (8 — empty-state copy, row content, severity rose/amber/teal, inline editor open/save/escape, chip render)
- ✅ **Trends** (+24): `TrendsPhaseCard` (5 — null without onboarding, Day-X-of-90 в phase 1, milestone proximity, milestone-day celebration, phase 1→2 transition; uses `useFakeTimers` за deterministic protocol-day math), `TrendsHero` (6 — em-dashes за empty, 1-decimal HOMA-IR, HbA1c %, TIR + date, signed pct delta, weight kg delta), `TrendsInsights` (6 — null при empty, title+detail, detail omit, kind→color mapping за improvement/concern/correlation, list-order preservation), `TrendsAnnotationsEditor` (6 — collapsed default, opens on click, disabled-until-typed, save emits onChange + chip, chip click removes, Enter commits)

### A11y pass (+3 tests)
- ✅ **`SkipLink`** — invisible-until-focused „Към съдържанието" link; Tailwind `sr-only` + `focus:not-sr-only`; целта е `#main-content` landmark в `layout.tsx` (`tabIndex={-1}` за programmatic focus без да се намесва в tab order)
- ✅ **`DailyPlanModule`** — `aria-pressed={done}` на checklist buttons за screen reader toggle state announcement (визуално са checkbox-и but built on `<button>`)
- ✅ **`CgmManualEntry`** — `aria-label="Единица за стойността"` на mg/dL ⇄ mmol/L select-а
- ✅ **`TrendsAnnotationsEditor`** — `aria-label` на remove-chip buttons (преди беше `title`-only) — VoiceOver/NVDA сега announce-ва „Премахни анотация „X" от YYYY-MM-DD"

**Total:** +47 теста, 282 → 329 (38 suites). Всички 12 route-а под 160kB First Load.

## Phase 8 — Privacy Policy + Terms of Use
- ✅ **`/privacy`** — 12 секции на български: кои сме, какви данни събираме (с encryption mention), как ги ползваме, кои трети страни (Google, Turso, Vercel, Anthropic, Resend, Upstash, push providers), security posture, retention, GDPR права (вкл. жалба до КЗЛД), cookies, възраст, контакт; кратка версия card в началото
- ✅ **`/terms`** — медицински дисклеймер в **warning-colored card в началото** (списък с условията, при които потребителят ТРЯБВА да се консултира с лекар); 11 секции: скоуп, точност, акаунт, допустимо ползване, IP, AS IS отговорност, прекратяване, българско право
- ✅ **`components/GlobalFooter.tsx`** — site-wide footer от layout.tsx; sticky-footer behavior с `flex min-h-dvh flex-col`; премахнат стария inline footer от landing
- ✅ **Sitemap**: добавени с priority 0.3, yearly change frequency
- ✅ Build: /privacy + /terms по 176 B (почти server-only)

## Phase 8 — BYOK (bring-your-own-key) за AI асистента
- ✅ **DB**: нова колона `users.anthropic_api_key_encrypted` (AES-256-GCM blob, същия scheme като blood markers)
- ✅ **`actions/anthropic-key.ts`** — `setAnthropicKeyAction` (format check + encrypt + write), `hasAnthropicKeyAction`, `maskedAnthropicKeyAction` (deriva mask от blob tail без decrypt), `clearAnthropicKeyAction`
- ✅ **`anthropic.ts`** — `askClaude(apiKey, ...)` приема explicit apiKey param; **премахнат** env-var fallback в production runtime
- ✅ **Multi-turn caching**: `queryCacheKey()` сега включва normalized history в hash-а — same conversation между users → cache hit; single-turn back-compat (празно history дава стария hash format)
- ✅ **`food-ai.ts`** — нов outcome `no-key`; flow: **cache lookup ПЪРВО** (без да изисква user key) → ако miss, изисква user-encrypted key, decrypt, call Claude, write to cache for всички future users
- ✅ **`AnthropicKeyCard.tsx`** в /settings — password input с client format check, masked badge при configured state, link към console.anthropic.com + бележка за monthly spend cap
- ✅ **Privacy policy** обновен: т.2 mention за encrypted API key storage, т.5 уточнение че Anthropic вижда queries само при cache miss и че user-ът плаща директно
- ✅ **`.env.example`** — ANTHROPIC_API_KEY помечен deprecated (per-user сега в DB)
- ✅ **Тестове** (+15): queryCacheKey back-compat + multi-turn split + cross-user same-conversation hit, anthropic-key actions (format check, encrypt round-trip, mask shape, clear UPDATE)

## Phase 8 — Custom domain prep + security headers
- ✅ **`lib/site-url.ts`** — single `siteUrl()` helper с documented resolution chain (`NEXT_PUBLIC_SITE_URL → NEXTAUTH_URL → fallback`); strips trailing slashes; migration recipe в header коментар
- ✅ **Refactor**: 5 call sites (layout, sitemap, robots, weekly-digest, education-schema) → еднa import line; canonical URL change = единствен env var swap
- ✅ **`next.config.ts`** site-wide security headers: HSTS (1y + subdomains), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy disables camera/mic/geo/FLoC, X-Frame-Options DENY
- ✅ **`layout.tsx`** `metadata.alternates.canonical = "/"` — Google няма да dual-индексира двата URL-а по време на migration window
- ✅ **`.env.example`** — `NEXT_PUBLIC_SITE_URL` документиран най-отгоре като canonical-URL knob
- ✅ **Тестове** (7): resolution priority, fallback chain, trailing slash normalization, concat safety

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

## Phase 8 — Education search + onboarding save/resume

Два малки, conversion- и UX-насочени слоя след основния Phase 8.

### Client-side education search (`/education`)
- ✅ **`lib/education-search.ts`** — pre-normalized search blob-ове, построени веднъж при module load; AND-token substring match (всеки токен трябва да съвпадне); diacritic/lowercase normalization
- ✅ **`name_en` в блоба** — английски заявки („ALZHEIMER", „parkinson", „GERD", „fatty liver") резолват към българските disease записи без транслитерация (всяко заболяване вече имаше `name_en` поле, просто не беше в blob-а)
- ✅ **`EducationModule.tsx`** — search input скрива body-map + chips докато филтрира (един filter наведнъж); единствен matching chapter се auto-expand-ва
- ✅ **`scripts/education-search-smoke.mjs`** — бърз re-verify smoke script
- ✅ **Тестове** (+14): `education-search.test.ts` — normalization, AND-token logic, EN/BG match, празна заявка

### Onboarding save+resume mid-flow
- ✅ **`lib/onboarding-draft.ts`** — отделен `{ step, answers, lens, tg, hdl, waist, hip, savedAt }` shape от завършения `OnboardingResult`, за да не се сблъсква draft-ът с „готов ли си?" redirect-а към /plan; **localStorage-only** (никога не се синхронизира към сървъра — drafts остаряват за часове, по-малка GDPR повърхност когато полу-въведени отговори не напускат устройството)
- ✅ **7-day TTL** на read: drop-ва остарели draft-ове + purge на ключа на същия read (localStorage не натрупва безкрайно); `isDraftSubstantive` guard игнорира празни drafts (welcome screen остава за първи посетители, които веднага навигират встрани)
- ✅ **`OnboardingFlow`** — ref-guarded mount-once hydration (Next 15 `useRouter()` връща нов обект всеки render → naive `[router]` dep loop-ва setter-ите покрай React update-depth guard-а); auto-save без debounce (localStorage writes са sync, <1KB — никога не искаме refresh да загуби последния keystroke); `clearOnboardingDraft` при finish (re-test в /settings почва наистина празен); „💾 Прогресът ти се запазва" microcopy на quiz step-а
- ✅ **`/settings` re-test** handler + `local-data.ts` signOut wipe обновени с новия `ir-onboarding-draft-v1` ключ
- ✅ **Тестове** (+14): `onboarding-draft.test.ts` (11 — round-trip, overwrite, 7-day TTL purge, malformed JSON, `isDraftSubstantive` cases) + OnboardingFlow component (+3 — resume from substantive draft, ignore empty, ignore 8-day-old)

### Test typing fix
- ✅ **jest mock typings** в `audit` / `morning-reminder` / `weekly-digest` suites — `jest.fn<Return, Args>()` явни генерици вместо implementation-inferred типове (празен args tuple → `mock(...args)` spread грешки; `never[]` rows; `ok: true` literal блокираше `ok: false`); `tsc --noEmit` + ESLint вече напълно clean, без промяна в runtime поведение

**Total:** 329 → **357 теста (40 suites)**; tsc + lint + build clean.

## Phase 8 — UI редизайн: app shell навигация + без емоджита + по-дискретна геймификация

Целенасочен UX пас — приложението изглеждаше „не толкова лесно" заради
плоската навигация и игривия тон. Без промяна в архитектурата или данните.

### App shell навигация (`components/AppShell.tsx`)
- ✅ Замени плоския 12-pill `ModuleNav` (беше маркиран „until the full app shell lands") — **изтрит** от кодовата база и от 11-те страници
- ✅ **Десктоп**: постоянен страничен sidebar с пълния списък модули + lucide икони + active highlight (teal); съдържанието е offset с `md:pl-60`
- ✅ **Мобилно**: фиксирана долна лента с 4-те най-използвани (План · Дневник · Показатели · Тренд) + бутон **„Още"**, който отваря bottom sheet с останалите 8 модула; `pb-16` пази съдържанието над лентата
- ✅ Active състоянието е автоматично през `usePathname()` (страниците вече не подават `active` prop); marketing / onboarding / legal / `/trends/print` route-овете рендерират **bare** (без chrome) през exclusion guard
- ✅ Wire-нат в `layout.tsx` като wrapper около `#main-content` + `GlobalFooter`, така че footer-ът се offset-ва коректно

### Без емоджита → lucide икони (целият UI + имейли + push)
- ✅ Празни състояния (`📈🧪📊🎯` → `LineChart` / `FlaskConical` / `ShieldCheck`), чекбокс `✓` → `Check`, close `✕` → `X`, CTA `→` → `ArrowRight`, back-линкове `←` → `ArrowLeft`, `⏱` → `Clock`, дисклеймер `⚠️` → `AlertTriangle`, `💾` → `Save`, `💡` → `Lightbulb`, `🍴` → `Utensils`, footer `⚕️` → чист текст
- ✅ **4-те стълба в `/education`** — emoji иконите (`🥦🥩🥑⏰`) в `data/knowledge.ts` извадени; рендерират се с lucide (`WheatOff/Beef/EggFried/Clock`), същите като landing `FourPillars`
- ✅ **Седмичен имейл** (`email.ts`) — subject-и (`🏆📈🔥`), заглавия, поздрав `👋`, footer `⚕️` изчистени; **push** (`push.ts`) — `✅` от test push тялото
- ✅ Toast-ове без `✓`/`🎉`; функционалните breadcrumb-стрелки в проза (напр. „Настройки → Преоцени теста") са оставени
- ✅ Единственото оставащо emoji в кода е негативен test-guard (`queryByText(/🍴/)).not…`)

### По-дискретна геймификация
- ✅ Milestone съобщенията (`milestoneMessage`) без `🎉🏆`, по-сдържан текст („Първа седмица завършена.", „90 дни завършени.")
- ✅ `TrendsPhaseCard` — „Днес е ден N — етап достигнат." (без `🎯` + „milestone")
- ✅ `ProgressCard` икони → неутрални: `CalendarCheck` / `Gauge` / `Award` (вместо `Flame`/`Trophy`); махнат „→" от „Виж в Настройки"

### Верификация
- ✅ tsc + ESLint (0 warning-а) + **357 теста** + `next build` (27 route-а) — всичко зелено; само 2 теста обновени за новия copy (`TrendsPhaseCard` milestone regex, email greeting без `👋`)
- Commits: `7543c7d` (shell + de-emoji + gamification) + `c63fc2a` (имейл + push + education pillars)

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
