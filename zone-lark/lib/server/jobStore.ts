import "server-only";

import fs from "fs";
import path from "path";

import { AssetRecord } from "@/lib/schemas";
import { assetRecordToRow, rowToAssetRecord } from "@/lib/server/db/assetMapper";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DATA_DIR, getLocalDb, newId, nowIso } from "@/lib/server/db/local/connection";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

const EXPORT_BUCKET = "exports";
const LOCAL_EXPORTS_DIR = path.join(DATA_DIR, "exports");

export interface JobContext {
  /** Every job's assets are persisted under an assessment (organizations -> ... -> assessments). */
  assessmentId: string;
  userId?: string | null;
}

export interface JobStore {
  set(jobId: string, buffer: Buffer, assets: AssetRecord[], ctx: JobContext): Promise<void>;
  getBuffer(jobId: string): Promise<Buffer | undefined>;
  getAssets(jobId: string): Promise<AssetRecord[] | undefined>;
}

/**
 * Supabase-backed replacement for the old in-memory `Map` store: assets persist to the `assets`
 * table, the rendered workbook persists to the `exports` Storage bucket, and `jobs` links the two
 * together. Uses the service-role admin client because jobs/exports are written on behalf of the
 * request's authenticated user but read back across the assess -> job -> export route sequence.
 */
class SupabaseJobStore implements JobStore {
  async set(jobId: string, buffer: Buffer, assets: AssetRecord[], ctx: JobContext): Promise<void> {
    const supabase = createSupabaseAdminClient();

    if (assets.length > 0) {
      const rows = assets.map((asset) => assetRecordToRow(asset, ctx.assessmentId));
      const { error } = await supabase.from("assets").insert(rows);
      if (error) throw new Error(`Failed to persist assets: ${error.message}`);
    }

    const storagePath = `${ctx.assessmentId}/${jobId}.xlsx`;
    const { error: uploadError } = await supabase.storage
      .from(EXPORT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });
    if (uploadError) throw new Error(`Failed to store export: ${uploadError.message}`);

    const { error: jobError } = await supabase.from("jobs").upsert({
      id: jobId,
      assessment_id: ctx.assessmentId,
      status: "complete",
      export_storage_path: storagePath,
      created_by: ctx.userId ?? null,
    });
    if (jobError) throw new Error(`Failed to record job: ${jobError.message}`);
  }

  async getBuffer(jobId: string): Promise<Buffer | undefined> {
    const supabase = createSupabaseAdminClient();
    const { data: job } = await supabase
      .from("jobs")
      .select("export_storage_path")
      .eq("id", jobId)
      .maybeSingle();
    if (!job?.export_storage_path) return undefined;

    const { data, error } = await supabase.storage
      .from(EXPORT_BUCKET)
      .download(job.export_storage_path);
    if (error || !data) return undefined;
    return Buffer.from(await data.arrayBuffer());
  }

  async getAssets(jobId: string): Promise<AssetRecord[] | undefined> {
    const supabase = createSupabaseAdminClient();
    const { data: job } = await supabase
      .from("jobs")
      .select("assessment_id")
      .eq("id", jobId)
      .maybeSingle();
    if (!job?.assessment_id) return undefined;

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("assessment_id", job.assessment_id);
    if (error || !data) return undefined;
    return data.map(rowToAssetRecord);
  }
}

/**
 * Local sqlite fallback (see lib/server/db/local/connection.ts) — same three-table shape as
 * Supabase (assets/jobs), minus Storage: the rendered workbook is written straight to a local
 * `.data/exports/` directory instead of a Storage bucket.
 */
class SqliteJobStore implements JobStore {
  async set(jobId: string, buffer: Buffer, assets: AssetRecord[], ctx: JobContext): Promise<void> {
    const db = getLocalDb();

    if (assets.length > 0) {
      db.exec("BEGIN");
      try {
        for (const asset of assets) {
          const row = assetRecordToRow(asset, ctx.assessmentId) as unknown as Record<
            string,
            string | number | null
          >;
          const columns = ["id", "created_at", "updated_at", ...Object.keys(row)];
          const now = nowIso();
          const values = [newId(), now, now, ...Object.values(row)];
          db.prepare(
            `INSERT INTO assets (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
          ).run(...values);
        }
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    }

    const fileName = `${jobId}.xlsx`;
    fs.mkdirSync(LOCAL_EXPORTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_EXPORTS_DIR, fileName), buffer);

    db.prepare(
      `INSERT INTO jobs (id, assessment_id, status, export_storage_path, created_by, created_at)
       VALUES (?, ?, 'complete', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         assessment_id = excluded.assessment_id,
         export_storage_path = excluded.export_storage_path,
         created_by = excluded.created_by`,
    ).run(jobId, ctx.assessmentId, fileName, ctx.userId ?? null, nowIso());
  }

  async getBuffer(jobId: string): Promise<Buffer | undefined> {
    const job = getLocalDb()
      .prepare("SELECT export_storage_path FROM jobs WHERE id = ?")
      .get(jobId) as unknown as { export_storage_path: string | null } | undefined;
    if (!job?.export_storage_path) return undefined;

    const filePath = path.join(LOCAL_EXPORTS_DIR, job.export_storage_path);
    if (!fs.existsSync(filePath)) return undefined;
    return fs.readFileSync(filePath);
  }

  async getAssets(jobId: string): Promise<AssetRecord[] | undefined> {
    const db = getLocalDb();
    const job = db.prepare("SELECT assessment_id FROM jobs WHERE id = ?").get(jobId) as unknown as
      { assessment_id: string | null } | undefined;
    if (!job?.assessment_id) return undefined;

    const rows = db
      .prepare("SELECT * FROM assets WHERE assessment_id = ?")
      .all(job.assessment_id) as unknown as Parameters<typeof rowToAssetRecord>[0][];
    return rows.map(rowToAssetRecord);
  }
}

export const jobStore: JobStore = isSupabaseConfigured()
  ? new SupabaseJobStore()
  : new SqliteJobStore();
