/**
 * One building.
 *
 * PATCH  → { building }  body: BuildingFormValues (see components/form/BuildingDetailsForm)
 *          mapped through buildingFormToPayload in lib/portfolioMapper.ts
 * DELETE → { ok: true }
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function PATCH(_request: Request, _ctx: { params: Promise<{ buildingId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}

export async function DELETE(_request: Request, _ctx: { params: Promise<{ buildingId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
