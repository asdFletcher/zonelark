/**
 * Portfolios owned by the caller's organization.
 *
 * GET  → { portfolios: { id, name, created_at }[] }
 * POST → { portfolio }  body: { name? }
 *
 * Creating the first portfolio also creates the user's organization if they
 * do not have one yet, and makes them its admin.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ portfolios: [] });
}

export async function POST(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
