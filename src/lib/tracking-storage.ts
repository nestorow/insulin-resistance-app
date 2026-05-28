"use client";

import { saveSymptomLogAction } from "./actions/journal";
import { saveMarkerLogAction } from "./actions/markers";

// Symptom journal + blood marker logs.
// localStorage is the primary cache; when signed in each write also fire-
// and-forgets to Turso (auth.ts checks session; non-auth callers no-op).

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

export function getSymptomLogs(): SymptomEntry[] {
  return readArr<SymptomEntry>(SYMPTOM_KEY);
}

export function addSymptomLog(
  entry: SymptomEntry,
  opts: SaveOpts = {}
): SymptomEntry[] {
  const next = upsertByDate(getSymptomLogs(), entry);
  writeArr(SYMPTOM_KEY, next);
  if (!opts.skipServer) {
    saveSymptomLogAction(entry).catch(() => {});
  }
  return next;
}

export function getMarkerLogs(): MarkerEntry[] {
  return readArr<MarkerEntry>(MARKER_KEY);
}

export function addMarkerLog(
  entry: MarkerEntry,
  opts: SaveOpts = {}
): MarkerEntry[] {
  const next = upsertByDate(getMarkerLogs(), entry);
  writeArr(MARKER_KEY, next);
  if (!opts.skipServer) {
    saveMarkerLogAction(entry).catch(() => {});
  }
  return next;
}
