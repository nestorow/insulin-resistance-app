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

    -- ── Gamification (Phase 2.7) ─────────────────────────────────────
    -- One row per user; single source of truth for the streak number
    -- shown in the UI. Engine updates on every check-in.
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,    -- consecutive days with activity
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,               -- YYYY-MM-DD; null = never
      total_xp INTEGER DEFAULT 0,          -- denormalized sum of xp_log for fast reads
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Append-only XP event log. Audit-style; recomputable into total_xp
    -- on demand. Each kind has a fixed point value defined in
    -- src/lib/gamification.ts so the table is value-stable.
    CREATE TABLE IF NOT EXISTS xp_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_kind TEXT NOT NULL,            -- 'plan.check' | 'symptom.save' | ...
      points INTEGER NOT NULL,
      date TEXT NOT NULL,                  -- YYYY-MM-DD the event credits
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_xp_log_user_date
      ON xp_log(user_id, date DESC);

    -- One row per (user, badge) — earning is idempotent via UNIQUE.
    CREATE TABLE IF NOT EXISTS user_badges (
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,              -- matches BADGES[].id
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, badge_id)
    );
  `);

  // Migration: weekly email digest opt-in.
  // Stored as a column on users so a single SELECT joins email + opt-in
  // for the cron job, instead of a separate table that'd require joins.
  await ensureColumn(client, "users", "email_digest_opt_in", "INTEGER DEFAULT 0");

  // Migration (Phase 8 BYOK): each user supplies their own Anthropic API
  // key for the food AI assistant. Stored as the same AES-256-GCM blob
  // format as blood markers (iv:ct:tag hex). Null = user hasn't
  // configured AI — assistant shows a CTA to /settings.
  await ensureColumn(
    client,
    "users",
    "anthropic_api_key_encrypted",
    "TEXT"
  );

  // Food AI assistant cache. Keyed on a normalized hash of the query so
  // semantically-identical questions ("банан keto?" vs "Банан keto") hit
  // the same row. Caching is essential: Anthropic calls cost money + are
  // slow, and food advice doesn't change.
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS food_search_cache (
      query_hash TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      tier TEXT NOT NULL,                  -- 'none' | 'moderate' | 'keto'
      response TEXT NOT NULL,
      model TEXT NOT NULL,
      hits INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_hit_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: encrypt blood markers at rest.
  // The plaintext columns (homa_ir, fasting_insulin, hba1c, triglycerides,
  // hdl) remain so legacy rows continue to read; on the next save they get
  // re-written as an encrypted JSON blob in `encrypted_data` and the
  // plaintext columns are nulled out.
  await ensureColumn(client, "blood_markers", "encrypted_data", "TEXT");

  // Migration (Phase 8): CGM readings — for the biohacker lens.
  // One row per (user, day). The day's readings are stored as an
  // AES-256-GCM blob (same scheme as blood markers) since glucose patterns
  // are GDPR special-category data. `count` lets us run quick coverage
  // queries (which days have data) without decrypting the payload.
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS cgm_readings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,                 -- YYYY-MM-DD (UTC day key)
      encrypted_payload TEXT NOT NULL,    -- AES-256-GCM of [{ts, mgdl, source}]
      count INTEGER NOT NULL,             -- # readings in the day
      source TEXT,                        -- 'libre'|'dexcom'|'manual'|'mixed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_cgm_readings_user_date
      ON cgm_readings(user_id, date DESC);

    -- One row per user holding the entire { peakTs → label } map as
    -- an encrypted JSON blob. Read pattern is "load all annotations
    -- to overlay on the spike list", so a single-row blob beats a
    -- normalized (user_id, peak_ts) table on simplicity. Note text is
    -- user-typed (could name foods → arguably more sensitive than the
    -- reading itself), hence encryption.
    CREATE TABLE IF NOT EXISTS cgm_annotations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      encrypted_payload TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
