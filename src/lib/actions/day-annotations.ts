"use server";

import { getServerSession } from "next-auth/next";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";

// Day annotations — same single-row-per-user encrypted-blob pattern as
// cgm_annotations. One row per user holds the full { date → label }
// map; each save is read-modify-write of the whole blob. The map stays
// small in practice (annotations are sparse, ≤60 chars each), so this
// beats a normalized table on operational simplicity.

const MAX_LEN = 60;

export type AnnotationActionResult =
  | { ok: true }
  | { ok: false; reason: "auth" | "rate" };

async function readMap(userId: string): Promise<Record<string, string>> {
  const res = await db.execute({
    sql: "SELECT encrypted_payload FROM day_annotations WHERE user_id = ?",
    args: [userId],
  });
  if (!res.rows.length) return {};
  try {
    return JSON.parse(decrypt(String(res.rows[0].encrypted_payload))) as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

async function writeMap(
  userId: string,
  map: Record<string, string>
): Promise<void> {
  const blob = encrypt(JSON.stringify(map));
  const res = await db.execute({
    sql: "SELECT id FROM day_annotations WHERE user_id = ?",
    args: [userId],
  });
  if (res.rows.length) {
    await db.execute({
      sql: `UPDATE day_annotations
              SET encrypted_payload = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?`,
      args: [blob, userId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO day_annotations (id, user_id, encrypted_payload)
            VALUES (?, ?, ?)`,
      args: [uuid(), userId, blob],
    });
  }
}

export async function saveDayAnnotationAction(
  date: string,
  note: string
): Promise<AnnotationActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, reason: "auth" };

  const rate = await checkRateLimit("write", session.user.id);
  if (!rate.ok) return { ok: false, reason: "rate" };

  const trimmed = note.trim().slice(0, MAX_LEN);
  const map = await readMap(session.user.id);
  if (trimmed) {
    map[date] = trimmed;
  } else {
    delete map[date];
  }
  await writeMap(session.user.id, map);
  return { ok: true };
}

export async function getDayAnnotationsAction(): Promise<Record<
  string,
  string
> | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return readMap(session.user.id);
}
