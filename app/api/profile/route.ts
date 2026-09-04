/**
 * Signed-in user's profile.
 *
 * GET   → { profile, email }  profile includes role, display_name, org
 * PATCH → { profile }  body: { displayName? }
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ profile: null, email: null });
}

export async function PATCH(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
