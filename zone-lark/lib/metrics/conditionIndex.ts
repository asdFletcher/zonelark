/**
 * DRAFT — starting hypothesis, not validated ground truth. Simple average FCA score (1-5, higher
 * = better condition) across a set of assets. Open question for the domain expert reviewing this:
 * should larger or costlier assets weigh more heavily than a straight average?
 */
import { AssetRecord } from "@/lib/schemas";
import { MetricResult } from "@/lib/metrics/types";

export const CONDITION_INDEX_VERSION = "v1-draft";

export function computeConditionIndex(assets: AssetRecord[]): MetricResult {
  if (assets.length === 0) {
    return {
      key: "condition_index",
      value: 0,
      definitionVersion: CONDITION_INDEX_VERSION,
      metadata: { assetCount: 0 },
    };
  }

  const avg = assets.reduce((sum, a) => sum + a.fcaScore, 0) / assets.length;
  return {
    key: "condition_index",
    value: Math.round(avg * 100) / 100,
    definitionVersion: CONDITION_INDEX_VERSION,
    metadata: { assetCount: assets.length },
  };
}
