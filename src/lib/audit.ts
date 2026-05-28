import { db } from "@/lib/db";

// Append-only audit log for sensitive writes. Backs trust messaging
// ("you can see every change made to your data") and supports an
// admin-side incident review path if a leak / takeover is suspected.
//
// Privacy: we record the FACT of a change + identifiers, never the
// medical values themselves. Encrypted markers stay encrypted; the
// audit row notes "markers.save on date=2026-05-28" — not the HbA1c.

export type AuditAction =
  | "onboarding.save"
  | "onboarding.clear"
  | "markers.save"
  | "symptoms.save"
  | "plan.update";

export interface AuditMetadata {
  /** Target date for date-keyed writes (markers, symptoms, plan). */
  date?: string;
  /** Tier captured at write time — for trend audits, not PII. */
  tier?: string;
  /** How many marker fields populated — counts only, never values. */
  fieldsPresent?: number;
}

/**
 * Append an audit row. Never throws — auditing is observability, not
 * a gate; a failed log should not break the user's write.
 *
 * Uses Node's native crypto.randomUUID() to avoid pulling in the `uuid`
 * ESM module at module-load time; everywhere this runs (Vercel edge,
 * Node runtime) has it built-in.
 */
export async function logAudit(opts: {
  userId: string;
  action: AuditAction;
  targetId?: string;
  metadata?: AuditMetadata;
}): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO audit_log (id, user_id, action, target_id, metadata)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        opts.userId,
        opts.action,
        opts.targetId ?? null,
        opts.metadata ? JSON.stringify(opts.metadata) : null,
      ],
    });
  } catch {
    // swallow — audit is a side observer
  }
}
