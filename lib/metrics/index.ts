import { computeConditionIndex } from "@/lib/metrics/conditionIndex";
import { computePortfolioRisk } from "@/lib/metrics/portfolioRisk";
import { computeReplacementBacklog } from "@/lib/metrics/replacementBacklog";
import { MetricResult } from "@/lib/metrics/types";
import { AssetRecord } from "@/lib/schemas";

export * from "@/lib/metrics/types";
export * from "@/lib/metrics/conditionIndex";
export * from "@/lib/metrics/replacementBacklog";
export * from "@/lib/metrics/slaCompliance";
export * from "@/lib/metrics/portfolioRisk";

/**
 * Every metric here is DRAFT (see each module's header comment) — a starting point for the user
 * to validate against real portfolio data, not asserted ground truth. Work-order-dependent
 * metrics (SLA compliance) aren't included here since they need Phase 3 integration data, not
 * just assets — compute those separately once a connection has synced.
 */
export function computeAssetMetrics(assets: AssetRecord[]): MetricResult[] {
  return [
    computeConditionIndex(assets),
    computeReplacementBacklog(assets),
    computePortfolioRisk(assets),
  ];
}
