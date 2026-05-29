"use client";

// Spike annotations — short user-supplied labels for detected glucose
// peaks ("банан + кафе", "пица", "стрес среща"). Stored as a flat
// { peakTs → text } map so a spike at ISO ts gets exactly one note.
//
// The map mirrors the same dual-mode pattern as the tracking-storage
// seam: localStorage is primary cache; signed-in users mirror writes
// to Turso (encrypted blob — content can name foods, which feed into
// the food assistant on a follow-up pass).

const KEY = "ir-cgm-annotations-v1";

/** Bounded — short labels only. Keeps storage small + encourages signal. */
export const MAX_NOTE_LEN = 80;

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
    // quota → silent; the user keeps the note in the UI for the session
  }
}

export function getCgmAnnotations(): AnnotationMap {
  return read();
}

export function setCgmAnnotation(
  peakTs: string,
  note: string,
  opts: SaveOpts = {}
): {
  local: AnnotationMap;
  pending: Promise<AnnotationSaveOutcome>;
} {
  const map = read();
  const trimmed = note.trim().slice(0, MAX_NOTE_LEN);
  if (trimmed) {
    map[peakTs] = trimmed;
  } else {
    delete map[peakTs]; // empty note = delete (clears the row)
  }
  write(map);

  if (opts.skipServer) {
    return { local: map, pending: Promise.resolve("ok") };
  }

  const pending = import("./actions/cgm-annotations")
    .then((m) => m.saveCgmAnnotationAction(peakTs, trimmed))
    .then((res): AnnotationSaveOutcome => {
      if (res.ok) return "ok";
      if (res.reason === "auth") return "auth";
      return res.reason === "rate" ? "rejected" : "offline";
    })
    .catch((): AnnotationSaveOutcome => "offline");

  return { local: map, pending };
}

export function clearCgmAnnotations(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
