import { isAdminGuardError, requireAdmin } from "@/lib/server/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";
import * as localProfiles from "@/lib/server/db/local/profileRepo";
import { LOCAL_USER_EMAIL } from "@/lib/server/db/local/connection";

const VALID_ROLES: UserRole[] = ["admin", "regional", "ownership", "individual"];

export async function GET() {
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });

  if (!isSupabaseConfigured()) {
    const p = localProfiles.get();
    return Response.json({
      users: [
        {
          id: p.id,
          email: LOCAL_USER_EMAIL,
          displayName: p.display_name,
          role: p.role,
          isSiteAdmin: p.is_site_admin,
          createdAt: p.created_at,
        },
      ],
    });
  }

  const admin = createSupabaseAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const users = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.id);
      return {
        id: p.id,
        email: data.user?.email ?? null,
        displayName: p.display_name,
        role: p.role,
        isSiteAdmin: p.is_site_admin,
        createdAt: p.created_at,
      };
    }),
  );

  return Response.json({ users });
}

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });

  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: "User invites require Supabase — local mode supports a single local user." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = (typeof body.role === "string" ? body.role : "individual") as UserRole;
  const displayName = typeof body.displayName === "string" ? body.displayName : undefined;

  if (!email) return Response.json({ error: "email is required." }, { status: 400 });
  if (!VALID_ROLES.includes(role))
    return Response.json({ error: "Invalid role." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
  });
  if (inviteError || !invited.user) {
    return Response.json(
      { error: inviteError?.message ?? "Failed to invite user." },
      { status: 500 },
    );
  }

  // The handle_new_user trigger (supabase/migrations/...core_schema.sql) already inserted a
  // default profile row for this auth user — assign it into this admin's org/role now.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ org_id: ctx.orgId, role, display_name: displayName })
    .eq("id", invited.user.id);
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  return Response.json({ userId: invited.user.id });
}
