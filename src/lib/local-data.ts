"use client";

// Single source of truth for localStorage keys this app writes, so we can
// wipe them cleanly on sign-out (privacy on shared machines — the next
// user shouldn't inherit the previous user's onboarding/journal/markers).

const KEYS = [
  "ir-onboarding-v1",
  "ir-onboarding-draft-v1",
  "ir-daily-plan-v1",
  "ir-symptom-log-v1",
  "ir-marker-log-v1",
  "ir-cgm-readings-v1",
  "ir-cgm-annotations-v1",
  "ir-day-annotations-v1",
];

export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  for (const k of KEYS) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
}
