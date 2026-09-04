import "server-only";

import { computeAssetMetrics } from "@/lib/metrics";
import { rowToAssetRecord } from "@/lib/server/db/assetMapper";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Walks org -> portfolios -> buildings -> assessments -> assets, computes the draft metrics in
 * lib/metrics/, and writes one metric_snapshots row per metric (scope_type "org"). Each snapshot
 * carries the metric's definition_version, so a later formula change doesn't rewrite history.
 */
export async function computeAndStoreOrgMetrics(orgId: string): Promise<{ stored: number }> {
  const admin = createSupabaseAdminClient();

  const { data: portfolios } = await admin.from("portfolios").select("id").eq("org_id", orgId);
  const portfolioIds = (portfolios ?? []).map((p) => p.id);
  if (portfolioIds.length === 0) return { stored: 0 };

  const { data: buildings } = await admin
    .from("buildings")
    .select("id")
    .in("portfolio_id", portfolioIds);
  const buildingIds = (buildings ?? []).map((b) => b.id);
  if (buildingIds.length === 0) return { stored: 0 };

  const { data: assessments } = await admin
    .from("assessments")
    .select("id")
    .in("building_id", buildingIds);
  const assessmentIds = (assessments ?? []).map((a) => a.id);
  if (assessmentIds.length === 0) return { stored: 0 };

  const { data: assetRows } = await admin
    .from("assets")
    .select("*")
    .in("assessment_id", assessmentIds);
  const assets = (assetRows ?? []).map(rowToAssetRecord);

  const metrics = computeAssetMetrics(assets);
  let stored = 0;
  for (const m of metrics) {
    const { error } = await admin.from("metric_snapshots").insert({
      scope_type: "org",
      scope_id: orgId,
      metric_key: m.key,
      value: m.value,
      metadata: m.metadata ?? {},
      definition_version: m.definitionVersion,
    });
    if (!error) stored++;
  }

  return { stored };
}
