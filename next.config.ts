import type { NextConfig } from "next";

// Canonical public host. www.insulin-reset.bg → apex is a Vercel-level
// domain redirect (308); the Vercel-issued production alias below is only
// reachable through Next, so it is redirected here.
const CANONICAL_HOST = "insulin-reset.bg";
const LEGACY_HOSTS = ["insulin-resistance-app.vercel.app"];

// Security headers — apply to every response.
// HSTS lock-in waits one year; preload list submission is a manual
// step at hstspreload.org once a custom domain is stable.
const securityHeaders = [
  // HTTPS enforcement: 1 year + subdomains. Vercel terminates TLS;
  // any non-https Vercel preview deploys are already redirected.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Stop browsers from sniffing MIME types away from the declared
  // Content-Type (defense against XSS via misinterpreted uploads).
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Don't leak the full URL in cross-origin requests; same-origin
  // still sees it for analytics-like behavior.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions Policy — explicitly disable the device APIs we don't
  // use. Future CGM integration may re-enable e.g. `usb` for direct
  // BLE access; revisit then.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Frame ancestor — keep the app un-embeddable except by itself.
  // CSP frame-ancestors is the modern equivalent; X-Frame-Options
  // covers older browsers.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  // @libsql/client is a server-only package with native/non-JS files
  // (e.g. hrana-client LICENSE). Keep it external so the bundler doesn't
  // try to parse its internals.
  serverExternalPackages: ["@libsql/client"],

  async redirects() {
    // Legacy hosts → canonical apex, permanently (308). /api/ is excluded on
    // purpose: Vercel cron and NextAuth callbacks hit the deployment host
    // directly, and /_next/ assets must keep resolving on any host.
    return LEGACY_HOSTS.map((host) => ({
      source: "/:path((?!api/|_next/).*)",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path`,
      permanent: true,
    }));
  },

  async headers() {
    return [
      {
        // Apply to everything; the Next router routes /api/* + pages
        // through the same response middleware.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        // Digital Asset Links for the Android TWA. Served from an
        // env-driven route so the signing fingerprint isn't committed.
        // See docs/twa-playstore.md.
        source: "/.well-known/assetlinks.json",
        destination: "/api/assetlinks",
      },
    ];
  },
};

export default nextConfig;
