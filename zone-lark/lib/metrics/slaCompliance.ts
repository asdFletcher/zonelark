/**
 * DRAFT. % of work orders whose response time met a configurable target by priority. Only
 * meaningful once at least one CMMS connection has synced work orders (lib/integrations/pipeline.ts
 * writes cmms_work_orders). Default targets below are a starting guess (respond within 24h for
 * high priority, 3 days normal, 7 days low) — the user is expected to correct these against real
 * portfolio SLAs, not treat them as authoritative.
 */
import { MetricResult } from "@/lib/metrics/types";

export const SLA_COMPLIANCE_VERSION = "v1-draft";

export interface WorkOrderLike {
  priority: string;
  opened_at: string;
  responded_at: string | null;
  closed_at: string | null;
}

const DEFAULT_RESPONSE_TARGET_HOURS: Record<string, number> = {
  high: 24,
  normal: 72,
  low: 168,
};

export function computeSlaCompliance(
  workOrders: WorkOrderLike[],
  responseTargetHours: Record<string, number> = DEFAULT_RESPONSE_TARGET_HOURS,
): MetricResult {
  const respondable = workOrders.filter((wo) => wo.responded_at);
  if (respondable.length === 0) {
    return {
      key: "sla_compliance",
      value: 0,
      definitionVersion: SLA_COMPLIANCE_VERSION,
      metadata: { workOrderCount: 0 },
    };
  }

  let met = 0;
  for (const wo of respondable) {
    const target = responseTargetHours[wo.priority] ?? DEFAULT_RESPONSE_TARGET_HOURS.normal;
    const hours =
      (new Date(wo.responded_at as string).getTime() - new Date(wo.opened_at).getTime()) / 36e5;
    if (hours <= target) met++;
  }

  return {
    key: "sla_compliance",
    value: Math.round((met / respondable.length) * 1000) / 10,
    definitionVersion: SLA_COMPLIANCE_VERSION,
    metadata: { workOrderCount: respondable.length, met },
  };
}
