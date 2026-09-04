import "server-only";

import { AssetRecord } from "@/lib/schemas";
import { Database } from "@/lib/supabase/database.types";

type AssetRow = Database["public"]["Tables"]["assets"]["Row"];
type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];

/** camelCase AssetRecord (lib/schemas.ts) -> snake_case `assets` table row. */
export function assetRecordToRow(asset: AssetRecord, assessmentId: string): AssetInsert {
  return {
    assessment_id: assessmentId,
    floor_id: asset.floorId,
    facility_name: asset.facilityName,
    facility_type: asset.facilityType,
    facility_level: asset.facilityLevel,
    room_number: asset.roomNumber,
    room_name: asset.roomName,
    area_served: asset.areaServed,
    cmms_id: asset.cmmsId,
    asset_name: asset.assetName,
    manufacturer: asset.manufacturer,
    model_number: asset.modelNumber,
    serial_number: asset.serialNumber,
    install_year: asset.installYear,
    notes: asset.notes,
    fca_score: asset.fcaScore,
    asset_type: asset.assetType,
    uniformat_level2: asset.uniformatLevel2 ?? null,
    asset_size: asset.assetSize,
    quantity_multiplier: asset.quantityMultiplier,
    uom: asset.uom,
    repair_or_replace: asset.repairOrReplace,
    observed_life_remaining: asset.observedLifeRemaining,
    observed_replacement_year: asset.observedReplacementYear ?? null,
    unit_probable_cost: asset.unitProbableCost ?? null,
    facility_sqft: asset.facilitySqft,
    assessment_date: asset.assessmentDate,
    operational_impact: asset.operationalImpact,
    energy_impact: asset.energyImpact,
  };
}

/** snake_case `assets` row -> camelCase AssetRecord, the shape every existing client expects. */
export function rowToAssetRecord(row: AssetRow): AssetRecord {
  return {
    floorId: row.floor_id,
    facilityName: row.facility_name,
    facilityType: row.facility_type,
    facilityLevel: row.facility_level,
    roomNumber: row.room_number,
    roomName: row.room_name,
    areaServed: row.area_served,
    cmmsId: row.cmms_id,
    assetName: row.asset_name,
    manufacturer: row.manufacturer,
    modelNumber: row.model_number,
    serialNumber: row.serial_number,
    installYear: row.install_year,
    notes: row.notes,
    fcaScore: row.fca_score,
    assetType: row.asset_type,
    uniformatLevel2: row.uniformat_level2 ?? undefined,
    assetSize: row.asset_size,
    quantityMultiplier: row.quantity_multiplier,
    uom: row.uom,
    repairOrReplace: row.repair_or_replace,
    observedLifeRemaining: row.observed_life_remaining,
    observedReplacementYear: row.observed_replacement_year ?? undefined,
    unitProbableCost: row.unit_probable_cost ?? undefined,
    facilitySqft: row.facility_sqft,
    assessmentDate: row.assessment_date,
    operationalImpact: row.operational_impact,
    energyImpact: row.energy_impact,
  };
}
