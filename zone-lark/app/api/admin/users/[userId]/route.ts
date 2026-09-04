import { isAdminGuardError, requireAdmin } from "@/lib/server/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";
import * as localProfiles from "@/lib/server/db/local/profileRepo";
import { LOCAL_USER_EMAIL, LOCAL_USER_ID } from "@/lib/server/db/local/connection";

const VALID_ROLES: UserRole[] = ["admin", "regional", "ownership", "individual"];

async function assertSameOrg(userId: string, orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();
  return target?.org_id === orgId;
}

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });

  if (!isSupabaseConfigured()) {
    if (userId !== LOCAL_USER_ID) {
      return Response.json({ error: "User not found in your organization." }, { status: 404 });
    }
    const p = localProfiles.get();
    return Response.json({
      id: p.id,
      email: LOCAL_USER_EMAIL,
      displayName: p.display_name,
      role: p.role,
      isSiteAdmin: p.is_site_admin,
      createdAt: p.created_at,
    });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!profile || profile.org_id !== ctx.orgId) {
    return Response.json({ error: "User not found in your organization." }, { status: 404 });
  }

  const { data } = await admin.auth.admin.getUserById(userId);
  return Response.json({
    id: profile.id,
    email: data.user?.email ?? null,
    displayName: profile.display_name,
    role: profile.role,
    isSiteAdmin: profile.is_site_admin,
    createdAt: profile.created_at,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });

  const body = await request.json().catch(() => ({}));

  if (!isSupabaseConfigured()) {
    if (userId !== LOCAL_USER_ID) {
      return Response.json({ error: "User not found in your organization." }, { status: 404 });
    }
    if (typeof body.role === "string" && body.role !== "admin") {
      return Response.json(
        { error: "Local mode has a single implicit admin user; role can't be changed." },
        { status: 400 },
      );
    }
    const displayName = typeof body.displayName === "string" ? body.displayName : undefined;
    localProfiles.update({ displayName });
    return Response.json({ ok: true });
  }

  if (!(await assertSameOrg(userId, ctx.orgId))) {
    return Response.json({ error: "User not found in your organization." }, { status: 404 });
  }

  const updates: { role?: UserRole; display_name?: string } = {};
  if (typeof body.role === "string") {
    if (!VALID_ROLES.includes(body.role as UserRole)) {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }
    updates.role = body.role as UserRole;
  }
  if (typeof body.displayName === "string") updates.display_name = body.displayName;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").update(updates).eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });

  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Can't delete the local user in local mode." }, { status: 400 });
  }

  if (!(await assertSameOrg(userId, ctx.orgId))) {
    return Response.json({ error: "User not found in your organization." }, { status: 404 });
  }
  if (userId === ctx.userId) {
    return Response.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
