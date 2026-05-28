"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// Daily plan checks — one row per (user, date), tasks_completed is a JSON
// map of checklist itemId -> boolean.

export async function setDayChecksAction(
  date: string,
  checks: Record<string, boolean>
): Promise<{ ok: true } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return null;

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

  let targetId: string;
  if (existing.rows.length > 0) {
    targetId = existing.rows[0].id as string;
    await db.execute({
      sql: "UPDATE daily_plan SET tasks_completed = ? WHERE id = ?",
      args: [tasksJson, targetId],
    });
  } else {
    targetId = uuid();
    await db.execute({
      sql: `INSERT INTO daily_plan
              (id, user_id, day_number, plan_variant, date, tasks_completed)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        targetId,
        session.user.id,
        dayNumber,
        "default", // tier-specific variant comes when daily generation lands
        date,
        tasksJson,
      ],
    });
  }

  // Audit: record date + count of checked items (no item IDs — that
  // would leak protocol detail across phases/tiers).
  const checkedCount = Object.values(checks).filter(Boolean).length;
  await logAudit({
    userId: session.user.id,
    action: "plan.update",
    targetId,
    metadata: { date, fieldsPresent: checkedCount },
  });

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
