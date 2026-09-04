"use client";

import {
  IconBrain,
  IconClipboardCheck,
  IconFileSpreadsheet,
  IconLoader2,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { AssetLogHeader } from "@/components/assets/AssetLogHeader";
import { AssetTable } from "@/components/assets/AssetTable";
import { SummaryBar } from "@/components/assets/SummaryBar";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { AssetDetailsForm, EMPTY_FORM, AssetFormValues } from "@/components/form/AssetDetailsForm";
import { ExtractedAssetForm } from "@/components/form/ExtractedAssetForm";
import { MobileCameraButtons } from "@/components/upload/MobileCameraButtons";
import { PhotoDropZone } from "@/components/upload/PhotoDropZone";
import { PhotoPreviewGrid } from "@/components/upload/PhotoPreviewGrid";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { computeSummary } from "@/lib/formatters";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
      {children}
    </p>
  );
}

export default function CapturePage() {
  const { assetSession, portfolio } = useDashboardContext();
  const {
    assets,
    jobId,
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
    extracted,
    setExtracted,
    assessing,
    status,
    clearAssets,
    runAssess,
    confirmUploadToLog,
    pendingAsset,
    runExport,
  } = assetSession;
  const { portfolioName, buildings } = portfolio;

  const [form, setForm] = useState<AssetFormValues>(EMPTY_FORM);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(0);
  const [showStatus, setShowStatus] = useState(false);

  const activeIndex = buildings.length ? Math.min(selectedBuildingIndex, buildings.length - 1) : 0;
  const activeBuilding = buildings[activeIndex];
  const buildingLabels = buildings.map((b, i) => b.buildingName.trim() || `Building ${i + 1}`);

  useEffect(() => {
    if (!status) return;
    setShowStatus(true);
    if (status.type === "ok") {
      const t = setTimeout(() => setShowStatus(false), 3500);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    if (pendingAsset?.notes) {
      setForm((f) => ({ ...f, notes: pendingAsset.notes }));
    }
  }, [pendingAsset]);

  useEffect(() => {
    if (!activeBuilding) return;
    setForm((f) => ({
      ...f,
      facilityName: activeBuilding.buildingName,
      facilityType: activeBuilding.buildingType,
      facilitySqft: activeBuilding.totalSqft,
      installDate: activeBuilding.buildDate.slice(0, 4),
    }));
  }, [activeBuilding]);

  const summary = assets.length > 0 ? computeSummary(assets) : null;

  return (
    <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 min-[701px]:grid-cols-[340px_1fr]">
      <aside className="max-h-[calc(100vh-112px)] overflow-y-auto border-r border-border bg-surface p-5 min-[701px]:max-h-[calc(100vh-112px)] max-[700px]:max-h-none">
        {portfolioName.trim() && (
          <p className="mb-4 text-[15px] font-semibold text-text">{portfolioName}</p>
        )}
        <SectionLabel>Field Photos</SectionLabel>

        <PhotoDropZone onFilesAdd={addFiles} />
        <MobileCameraButtons onFilesAdd={addFiles} />
        <PhotoPreviewGrid files={selectedFiles} onRemove={removeFile} onClear={clearFiles} />

        <hr className="my-4 border-0 border-t border-border" />
        <SectionLabel>Asset Details</SectionLabel>
        <AssetDetailsForm
          values={form}
          onChange={setForm}
          buildingOptions={buildingLabels}
          selectedBuilding={activeIndex}
          onSelectBuilding={setSelectedBuildingIndex}
        />

        <hr className="my-4 border-0 border-t border-border" />
        <SectionLabel>Extracted Asset Data</SectionLabel>
        <ExtractedAssetForm values={extracted} onChange={setExtracted} disabled={!pendingAsset} />

        <hr className="my-4 border-0 border-t border-border" />
        <Button
          variant="primary"
          disabled={assessing}
          onClick={() => runAssess(form, activeBuilding?.id)}
        >
          {assessing ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              Assessing...
            </>
          ) : (
            <>
              <IconBrain size={16} />
              Run AI assessment
            </>
          )}
        </Button>
        <Button
          variant="confirm"
          className="mt-2"
          disabled={!pendingAsset}
          onClick={() => confirmUploadToLog(form.notes)}
        >
          <IconClipboardCheck size={16} />
          Add to asset log?
        </Button>
        <Button
          variant="export"
          className="mt-2"
          disabled={!jobId || assets.length === 0}
          onClick={runExport}
        >
          <IconFileSpreadsheet size={16} />
          Export to Excel
        </Button>
        {showStatus && status && <StatusMessage message={status.text} type={status.type} />}
      </aside>

      <section className="max-h-[calc(100vh-112px)] overflow-y-auto max-[700px]:max-h-none">
        <AssetLogHeader count={assets.length} onClear={clearAssets} />
        {summary && <SummaryBar summary={summary} />}
        <AssetTable assets={assets} />
      </section>
    </div>
  );
}
