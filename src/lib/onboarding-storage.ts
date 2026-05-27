"use client";

import type { OnboardingResult } from "./onboarding";
import { ONBOARDING_VERSION } from "./onboarding";

// Persistence seam for onboarding results.
// Phase 1: localStorage (no auth yet). Phase 2: swap to a server action that
// writes `onboarding` + `daily_plan` for the signed-in user. Keep this the
// only place that knows *where* results live so the swap stays contained.

const KEY = `ir-onboarding-v${ONBOARDING_VERSION}`;

export function saveOnboarding(result: OnboardingResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // storage full / disabled — non-critical for Phase 1
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
