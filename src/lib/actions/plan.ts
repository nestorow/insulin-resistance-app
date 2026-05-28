"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Daily plan checks — one row per (user, date), tasks_completed is a JSON
// map of checklist itemId -> boolean.

export async function setDayChecksAction(
  date: string,
  checks: Record<string, boolean>
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // Day-plan key: (user_id, day_number, date). We use date as the user-visible
  // key and compute day_number = epoch-days for ordering; the column is
  // present in the schema but secondary here.
  const dayNumber = Math.floor(new Date(date).getTime() / 86_400_000);

  // Check if a row exists for this user+date
  const existing = await db.execute({
    sql: "SELECT id FROM daily_plan WHERE user_id = ? AND date = ?",
    args: [session.user.id, date],
  });

  const tasksJson = JSON.stringify(checks);

  if (existing.rows.length > 0) {
    await db.execute({
      sql: "UPDATE daily_plan SET tasks_completed = ? WHERE id = ?",
      args: [tasksJson, existing.rows[0].id as string],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO daily_plan
              (id, user_id, day_number, plan_variant, date, tasks_completed)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        uuid(),
        session.user.id,
        dayNumber,
        "default", // tier-specific variant comes when daily generation lands
        date,
        tasksJson,
      ],
    });
  }

  return { ok: true };
}

export async function getAllDayChecksAction(): Promise<Record<
  string,
  Record<string, boolean>
> | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const res = await db.execute({
    sql: "SELECT date, tasks_completed FROM daily_plan WHERE user_id = ?",
    args: [session.user.id],
  });

  const out: Record<string, Record<string, boolean>> = {};
  for (const r of res.rows) {
    try {
      out[String(r.date)] = JSON.parse(
        (r.tasks_completed as string) ?? "{}"
      ) as Record<string, boolean>;
    } catch {
      // skip malformed rows
    }
  }
  return out;
}
