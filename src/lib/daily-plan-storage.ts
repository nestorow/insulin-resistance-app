"use client";

import { setDayChecksAction } from "./actions/plan";

// Daily checklist state, keyed by ISO date (YYYY-MM-DD).
// localStorage is the primary cache; when signed in, each toggle fire-and-
// forgets the full day's checks to Turso (UPSERT semantics).

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

export function toggleDayCheck(
  date: string,
  itemId: string
): Record<string, boolean> {
  const store = read();
  const day = { ...(store[date] ?? {}) };
  day[itemId] = !day[itemId];
  store[date] = day;
  write(store);
  // Fire-and-forget server sync: persist the full day's check set.
  setDayChecksAction(date, day).catch(() => {});
  return day;
}

interface SaveOpts {
  skipServer?: boolean;
}

/** Bulk replace by date (used by SyncOnLogin to hydrate from server). */
export function setDayChecks(
  date: string,
  checks: Record<string, boolean>,
  opts: SaveOpts = {}
): void {
  const store = read();
  store[date] = checks;
  write(store);
  if (!opts.skipServer) {
    setDayChecksAction(date, checks).catch(() => {});
  }
}
