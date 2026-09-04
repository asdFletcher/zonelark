import { describe, expect, it } from "vitest";

import { CURRENT_YEAR } from "@/lib/config";
import { computeConditionIndex } from "@/lib/metrics/conditionIndex";
import { computePortfolioRisk } from "@/lib/metrics/portfolioRisk";
import { computeReplacementBacklog } from "@/lib/metrics/replacementBacklog";
import { computeSlaCompliance, WorkOrderLike } from "@/lib/metrics/slaCompliance";
import { AssetRecord } from "@/lib/schemas";

function buildAsset(overrides: Partial<AssetRecord> = {}): AssetRecord {
  return {
    floorId: "01",
    facilityName: "Test Facility",
    facilityType: "Office",
    facilityLevel: "1st Floor",
    roomNumber: "101",
    roomName: "Mechanical Room",
    areaServed: "Whole Building",
    cmmsId: "AHU-1",
    assetName: "AHU-1",
    manufacturer: "Trane",
    modelNumber: "N/A",
    serialNumber: "N/A",
    installYear: CURRENT_YEAR - 10,
    notes: "",
    fcaScore: 3,
    assetType: "Air Handling Unit",
    assetSize: "N/A",
    quantityMultiplier: 1,
    uom: "EA",
    repairOrReplace: "Maintain",
    observedLifeRemaining: 10,
    observedReplacementYear: CURRENT_YEAR + 10,
    unitProbableCost: 15_000,
    facilitySqft: 50_000,
    assessmentDate: `${CURRENT_YEAR}-01-01`,
    operationalImpact: 3,
    energyImpact: 3,
    ...overrides,
  };
}

describe("computeConditionIndex", () => {
  it("returns 0 for an empty portfolio", () => {
    expect(computeConditionIndex([]).value).toBe(0);
  });

  it("averages fcaScore across assets", () => {
    const assets = [buildAsset({ fcaScore: 5 }), buildAsset({ fcaScore: 1 })];
    expect(computeConditionIndex(assets).value).toBe(3);
  });
});

describe("computeReplacementBacklog", () => {
  it("only counts assets replacing within the window", () => {
    const assets = [
      buildAsset({ observedReplacementYear: CURRENT_YEAR + 2, unitProbableCost: 10_000 }),
      buildAsset({ observedReplacementYear: CURRENT_YEAR + 20, unitProbableCost: 50_000 }),
    ];
    const result = computeReplacementBacklog(assets, 5);
    expect(result.value).toBe(10_000);
    expect(result.metadata?.assetCount).toBe(1);
  });

  it("multiplies by quantityMultiplier", () => {
    const assets = [
      buildAsset({
        observedReplacementYear: CURRENT_YEAR + 1,
        unitProbableCost: 1_000,
        quantityMultiplier: 4,
      }),
    ];
    expect(computeReplacementBacklog(assets, 5).value).toBe(4_000);
  });
});

describe("computePortfolioRisk", () => {
  it("scores a healthy, low-backlog portfolio near 0", () => {
    const assets = [buildAsset({ fcaScore: 5, observedReplacementYear: CURRENT_YEAR + 20 })];
    expect(computePortfolioRisk(assets).value).toBeLessThan(15);
  });

  it("scores a poor-condition, high-backlog portfolio near 100", () => {
    const assets = [
      buildAsset({ fcaScore: 1, observedReplacementYear: CURRENT_YEAR, unitProbableCost: 600_000 }),
    ];
    expect(computePortfolioRisk(assets).value).toBeGreaterThan(85);
  });
});

describe("computeSlaCompliance", () => {
  it("ignores work orders with no response yet", () => {
    const workOrders: WorkOrderLike[] = [
      { priority: "high", opened_at: "2026-01-01T00:00:00Z", responded_at: null, closed_at: null },
    ];
    expect(computeSlaCompliance(workOrders).metadata?.workOrderCount).toBe(0);
  });

  it("flags a response outside the priority target as non-compliant", () => {
    const workOrders: WorkOrderLike[] = [
      {
        priority: "high",
        opened_at: "2026-01-01T00:00:00Z",
        responded_at: "2026-01-04T00:00:00Z", // 72h, target for "high" is 24h
        closed_at: null,
      },
      {
        priority: "high",
        opened_at: "2026-01-01T00:00:00Z",
        responded_at: "2026-01-01T12:00:00Z", // 12h, within target
        closed_at: null,
      },
    ];
    expect(computeSlaCompliance(workOrders).value).toBe(50);
  });
});
