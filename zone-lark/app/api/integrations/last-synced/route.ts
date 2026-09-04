import { isAdminGuardError, requireAdminOrRegional } from "@/lib/server/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

/**
 * Most recent integration_connections.last_synced_at for the caller's org — surfaced as a
 * top-of-page badge (admin/regional only, matching that table's RLS tier). Callers outside that
 * tier, or without Supabase configured, get { lastSyncedAt: null } rather than an error, since
 * "no badge" is the correct UI outcome either way.
 */
export async function GET() {
  const ctx = await requireAdminOrRegional();
  if (isAdminGuardError(ctx)) return Response.json({ lastSyncedAt: null });
  if (!isSupabaseConfigured()) return Response.json({ lastSyncedAt: null });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("integration_connections")
    .select("last_synced_at")
    .eq("org_id", ctx.orgId)
    .not("last_synced_at", "is", null)
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ lastSyncedAt: data?.last_synced_at ?? null });
}
