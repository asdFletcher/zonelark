/**
 * Zonelark — ExcelJS workbook builder.
 * Produces a fully-styled, formula-driven 35-column .xlsx buffer.
 *
 * Column index map (1-based):
 *  1  Floor/ID Number           19  Unit of Measure
 *  2  Facility Name             20  Asset Repair or Replace
 *  3  Facility Type/Usage       21  Uniformat Level 2
 *  4  Facility Level/Floor      22  Industry Life Expectancy
 *  5  Room Number               23  Industry Replacement Year  ← formula
 *  6  Room Name                 24  Industry Life Remaining    ← formula
 *  7  Area / Asset Served       25  Estimated / Observed Life Remaining
 *  8  Asset / CMMS ID           26  Observed Replacement Year
 *  9  Asset Name                27  Unit Probable Cost ($)
 * 10  Asset Manufacturer        28  Extended Probable Cost ($)  ← formula
 * 11  Asset Model Number        29  Depreciated Value           ← formula
 * 12  Asset Serial Number       30  Annual Maintenance          ← formula
 * 13  Asset Approximate Install Year  31  Facility Square Feet
 * 14  Notes/Comments            32  Date of Assessment
 * 15  FCA 1-5                   33  Operational Status
 * 16  Asset Type                34  Criticality Factor
 * 17  Asset "Size"              35  Recommended Action Priority
 * 18  Asset Quantity Multiplier
 */
import ExcelJS from "exceljs";
import {
  COLUMNS_SCHEMA,
  CURRENT_YEAR,
  HEADER_COLOR,
  YELLOW_COLOR,
  ZEBRA_COLOR,
  getRegistry,
  getUniformat,
} from "@/lib/config";
import { AssetRecord } from "@/lib/schemas";

// ── Style helpers ─────────────────────────────────────────────────────────

const HDR_FONT: Partial<ExcelJS.Font> = {
  name: "Segoe UI",
  size: 9,
  bold: true,
  color: { argb: "FFFFFFFF" },
};
const BODY_FONT: Partial<ExcelJS.Font> = { name: "Segoe UI", size: 9 };
const TOTAL_FONT: Partial<ExcelJS.Font> = { name: "Segoe UI", size: 9, bold: true };

const HDR_FILL = fill(HEADER_COLOR);
const ZEBRA_FILL = fill(ZEBRA_COLOR);
const WHITE_FILL = fill("FFFFFF");
const YELLOW_FILL = fill(YELLOW_COLOR);
const TOTAL_FILL = fill("D6E4F0");

const MAIN_SHEET_NAME = "Zonelark FCA Log";

function fill(hex: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hex}` } };
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFC0C0C0" } },
  bottom: { style: "thin", color: { argb: "FFC0C0C0" } },
  left: { style: "thin", color: { argb: "FFC0C0C0" } },
  right: { style: "thin", color: { argb: "FFC0C0C0" } },
};

const HDR_ALIGN: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "bottom",
  textRotation: 60,
  wrapText: true,
};
const LEFT_ALIGN: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" };
const RIGHT_ALIGN: Partial<ExcelJS.Alignment> = { horizontal: "right", vertical: "middle" };

const NUMERIC_COLS = new Set([13, 15, 18, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34]);
const CURRENCY_FMT = "#,##0.00";
const INT_FMT = "0";

const COL_WIDTHS: Record<number, number> = {
  1: 8,
  2: 18,
  3: 14,
  4: 12,
  5: 9,
  6: 16,
  7: 16,
  8: 12,
  9: 12,
  10: 16,
  11: 14,
  12: 14,
  13: 8,
  14: 22,
  15: 6,
  16: 18,
  17: 10,
  18: 6,
  19: 6,
  20: 10,
  21: 18,
  22: 8,
  23: 8,
  24: 8,
  25: 8,
  26: 8,
  27: 14,
  28: 14,
  29: 14,
  30: 13,
  31: 10,
  32: 11,
  33: 10,
  34: 10,
};

// ── Cell writer helpers ───────────────────────────────────────────────────

function styleCell(
  cell: ExcelJS.Cell,
  rowFill: ExcelJS.Fill,
  isNumeric: boolean,
  fmt?: string,
): void {
  cell.font = BODY_FONT;
  cell.fill = rowFill;
  cell.border = THIN_BORDER;
  cell.alignment = isNumeric ? RIGHT_ALIGN : LEFT_ALIGN;
  if (fmt) cell.numFmt = fmt;
}

// ── Main export ───────────────────────────────────────────────────────────

export async function exportWorkbook(assets: AssetRecord[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Zonelark 2.0";

  const ws = wb.addWorksheet(MAIN_SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // ── Header row ─────────────────────────────────────────────────────
  ws.addRow(COLUMNS_SCHEMA);
  ws.getRow(1).height = 120;

  COLUMNS_SCHEMA.forEach((_, i) => {
    const col = i + 1;
    const cell = ws.getCell(1, col);
    cell.font = HDR_FONT;
    cell.fill = HDR_FILL;
    cell.alignment = HDR_ALIGN;
    cell.border = THIN_BORDER;
    ws.getColumn(col).width = COL_WIDTHS[col] ?? 12;
  });

  // ── Data rows ───────────────────────────────────────────────────────
  assets.forEach((asset, idx) => {
    const row = idx + 2;
    const rowFill = row % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
    writeAssetRow(ws, row, asset, rowFill);
  });

  // ── Totals row ──────────────────────────────────────────────────────
  if (assets.length > 0) {
    writeTotalsRow(ws, assets.length + 2);
  }

  writeCapXSheet(wb, assets);

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

// ── Row writer ────────────────────────────────────────────────────────────

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function writeAssetRow(
  ws: ExcelJS.Worksheet,
  row: number,
  asset: AssetRecord,
  rowFill: ExcelJS.Fill,
): void {
  const reg = getRegistry(asset.assetType);
  const lifeExp = reg.life;
  const uniformat = getUniformat(asset);
  const unitCost = asset.unitProbableCost ?? reg.unitCost;
  const obsReplYr = asset.observedReplacementYear ?? CURRENT_YEAR + asset.observedLifeRemaining;

  ws.getRow(row).height = 18;

  // Static values cols 1–21
  const staticVals: unknown[] = [
    asset.floorId,
    asset.facilityName,
    asset.facilityType,
    asset.facilityLevel,
    asset.roomNumber,
    asset.roomName,
    asset.areaServed,
    asset.cmmsId,
    asset.assetName,
    asset.manufacturer,
    asset.modelNumber,
    asset.serialNumber,
    asset.installYear,
    asset.notes,
    asset.fcaScore,
    asset.assetType,
    asset.assetSize,
    asset.quantityMultiplier,
    asset.uom,
    asset.repairOrReplace,
    uniformat,
  ];

  staticVals.forEach((val, i) => {
    const c = ws.getCell(row, i + 1);
    c.value = val as ExcelJS.CellValue;
    styleCell(c, rowFill, NUMERIC_COLS.has(i + 1), i + 1 === 13 ? INT_FMT : undefined);
  });

  // 22 — Industry Life Expectancy (static lookup)
  set(ws, row, 22, lifeExp, rowFill, INT_FMT);

  const installCol = colLetter(13);
  const lifeCol = colLetter(22);
  const qtyCol = colLetter(18);
  const costCol = colLetter(27);
  const replCol = colLetter(23);
  const extCol = colLetter(28);
  const lifeRemCol = colLetter(24);

  set(ws, row, 23, { formula: `${installCol}${row}+${lifeCol}${row}` }, rowFill, INT_FMT);
  set(ws, row, 24, { formula: `${replCol}${row}-${CURRENT_YEAR}` }, rowFill, INT_FMT);
  set(ws, row, 25, asset.observedLifeRemaining, rowFill, INT_FMT);
  set(ws, row, 26, obsReplYr, rowFill, INT_FMT);

  const costCell = ws.getCell(row, 27);
  costCell.value = unitCost;
  costCell.font = BODY_FONT;
  costCell.fill = YELLOW_FILL;
  costCell.border = THIN_BORDER;
  costCell.alignment = RIGHT_ALIGN;
  costCell.numFmt = CURRENCY_FMT;

  set(ws, row, 28, { formula: `${qtyCol}${row}*${costCol}${row}` }, rowFill, CURRENCY_FMT);
  set(
    ws,
    row,
    29,
    { formula: `IF(${lifeExp}>0,${extCol}${row}*MAX(0,${lifeRemCol}${row})/${lifeExp},0)` },
    rowFill,
    CURRENCY_FMT,
  );
  set(ws, row, 30, { formula: `${extCol}${row}*${reg.maintPct}` }, rowFill, CURRENCY_FMT);

  const tail: unknown[] = [
    asset.facilitySqft,
    asset.assessmentDate,
    asset.operationalImpact,
    asset.energyImpact,
  ];
  tail.forEach((val, i) => {
    const colIdx = 31 + i;
    const c = ws.getCell(row, colIdx);
    c.value = val as ExcelJS.CellValue;
    styleCell(c, rowFill, NUMERIC_COLS.has(colIdx), colIdx === 31 ? "#,##0" : INT_FMT);
  });
}

function set(
  ws: ExcelJS.Worksheet,
  row: number,
  colIdx: number,
  value: unknown,
  rowFill: ExcelJS.Fill,
  fmt?: string,
): void {
  const c = ws.getCell(row, colIdx);
  c.value = value as ExcelJS.CellValue;
  c.font = BODY_FONT;
  c.fill = rowFill;
  c.border = THIN_BORDER;
  c.alignment = RIGHT_ALIGN;
  if (fmt) c.numFmt = fmt;
}

function writeTotalsRow(ws: ExcelJS.Worksheet, row: number): void {
  const lastData = row - 1;

  const labelCell = ws.getCell(row, 1);
  labelCell.value = "TOTALS / PORTFOLIO SUMMARY";
  labelCell.font = TOTAL_FONT;
  labelCell.fill = TOTAL_FILL;
  labelCell.border = THIN_BORDER;
  labelCell.alignment = LEFT_ALIGN;

  ws.mergeCells(row, 1, row, 20);
  ws.getRow(row).height = 20;

  const sumCols = new Set([28, 29, 30]);

  for (let c = 21; c <= COLUMNS_SCHEMA.length; c++) {
    const cell = ws.getCell(row, c);
    if (sumCols.has(c) && lastData >= 2) {
      cell.value = { formula: `SUM(${colLetter(c)}2:${colLetter(c)}${lastData})` };
      cell.numFmt = CURRENCY_FMT;
    }
    cell.font = TOTAL_FONT;
    cell.fill = TOTAL_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = RIGHT_ALIGN;
  }
}

// ── "output-capX" sheet: 30-year capital forecast by facility ──────────────
// Formula-driven off the main sheet (Facility Name / Observed Replacement Year /
// Extended Probable Cost columns) so editing the Inflation Rate cell recalculates
// every Year column and the NPV total live in Excel — no re-export required.

const CAPX_YEARS = 30;
const CAPX_INFLATION_ROW = 1;
const CAPX_HEADER_ROW = 2;
const CAPX_DATA_START_ROW = 3;
const CAPX_FACILITY_COL = 1;
const CAPX_NPV_COL = 2;
const CAPX_YEAR1_COL = 3;
const CAPX_LAST_COL = CAPX_YEAR1_COL + CAPX_YEARS - 1;

function writeCapXSheet(wb: ExcelJS.Workbook, assets: AssetRecord[]): void {
  if (assets.length === 0) return;

  const mainLastRow = assets.length + 1;
  const facilityRef = colLetter(2); // main sheet: Facility Name
  const replYearRef = colLetter(26); // main sheet: Observed Replacement Year
  const extCostRef = colLetter(28); // main sheet: Extended Probable Cost ($)

  const facilities = Array.from(new Set(assets.map((a) => a.facilityName))).sort((a, b) =>
    a.localeCompare(b),
  );

  const ws = wb.addWorksheet("output-capX", {
    views: [{ state: "frozen", xSplit: 1, ySplit: CAPX_HEADER_ROW }],
  });

  ws.getColumn(CAPX_FACILITY_COL).width = 24;
  ws.getColumn(CAPX_NPV_COL).width = 13;
  for (let c = CAPX_YEAR1_COL; c <= CAPX_LAST_COL; c++) ws.getColumn(c).width = 10;

  // Inflation-rate input cell — the one value a user is meant to edit. Every Year
  // column formula below reads it, so changing it recalculates the whole sheet.
  const rateLabelCell = ws.getCell(CAPX_INFLATION_ROW, 1);
  rateLabelCell.value = "Inflation Rate:";
  rateLabelCell.font = TOTAL_FONT;
  rateLabelCell.alignment = RIGHT_ALIGN;

  const rateCell = ws.getCell(CAPX_INFLATION_ROW, CAPX_NPV_COL);
  rateCell.value = 0.05;
  rateCell.numFmt = "0.00%";
  rateCell.font = TOTAL_FONT;
  rateCell.fill = TOTAL_FILL;
  rateCell.border = THIN_BORDER;
  rateCell.alignment = { horizontal: "center", vertical: "middle" };
  rateCell.dataValidation = {
    type: "decimal",
    operator: "between",
    formulae: [0.005, 0.1],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Invalid inflation rate",
    error: "Enter a rate between 0.50% and 10.00%.",
    showInputMessage: true,
    prompt: "Enter a rate between 0.50% and 10.00%.",
  };
  const rateRef = `$${colLetter(CAPX_NPV_COL)}$${CAPX_INFLATION_ROW}`;

  // Header row
  const flatHeaderAlign: Partial<ExcelJS.Alignment> = { ...HDR_ALIGN, textRotation: 0 };
  const writeHeader = (col: number, label: string, rotate: boolean) => {
    const c = ws.getCell(CAPX_HEADER_ROW, col);
    c.value = label;
    c.font = HDR_FONT;
    c.fill = HDR_FILL;
    c.border = THIN_BORDER;
    c.alignment = rotate ? HDR_ALIGN : flatHeaderAlign;
  };
  writeHeader(CAPX_FACILITY_COL, "Facility Name", false);
  writeHeader(CAPX_NPV_COL, `NPV (${CAPX_YEARS} Yr)`, false);
  for (let n = 1; n <= CAPX_YEARS; n++) {
    writeHeader(CAPX_YEAR1_COL + n - 1, `Year. ${n}`, true);
  }
  ws.getRow(CAPX_HEADER_ROW).height = 60;

  // One row per facility — each Year cell sums that facility's extended cost for
  // assets replaced in that calendar year, escalated by the inflation-rate cell.
  facilities.forEach((facility, idx) => {
    const row = CAPX_DATA_START_ROW + idx;
    const rowFill = row % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;

    const nameCell = ws.getCell(row, CAPX_FACILITY_COL);
    nameCell.value = facility;
    nameCell.font = HDR_FONT;
    nameCell.fill = HDR_FILL;
    nameCell.border = THIN_BORDER;
    nameCell.alignment = LEFT_ALIGN;

    for (let n = 1; n <= CAPX_YEARS; n++) {
      const col = CAPX_YEAR1_COL + n - 1;
      const targetYear = CURRENT_YEAR + n;
      const cell = ws.getCell(row, col);
      cell.value = {
        formula:
          `SUMPRODUCT(('${MAIN_SHEET_NAME}'!$${facilityRef}$2:$${facilityRef}$${mainLastRow}=$A${row})*` +
          `('${MAIN_SHEET_NAME}'!$${replYearRef}$2:$${replYearRef}$${mainLastRow}=${targetYear})*` +
          `'${MAIN_SHEET_NAME}'!$${extCostRef}$2:$${extCostRef}$${mainLastRow})*(1+${rateRef})^${n}`,
      };
      styleCell(cell, rowFill, true, "$#,##0");
    }

    const npvCell = ws.getCell(row, CAPX_NPV_COL);
    npvCell.value = {
      formula: `SUM(${colLetter(CAPX_YEAR1_COL)}${row}:${colLetter(CAPX_LAST_COL)}${row})`,
    };
    styleCell(npvCell, rowFill, true, "$#,##0");
  });

  // Totals row
  const totalsRow = CAPX_DATA_START_ROW + facilities.length;
  const firstDataRow = CAPX_DATA_START_ROW;
  const lastDataRow = totalsRow - 1;

  const totalsLabelCell = ws.getCell(totalsRow, CAPX_FACILITY_COL);
  totalsLabelCell.value = "TOTAL — ALL FACILITIES";
  totalsLabelCell.font = TOTAL_FONT;
  totalsLabelCell.fill = TOTAL_FILL;
  totalsLabelCell.border = THIN_BORDER;
  totalsLabelCell.alignment = LEFT_ALIGN;

  for (let col = CAPX_NPV_COL; col <= CAPX_LAST_COL; col++) {
    const cell = ws.getCell(totalsRow, col);
    cell.value = {
      formula: `SUM(${colLetter(col)}${firstDataRow}:${colLetter(col)}${lastDataRow})`,
    };
    cell.font = TOTAL_FONT;
    cell.fill = TOTAL_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = RIGHT_ALIGN;
    cell.numFmt = "$#,##0";
  }
  ws.getRow(totalsRow).height = 20;
}
