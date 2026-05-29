# Custom domain cutover → `insulin-reset.bg`

Canonical = **apex** (`https://insulin-reset.bg`); `www` redirects to apex.

The **code is already done** — `siteUrl()` (`src/lib/site-url.ts`) resolves
`NEXT_PUBLIC_SITE_URL → NEXTAUTH_URL → vercel.app` fallback, and every
downstream caller (sitemap, robots, OG image, JSON-LD, email links,
`manifest`, canonical `<link>`) reads from it. The HSTS / security headers
are in `next.config.ts`. **No code change is required** — the cutover is
entirely account-side. Work the checklist top to bottom.

---

## 0. Already done (no action)
- [x] `siteUrl()` single-source resolver + trailing-slash normalization
- [x] `metadata.alternates.canonical` + OpenGraph/Twitter follow `siteUrl()`
- [x] Security headers (HSTS 1y + `includeSubDomains`, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options)

## 1. Register the domain
- [ ] `.bg` **cannot** be bought through Vercel. Register `insulin-reset.bg`
      at a `.bg`-accredited registrar (register.bg, superhosting.bg, neterra…).
- [ ] `.bg` second-level names may require proof of eligibility / documents —
      budget extra time vs a `.com`.
- [ ] Do **not** change DNS yet.

## 2. Add the domain in Vercel
- [ ] Vercel → Project → **Settings → Domains** → add **both**
      `insulin-reset.bg` and `www.insulin-reset.bg`.
- [ ] Set `insulin-reset.bg` as **Primary**. Vercel then auto-creates the
      `www → apex` 301 (no app-level redirect needed).
- [ ] Note the DNS targets Vercel shows.

## 3. Point DNS (at the registrar's DNS panel)
- [ ] Apex `insulin-reset.bg`: **A** record → `76.76.21.21` (Vercel anycast).
      If the registrar supports ALIAS/ANAME at apex, that also works; or
      delegate the nameservers to Vercel if you prefer Vercel-managed DNS.
- [ ] `www`: **CNAME** → `cname.vercel-dns.com`.
- [ ] Wait for propagation → Vercel shows **Valid Configuration** and
      issues the TLS cert automatically.

### This project — registrar is SuperHosting.bg
`insulin-reset.bg` uses SuperHosting nameservers
(`ns263.superhosting.bg` / `ns264.superhosting.bg`). **Keep them** — that
leaves email (MX/SPF/DKIM for `hello@insulin-reset.bg`) manageable on
SuperHosting. Just add two records that point the web to Vercel:

| Type  | Host / Name | Value                  | TTL  |
|-------|-------------|------------------------|------|
| A     | `@` (apex)  | `76.76.21.21`          | 3600 |
| CNAME | `www`       | `cname.vercel-dns.com` | 3600 |

How, in the SuperHosting panel (Контролен панел → домейна → DNS):
- The top-level **„DNS Настройки"** screen's *„Насочване към IP адрес"* sets
  only the **apex A record** — put `76.76.21.21` there.
- For the **`www` CNAME**, open the full zone editor: **„Управление на DNS
  зоната"** in the customer panel, or **cPanel → Zone Editor** if the domain
  sits on a cPanel hosting account. Add `Type=CNAME`, `Name=www`,
  `Record=cname.vercel-dns.com`.
- **Edit, don't duplicate**: if a default apex `A` record already exists
  (parking / SuperHosting hosting IP), change its value to `76.76.21.21`
  instead of adding a second one; remove any conflicting `www` record.
- Apex must be **A** (a CNAME on the bare domain is invalid).
- Labels vary by panel version — if the zone editor is hard to find, ask
  SuperHosting support verbatim: *"add A `@` → 76.76.21.21 and CNAME `www`
  → cname.vercel-dns.com, keep the current nameservers."*
- Propagation: **2–48 h** (per SuperHosting's own notice).

## 4. Environment variables (Vercel → Settings → Environment Variables)
Set on **Production** scope:
- [ ] `NEXT_PUBLIC_SITE_URL = https://insulin-reset.bg`  (no trailing slash)
- [ ] `NEXTAUTH_URL = https://insulin-reset.bg`
- [ ] Leave everything else unchanged.

> ⚠️ `NEXT_PUBLIC_*` is inlined at **build time** — saving the var is not
> enough, you must **redeploy** (step 7) for it to take effect. Set it on
> Production scope only — if it leaks into Preview, every preview deploy
> would claim the prod URL in its OG/canonical tags.

## 5. Google OAuth (Google Cloud Console → APIs & Services → Credentials)
Open the Web OAuth client:
- [ ] **Authorized JavaScript origins** → add `https://insulin-reset.bg`
- [ ] **Authorized redirect URIs** → add
      `https://insulin-reset.bg/api/auth/callback/google`
- [ ] Keep the existing `…vercel.app` entries during the transition; remove
      them once the new domain is confirmed working.

## 6. Email sender (only if the weekly digest is enabled)
- [ ] In Resend, verify `insulin-reset.bg` (add the SPF / DKIM / return-path
      DNS records at the registrar).
- [ ] Set `DIGEST_FROM_EMAIL = InsulinReset <hello@insulin-reset.bg>`
      (Vercel Production env).

## 7. Redeploy
- [ ] Trigger a **Production redeploy** (Vercel → Deployments → ⋯ → Redeploy,
      or push a commit) so the new `NEXT_PUBLIC_SITE_URL` is baked into the bundle.

## 8. Verify
- [ ] `https://insulin-reset.bg` loads with a valid TLS padlock.
- [ ] `https://www.insulin-reset.bg` 301-redirects to apex.
- [ ] Google sign-in completes on the new domain (no `redirect_uri_mismatch`).
- [ ] View source / `curl`:
      - `<link rel="canonical" href="https://insulin-reset.bg/">`
      - `https://insulin-reset.bg/sitemap.xml` and `/robots.txt` show the new host
      - OG image + JSON-LD `url` show the new host
- [ ] (If email on) send a test digest → links point at the new domain.

## 9. Post-cutover (later, optional)
- [ ] In Vercel, redirect the old `insulin-resistance-app.vercel.app` →
      `insulin-reset.bg` (Domains → old domain → Redirect). Preview deploys
      keep their own `*.vercel.app` URLs — don't blanket-redirect those.
- [ ] Submit to https://hstspreload.org once the apex is stable on HTTPS
      (header already carries `includeSubDomains`; add `preload` only when ready).
- [ ] Tick the roadmap box in `PROJECT.md`.

---

## Gotchas
- **`NEXT_PUBLIC_*` is build-time.** Changing it in Vercel needs a redeploy,
  not just a save.
- **Don't set `NEXT_PUBLIC_SITE_URL` in local/preview** — production scope
  only, or previews advertise the prod URL.
- **`.bg` is not a Vercel-purchasable TLD** — external registrar + manual
  DNS records (or NS delegation).
- **HSTS `includeSubDomains`** is already sent — make sure any subdomain you
  ever serve is HTTPS before submitting to the preload list (preload is
  hard to undo).
