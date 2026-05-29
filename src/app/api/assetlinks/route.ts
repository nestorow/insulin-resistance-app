import { NextResponse } from "next/server";

// Digital Asset Links for the Android TWA (Trusted Web Activity).
// Reachable at /.well-known/assetlinks.json via a rewrite (next.config.ts).
//
// This file is what tells Chrome the Play-signed Android app is allowed to
// render this origin WITHOUT the browser URL bar ("trusted"). It's served
// from an env-driven route — not a committed static file — so the signing
// fingerprint never lands in git and can differ per environment.
//
// Returns 404 until configured, so a half-set-up deploy doesn't publish a
// broken (unverifiable) asset-links file. Full setup: docs/twa-playstore.md
//
// Env:
//   TWA_PACKAGE_NAME        — Android applicationId (default below)
//   TWA_SHA256_FINGERPRINTS — comma-separated SHA-256 cert fingerprints
//                             (colon-separated hex). Include BOTH the upload
//                             key AND the Play App Signing key — Play re-signs
//                             the upload, so users verify against the latter.

export const dynamic = "force-dynamic";

const DEFAULT_PACKAGE = "bg.insulinreset.twa";

export function GET() {
  const fingerprints = (process.env.TWA_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (fingerprints.length === 0) {
    // Not configured yet — see docs/twa-playstore.md.
    return new NextResponse("assetlinks not configured", { status: 404 });
  }

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.TWA_PACKAGE_NAME ?? DEFAULT_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
