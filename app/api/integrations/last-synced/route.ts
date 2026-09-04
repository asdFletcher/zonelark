/**
 * Most recent integration last_synced_at for the caller's org — the TopBar badge.
 *
 * GET → { lastSyncedAt: string | null }
 *
 * Returns null (not an error) when the caller should not see a badge.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ lastSyncedAt: null });
}
