/**
 * Manual / CSV-import assess. JSON body: { assets: AssetRecord[], building_id? }.
 * Validates each row, writes a workbook into the job store, persists an
 * `assessments` row when building_id is set, and returns job_id.
 */
import { randomUUID } from "crypto";

import { jobStore } from "@/lib/server/jobStore";
import { persistAssessment } from "@/lib/server/persistAssessment";
import { exportWorkbook } from "@/lib/server/spreadsheet";
import { requireUser } from "@/lib/server/session";
import { AssetRecord, AssetRecordSchema } from "@/lib/schemas";

export const runtime = "nodejs";

interface ManualAssessBody {
  assets: unknown[];
  building_id?: string;
}

export async function POST(request: Request) {
  const authed = await requireUser();
  if ("error" in authed) return authed.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { assets: rawAssets, building_id: buildingId } = (body ?? {}) as Partial<ManualAssessBody>;

  if (!Array.isArray(rawAssets) || rawAssets.length === 0) {
    return Response.json(
      { error: "assets must be a non-empty array of AssetRecords." },
      { status: 400 },
    );
  }

  const assets: AssetRecord[] = [];
  for (let i = 0; i < rawAssets.length; i++) {
    const result = AssetRecordSchema.safeParse(rawAssets[i]);
    if (!result.success) {
      return Response.json(
        { error: `Asset[${i}] invalid: ${result.error.message}` },
        { status: 400 },
      );
    }
    assets.push(result.data);
  }

  const jobId = randomUUID();
  await jobStore.set(jobId, await exportWorkbook(assets), assets);
  await persistAssessment({
    orgId: authed.user.orgId,
    userId: authed.user.id,
    buildingId: buildingId ?? null,
    assets,
  });

  return Response.json({
    job_id: jobId,
    assets_processed: assets.length,
    download_url: `/api/export/${jobId}`,
  });
}
