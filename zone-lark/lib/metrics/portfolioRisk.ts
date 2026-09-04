/**
 * DRAFT — the most opinionated metric here, most explicitly a hypothesis rather than a validated
 * model. Blends Condition Index (inverted — higher FCA is better) and replacement backlog $
 * (normalized against an assumed "large portfolio" ceiling) into a single 0-100 risk score. The
 * weights and normalization constant below are starting guesses for the user (a facilities-ops
 * domain expert) to correct against real portfolio data, not asserted ground truth.
 */
import { computeConditionIndex } from "@/lib/metrics/conditionIndex";
import { computeReplacementBacklog } from "@/lib/metrics/replacementBacklog";
import { MetricResult } from "@/lib/metrics/types";
import { AssetRecord } from "@/lib/schemas";

export const PORTFOLIO_RISK_VERSION = "v1-draft";

const WEIGHTS = { condition: 0.5, backlog: 0.5 };
// "A replacement backlog this large or larger contributes the maximum backlog-risk weight."
const BACKLOG_NORMALIZATION_USD = 500_000;

export function computePortfolioRisk(assets: AssetRecord[]): MetricResult {
  if (assets.length === 0) {
    return {
      key: "portfolio_risk",
      value: 0,
      definitionVersion: PORTFOLIO_RISK_VERSION,
      metadata: { assetCount: 0 },
    };
  }

  const condition = computeConditionIndex(assets);
  const backlog = computeReplacementBacklog(assets);

  const conditionRisk = (5 - condition.value) / 4; // 0 (fca=5, best) .. 1 (fca=1, worst)
  const backlogRisk = Math.min(1, backlog.value / BACKLOG_NORMALIZATION_USD);
  const score = Math.round(
    (WEIGHTS.condition * conditionRisk + WEIGHTS.backlog * backlogRisk) * 100,
  );

  return {
    key: "portfolio_risk",
    value: score,
    definitionVersion: PORTFOLIO_RISK_VERSION,
    metadata: { conditionIndex: condition.value, replacementBacklog: backlog.value },
  };
}
