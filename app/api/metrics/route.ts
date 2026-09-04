/**
 * Stored operational metric snapshots for the caller's org.
 *
 * GET → { snapshots }  newest first, limited to 50.
 * Each snapshot: scope_type, scope_id, metric_key, value, metadata,
 * definition_version, computed_at. Formulas live in lib/metrics/.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function GET() {
  return Response.json({ snapshots: [] });
}
