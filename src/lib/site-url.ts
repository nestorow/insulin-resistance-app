// Single source of truth for the canonical site URL.
//
// Resolution order (first non-empty wins):
//   1. NEXT_PUBLIC_SITE_URL  — explicit override; set this on Vercel
//      once a custom domain (e.g. insulin-reset.bg) is provisioned
//   2. NEXTAUTH_URL          — already set for auth callbacks; useful
//      during the migration window when only auth is on the new host
//   3. Vercel-managed fallback for the original preview deploy
//
// To migrate to a custom domain:
//   - Point DNS at Vercel (apex + www)
//   - In Vercel: add the domain, mark it primary
//   - Set NEXT_PUBLIC_SITE_URL=https://insulin-reset.bg (no trailing /)
//   - Update NEXTAUTH_URL similarly + the Google OAuth redirect URI
//   - Redeploy — every downstream caller (sitemap, robots, OG, JSON-LD,
//     emails, manifest) picks it up automatically.

const FALLBACK = "https://insulin-resistance-app.vercel.app";

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    FALLBACK;
  // Strip trailing slash so callers can do `${siteUrl()}/path` safely.
  return raw.replace(/\/+$/, "");
}
