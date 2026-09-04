/**
 * One user in the caller's organization.
 *
 * GET    → { id, email, displayName, role, isSiteAdmin, createdAt }  (404 if missing or a different org)
 * PATCH  → { ok: true }  body: { role?, displayName? }
 * DELETE → { ok: true }  deactivates the account
 *
 * Domain rules: same-org only; role must be one of
 * `admin` | `regional` | `ownership` | `individual`; an admin cannot
 * deactivate themselves.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET(_request: Request, _ctx: { params: Promise<{ userId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}

export async function PATCH(_request: Request, _ctx: { params: Promise<{ userId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}

export async function DELETE(_request: Request, _ctx: { params: Promise<{ userId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
