/**
 * Buildings in a portfolio.
 *
 * GET  → { buildings: BuildingRow[] }  query: ?portfolio_id= optional filter
 * POST → { building }  body: { portfolio_id }  creates an empty building
 *        (see EMPTY_BUILDING_FORM / buildingFormToPayload in lib/portfolioMapper.ts)
 */
import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { buildings, portfolios } from "@/lib/db/schema";
import {
  emptyBuildingValues,
  getPortfolioInOrg,
  toBuildingRow,
} from "@/lib/server/portfolioAccess";
import { requireUser } from "@/lib/server/session";

export async function GET(request: Request) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const portfolioId = new URL(request.url).searchParams.get("portfolio_id");
  const db = getDb();

  const rows = portfolioId
    ? await db
        .select({ building: buildings })
        .from(buildings)
        .innerJoin(portfolios, eq(buildings.portfolioId, portfolios.id))
        .where(and(eq(buildings.portfolioId, portfolioId), eq(portfolios.orgId, result.user.orgId)))
    : await db
        .select({ building: buildings })
        .from(buildings)
        .innerJoin(portfolios, eq(buildings.portfolioId, portfolios.id))
        .where(eq(portfolios.orgId, result.user.orgId));

  return Response.json({ buildings: rows.map((row) => toBuildingRow(row.building)) });
}

export async function POST(request: Request) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const portfolioId =
    typeof (body as { portfolio_id?: unknown }).portfolio_id === "string"
      ? (body as { portfolio_id: string }).portfolio_id
      : "";
  if (!portfolioId) {
    return Response.json({ error: "portfolio_id is required." }, { status: 400 });
  }

  const portfolio = await getPortfolioInOrg(portfolioId, result.user.orgId);
  if (!portfolio) {
    return Response.json({ error: "Portfolio not found." }, { status: 404 });
  }

  const empty = emptyBuildingValues();
  const db = getDb();
  const [created] = await db
    .insert(buildings)
    .values({
      portfolioId: portfolio.id,
      buildingName: empty.building_name,
      buildingType: empty.building_type,
      totalSqft: empty.total_sqft,
      aboveGradeFloors: empty.above_grade_floors,
      basementLevels: empty.basement_levels,
      hasRoofLevel: empty.has_roof_level,
      buildDate: empty.build_date,
      remodelDates: empty.remodel_dates,
    })
    .returning();

  return Response.json({ building: toBuildingRow(created) });
}
