import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/server/requireUser";
import { LOCAL_ORG_ID, LOCAL_USER_ID } from "@/lib/server/db/local/connection";
import { UserRole } from "@/lib/supabase/database.types";

export interface AdminContext {
  userId: string;
  orgId: string;
}

export interface AdminGuardError {
  error: string;
  status: number;
}

/**
 * Successor to the removed lib/server/adminGuard.ts's requireSiteAdmin() — same guard-per-route
 * pattern, rebuilt against Supabase profiles instead of NextAuth/isSiteAdmin. Every app/api/admin/**
 * route calls this first. In local mode (no Supabase configured) the single seeded local profile
 * is always admin, so this short-circuits straight to it instead of querying Supabase.
 */
export async function requireAdmin(): Promise<AdminContext | AdminGuardError> {
  const { user, configured } = await requireUser();
  if (!user) return { error: "Not authenticated.", status: 401 };
  if (!configured) return { userId: LOCAL_USER_ID, orgId: LOCAL_ORG_ID };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role as UserRole) !== "admin" || !profile.org_id) {
    return { error: "Admin access required.", status: 403 };
  }

  return { userId: user.id, orgId: profile.org_id };
}

export function isAdminGuardError(ctx: AdminContext | AdminGuardError): ctx is AdminGuardError {
  return "error" in ctx;
}

/**
 * Same shape as requireAdmin(), but also admits the "regional" role — for read-only routes that
 * mirror the integration_connections RLS tier (admin + regional can read, ownership/individual
 * cannot; see supabase/migrations/20260721000003_rls_policies.sql).
 */
export async function requireAdminOrRegional(): Promise<AdminContext | AdminGuardError> {
  const { user, configured } = await requireUser();
  if (!user) return { error: "Not authenticated.", status: 401 };
  if (!configured) return { userId: LOCAL_USER_ID, orgId: LOCAL_ORG_ID };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  if (!profile?.org_id || (role !== "admin" && role !== "regional")) {
    return { error: "Admin or regional access required.", status: 403 };
  }

  return { userId: user.id, orgId: profile.org_id };
}
