/**
 * Admin user directory for the caller's organization.
 *
 * GET  → { users: [{ id, email, displayName, role, isSiteAdmin, createdAt }] }
 * POST → { userId }  body: { email, role?, displayName? }
 *
 * Invite creates an account, then assigns org + role. Roles:
 * `admin` | `regional` | `ownership` | `individual` (default individual).
 * Email is required. A user must stay inside the inviting admin's organization.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ users: [] });
}

export async function POST(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
