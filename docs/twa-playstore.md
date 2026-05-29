# TWA → Google Play — `bg.insulinreset.twa`

Wrap the PWA as a **Trusted Web Activity** (full-screen, no URL bar) with
Bubblewrap, sign it, host Digital Asset Links, ship via Play Console.

> Build the TWA against the **final domain** `insulin-reset.bg` — asset-link
> verification is origin-exact, so building against the temporary
> `*.vercel.app` URL means redoing it later. Do the
> [custom-domain cutover](custom-domain-cutover.md) first (or accept that a
> test build on vercel.app is throwaway).

---

## 0. Already done (this repo)
- [x] Installable PWA — `manifest.webmanifest` (standalone, theme `#1B7A6E`,
      bg `#F0FAF6`, BG locale), icons, service worker.
- [x] **Digital Asset Links endpoint** — `src/app/api/assetlinks/route.ts`,
      reachable at `/.well-known/assetlinks.json` via a rewrite in
      `next.config.ts`. Env-driven (`TWA_PACKAGE_NAME`,
      `TWA_SHA256_FINGERPRINTS`); returns **404 until fingerprints are set**.

## Prerequisites
- Node 18+ (present), **JDK 17**, Android SDK. `bubblewrap` can bootstrap the
  JDK + SDK for you on first run; `bubblewrap doctor` diagnoses path issues.
- PWA live on HTTPS at the target host.
- *Optional but recommended:* a **512×512** launcher icon. The manifest tops
  out at 192 — extend `scripts/rasterize-icons.mjs` to emit `icon-512.png`
  and add it to `src/app/manifest.ts` before building for a crisp launcher.

## 1. Install Bubblewrap
```bash
npm i -g @bubblewrap/cli
```

## 2. Init the Android project (in a SIBLING folder, not this repo)
```bash
mkdir ../insulin-reset-twa && cd ../insulin-reset-twa
bubblewrap init --manifest https://insulin-reset.bg/manifest.webmanifest
```
Answers:
- Application ID / package → `bg.insulinreset.twa`
- Host → `insulin-reset.bg`
- App name → `InsulinReset — 90-дневен протокол`; launcher → `InsulinReset`
- Theme color → `#1B7A6E`; background → `#F0FAF6`; start URL → `/`
- Signing key → let Bubblewrap create `android.keystore` (**save the
  passwords** — losing them means you can't ship updates).

## 3. Build
```bash
bubblewrap build
```
Produces `app-release-signed.aab` (Play upload) and `app-release-signed.apk`
(sideload test).

## 4. Get the signing fingerprint(s)
```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```
Copy the `SHA256:` colon-hex. **Also** copy the **Play App Signing** SHA-256
from Play Console → *Setup → App signing* once the app exists — Play re-signs
your upload, so that's the fingerprint users actually verify against.

## 5. Wire Digital Asset Links (this repo)
In Vercel → Settings → Environment Variables (**Production**):
- `TWA_PACKAGE_NAME = bg.insulinreset.twa`
- `TWA_SHA256_FINGERPRINTS = <upload-key-sha256>,<play-app-signing-sha256>`

Redeploy, then verify:
```bash
curl https://insulin-reset.bg/.well-known/assetlinks.json
# → 200 + JSON listing BOTH fingerprints (was 404 before configuring)
```

## 6. Play Console
- Create app; listing in BG (+ EN); content rating; **health/medical
  disclaimer** — Play scrutinizes health apps, reuse the framing from `/terms`
  (educational, not medical advice).
- Privacy policy URL → `https://insulin-reset.bg/privacy`.
- Data safety form → declare collection per `/privacy` (encrypted at rest,
  no ads, no data sale).
- Upload the `.aab` → release to **Internal testing** first.

## 7. Verify the trusted relationship
Install the internal-testing build. The app should open **without a URL bar**.
If a URL bar appears → asset-link verification failed:
- `curl` the assetlinks file (step 5) — is it 200 with the right fingerprints?
- Did you include the **Play App Signing** fingerprint, not just the upload key?

---

## Gotchas
- **Play re-signs the app.** Users verify against the Play App Signing key, not
  your upload key — include both in `TWA_SHA256_FINGERPRINTS`.
- **Origin-exact.** assetlinks must be served from the same host the TWA
  declares (`insulin-reset.bg`). Build after the domain is live.
- **URL bar visible = broken asset link.** Always `curl` the assetlinks file
  before debugging anything else.
- **Health-app review.** Expect Play to ask about medical claims; the
  not-medical-advice disclaimer in `/terms` is the answer.
- **Build env.** Producing the `.aab` needs JDK 17 + Android SDK — this can't
  run in the web app's CI container; build locally or in a dedicated Android
  workflow. The repo's part (assetlinks) is verifiable with plain `curl`.
