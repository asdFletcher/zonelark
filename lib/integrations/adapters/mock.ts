import "server-only";

import {
  NormalizedAsset,
  NormalizedServiceRequest,
  NormalizedTenantRecord,
  NormalizedWorkOrder,
} from "@/lib/integrations/schemas";
import { AuthResult, CmmsAdapter, CrmAdapter } from "@/lib/integrations/types";
import { SAMPLE_ASSETS } from "@/lib/sampleAssets";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * Deterministic mock CMMS, seeded from lib/sampleAssets.ts so mock work orders line up with the
 * same demo assets used elsewhere. The only registered adapter until a real vendor is chosen —
 * see lib/integrations/pipeline.ts.
 */
export class MockCmmsAdapter implements CmmsAdapter {
  readonly key = "mock";

  async authenticate(): Promise<AuthResult> {
    return { ok: true };
  }

  async syncAssets(): Promise<NormalizedAsset[]> {
    return SAMPLE_ASSETS.map((a, i) => ({
      external_id: `mock-asset-${i}`,
      name: a.assetName,
      status: "active",
    }));
  }

  async syncWorkOrders(): Promise<NormalizedWorkOrder[]> {
    return SAMPLE_ASSETS.map((a, i) => {
      const priority = a.fcaScore <= 2 ? "high" : a.fcaScore === 3 ? "normal" : "low";
      const openedAt = daysAgo(10 + i * 3);
      const respondedAt = a.fcaScore <= 2 ? daysAgo(9 + i * 3) : daysAgo(7 + i * 3);
      const closedAt = a.repairOrReplace === "Maintain" ? daysAgo(5 + i * 3) : undefined;
      return {
        external_id: `mock-wo-${i}`,
        priority,
        status: closedAt ? "closed" : "open",
        opened_at: openedAt,
        responded_at: respondedAt,
        closed_at: closedAt,
      };
    });
  }
}

export class MockCrmAdapter implements CrmAdapter {
  readonly key = "mock";

  async authenticate(): Promise<AuthResult> {
    return { ok: true };
  }

  async syncTenantRecords(): Promise<NormalizedTenantRecord[]> {
    return [{ external_id: "mock-tenant-1", name: "Sample Tenant LLC", status: "active" }];
  }

  async syncServiceRequests(): Promise<NormalizedServiceRequest[]> {
    return [
      { external_id: "mock-sr-1", status: "open", opened_at: daysAgo(4) },
      {
        external_id: "mock-sr-2",
        status: "closed",
        opened_at: daysAgo(20),
        closed_at: daysAgo(15),
      },
    ];
  }
}
