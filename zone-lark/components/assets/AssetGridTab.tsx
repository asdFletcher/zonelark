"use client";

import { useMemo, useState } from "react";

import { AssetTable } from "@/components/assets/AssetTable";
import { BathtubCurveChart } from "@/components/assets/BathtubCurveChart";
import { CsvDropZone } from "@/components/assets/CsvDropZone";
import { EmptyState } from "@/components/assets/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { StatusMessage as StatusMessageType } from "@/hooks/useAssetSession";
import { getUniformat } from "@/lib/config";
import { AssetRecord } from "@/lib/schemas";

const ALL_FACILITIES = "__all__";
const ALL_CATEGORIES = "__all_categories__";

interface AssetGridTabProps {
  assets: AssetRecord[];
  onImportCsv: (file: File, buildingId?: string) => void;
  status: StatusMessageType | null;
  buildingId?: string;
}

export function AssetGridTab({ assets, onImportCsv, status, buildingId }: AssetGridTabProps) {
  const handleImport = (file: File) => onImportCsv(file, buildingId);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [facilityFilter, setFacilityFilter] = useState(ALL_FACILITIES);
  const [uniformatFilter, setUniformatFilter] = useState(ALL_CATEGORIES);
  const [showAllAssets, setShowAllAssets] = useState(false);

  const facilityNames = useMemo(
    () =>
      Array.from(new Set(assets.map((a) => a.facilityName).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [assets],
  );

  // Only categories that at least one logged asset actually falls within.
  const uniformatCategories = useMemo(
    () =>
      Array.from(new Set(assets.map((a) => getUniformat(a)))).sort((a, b) => a.localeCompare(b)),
    [assets],
  );

  const filteredAssets = useMemo(
    () =>
      showAllAssets
        ? assets
        : assets.filter(
            (a) =>
              (facilityFilter === ALL_FACILITIES || a.facilityName === facilityFilter) &&
              (uniformatFilter === ALL_CATEGORIES || getUniformat(a) === uniformatFilter),
          ),
    [assets, facilityFilter, uniformatFilter, showAllAssets],
  );

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === filteredAssets.length ? new Set() : new Set(filteredAssets.map((_, i) => i)),
    );
  };

  const handleFacilityChange = (value: string) => {
    setFacilityFilter(value);
    setSelected(new Set());
  };

  const handleUniformatChange = (value: string) => {
    setUniformatFilter(value);
    setSelected(new Set());
  };

  const handleShowAllChange = (checked: boolean) => {
    setShowAllAssets(checked);
    setSelected(new Set());
  };

  if (assets.length === 0) {
    return (
      <div className="flex flex-col gap-3.5 p-5">
        <CsvDropZone onFileSelect={handleImport} />
        {status && <StatusMessage message={status.text} type={status.type} />}
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-2.5">
        <CsvDropZone onFileSelect={handleImport} />
        {status && <StatusMessage message={status.text} type={status.type} />}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <label htmlFor="facility-filter" className="text-[11px] font-medium text-muted">
            Facility
          </label>
          <select
            id="facility-filter"
            value={facilityFilter}
            onChange={(e) => handleFacilityChange(e.target.value)}
            disabled={showAllAssets}
            className="min-w-[200px] rounded-[7px] border border-border bg-bg px-2.5 py-1.5 text-[13px] text-text outline-none transition-[border-color] focus:border-green disabled:opacity-50"
          >
            <option value={ALL_FACILITIES}>All facilities</option>
            {facilityNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <label htmlFor="uniformat-filter" className="text-[11px] font-medium text-muted">
            Uniformat
          </label>
          <select
            id="uniformat-filter"
            value={uniformatFilter}
            onChange={(e) => handleUniformatChange(e.target.value)}
            disabled={showAllAssets}
            className="min-w-[200px] rounded-[7px] border border-border bg-bg px-2.5 py-1.5 text-[13px] text-text outline-none transition-[border-color] focus:border-green disabled:opacity-50"
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {uniformatCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[13px] text-text">
            <input
              type="checkbox"
              checked={showAllAssets}
              onChange={(e) => handleShowAllChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-green"
            />
            Show every asset
          </label>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
            Asset Life Cycle — Bathtub Curve
          </p>
          <p className="text-[12px] text-muted">
            {selected.size === 0
              ? `Showing all ${filteredAssets.length} asset${filteredAssets.length === 1 ? "" : "s"}`
              : `${selected.size} of ${filteredAssets.length} highlighted`}
          </p>
        </div>
        {filteredAssets.length > 0 ? (
          <BathtubCurveChart assets={filteredAssets} selectedIndices={selected} />
        ) : (
          <p className="py-10 text-center text-[13px] text-hint">
            No assets logged for this facility yet.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
            Asset Grid — select rows to highlight on the curve above
          </p>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[12px] font-medium text-green hover:underline"
          >
            {selected.size === filteredAssets.length ? "Clear selection" : "Select all"}
          </button>
        </div>
        <AssetTable
          assets={filteredAssets}
          selectable
          selectedIndices={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          boundedHeight
        />
      </div>
    </div>
  );
}
