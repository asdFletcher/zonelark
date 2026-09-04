import { runSync } from "@/lib/integrations/pipeline";
import { isAdminGuardError, requireAdmin } from "@/lib/server/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  const { connectionId } = await params;
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: "Integrations require Supabase — unavailable in local mode." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: connection } = await admin
    .from("integration_connections")
    .select("org_id")
    .eq("id", connectionId)
    .maybeSingle();
  if (!connection || connection.org_id !== ctx.orgId) {
    return Response.json({ error: "Connection not found." }, { status: 404 });
  }

  try {
    const result = await runSync(connectionId);
    return Response.json({ ok: true, synced: result.synced });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Sync failed." },
      { status: 500 },
    );
  }
}
