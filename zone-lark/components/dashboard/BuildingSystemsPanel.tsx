"use client";

import { useState } from "react";

import { AssetTable } from "@/components/assets/AssetTable";
import { BathtubCurveChart } from "@/components/assets/BathtubCurveChart";
import { EmptyState } from "@/components/assets/EmptyState";
import { AssetRecord } from "@/lib/schemas";

interface BuildingSystemsPanelProps {
  assets: AssetRecord[];
}

/**
 * "Building Systems" twin module — physical asset/CMMS condition telemetry. Reuses AssetTable and
 * BathtubCurveChart as-is (internals unchanged, still the four-phase lifecycle model computed
 * client-side); once Phase 3 syncs live CMMS work orders, those surface here alongside FCA data.
 */
export function BuildingSystemsPanel({ assets }: BuildingSystemsPanelProps) {
  const [selected] = useState<Set<number>>(new Set());

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
        Building Systems
      </p>
      {assets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <BathtubCurveChart assets={assets} selectedIndices={selected} />
          <AssetTable assets={assets.slice(0, 8)} boundedHeight />
        </>
      )}
    </div>
  );
}
