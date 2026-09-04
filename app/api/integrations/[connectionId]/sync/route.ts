/**
 * Run one integration connection's adapter and persist normalized records.
 *
 * POST → { ok: true, synced: number }
 *
 * Resolves the connection (must belong to the caller's org), loads the
 * CmmsAdapter or CrmAdapter by adapter_key, authenticates, syncs work orders
 * or service requests, and bumps last_synced_at.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function POST(_request: Request, _ctx: { params: Promise<{ connectionId: string }> }) {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
