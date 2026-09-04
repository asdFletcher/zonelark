/**
 * Zonelark — CSV → AssetRecord[] import.
 * Headers are matched against AssetRecordSchema field names, case/spacing-insensitive
 * (e.g. "Asset Name", "asset_name", "assetname" all match `assetName`).
 */
import { CURRENT_YEAR, getRegistry, normalizeUniformatLabel } from "@/lib/config";
import { AssetRecord, AssetRecordSchema } from "@/lib/schemas";

const NUMERIC_FIELDS = new Set([
  "installYear",
  "fcaScore",
  "quantityMultiplier",
  "observedLifeRemaining",
  "observedReplacementYear",
  "unitProbableCost",
  "facilitySqft",
  "operationalImpact",
  "energyImpact",
]);

const REQUIRED_STRING_FIELDS = [
  "facilityName",
  "facilityType",
  "roomNumber",
  "roomName",
  "areaServed",
  "cmmsId",
  "assetName",
] as const;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const FIELD_LOOKUP = new Map(
  Object.keys(AssetRecordSchema.shape).map((key) => [normalize(key), key]),
);

/** Minimal RFC4180-ish CSV parser: handles quoted fields, commas, and embedded newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

export interface CsvImportResult {
  assets: AssetRecord[];
  errors: string[];
}

/** Maps parsed CSV rows to valid AssetRecords, filling defaults from the lifecycle registry. */
export function rowsToAssets(rows: Record<string, string>[]): CsvImportResult {
  const assets: AssetRecord[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const candidate: Record<string, unknown> = {};
    for (const [header, value] of Object.entries(row)) {
      if (value === "") continue;
      const key = FIELD_LOOKUP.get(normalize(header));
      if (!key) continue;
      if (NUMERIC_FIELDS.has(key)) {
        const n = Number(value);
        if (!Number.isNaN(n)) candidate[key] = n;
      } else {
        candidate[key] = value;
      }
    }

    const assetType = typeof candidate.assetType === "string" ? candidate.assetType : "Unknown";
    if (candidate.assetType === undefined) candidate.assetType = assetType;
    if (typeof candidate.uniformatLevel2 === "string") {
      candidate.uniformatLevel2 = normalizeUniformatLabel(candidate.uniformatLevel2);
    }
    const reg = getRegistry(assetType);
    const fcaScore =
      typeof candidate.fcaScore === "number" && !Number.isNaN(candidate.fcaScore)
        ? candidate.fcaScore
        : 3;

    if (typeof candidate.installYear !== "number") {
      candidate.installYear = CURRENT_YEAR - Math.floor(reg.life / 2);
    }
    if (typeof candidate.observedLifeRemaining !== "number") {
      candidate.observedLifeRemaining = Math.max(
        0,
        Math.min(Math.round(fcaScore * (reg.life / 5)), reg.life),
      );
    }
    if (typeof candidate.unitProbableCost !== "number") {
      candidate.unitProbableCost = reg.unitCost;
    }
    if (typeof candidate.facilitySqft !== "number") {
      candidate.facilitySqft = 0;
    }
    for (const key of REQUIRED_STRING_FIELDS) {
      if (candidate[key] === undefined) candidate[key] = "";
    }

    const result = AssetRecordSchema.safeParse(candidate);
    if (result.success) {
      assets.push(result.data);
    } else {
      errors.push(`Row ${idx + 2}: ${result.error.issues[0]?.message ?? "invalid data"}`);
    }
  });

  return { assets, errors };
}
