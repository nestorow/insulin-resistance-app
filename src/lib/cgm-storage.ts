"use client";

// CGM persistence seam — same dual-mode shape as tracking-storage.ts.
// localStorage is the working cache (fast reads for charts); when the
// user is signed in each batch write also fires to Turso via a dynamically
// imported server action.
//
// Unlike markers/journal, CGM data is high-volume (≈12 readings/hour for
// FreeStyle Libre, 5-min cadence for Dexcom) so we use a flat sorted
// array keyed by ts. The cap below keeps the in-browser footprint
// bounded — a serious biohacker user with ~90 days × 96 readings = ~8.6K
// rows = ~500 kB serialized, comfortably below the 5 MB localStorage
// budget but still worth bounding.

import { CgmReading } from "./cgm";

const KEY = "ir-cgm-readings-v1";

/** Keep at most 90 days of readings client-side. Older rows live on the
 *  server and can be pulled on demand. */
const MAX_READINGS = 12_000;

export type CgmSaveOutcome = "ok" | "rejected" | "offline" | "auth";

interface SaveOpts {
  /** Skip server echo — used by SyncOnLogin when hydrating from DB. */
  skipServer?: boolean;
}

interface AddResult {
  local: CgmReading[];
  /** Resolves after the server roundtrip; `auth` for anonymous users. */
  pending: Promise<CgmSaveOutcome>;
}

function read(): CgmReading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CgmReading[]) : [];
  } catch {
    return [];
  }
}

function write(arr: CgmReading[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // quota → drop silently; user will see fewer historical points but
    // the UI doesn't break. Could escalate to a toast in a later pass.
  }
}

/** Merge `incoming` into `existing`, dedupe by ts, sort ascending, cap. */
export function mergeReadings(
  existing: CgmReading[],
  incoming: CgmReading[]
): CgmReading[] {
  if (!incoming.length) return existing;
  const map = new Map<string, CgmReading>();
  for (const r of existing) map.set(r.ts, r);
  // Incoming wins on ts collision — last upload reflects latest device data.
  for (const r of incoming) map.set(r.ts, r);
  const merged = Array.from(map.values()).sort((a, b) =>
    a.ts.localeCompare(b.ts)
  );
  // Cap at MAX_READINGS — keep the most recent.
  return merged.length > MAX_READINGS
    ? merged.slice(merged.length - MAX_READINGS)
    : merged;
}

export function getCgmReadings(): CgmReading[] {
  return read();
}

export function clearCgmReadings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function addCgmReadings(
  incoming: CgmReading[],
  opts: SaveOpts = {}
): AddResult {
  const next = mergeReadings(read(), incoming);
  write(next);

  if (opts.skipServer || incoming.length === 0) {
    return { local: next, pending: Promise.resolve("ok") };
  }

  const pending = import("./actions/cgm")
    .then((m) => m.saveCgmBatchAction(incoming))
    .then((res): CgmSaveOutcome => {
      if (res.ok) return "ok";
      if (res.reason === "auth") return "auth";
      return res.reason === "rate" ? "rejected" : "offline";
    })
    .catch((): CgmSaveOutcome => "offline");

  return { local: next, pending };
}
