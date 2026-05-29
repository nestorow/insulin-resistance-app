"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  loadOnboardingAction,
  saveOnboardingAction,
} from "@/lib/actions/onboarding";
import {
  getAllDayChecksAction,
  setDayChecksAction,
} from "@/lib/actions/plan";
import {
  getSymptomLogsAction,
  saveSymptomLogAction,
} from "@/lib/actions/journal";
import {
  getMarkerLogsAction,
  saveMarkerLogAction,
} from "@/lib/actions/markers";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding-storage";
import { setDayChecks } from "@/lib/daily-plan-storage";
import {
  getSymptomLogs,
  addSymptomLog,
  getMarkerLogs,
  addMarkerLog,
} from "@/lib/tracking-storage";
import {
  getCgmReadingsAction,
  saveCgmBatchAction,
} from "@/lib/actions/cgm";
import { addCgmReadings, getCgmReadings } from "@/lib/cgm-storage";
import {
  getCgmAnnotationsAction,
  saveCgmAnnotationAction,
} from "@/lib/actions/cgm-annotations";
import {
  getCgmAnnotations,
  setCgmAnnotation,
} from "@/lib/cgm-annotations";

// One-time per session bidirectional sync:
//   server → localStorage  (writes mirrored to local, no echo back)
//   localStorage → server  (any local-only entries pushed up)
// Mounted in the root layout; runs only when session becomes "authenticated".

export default function SyncOnLogin() {
  const { status } = useSession();
  const done = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || done.current) return;
    done.current = true;
    void runSync();
  }, [status]);

  return null;
}

async function runSync() {
  try {
    await Promise.all([
      syncOnboarding(),
      syncDailyPlan(),
      syncSymptoms(),
      syncMarkers(),
      syncCgm(),
      syncCgmAnnotations(),
    ]);
  } catch {
    // best-effort — next session will retry
  }
}

async function syncOnboarding() {
  const [local, server] = await Promise.all([
    Promise.resolve(loadOnboarding()),
    loadOnboardingAction(),
  ]);
  if (server) {
    saveOnboarding(server, { skipServer: true });
  } else if (local) {
    await saveOnboardingAction(local);
  }
}

async function syncDailyPlan() {
  const local = collectLocalDailyChecks();
  const server = (await getAllDayChecksAction()) ?? {};
  // Hydrate every date the server has into local cache.
  for (const [date, checks] of Object.entries(server)) {
    setDayChecks(date, checks, { skipServer: true });
  }
  // Push any local-only dates up.
  for (const date of Object.keys(local)) {
    if (!(date in server)) {
      await setDayChecksAction(date, local[date]);
    }
  }
}

function collectLocalDailyChecks(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("ir-daily-plan-v1");
    return raw ? (JSON.parse(raw) as Record<string, Record<string, boolean>>) : {};
  } catch {
    return {};
  }
}

async function syncSymptoms() {
  const local = getSymptomLogs();
  const server = (await getSymptomLogsAction()) ?? [];
  const serverDates = new Set(server.map((e) => e.date));
  // Pull server entries into local cache.
  for (const e of server) {
    addSymptomLog(e, { skipServer: true });
  }
  // Push local-only.
  for (const e of local) {
    if (!serverDates.has(e.date)) {
      await saveSymptomLogAction(e);
    }
  }
}

async function syncMarkers() {
  const local = getMarkerLogs();
  const server = (await getMarkerLogsAction()) ?? [];
  const serverDates = new Set(server.map((e) => e.date));
  for (const e of server) {
    addMarkerLog(e, { skipServer: true });
  }
  for (const e of local) {
    if (!serverDates.has(e.date)) {
      await saveMarkerLogAction(e);
    }
  }
}

async function syncCgm() {
  // Symmetric pull/push. The server merge logic (saveCgmBatchAction)
  // dedupes by ts, so pushing every local reading is safe — the action
  // itself filters out duplicates that already exist server-side.
  const local = getCgmReadings();
  const server = (await getCgmReadingsAction()) ?? [];
  if (server.length) {
    addCgmReadings(server, { skipServer: true });
  }
  // Push any timestamps the server doesn't have yet.
  const serverTs = new Set(server.map((r) => r.ts));
  const localOnly = local.filter((r) => !serverTs.has(r.ts));
  if (localOnly.length) {
    await saveCgmBatchAction(localOnly);
  }
}

async function syncCgmAnnotations() {
  const local = getCgmAnnotations();
  const server = (await getCgmAnnotationsAction()) ?? {};
  // Merge: server wins on key collision (single source of truth across
  // devices). Push any local-only keys up.
  for (const [ts, note] of Object.entries(server)) {
    setCgmAnnotation(ts, note, { skipServer: true });
  }
  for (const [ts, note] of Object.entries(local)) {
    if (!(ts in server)) {
      await saveCgmAnnotationAction(ts, note);
    }
  }
}
