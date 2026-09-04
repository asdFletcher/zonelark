import "server-only";

import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

/**
 * Zero-config fallback store used whenever Supabase isn't configured (see
 * lib/server/supabaseConfigured.ts) — a single sqlite file on disk, no signup, no Docker, no
 * native dependency (node:sqlite ships with Node itself). Mirrors supabase/migrations/
 * 20260721000001_core_schema.sql's table shapes so the existing camelCase<->snake_case mappers
 * (lib/portfolioMapper.ts, lib/server/db/assetMapper.ts) work against these rows unmodified.
 * Single implicit tenant/user — there's no auth locally, so RLS/org-scoping is simply omitted.
 */

export const LOCAL_ORG_ID = "local-org";
export const LOCAL_USER_ID = "local-user";
export const LOCAL_PORTFOLIO_ID = "local-portfolio";
export const LOCAL_USER_EMAIL = "local@zonelark.local";

export const DATA_DIR = path.join(process.cwd(), ".data");

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    org_id TEXT REFERENCES organizations (id),
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'regional', 'ownership', 'individual')),
    is_site_admin INTEGER NOT NULL DEFAULT 0,
    display_name TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations (id),
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolios (id),
    building_name TEXT NOT NULL DEFAULT '',
    building_type TEXT NOT NULL DEFAULT '',
    total_sqft REAL NOT NULL DEFAULT 0,
    above_grade_floors INTEGER NOT NULL DEFAULT 1,
    basement_levels INTEGER NOT NULL DEFAULT 0,
    has_roof_level INTEGER NOT NULL DEFAULT 1,
    build_date TEXT,
    remodel_dates TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL REFERENCES buildings (id),
    assessment_date TEXT,
    facility_level TEXT,
    floor_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES assessments (id),
    floor_id TEXT NOT NULL DEFAULT '01',
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    facility_level TEXT NOT NULL DEFAULT '1st Floor',
    room_number TEXT NOT NULL DEFAULT '',
    room_name TEXT NOT NULL DEFAULT '',
    area_served TEXT NOT NULL DEFAULT '',
    cmms_id TEXT NOT NULL DEFAULT '',
    asset_name TEXT NOT NULL,
    manufacturer TEXT NOT NULL DEFAULT 'Unknown',
    model_number TEXT NOT NULL DEFAULT 'N/A',
    serial_number TEXT NOT NULL DEFAULT 'N/A',
    install_year INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    fca_score INTEGER NOT NULL DEFAULT 3,
    asset_type TEXT NOT NULL,
    uniformat_level2 TEXT,
    asset_size TEXT NOT NULL DEFAULT 'N/A',
    quantity_multiplier REAL NOT NULL DEFAULT 1,
    uom TEXT NOT NULL DEFAULT 'EA',
    repair_or_replace TEXT NOT NULL DEFAULT 'Maintain',
    observed_life_remaining INTEGER NOT NULL,
    observed_replacement_year INTEGER,
    unit_probable_cost REAL,
    facility_sqft REAL NOT NULL,
    assessment_date TEXT NOT NULL,
    operational_impact INTEGER NOT NULL DEFAULT 3,
    energy_impact INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS assets_assessment_id_idx ON assets (assessment_id);

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    assessment_id TEXT REFERENCES assessments (id),
    status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'complete', 'failed')),
    export_storage_path TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );
`;

function seed(db: DatabaseSync, now: string) {
  db.prepare("INSERT OR IGNORE INTO organizations (id, name, created_at) VALUES (?, ?, ?)").run(
    LOCAL_ORG_ID,
    "Local Organization",
    now,
  );
  db.prepare(
    "INSERT OR IGNORE INTO profiles (id, org_id, role, is_site_admin, display_name, created_at) VALUES (?, ?, 'admin', 1, ?, ?)",
  ).run(LOCAL_USER_ID, LOCAL_ORG_ID, "Local User", now);
  db.prepare(
    "INSERT OR IGNORE INTO portfolios (id, org_id, name, created_at) VALUES (?, ?, ?, ?)",
  ).run(LOCAL_PORTFOLIO_ID, LOCAL_ORG_ID, "Local Portfolio", now);
}

declare global {
  var __zonelarkLocalDb: DatabaseSync | undefined;
}

/**
 * Cached on `globalThis` rather than a plain module-level variable — webpack dev-mode HMR
 * re-executes route modules on file changes, and a module-level singleton would open a second
 * file handle onto the same sqlite file on every edit (risking SQLITE_BUSY, especially on
 * Windows's stricter file locking).
 */
export function getLocalDb(): DatabaseSync {
  if (!globalThis.__zonelarkLocalDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new DatabaseSync(path.join(DATA_DIR, "local.db"));
    db.exec(SCHEMA_SQL);
    seed(db, new Date().toISOString());
    globalThis.__zonelarkLocalDb = db;
  }
  return globalThis.__zonelarkLocalDb;
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
