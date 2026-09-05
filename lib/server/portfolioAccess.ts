import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { buildings, portfolios } from "@/lib/db/schema";
import type { BuildingFormValues } from "@/components/form/BuildingDetailsForm";
import { BuildingRowLike, EMPTY_BUILDING_FORM, buildingFormToPayload } from "@/lib/portfolioMapper";

export function toBuildingRow(
  row: typeof buildings.$inferSelect,
): BuildingRowLike & { portfolio_id: string; created_at: string } {
  return {
    id: row.id,
    portfolio_id: row.portfolioId,
    building_name: row.buildingName,
    building_type: row.buildingType,
    total_sqft: row.totalSqft,
    above_grade_floors: row.aboveGradeFloors,
    basement_levels: row.basementLevels,
    has_roof_level: row.hasRoofLevel,
    build_date: row.buildDate,
    remodel_dates: row.remodelDates ?? [],
    created_at: row.createdAt.toISOString(),
  };
}

export async function getPortfolioInOrg(portfolioId: string, orgId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.orgId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function getBuildingInOrg(buildingId: string, orgId: string) {
  const db = getDb();
  const [row] = await db
    .select({ building: buildings })
    .from(buildings)
    .innerJoin(portfolios, eq(buildings.portfolioId, portfolios.id))
    .where(and(eq(buildings.id, buildingId), eq(portfolios.orgId, orgId)))
    .limit(1);
  return row?.building ?? null;
}

export function emptyBuildingValues() {
  return buildingFormToPayload(EMPTY_BUILDING_FORM);
}

export function isBuildingFormValues(value: unknown): value is BuildingFormValues {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.buildingName === "string" && typeof v.buildingType === "string";
}
