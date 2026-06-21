"use client";

// Client-side trends aggregation.
//
// The /trends dashboard originally read only from Turso (see
// actions/trends.ts). But every module writes local-first to localStorage
// and only fire-and-forget syncs to the server — so whenever that sync lags
// or fails (offline, rate-limit, expired DB token) the server has no rows
// and the dashboard renders empty even though the data is sitting in the
// browser.
//
// This builder runs the SAME pure mergers from lib/trends.ts against the
// local stores, so the timeline reflects what the user actually recorded.
// TrendsModule uses this as the primary source and only falls back to the
// server when local is empty (e.g. a fresh device after sign-in).

import { getMarkerLogs, getSymptomLogs } from "./tracking-storage";
import { getCgmReadings } from "./cgm-storage";
import { getAllDayChecks } from "./daily-plan-storage";
import {
  buildAxis,
  computeSummary,
  mergeCgm,
  mergeMarkers,
  mergePlan,
  mergeSymptoms,
  type TrendsData,
} from "./trends";

export function buildTrendsFromLocal(endDay: Date = new Date()): TrendsData {
  let days = buildAxis(endDay);
  days = mergeMarkers(days, getMarkerLogs());
  days = mergeSymptoms(days, getSymptomLogs());
  days = mergeCgm(days, getCgmReadings());
  days = mergePlan(days, getAllDayChecks());
  return { days, summary: computeSummary(days) };
}
