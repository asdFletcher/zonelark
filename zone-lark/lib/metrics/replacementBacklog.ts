/**
 * DRAFT. Total probable cost of assets whose observed replacement year falls within `windowYears`
 * (default 5) — reuses the same extended-cost math as lib/formatters.ts's computeRowDerived.
 */
import { CURRENT_YEAR } from "@/lib/config";
import { MetricResult } from "@/lib/metrics/types";
import { AssetRecord } from "@/lib/schemas";

export const REPLACEMENT_BACKLOG_VERSION = "v1-draft";

export function computeReplacementBacklog(assets: AssetRecord[], windowYears = 5): MetricResult {
  const withinWindow = assets.filter(
    (a) =>
      a.observedReplacementYear !== undefined &&
      a.observedReplacementYear - CURRENT_YEAR <= windowYears,
  );
  const total = withinWindow.reduce(
    (sum, a) => sum + (a.unitProbableCost || 0) * (a.quantityMultiplier || 1),
    0,
  );

  return {
    key: "replacement_backlog",
    value: Math.round(total),
    definitionVersion: REPLACEMENT_BACKLOG_VERSION,
    metadata: { windowYears, assetCount: withinWindow.length },
  };
}
