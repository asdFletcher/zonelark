"use client";

import {
  computeRowDerived,
  fcaDotClass,
  fmtCell,
  fmtCellCurrency,
  fmtCellNumber,
} from "@/lib/formatters";
import { AssetRecord } from "@/lib/schemas";

import { EmptyState } from "./EmptyState";

const COLUMNS = [
  "Fixed ID",
  "Facility Name",
  "Level/Floor",
  "Room Name",
  "Area Served",
  "CMMS ID",
  "Asset Name",
  "Manufacturer",
  "Model #",
  "Serial #",
  "Install Year",
  "Notes",
  "FCA",
  "Oper. Impact",
  "Asset Type",
  "Size",
  "Qty",
  "UOM",
  "Repair/Replace",
  "Uniformat L2",
  "Ind. Life Exp.",
  "Ind. Repl. Year",
  "Ind. Life Rem.",
  "Obs. Life Rem.",
  "Obs. Repl. Year",
  "Unit Cost ($)",
  "Ext. Cost ($)",
  "Depr. Value",
  "Annual Maint.",
  "Facility Sq Ft",
  "Assess. Date",
  "Energy Impact",
] as const;

interface AssetTableProps {
  assets: AssetRecord[];
  selectable?: boolean;
  selectedIndices?: Set<number>;
  onToggleSelect?: (idx: number) => void;
  onToggleSelectAll?: () => void;
  /** Bounds the table to a fixed viewport height so both scrollbars stay reachable in place. */
  boundedHeight?: boolean;
}

export function AssetTable({
  assets,
  selectable = false,
  selectedIndices,
  onToggleSelect,
  onToggleSelectAll,
  boundedHeight = false,
}: AssetTableProps) {
  const allSelected = selectable && !!selectedIndices && selectedIndices.size === assets.length;
  const someSelected = selectable && !!selectedIndices && selectedIndices.size > 0 && !allSelected;
  const scrollClass = boundedHeight
    ? "max-h-[65vh] overflow-auto max-[700px]:max-h-none"
    : "overflow-x-auto";

  if (assets.length === 0) {
    return (
      <div className={scrollClass}>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {selectable && <th className={thClass} />}
              {COLUMNS.map((col) => (
                <th key={col} className={thClass}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLUMNS.length + (selectable ? 1 : 0)}>
                <EmptyState />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={scrollClass}>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {selectable && (
              <th className={`${thClass} w-9`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => onToggleSelectAll?.()}
                  aria-label="Select all assets"
                />
              </th>
            )}
            {COLUMNS.map((col) => (
              <th key={col} className={thClass}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, idx) => {
            const d = computeRowDerived(asset);
            const isSelected = !!selectedIndices?.has(idx);
            return (
              <tr
                key={`${asset.cmmsId}-${idx}`}
                className={`even:bg-zebra hover:bg-green/[0.04] ${isSelected ? "bg-green/[0.08]" : ""}`}
              >
                {selectable && (
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(idx)}
                      aria-label={`Select ${asset.assetName || "asset"}`}
                    />
                  </td>
                )}
                <td className={tdClass}>{fmtCell(asset.floorId)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtCell(asset.facilityName)}</td>
                <td className={tdClass}>{fmtCell(asset.facilityLevel)}</td>
                <td className={tdClass}>{fmtCell(asset.roomName)}</td>
                <td className={tdClass}>{fmtCell(asset.areaServed)}</td>
                <td className={tdClass}>{fmtCell(asset.cmmsId)}</td>
                <td className={tdClass}>
                  <strong>{fmtCell(asset.assetName)}</strong>
                </td>
                <td className={tdClass}>{fmtCell(asset.manufacturer)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtCell(asset.modelNumber)}</td>
                <td className={tdClass}>{fmtCell(asset.serialNumber)}</td>
                <td className={`${tdClass} text-right`}>{fmtCell(asset.installYear)}</td>
                <td className={`${tdClass} max-w-[200px] whitespace-normal text-[11px]`}>
                  {fmtCell(asset.notes)}
                </td>
                <td className={`${tdClass} text-center`}>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${fcaDotClass(asset.fcaScore)}`}
                  >
                    {asset.fcaScore}
                  </span>
                </td>
                <td className={`${tdClass} text-center`}>{fmtCell(asset.operationalImpact)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtCell(asset.assetType)}</td>
                <td className={tdClass}>{fmtCell(asset.assetSize)}</td>
                <td className={`${tdClass} text-right`}>{fmtCell(asset.quantityMultiplier)}</td>
                <td className={tdClass}>{fmtCell(asset.uom)}</td>
                <td className={tdClass}>{fmtCell(asset.repairOrReplace)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{d.uniformat}</td>
                <td className={`${tdClass} text-right`}>{d.lifeExp} yr</td>
                <td className={`${tdClass} text-right`}>{d.indReplYr}</td>
                <td className={`${tdClass} text-right`}>{d.indLifeRem} yr</td>
                <td className={`${tdClass} text-right`}>
                  {fmtCell(asset.observedLifeRemaining)} yr
                </td>
                <td className={`${tdClass} text-right`}>
                  {fmtCell(asset.observedReplacementYear)}
                </td>
                <td className={`${tdClass} bg-[#fffde799] text-right`}>
                  {fmtCellCurrency(asset.unitProbableCost)}
                </td>
                <td className={`${tdClass} text-right font-medium`}>
                  {fmtCellCurrency(d.extCost)}
                </td>
                <td className={`${tdClass} text-right`}>{fmtCellCurrency(d.deprVal)}</td>
                <td className={`${tdClass} text-right`}>{fmtCellCurrency(d.annMaint)}</td>
                <td className={`${tdClass} text-right`}>{fmtCellNumber(asset.facilitySqft)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtCell(asset.assessmentDate)}</td>
                <td className={`${tdClass} text-center`}>{fmtCell(asset.energyImpact)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thClass =
  "sticky top-0 border-b border-border bg-bg px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap";

const tdClass = "border-b border-border px-3 py-2.5 align-middle";
