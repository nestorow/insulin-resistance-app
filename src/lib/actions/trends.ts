"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { CgmReading } from "@/lib/cgm";
import type { MarkerEntry, SymptomEntry } from "@/lib/tracking-storage";
import {
  buildAxis,
  computeSummary,
  mergeCgm,
  mergeMarkers,
  mergePlan,
  mergeSymptoms,
  TRENDS_WINDOW_DAYS,
  type TrendsData,
} from "@/lib/trends";
import { sanitizeMarkerEntry, sanitizeSymptomEntry } from "@/lib/health-ranges";

// Single read endpoint for the /trends dashboard. Reaches into the four
// stores (blood_markers, symptom_log, cgm_readings, daily_plan), filters
// each to the 90-day window server-side (cheaper than pulling everything
// then trimming), then runs the pure mergers from lib/trends.ts.
//
// Decryption happens inline here — both blood markers and CGM readings
// are AES-256-GCM at rest. Failed decrypts are skipped silently; one
// corrupt blob shouldn't blank the entire dashboard.

interface EncryptedMarkerPayload {
  homaIr?: number;
  fastingInsulin?: number;
  hba1c?: number;
  triglycerides?: number;
  hdl?: number;
}

export async function getTrendsAction(): Promise<TrendsData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const axis = buildAxis();
  const cutoff = axis[0].date;

  const [markers, symptoms, cgm, plan] = await Promise.all([
    fetchMarkers(session.user.id, cutoff),
    fetchSymptoms(session.user.id, cutoff),
    fetchCgmReadings(session.user.id, cutoff),
    fetchPlanByDate(session.user.id, cutoff),
  ]);

  let days = axis;
  // Drop out-of-range values from old DB rows so they don't skew trends.
  days = mergeMarkers(days, markers.map(sanitizeMarkerEntry));
  days = mergeSymptoms(days, symptoms.map(sanitizeSymptomEntry));
  days = mergeCgm(days, cgm);
  days = mergePlan(days, plan);

  return {
    days,
    summary: computeSummary(days),
  };
}

async function fetchMarkers(
  userId: string,
  cutoff: string
): Promise<MarkerEntry[]> {
  const res = await db.execute({
    sql: `SELECT date, encrypted_data,
                 homa_ir, fasting_insulin, hba1c, triglycerides, hdl
            FROM blood_markers
           WHERE user_id = ? AND date >= ?
           ORDER BY date ASC`,
    args: [userId, cutoff],
  });
  return res.rows.map((r) => {
    if (r.encrypted_data) {
      try {
        const p = JSON.parse(
          decrypt(String(r.encrypted_data))
        ) as EncryptedMarkerPayload;
        return { date: String(r.date), ...p };
      } catch {
        // Fall back to plaintext columns if blob is corrupt.
      }
    }
    return {
      date: String(r.date),
      homaIr: r.homa_ir === null ? undefined : Number(r.homa_ir),
      fastingInsulin:
        r.fasting_insulin === null ? undefined : Number(r.fasting_insulin),
      hba1c: r.hba1c === null ? undefined : Number(r.hba1c),
      triglycerides:
        r.triglycerides === null ? undefined : Number(r.triglycerides),
      hdl: r.hdl === null ? undefined : Number(r.hdl),
    };
  });
}

async function fetchSymptoms(
  userId: string,
  cutoff: string
): Promise<SymptomEntry[]> {
  const res = await db.execute({
    sql: `SELECT date, energy, brain_fog, weight, waist, blood_sugar, notes
            FROM symptom_log
           WHERE user_id = ? AND date >= ?
           ORDER BY date ASC`,
    args: [userId, cutoff],
  });
  return res.rows.map((r) => ({
    date: String(r.date),
    energy: Number(r.energy),
    brainFog: Number(r.brain_fog),
    weight: r.weight === null ? undefined : Number(r.weight),
    waist: r.waist === null ? undefined : Number(r.waist),
    bloodSugar: r.blood_sugar === null ? undefined : Number(r.blood_sugar),
    notes: r.notes === null ? undefined : String(r.notes),
  }));
}

async function fetchCgmReadings(
  userId: string,
  cutoff: string
): Promise<CgmReading[]> {
  const res = await db.execute({
    sql: `SELECT encrypted_payload
            FROM cgm_readings
           WHERE user_id = ? AND date >= ?
           ORDER BY date ASC`,
    args: [userId, cutoff],
  });
  const out: CgmReading[] = [];
  for (const row of res.rows) {
    try {
      const day = JSON.parse(
        decrypt(String(row.encrypted_payload))
      ) as CgmReading[];
      for (const r of day) out.push(r);
    } catch {
      /* skip undecryptable blob */
    }
  }
  return out;
}

async function fetchPlanByDate(
  userId: string,
  cutoff: string
): Promise<Record<string, Record<string, boolean>>> {
  const res = await db.execute({
    sql: `SELECT date, tasks_completed FROM daily_plan
           WHERE user_id = ? AND date >= ?`,
    args: [userId, cutoff],
  });
  const out: Record<string, Record<string, boolean>> = {};
  for (const r of res.rows) {
    try {
      out[String(r.date)] = JSON.parse(
        (r.tasks_completed as string) ?? "{}"
      );
    } catch {
      // skip malformed row
    }
  }
  return out;
}

// Re-export for the route's invalidation hint — keeps the window
// constant single-sourced.
export { TRENDS_WINDOW_DAYS };
