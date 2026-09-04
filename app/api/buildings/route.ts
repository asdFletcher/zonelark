/**
 * Buildings in a portfolio.
 *
 * GET  → { buildings: BuildingRow[] }  query: ?portfolio_id= optional filter
 * POST → { building }  body: { portfolio_id }  creates an empty building
 *        (see EMPTY_BUILDING_FORM / buildingFormToPayload in lib/portfolioMapper.ts)
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ buildings: [] });
}

export async function POST(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
