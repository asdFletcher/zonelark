/**
 * One building.
 *
 * PATCH  → { building }  body: BuildingFormValues (see components/form/BuildingDetailsForm)
 *          mapped through buildingFormToPayload in lib/portfolioMapper.ts
 * DELETE → { ok: true }
 */
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { buildings } from "@/lib/db/schema";
import { buildingFormToPayload } from "@/lib/portfolioMapper";
import {
  getBuildingInOrg,
  isBuildingFormValues,
  toBuildingRow,
} from "@/lib/server/portfolioAccess";
import { requireUser } from "@/lib/server/session";

export async function PATCH(request: Request, ctx: { params: Promise<{ buildingId: string }> }) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const { buildingId } = await ctx.params;
  const existing = await getBuildingInOrg(buildingId, result.user.orgId);
  if (!existing) {
    return Response.json({ error: "Building not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isBuildingFormValues(body)) {
    return Response.json({ error: "Invalid building form values." }, { status: 400 });
  }

  const payload = buildingFormToPayload(body);
  const db = getDb();
  const [updated] = await db
    .update(buildings)
    .set({
      buildingName: payload.building_name,
      buildingType: payload.building_type,
      totalSqft: payload.total_sqft,
      aboveGradeFloors: payload.above_grade_floors,
      basementLevels: payload.basement_levels,
      hasRoofLevel: payload.has_roof_level,
      buildDate: payload.build_date,
      remodelDates: payload.remodel_dates,
    })
    .where(eq(buildings.id, existing.id))
    .returning();

  return Response.json({ building: toBuildingRow(updated) });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ buildingId: string }> }) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const { buildingId } = await ctx.params;
  const existing = await getBuildingInOrg(buildingId, result.user.orgId);
  if (!existing) {
    return Response.json({ error: "Building not found." }, { status: 404 });
  }

  const db = getDb();
  await db.delete(buildings).where(eq(buildings.id, existing.id));
  return Response.json({ ok: true });
}
