/**
 * Recompute draft org-level metrics and store a new snapshot batch.
 *
 * POST → { ok: true, stored: number }
 *
 * Walks org → portfolios → buildings → assessments → assets, runs
 * computeAssetMetrics() from lib/metrics/, writes one snapshot per metric
 * with that formula's definition_version so later formula changes do not
 * rewrite history.
 *
 * Auth and persistence are not wired. Do not reintroduce Supabase.
 */
export async function POST() {
  return Response.json({ error: "Not implemented." }, { status: 501 });
}
