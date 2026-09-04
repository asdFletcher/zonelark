/**
 * Zonelark — TypeScript types and Zod validation schemas.
 */
import { z } from "zod";

// ── Parsed output from LLM vision pipeline ───────────────────────────────
export const ParsedPlateSchema = z.object({
  asset_type: z.string(),
  manufacturer: z.string(),
  model_number: z.string(),
  serial_number: z.string(),
  install_year: z.number().int().nullable().optional(),
  asset_name: z.string(),
  room_number: z.string(),
  room_name: z.string(),
  area_served: z.string(),
  asset_size: z.string().default("N/A"),
  fca_score: z.number().int().min(1).max(5).default(3),
  notes: z.string().default(""),
});
export type ParsedPlate = z.infer<typeof ParsedPlateSchema>;

// ── Full enriched asset record (one row in the workbook) ─────────────────
export const AssetRecordSchema = z.object({
  floorId: z.string().default("01"),
  facilityName: z.string(),
  facilityType: z.string(),
  facilityLevel: z.string().default("1st Floor"),
  roomNumber: z.string(),
  roomName: z.string(),
  areaServed: z.string(),
  cmmsId: z.string(),
  assetName: z.string(),
  manufacturer: z.string().default("Unknown"),
  modelNumber: z.string().default("N/A"),
  serialNumber: z.string().default("N/A"),
  installYear: z.number().int(),
  notes: z.string().default(""),
  fcaScore: z.number().int().min(1).max(5).default(3),
  assetType: z.string(),
  uniformatLevel2: z.string().optional(),
  assetSize: z.string().default("N/A"),
  quantityMultiplier: z.number().default(1),
  uom: z.string().default("EA"),
  repairOrReplace: z.string().default("Maintain"),
  observedLifeRemaining: z.number().int(),
  observedReplacementYear: z.number().int().optional(),
  unitProbableCost: z.number().optional(),
  facilitySqft: z.number(),
  assessmentDate: z.string().default(() => new Date().toISOString().slice(0, 10)),
  operationalImpact: z.number().int().min(1).max(5).default(3),
  energyImpact: z.number().int().min(1).max(5).default(3),
});
export type AssetRecord = z.infer<typeof AssetRecordSchema>;

// ── Upload context supplied by the caller alongside image files ───────────
export interface UploadContext {
  facilityName: string;
  facilityType: string;
  facilityLevel?: string;
  floorId?: string;
  facilitySqft: number;
  assessmentDate?: string;
  operationalImpact?: number;
  energyImpact?: number;
  quantityMultiplier?: number;
  uom?: string;
}
