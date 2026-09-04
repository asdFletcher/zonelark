/**
 * Manual / CSV-import assess. JSON body: { assets: AssetRecord[] }.
 * Validates each row, writes a workbook into the job store, returns job_id.
 *
 * Once persistence exists, the client will also send building_id and this
 * route should create an `assessments` row under that building.
 */
import { randomUUID } from "crypto";

import { jobStore } from "@/lib/server/jobStore";
import { exportWorkbook } from "@/lib/server/spreadsheet";
import { AssetRecord, AssetRecordSchema } from "@/lib/schemas";

export const runtime = "nodejs";

interface ManualAssessBody {
  assets: unknown[];
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { assets: rawAssets } = (body ?? {}) as Partial<ManualAssessBody>;

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

  return Response.json({
    job_id: jobId,
    assets_processed: assets.length,
    download_url: `/api/export/${jobId}`,
  });
}
