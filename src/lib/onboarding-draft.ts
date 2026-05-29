"use client";

// In-progress onboarding state — separate from the completed
// `OnboardingResult` so resumption never collides with the "are you
// done?" check that bounces completers to /plan.
//
// Localstorage-only; never synced to the server. The cost-benefit
// doesn't justify a DB round-trip for an interrupted flow:
//   - drafts are stale within hours (user re-takes or abandons)
//   - the only signal worth syncing is the *completed* result
//   - GDPR surface area shrinks when half-typed answers don't leave
//     the device

import type { Lens } from "./onboarding";

const KEY = "ir-onboarding-draft-v1";

/** TTL — after a week we drop the draft on read. Stale answers from
 *  weeks ago are more likely to be wrong than helpful (people forget
 *  what they were thinking). */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface OnboardingDraft {
  /** Last step the user was on. */
  step: "welcome" | "quiz" | "lens" | "result" | "day1";
  /** Quiz answers, with null for unanswered slots. */
  answers: (boolean | null)[];
  /** Picked / inferred audience lens, if reached. */
  lens: Lens | null;
  /** Optional TG/HDL inputs from the result step. */
  tg: string;
  hdl: string;
  /** Optional waist/hip inputs from the result step. */
  waist: string;
  hip: string;
  /** ISO timestamp of last save — used for TTL on read. */
  savedAt: string;
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    // Drop expired drafts so a 2-month-old half-quiz doesn't suddenly
    // resume when the user retries.
    if (Date.now() - new Date(draft.savedAt).getTime() > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(
  draft: Omit<OnboardingDraft, "savedAt">
): void {
  if (typeof window === "undefined") return;
  try {
    const full: OnboardingDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    // quota — silent; the user just won't get resume support this session
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Truthy when the draft has any user-typed signal worth resuming. */
export function isDraftSubstantive(d: OnboardingDraft | null): boolean {
  if (!d) return false;
  if (d.answers.some((a) => a !== null)) return true;
  if (d.lens) return true;
  if (d.tg || d.hdl || d.waist || d.hip) return true;
  return false;
}
