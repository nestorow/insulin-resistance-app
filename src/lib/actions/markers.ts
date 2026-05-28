"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MarkerEntry } from "@/lib/tracking-storage";

// Blood markers — upsert-by-date (UNIQUE (user_id, date)).

export async function saveMarkerLogAction(
  entry: MarkerEntry
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const existing = await db.execute({
    sql: "SELECT id FROM blood_markers WHERE user_id = ? AND date = ?",
    args: [session.user.id, entry.date],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE blood_markers
              SET homa_ir = ?, fasting_insulin = ?, hba1c = ?,
                  triglycerides = ?, hdl = ?
            WHERE id = ?`,
      args: [
        entry.homaIr ?? null,
        entry.fastingInsulin ?? null,
        entry.hba1c ?? null,
        entry.triglycerides ?? null,
        entry.hdl ?? null,
        existing.rows[0].id as string,
      ],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO blood_markers
              (id, user_id, date, homa_ir, fasting_insulin, hba1c,
               triglycerides, hdl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        uuid(),
        session.user.id,
        entry.date,
        entry.homaIr ?? null,
        entry.fastingInsulin ?? null,
        entry.hba1c ?? null,
        entry.triglycerides ?? null,
        entry.hdl ?? null,
      ],
    });
  }

  return { ok: true };
}

export async function getMarkerLogsAction(): Promise<MarkerEntry[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: `SELECT date, homa_ir, fasting_insulin, hba1c, triglycerides, hdl
            FROM blood_markers
           WHERE user_id = ?
           ORDER BY date ASC`,
    args: [session.user.id],
  });

  return res.rows.map((r) => ({
    date: String(r.date),
    homaIr: r.homa_ir === null ? undefined : Number(r.homa_ir),
    fastingInsulin:
      r.fasting_insulin === null ? undefined : Number(r.fasting_insulin),
    hba1c: r.hba1c === null ? undefined : Number(r.hba1c),
    triglycerides:
      r.triglycerides === null ? undefined : Number(r.triglycerides),
    hdl: r.hdl === null ? undefined : Number(r.hdl),
  }));
}
