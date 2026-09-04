/**
 * One portfolio.
 *
 * PATCH → { portfolio }  body: { name }  (name is required)
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function PATCH(_request: Request, _ctx: { params: Promise<{ portfolioId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
