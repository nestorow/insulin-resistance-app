"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SymptomEntry } from "@/lib/tracking-storage";

// Symptom journal — upsert-by-date (UNIQUE (user_id, date)).

export async function saveSymptomLogAction(
  entry: SymptomEntry
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const existing = await db.execute({
    sql: "SELECT id FROM symptom_log WHERE user_id = ? AND date = ?",
    args: [session.user.id, entry.date],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE symptom_log
              SET energy = ?, brain_fog = ?, weight = ?, waist = ?,
                  blood_sugar = ?, notes = ?
            WHERE id = ?`,
      args: [
        entry.energy,
        entry.brainFog,
        entry.weight ?? null,
        entry.waist ?? null,
        entry.bloodSugar ?? null,
        entry.notes ?? null,
        existing.rows[0].id as string,
      ],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO symptom_log
              (id, user_id, date, energy, brain_fog, weight, waist,
               blood_sugar, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        uuid(),
        session.user.id,
        entry.date,
        entry.energy,
        entry.brainFog,
        entry.weight ?? null,
        entry.waist ?? null,
        entry.bloodSugar ?? null,
        entry.notes ?? null,
      ],
    });
  }

  return { ok: true };
}

export async function getSymptomLogsAction(): Promise<SymptomEntry[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: `SELECT date, energy, brain_fog, weight, waist, blood_sugar, notes
            FROM symptom_log
           WHERE user_id = ?
           ORDER BY date ASC`,
    args: [session.user.id],
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
