"use client";

// Daily checklist state, keyed by ISO date (YYYY-MM-DD).
// Phase 1 seam: localStorage. Phase 2 swaps for `daily_plan` rows in Turso.

const KEY = "ir-daily-plan-v1";

type Store = Record<string, Record<string, boolean>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDayChecks(date: string): Record<string, boolean> {
  return read()[date] ?? {};
}

export function toggleDayCheck(date: string, itemId: string): Record<string, boolean> {
  const store = read();
  const day = { ...(store[date] ?? {}) };
  day[itemId] = !day[itemId];
  store[date] = day;
  write(store);
  return day;
}
