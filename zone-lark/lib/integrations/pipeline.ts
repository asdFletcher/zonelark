import "server-only";

import { MockCmmsAdapter, MockCrmAdapter } from "@/lib/integrations/adapters/mock";
import { CmmsAdapter, CrmAdapter } from "@/lib/integrations/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const CMMS_ADAPTERS: Record<string, CmmsAdapter> = { mock: new MockCmmsAdapter() };
const CRM_ADAPTERS: Record<string, CrmAdapter> = { mock: new MockCrmAdapter() };

/**
 * load connection -> resolve adapter by adapter_key -> authenticate() -> syncX() -> normalize
 * (already Zod-shaped by the adapter) -> upsert into cmms_work_orders/crm_service_requests ->
 * bump last_synced_at. Only the "mock" adapter is registered today (Phase 3 scope); adding a real
 * vendor later means implementing CmmsAdapter/CrmAdapter and registering it here, not touching
 * this pipeline.
 */
export async function runSync(connectionId: string): Promise<{ synced: number }> {
  const admin = createSupabaseAdminClient();
  const { data: connection, error } = await admin
    .from("integration_connections")
    .select("*")
    .eq("id", connectionId)
    .single();
  if (error || !connection) throw new Error("Connection not found.");

  const ctx = { connectionId, orgId: connection.org_id, config: connection.config };
  let synced = 0;

  if (connection.provider_kind === "cmms") {
    const adapter = CMMS_ADAPTERS[connection.adapter_key];
    if (!adapter) throw new Error(`Unknown CMMS adapter: ${connection.adapter_key}`);

    const authResult = await adapter.authenticate(connection.config);
    if (!authResult.ok) throw new Error(authResult.message ?? "Authentication failed.");

    const workOrders = await adapter.syncWorkOrders(ctx);
    for (const wo of workOrders) {
      const { error: upsertError } = await admin.from("cmms_work_orders").upsert(
        {
          connection_id: connectionId,
          external_id: wo.external_id,
          priority: wo.priority,
          status: wo.status,
          opened_at: wo.opened_at,
          responded_at: wo.responded_at ?? null,
          closed_at: wo.closed_at ?? null,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,external_id" },
      );
      if (!upsertError) synced++;
    }
  } else {
    const adapter = CRM_ADAPTERS[connection.adapter_key];
    if (!adapter) throw new Error(`Unknown CRM adapter: ${connection.adapter_key}`);

    const authResult = await adapter.authenticate(connection.config);
    if (!authResult.ok) throw new Error(authResult.message ?? "Authentication failed.");

    const requests = await adapter.syncServiceRequests(ctx);
    for (const sr of requests) {
      const { error: upsertError } = await admin.from("crm_service_requests").upsert(
        {
          connection_id: connectionId,
          external_id: sr.external_id,
          status: sr.status,
          opened_at: sr.opened_at,
          closed_at: sr.closed_at ?? null,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,external_id" },
      );
      if (!upsertError) synced++;
    }
  }

  await admin
    .from("integration_connections")
    .update({ status: "connected", last_synced_at: new Date().toISOString() })
    .eq("id", connectionId);

  return { synced };
}
