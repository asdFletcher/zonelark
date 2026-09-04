import { randomUUID } from "crypto";

import { isAssessmentContextError, requireAssessmentContext } from "@/lib/server/assessmentContext";
import { jobStore } from "@/lib/server/jobStore";
import { exportWorkbook } from "@/lib/server/spreadsheet";
import { AssetRecord, AssetRecordSchema } from "@/lib/schemas";

export const runtime = "nodejs";

interface ManualAssessBody {
  building_id: string;
  assets: unknown[];
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { building_id: buildingId, assets: rawAssets } = (body ?? {}) as Partial<ManualAssessBody>;

  if (!buildingId) {
    return Response.json({ error: "building_id is required." }, { status: 400 });
  }
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

  const assessmentCtx = await requireAssessmentContext({ buildingId });
  if (isAssessmentContextError(assessmentCtx)) {
    return Response.json({ error: assessmentCtx.error }, { status: assessmentCtx.status });
  }

  const jobId = randomUUID();
  await jobStore.set(jobId, await exportWorkbook(assets), assets, {
    assessmentId: assessmentCtx.assessmentId,
    userId: assessmentCtx.userId,
  });

  return Response.json({
    job_id: jobId,
    assets_processed: assets.length,
    download_url: `/api/export/${jobId}`,
  });
}
