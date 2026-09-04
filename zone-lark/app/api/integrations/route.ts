import { isAdminGuardError, requireAdmin } from "@/lib/server/adminGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

const LOCAL_MODE_MESSAGE = "Integrations require Supabase — unavailable in local mode.";

export async function GET() {
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });
  if (!isSupabaseConfigured()) return Response.json({ error: LOCAL_MODE_MESSAGE }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("integration_connections")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ connections: data });
}

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (isAdminGuardError(ctx)) return Response.json({ error: ctx.error }, { status: ctx.status });
  if (!isSupabaseConfigured()) return Response.json({ error: LOCAL_MODE_MESSAGE }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const providerKind = body.provider_kind === "crm" ? "crm" : "cmms";
  const adapterKey = typeof body.adapter_key === "string" ? body.adapter_key : "mock";

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("integration_connections")
    .insert({ org_id: ctx.orgId, provider_kind: providerKind, adapter_key: adapterKey })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ connection: data });
}
