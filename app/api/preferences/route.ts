/**
 * Per-user autosaved UI preferences (theme, last tab, selected building, KPI order).
 * Schema-light JSON — validated at the API boundary, not in the database.
 *
 * GET   → { preferences, updatedAt }
 * PATCH → { preferences, updatedAt }  body: { preferences }
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ preferences: {}, updatedAt: null });
}

export async function PATCH(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
