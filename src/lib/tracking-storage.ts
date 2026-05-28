"use client";

// Symptom journal + blood marker logs.
// localStorage is the primary cache; when signed in each write also fires
// to Turso via a dynamically-imported server action.
//
// `addSymptomLog` / `addMarkerLog` return both the synchronous new local
// state AND a `pending` promise resolving to the server outcome:
//   - 'ok'        — server accepted (or no server because anonymous)
//   - 'rejected'  — server explicitly refused (rate-limited; will never
//                   land server-side → caller should revert local)
//   - 'offline'   — transient error (network blip); SyncOnLogin will
//                   reconcile, so the local cache is kept
//
// This is the foundation for optimistic UI rollback on the journal +
// markers entry forms.

export type SaveOutcome = "ok" | "rejected" | "offline";

export interface SymptomEntry {
  date: string; // YYYY-MM-DD
  energy: number; // 1-10
  brainFog: number; // 1-10 (higher = worse)
  weight?: number; // kg
  waist?: number; // cm
  bloodSugar?: number; // mmol/L
  notes?: string;
}

export interface MarkerEntry {
  date: string; // YYYY-MM-DD
  homaIr?: number;
  fastingInsulin?: number; // µU/mL
  hba1c?: number; // %
  triglycerides?: number; // mg/dL
  hdl?: number; // mg/dL
}

interface SaveOpts {
  /** Skip server echo — used by SyncOnLogin when hydrating from DB. */
  skipServer?: boolean;
}

interface AddResult<T> {
  /** New list after the upsert; already written to localStorage. */
  local: T[];
  /**
   * Resolves when the server roundtrip finishes. On 'rejected' the
   * caller should remove the entry from local state (rollback) — see
   * `removeSymptomLog` / `removeMarkerLog` for the inverse operation.
   */
  pending: Promise<SaveOutcome>;
}

const SYMPTOM_KEY = "ir-symptom-log-v1";
const MARKER_KEY = "ir-marker-log-v1";

function readArr<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeArr<T>(key: string, arr: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function upsertByDate<T extends { date: string }>(arr: T[], entry: T): T[] {
  const next = arr.filter((e) => e.date !== entry.date);
  next.push(entry);
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

function removeByDate<T extends { date: string }>(arr: T[], date: string): T[] {
  return arr.filter((e) => e.date !== date);
}

// ── Symptom log ─────────────────────────────────────────────────────
export function getSymptomLogs(): SymptomEntry[] {
  return readArr<SymptomEntry>(SYMPTOM_KEY);
}

export function addSymptomLog(
  entry: SymptomEntry,
  opts: SaveOpts = {}
): AddResult<SymptomEntry> {
  const next = upsertByDate(getSymptomLogs(), entry);
  writeArr(SYMPTOM_KEY, next);

  if (opts.skipServer) {
    return { local: next, pending: Promise.resolve("ok") };
  }

  const pending = import("./actions/journal")
    .then((m) => m.saveSymptomLogAction(entry))
    .then((res): SaveOutcome => {
      if (res.ok) return "ok";
      // 'auth' outcome happens for anonymous users — we never expected
      // a server commit, so the local-only write is correct as-is.
      return res.reason === "rate" ? "rejected" : "ok";
    })
    .catch((): SaveOutcome => "offline");

  return { local: next, pending };
}

/** Rollback inverse of addSymptomLog — remove the entry for `date`. */
export function removeSymptomLog(date: string): SymptomEntry[] {
  const next = removeByDate(getSymptomLogs(), date);
  writeArr(SYMPTOM_KEY, next);
  return next;
}

// ── Marker log ──────────────────────────────────────────────────────
export function getMarkerLogs(): MarkerEntry[] {
  return readArr<MarkerEntry>(MARKER_KEY);
}

export function addMarkerLog(
  entry: MarkerEntry,
  opts: SaveOpts = {}
): AddResult<MarkerEntry> {
  const next = upsertByDate(getMarkerLogs(), entry);
  writeArr(MARKER_KEY, next);

  if (opts.skipServer) {
    return { local: next, pending: Promise.resolve("ok") };
  }

  const pending = import("./actions/markers")
    .then((m) => m.saveMarkerLogAction(entry))
    .then((res): SaveOutcome => {
      if (res.ok) return "ok";
      return res.reason === "rate" ? "rejected" : "ok";
    })
    .catch((): SaveOutcome => "offline");

  return { local: next, pending };
}

export function removeMarkerLog(date: string): MarkerEntry[] {
  const next = removeByDate(getMarkerLogs(), date);
  writeArr(MARKER_KEY, next);
  return next;
}
