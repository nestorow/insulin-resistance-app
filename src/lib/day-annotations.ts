"use client";

// Day annotations — short user-supplied labels attached to a calendar
// date ("започнах кето", "ваканция", "бях болен"). Stored as a flat
// { YYYY-MM-DD → text } map so the trends overlay can render vertical
// reference lines on every sparkline with one lookup.
//
// Same dual-mode pattern as cgm-annotations: localStorage primary
// cache; signed-in users mirror writes to Turso through a server
// action (single encrypted blob per user — content can be personal).

const KEY = "ir-day-annotations-v1";

/** Bounded — short labels only. Tooltip-friendly + small storage. */
export const MAX_ANNOTATION_LEN = 60;

export type AnnotationMap = Record<string, string>;
export type AnnotationSaveOutcome = "ok" | "rejected" | "offline" | "auth";

interface SaveOpts {
  skipServer?: boolean;
}

function read(): AnnotationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnnotationMap) : {};
  } catch {
    return {};
  }
}

function write(m: AnnotationMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    // quota — silent
  }
}

export function getDayAnnotations(): AnnotationMap {
  return read();
}

export function setDayAnnotation(
  date: string,
  note: string,
  opts: SaveOpts = {}
): {
  local: AnnotationMap;
  pending: Promise<AnnotationSaveOutcome>;
} {
  const map = read();
  const trimmed = note.trim().slice(0, MAX_ANNOTATION_LEN);
  if (trimmed) {
    map[date] = trimmed;
  } else {
    delete map[date]; // empty = delete
  }
  write(map);

  if (opts.skipServer) {
    return { local: map, pending: Promise.resolve("ok") };
  }

  const pending = import("./actions/day-annotations")
    .then((m) => m.saveDayAnnotationAction(date, trimmed))
    .then((res): AnnotationSaveOutcome => {
      if (res.ok) return "ok";
      if (res.reason === "auth") return "auth";
      return res.reason === "rate" ? "rejected" : "offline";
    })
    .catch((): AnnotationSaveOutcome => "offline");

  return { local: map, pending };
}

export function clearDayAnnotations(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
