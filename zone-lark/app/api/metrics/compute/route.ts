import { isAdminGuardError, requireAdmin } from "@/lib/server/adminGuard";
import { computeAndStoreOrgMetrics } from "@/lib/server/metrics/snapshotWriter";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

export async function POST() {
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: "Metrics require Supabase — unavailable in local mode." },
      { status: 400 },
    );
  }

  const result = await computeAndStoreOrgMetrics(ctx.orgId);
  return Response.json({ ok: true, stored: result.stored });
}
