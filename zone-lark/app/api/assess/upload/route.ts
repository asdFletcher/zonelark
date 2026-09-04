import { randomUUID } from "crypto";
import path from "path";

import { isAssessmentContextError, requireAssessmentContext } from "@/lib/server/assessmentContext";
import { enrichAsset } from "@/lib/server/enrichment";
import { jobStore } from "@/lib/server/jobStore";
import { ZonelarkVisionPipeline } from "@/lib/server/llmPipeline";
import { exportWorkbook } from "@/lib/server/spreadsheet";
import { AssetRecord, UploadContext } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

interface UploadedFile {
  data: Buffer;
  ext: string;
}

async function fileToUploaded(file: File): Promise<UploadedFile> {
  const data = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name || ".jpg") || ".jpg";
  return { data, ext };
}

export async function POST(request: Request) {
  const form = await request.formData();

  const fields: Record<string, string> = {};
  const photoFiles: UploadedFile[] = [];
  const blueprintFiles: UploadedFile[] = [];

  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      const uploaded = await fileToUploaded(value);
      if (key === "field_photos") {
        photoFiles.push(uploaded);
      } else if (key === "blueprint_images") {
        blueprintFiles.push(uploaded);
      }
    } else {
      fields[key] = value.toString();
    }
  }

  if (!fields.facility_name || !fields.facility_type || !fields.facility_sqft) {
    return Response.json(
      { error: "facility_name, facility_type, facility_sqft are required fields." },
      { status: 400 },
    );
  }

  if (!fields.building_id) {
    return Response.json({ error: "building_id is required." }, { status: 400 });
  }

  if (photoFiles.length === 0) {
    return Response.json({ error: "At least one field_photo is required." }, { status: 400 });
  }

  const assessmentCtx = await requireAssessmentContext({
    buildingId: fields.building_id,
    assessmentDate: fields.assessment_date,
    facilityLevel: fields.facility_level,
    floorId: fields.floor_id,
  });
  if (isAssessmentContextError(assessmentCtx)) {
    return Response.json({ error: assessmentCtx.error }, { status: assessmentCtx.status });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set." }, { status: 500 });
  }

  const pipeline = new ZonelarkVisionPipeline(apiKey);
  const ctx: UploadContext = {
    facilityName: fields.facility_name,
    facilityType: fields.facility_type,
    facilityLevel: fields.facility_level,
    floorId: fields.floor_id,
    facilitySqft: parseFloat(fields.facility_sqft),
    assessmentDate: fields.assessment_date,
    operationalImpact: fields.operational_impact ? parseInt(fields.operational_impact, 10) : 3,
    energyImpact: fields.energy_impact ? parseInt(fields.energy_impact, 10) : undefined,
    quantityMultiplier: fields.quantity_multiplier ? parseFloat(fields.quantity_multiplier) : 1,
    uom: fields.uom ?? "EA",
  };

  let assets: AssetRecord[];

  try {
    const parsed = await pipeline.parseAssetGroup(photoFiles, blueprintFiles);
    assets = [enrichAsset(parsed, ctx)];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `LLM parsing failed: ${message}` }, { status: 422 });
  }

  const jobId = randomUUID();
  await jobStore.set(jobId, await exportWorkbook(assets), assets, {
    assessmentId: assessmentCtx.assessmentId,
    userId: assessmentCtx.userId,
  });

  return Response.json({
    job_id: jobId,
    assets_processed: assets.length,
    assets,
    download_url: `/api/export/${jobId}`,
  });
}
