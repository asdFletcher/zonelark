/**
 * CMMS/CRM connections for the caller's organization.
 *
 * GET  → { connections }  each: { id, provider_kind, adapter_key, status, last_synced_at }
 * POST → { connection }  body: { provider_kind: "cmms" | "crm", adapter_key? }
 *        adapter_key defaults to "mock" (lib/integrations/pipeline.ts).
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ connections: [] });
}

export async function POST(_request: Request) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
