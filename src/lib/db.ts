import { createClient, type Client } from "@libsql/client";

// Turso (libsql) client with lazy init + idempotent migrations.
// Pattern adapted from thyroid-rehab/src/lib/db.ts.

let _db: Client | null = null;
let _migrationPromise: Promise<void> | null = null;

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

async function ensureMigrations() {
  if (!_migrationPromise) {
    _migrationPromise = initializeDatabase().catch((err: unknown) => {
      const e = err as { name?: string; message?: string; code?: string };
      console.error(
        "Migration error:",
        JSON.stringify({ name: e?.name, message: e?.message, code: e?.code })
      );
    });
  }
  await _migrationPromise;
}

// Lazy proxy: avoids creating the client at import time and runs migrations
// on the first write/query.
export const db = new Proxy({} as Client, {
  get(_, prop: keyof Client) {
    const client = getDb();
    const value = client[prop];
    if (typeof value === "function") {
      if (prop === "execute" || prop === "executeMultiple" || prop === "batch") {
        return async (...args: unknown[]) => {
          await ensureMigrations();
          return (value as (...a: unknown[]) => unknown).apply(client, args);
        };
      }
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Add `column` (with `type` declaration) to `table` if it doesn't already
 * exist. SQLite has no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so we
 * inspect PRAGMA table_info first. Idempotent.
 */
async function ensureColumn(
  client: Client,
  table: string,
  column: string,
  type: string
): Promise<void> {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const has = info.rows.some((r) => String(r.name) === column);
  if (!has) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export async function initializeDatabase() {
  const client = getDb();
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      role TEXT DEFAULT 'free',
      lens TEXT,                       -- 'medical' | 'educational' | 'biohacker'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS onboarding (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lens TEXT NOT NULL,              -- chosen audience lens
      quiz_yes_count INTEGER,          -- 0..8 from the IR self-assessment
      quiz_answers TEXT,               -- JSON boolean[]
      diet_tier TEXT,                  -- 'moderate' (<100g) | 'keto' (<50g)
      tg_hdl_ratio REAL,
      whr REAL,                        -- waist-to-hip ratio
      recommended_sequence TEXT,       -- JSON ordering of modules for this lens
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_onboarding_user
      ON onboarding(user_id);

    CREATE TABLE IF NOT EXISTS daily_plan (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,     -- 1..90
      plan_variant TEXT NOT NULL,
      date TEXT NOT NULL,
      tasks_completed TEXT DEFAULT '{}',  -- JSON map
      notes TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_daily_plan_user_day
      ON daily_plan(user_id, day_number);

    CREATE TABLE IF NOT EXISTS symptom_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      energy INTEGER CHECK(energy BETWEEN 1 AND 10),
      brain_fog INTEGER CHECK(brain_fog BETWEEN 1 AND 10),
      weight REAL,
      waist REAL,
      blood_sugar REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_symptom_log_user_date
      ON symptom_log(user_id, date DESC);

    CREATE TABLE IF NOT EXISTS blood_markers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      homa_ir REAL,
      fasting_insulin REAL,
      hba1c REAL,
      triglycerides REAL,
      hdl REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_blood_markers_user_date
      ON blood_markers(user_id, date DESC);

    CREATE TABLE IF NOT EXISTS food_bookmarks (
      user_id TEXT NOT NULL,
      food_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, food_id)
    );

    -- Append-only audit log for sensitive writes. Records the fact of
    -- a change + identifiers; never stores medical values. See
    -- src/lib/audit.ts for the writer + the AuditAction enum.
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      metadata TEXT,                   -- JSON (counts/dates only, no PHI)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_user
      ON audit_log(user_id, created_at DESC);

    -- Web push subscriptions. One user can have several subscriptions
    -- (laptop + phone + work browser); the endpoint URL is globally
    -- unique so we key on it. \`keys_p256dh\` / \`keys_auth\` are the
    -- subscription crypto keys returned by PushManager.subscribe.
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,       -- vendor push URL, unique
      user_id TEXT NOT NULL,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      user_agent TEXT,                 -- for the "remove on this device" UX
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_push_subs_user
      ON push_subscriptions(user_id);
  `);

  // Migration: encrypt blood markers at rest.
  // The plaintext columns (homa_ir, fasting_insulin, hba1c, triglycerides,
  // hdl) remain so legacy rows continue to read; on the next save they get
  // re-written as an encrypted JSON blob in `encrypted_data` and the
  // plaintext columns are nulled out.
  await ensureColumn(client, "blood_markers", "encrypted_data", "TEXT");
}
