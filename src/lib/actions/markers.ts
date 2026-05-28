"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { recordEvent } from "@/lib/gamification";
import type { MarkerEntry } from "@/lib/tracking-storage";

// Blood markers — upsert-by-date (UNIQUE (user_id, date)).
//
// Privacy: medical measurements are sensitive PII (GDPR special category).
// We store them as an authenticated-encrypted JSON blob (AES-256-GCM) in
// the `encrypted_data` column. `date` stays plaintext because it's used
// for ORDER BY + the uniqueness constraint, and on its own reveals nothing
// medical. Legacy rows that still have plaintext columns are read
// transparently and re-encrypted on the next save.

interface EncryptedPayload {
  homaIr?: number;
  fastingInsulin?: number;
  hba1c?: number;
  triglycerides?: number;
  hdl?: number;
}

function toPayload(entry: MarkerEntry): EncryptedPayload {
  return {
    homaIr: entry.homaIr,
    fastingInsulin: entry.fastingInsulin,
    hba1c: entry.hba1c,
    triglycerides: entry.triglycerides,
    hdl: entry.hdl,
  };
}

export async function saveMarkerLogAction(
  entry: MarkerEntry
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return null;

  const payload = toPayload(entry);
  const blob = encrypt(JSON.stringify(payload));

  const existing = await db.execute({
    sql: "SELECT id FROM blood_markers WHERE user_id = ? AND date = ?",
    args: [session.user.id, entry.date],
  });

  let targetId: string;
  if (existing.rows.length > 0) {
    targetId = existing.rows[0].id as string;
    // UPDATE also wipes the plaintext columns so a successful save is the
    // moment a legacy row stops leaking medical data via the schema.
    await db.execute({
      sql: `UPDATE blood_markers
              SET encrypted_data = ?,
                  homa_ir = NULL, fasting_insulin = NULL, hba1c = NULL,
                  triglycerides = NULL, hdl = NULL
            WHERE id = ?`,
      args: [blob, targetId],
    });
  } else {
    targetId = uuid();
    await db.execute({
      sql: `INSERT INTO blood_markers
              (id, user_id, date, encrypted_data)
            VALUES (?, ?, ?, ?)`,
      args: [targetId, session.user.id, entry.date, blob],
    });
  }

  // Audit: record the fact + counts only — never the values themselves.
  const fieldsPresent = Object.values(payload).filter(
    (v) => v !== undefined
  ).length;
  await logAudit({
    userId: session.user.id,
    action: "markers.save",
    targetId,
    metadata: { date: entry.date, fieldsPresent },
  });

  await recordEvent(session.user.id, "marker.save", entry.date);

  return { ok: true };
}

export async function getMarkerLogsAction(): Promise<MarkerEntry[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: `SELECT date, encrypted_data,
                 homa_ir, fasting_insulin, hba1c, triglycerides, hdl
            FROM blood_markers
           WHERE user_id = ?
           ORDER BY date ASC`,
    args: [session.user.id],
  });

  return res.rows.map((r) => {
    if (r.encrypted_data) {
      // Modern (encrypted) row — decrypt the blob and reconstruct the entry.
      const payload = JSON.parse(
        decrypt(String(r.encrypted_data))
      ) as EncryptedPayload;
      return { date: String(r.date), ...payload };
    }
    // Legacy plaintext row — return as-is; the next save will encrypt it.
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
