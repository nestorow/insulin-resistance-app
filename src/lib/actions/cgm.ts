"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import type { CgmReading } from "@/lib/cgm";

// CGM batch save — one server roundtrip per CSV upload, regardless of
// reading count. Storage shape: one row per (user, day) holding the
// day's readings as an AES-256-GCM blob.
//
// Merge semantics: when a day already has readings, we decrypt, merge by
// ts (incoming wins on collision), re-encrypt, UPDATE. This means a user
// can upload partial days repeatedly without losing earlier data — the
// common case for a biohacker who pulls a new LibreView export weekly.

export type CgmSaveResult =
  | { ok: true; daysWritten: number; totalReadings: number }
  | { ok: false; reason: "auth" | "rate" };

function dayKey(ts: string): string {
  return ts.slice(0, 10); // ISO ts → YYYY-MM-DD; UTC since parser normalizes.
}

function groupByDay(readings: CgmReading[]): Map<string, CgmReading[]> {
  const m = new Map<string, CgmReading[]>();
  for (const r of readings) {
    const k = dayKey(r.ts);
    const arr = m.get(k);
    if (arr) arr.push(r);
    else m.set(k, [r]);
  }
  return m;
}

function mergeByTs(a: CgmReading[], b: CgmReading[]): CgmReading[] {
  const map = new Map<string, CgmReading>();
  for (const r of a) map.set(r.ts, r);
  for (const r of b) map.set(r.ts, r);
  return Array.from(map.values()).sort((x, y) => x.ts.localeCompare(y.ts));
}

/** Mixed-source days get the literal string "mixed" — matches the UI badge. */
function pickSource(readings: CgmReading[]): string {
  const set = new Set(readings.map((r) => r.source));
  return set.size === 1 ? readings[0].source : "mixed";
}

export async function saveCgmBatchAction(
  readings: CgmReading[]
): Promise<CgmSaveResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, reason: "auth" };
  if (readings.length === 0) {
    return { ok: true, daysWritten: 0, totalReadings: 0 };
  }

  // One CSV upload = one rate-limit check (not per-reading) — a batch of
  // 5K readings is still a single user action.
  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return { ok: false, reason: "rate" };

  const days = groupByDay(readings);
  let totalReadings = 0;

  for (const [date, dayReadings] of days) {
    const existing = await db.execute({
      sql: "SELECT id, encrypted_payload FROM cgm_readings WHERE user_id = ? AND date = ?",
      args: [session.user.id, date],
    });

    let merged: CgmReading[];
    let targetId: string;

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      targetId = String(row.id);
      const prior = JSON.parse(
        decrypt(String(row.encrypted_payload))
      ) as CgmReading[];
      merged = mergeByTs(prior, dayReadings);
      const blob = encrypt(JSON.stringify(merged));
      await db.execute({
        sql: `UPDATE cgm_readings
                SET encrypted_payload = ?,
                    count = ?,
                    source = ?,
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [blob, merged.length, pickSource(merged), targetId],
      });
    } else {
      merged = mergeByTs([], dayReadings);
      targetId = uuid();
      const blob = encrypt(JSON.stringify(merged));
      await db.execute({
        sql: `INSERT INTO cgm_readings
                (id, user_id, date, encrypted_payload, count, source)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          targetId,
          session.user.id,
          date,
          blob,
          merged.length,
          pickSource(merged),
        ],
      });
    }
    totalReadings += merged.length;
  }

  await logAudit({
    userId: session.user.id,
    action: "cgm.save",
    metadata: {
      date: Array.from(days.keys()).sort()[0],
      daysWritten: days.size,
      readingCount: readings.length,
    },
  });

  return { ok: true, daysWritten: days.size, totalReadings };
}

export async function getCgmReadingsAction(): Promise<CgmReading[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: `SELECT encrypted_payload
            FROM cgm_readings
           WHERE user_id = ?
           ORDER BY date ASC`,
    args: [session.user.id],
  });

  const out: CgmReading[] = [];
  for (const row of res.rows) {
    try {
      const day = JSON.parse(
        decrypt(String(row.encrypted_payload))
      ) as CgmReading[];
      for (const r of day) out.push(r);
    } catch {
      // Skip undecryptable rows (key rotation in the future, corrupt blob);
      // logging would be too noisy here — server logs already capture it.
    }
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}

export async function clearCgmReadingsAction(): Promise<{ ok: true }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: true };
  await db.execute({
    sql: "DELETE FROM cgm_readings WHERE user_id = ?",
    args: [session.user.id],
  });
  await logAudit({
    userId: session.user.id,
    action: "cgm.clear",
  });
  return { ok: true };
}
