import "server-only";

/**
 * Zonelark — Enrichment engine.
 * Merges ParsedPlate + facility context → full AssetRecord.
 */
import { CURRENT_YEAR, getRegistry } from "@/lib/config";
import { AssetRecord, ParsedPlate, UploadContext } from "@/lib/schemas";

const ENERGY_IMPACT_MAP: Record<string, number> = {
  Chiller: 5,
  "Packaged Rooftop Unit": 5,
  "Air Handling Unit": 5,
  Boiler: 4,
  "Cooling Tower": 4,
  "Heat Exchanger": 4,
  "Fan Coil Unit": 3,
  "Variable Air Volume Box": 3,
  "Mini Split System": 3,
  "Condensing Unit": 3,
  "Centrifugal Pump": 2,
  "Commercial Water Heater": 2,
  "Domestic Water Heater": 2,
  "Emergency Generator": 2,
  "Motor Control Center": 2,
  "Fire Pump": 1,
  "Fire Alarm Control Panel": 1,
  "Sprinkler System": 1,
  "Automatic Transfer Switch": 1,
  "UPS System": 1,
  "Electrical Panelboard": 1,
};

function resolveEnergyImpact(assetType: string, fca: number): number {
  const base = ENERGY_IMPACT_MAP[assetType] ?? 3;
  // Poor condition = less efficient = bump up by 1
  return Math.min(5, fca <= 2 ? base + 1 : base);
}

function resolveRepairOrReplace(fca: number, lifeRemaining: number): string {
  if (fca <= 2 || lifeRemaining <= 2) return "Replace";
  if (fca === 3 || lifeRemaining <= 5) return "Repair";
  return "Maintain";
}

export function enrichAsset(parsed: ParsedPlate, ctx: UploadContext): AssetRecord {
  const reg = getRegistry(parsed.asset_type);
  const installYear = parsed.install_year ?? CURRENT_YEAR - Math.floor(reg.life / 2);

  const industryReplYear = installYear + reg.life;
  const industryLifeRem = industryReplYear - CURRENT_YEAR;

  // Heuristic: FCA score maps linearly across expected life
  const obsLifeRemaining = Math.max(
    0,
    Math.min(Math.round(parsed.fca_score * (reg.life / 5)), reg.life),
  );
  const obsReplYear = CURRENT_YEAR + obsLifeRemaining;

  return {
    floorId: ctx.floorId ?? "01",
    facilityName: ctx.facilityName,
    facilityType: ctx.facilityType,
    facilityLevel: ctx.facilityLevel ?? "1st Floor",
    roomNumber: parsed.room_number,
    roomName: parsed.room_name,
    areaServed: parsed.area_served,
    cmmsId: parsed.asset_name,
    assetName: parsed.asset_name,
    manufacturer: parsed.manufacturer,
    modelNumber: parsed.model_number,
    serialNumber: parsed.serial_number,
    installYear,
    notes: parsed.notes,
    fcaScore: parsed.fca_score,
    assetType: parsed.asset_type,
    assetSize: parsed.asset_size,
    quantityMultiplier: ctx.quantityMultiplier ?? 1,
    uom: ctx.uom ?? "EA",
    repairOrReplace: resolveRepairOrReplace(parsed.fca_score, industryLifeRem),
    observedLifeRemaining: obsLifeRemaining,
    observedReplacementYear: obsReplYear,
    unitProbableCost: reg.unitCost,
    facilitySqft: ctx.facilitySqft,
    assessmentDate: ctx.assessmentDate ?? new Date().toISOString().slice(0, 10),
    operationalImpact: ctx.operationalImpact ?? 3,
    energyImpact: ctx.energyImpact ?? resolveEnergyImpact(parsed.asset_type, parsed.fca_score),
  };
}
