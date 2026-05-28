"use client";

import type { OnboardingResult } from "./onboarding";
import { ONBOARDING_VERSION } from "./onboarding";

// Persistence seam for onboarding results.
// localStorage is the working cache (sync, instant). When the user is signed
// in, writes are mirrored to Turso via a fire-and-forget server action call —
// the action itself checks the session and silently no-ops when absent.
// SyncOnLogin handles the initial pull/push at login time.
//
// Server actions are dynamically imported on first use so this module
// stays free of next-auth (ESM) at load time — keeps SSR/tests clean and
// lets the auth chunk lazy-load only for signed-in users.

const KEY = `ir-onboarding-v${ONBOARDING_VERSION}`;

interface SaveOpts {
  /** Skip the server echo — used when sync is hydrating local from DB. */
  skipServer?: boolean;
}

export function saveOnboarding(
  result: OnboardingResult,
  opts: SaveOpts = {}
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // storage full / disabled — non-critical for Phase 1
  }
  if (!opts.skipServer) {
    import("./actions/onboarding")
      .then((m) => m.saveOnboardingAction(result))
      .catch(() => {
        /* no-op; local cache is enough until next sync */
      });
  }
}

export function loadOnboarding(): OnboardingResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingResult) : null;
  } catch {
    return null;
  }
}

export function clearOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
