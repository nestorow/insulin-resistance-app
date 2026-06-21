"use client";

// Day-1 checklist state for the onboarding primer. Mirrors the /plan
// checkbox behaviour (persisted toggles + a done counter) but lives in its
// OWN localStorage key — separate from ir-daily-plan-v1 — so ticking a task
// here never leaks into the real daily-plan completion % or the trends plan
// aggregation (mergePlan divides completed / keys-present for the day).

const KEY = "ir-onboarding-day1-v1";

export function getDay1Checks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function toggleDay1Check(id: string): Record<string, boolean> {
  const next = { ...getDay1Checks() };
  next[id] = !next[id];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private-mode failures — the UI state still updates
    }
  }
  return next;
}
