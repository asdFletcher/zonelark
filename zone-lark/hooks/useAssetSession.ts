"use client";

import { useCallback, useState } from "react";

import { AssetFormValues } from "@/components/form/AssetDetailsForm";
import { EMPTY_EXTRACTED, ExtractedAssetValues } from "@/components/form/ExtractedAssetForm";
import { parseCsv, rowsToAssets } from "@/lib/csvImport";
import { DEMO_ASSETS } from "@/lib/demoData";
import { preprocessImage } from "@/hooks/useImagePreprocess";
import { AssetRecord } from "@/lib/schemas";

export interface StatusMessage {
  text: string;
  type: "ok" | "err";
}

function assetToExtracted(asset: AssetRecord): ExtractedAssetValues {
  return {
    assetName: asset.assetName || "",
    assetType: asset.assetType || "",
    manufacturer: asset.manufacturer || "",
    modelNumber: asset.modelNumber || "",
    serialNumber: asset.serialNumber || "",
    installYear: asset.installYear ? String(asset.installYear) : "",
    roomNumber: asset.roomNumber || "",
    roomName: asset.roomName || "",
    areaServed: asset.areaServed || "",
    assetSize: asset.assetSize || "",
    fcaScore: asset.fcaScore ? String(asset.fcaScore) : "",
  };
}

function mergeAssetOverrides(
  pending: AssetRecord,
  extracted: ExtractedAssetValues,
  notes?: string,
): AssetRecord {
  const final: AssetRecord = { ...pending };

  const str = (v: string) => v || undefined;
  const num = (v: string) => {
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const overrides: Partial<AssetRecord> = {
    assetName: str(extracted.assetName),
    assetType: str(extracted.assetType),
    manufacturer: str(extracted.manufacturer),
    modelNumber: str(extracted.modelNumber),
    serialNumber: str(extracted.serialNumber),
    installYear: num(extracted.installYear),
    roomNumber: str(extracted.roomNumber),
    roomName: str(extracted.roomName),
    areaServed: str(extracted.areaServed),
    assetSize: str(extracted.assetSize),
    fcaScore: num(extracted.fcaScore),
    notes: notes || undefined,
  };

  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) {
      (final as Record<string, unknown>)[k] = v;
    }
  }

  return final;
}

export function useAssetSession() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pendingAsset, setPendingAsset] = useState<AssetRecord | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [extracted, setExtracted] = useState<ExtractedAssetValues>(EMPTY_EXTRACTED);
  const [assessing, setAssessing] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const addFiles = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const resetExtracted = useCallback(() => {
    setExtracted(EMPTY_EXTRACTED);
  }, []);

  const populateFromAsset = useCallback((asset: AssetRecord) => {
    setExtracted(assetToExtracted(asset));
  }, []);

  const clearAssets = useCallback(() => {
    setAssets([]);
    setJobId(null);
    setPendingAsset(null);
    resetExtracted();
    setStatus(null);
  }, [resetExtracted]);

  const runAssess = useCallback(
    async (form: AssetFormValues, buildingId?: string) => {
      setAssessing(true);
      setStatus(null);
      setPendingAsset(null);
      resetExtracted();
      try {
        if (selectedFiles.length) {
          if (!buildingId) throw new Error("select a building first");
          const body = new FormData();
          for (let i = 0; i < selectedFiles.length; i++) {
            const processedBlob = await preprocessImage(selectedFiles[i]);
            body.append("field_photos", processedBlob, `photo-${i + 1}.jpg`);
          }
          body.append("building_id", buildingId);
          body.append("facility_name", form.facilityName || "Unknown Facility");
          body.append("facility_type", form.facilityType || "Other");
          body.append("facility_sqft", form.facilitySqft || "0");
          body.append("facility_level", form.facilityLevel || "");
          body.append("floor_id", "01");
          body.append("assessment_date", new Date().toISOString().slice(0, 10));
          body.append("cmms_id", form.cmmsId || "");
          body.append("operational_status", form.operationalStatus || "");
          body.append("notes", form.notes || "");

          const res = await fetch("/api/assess/upload", { method: "POST", body });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || `Server error ${res.status}`);
          }
          const result = await res.json();
          const newJobId = result.job_id as string;
          setJobId(newJobId);

          const assetRes = await fetch(`/api/job/${newJobId}`).catch(() => null);
          const assetData = assetRes?.ok ? await assetRes.json() : null;
          const newAssets = (assetData?.assets ?? result.assets ?? []) as AssetRecord[];
          const first = newAssets[0] ?? null;
          setPendingAsset(first);
          if (first) populateFromAsset(first);
          setStatus({
            text: "Assessment complete — review details below, then upload to the log.",
            type: "ok",
          });
        } else {
          await new Promise((r) => setTimeout(r, 1000));
          const pick = DEMO_ASSETS[Math.floor(Math.random() * DEMO_ASSETS.length)];
          setJobId(`demo-${Date.now()}`);
          setPendingAsset(pick);
          populateFromAsset(pick);
          setStatus({
            text: "Demo mode — details populated, review and upload to log.",
            type: "ok",
          });
        }
        clearFiles();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "server offline";
        setStatus({
          text: `Assessment failed: ${message}.`,
          type: "err",
        });
      } finally {
        setAssessing(false);
      }
    },
    [selectedFiles, clearFiles, populateFromAsset, resetExtracted],
  );

  const confirmUploadToLog = useCallback(
    (formNotes: string) => {
      if (!pendingAsset) return;
      const finalAsset = mergeAssetOverrides(pendingAsset, extracted, formNotes || undefined);
      setAssets((prev) => [...prev, finalAsset]);
      setPendingAsset(null);
      resetExtracted();
      setStatus({ text: "Asset added to log.", type: "ok" });
    },
    [pendingAsset, extracted, resetExtracted],
  );

  const importCsv = useCallback(
    async (file: File, buildingId?: string) => {
      setStatus(null);
      if (!buildingId) {
        setStatus({ text: "Select a building before importing.", type: "err" });
        return;
      }
      const isExcel =
        /\.xlsx?$/i.test(file.name) ||
        file.type.includes("spreadsheetml") ||
        file.type === "application/vnd.ms-excel";
      const kind = isExcel ? "Excel" : "CSV";
      try {
        let rows: Record<string, string>[];
        if (isExcel) {
          // Excel is binary — parse it server-side into header-keyed rows.
          const body = new FormData();
          body.append("file", file);
          const parseRes = await fetch("/api/import/xlsx", { method: "POST", body });
          if (!parseRes.ok) {
            const err = await parseRes.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || `Server error ${parseRes.status}`);
          }
          const parsed = await parseRes.json();
          rows = (parsed.rows ?? []) as Record<string, string>[];
        } else {
          rows = parseCsv(await file.text());
        }

        if (rows.length === 0) {
          setStatus({ text: `${kind} file has no data rows.`, type: "err" });
          return;
        }

        const { assets: parsedAssets, errors } = rowsToAssets(rows);
        if (parsedAssets.length === 0) {
          setStatus({
            text: `No valid rows imported.${errors[0] ? ` ${errors[0]}` : ""}`,
            type: "err",
          });
          return;
        }

        const merged = [...assets, ...parsedAssets];
        const res = await fetch("/api/assess/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ building_id: buildingId, assets: merged }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || `Server error ${res.status}`);
        }
        const result = await res.json();
        setAssets(merged);
        setJobId(result.job_id as string);

        const skipped = errors.length;
        setStatus({
          text: `Imported ${parsedAssets.length} asset${parsedAssets.length === 1 ? "" : "s"} from ${kind}${
            skipped ? ` (${skipped} row${skipped === 1 ? "" : "s"} skipped)` : ""
          }.`,
          type: "ok",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "import failed";
        setStatus({ text: `${kind} import failed: ${message}.`, type: "err" });
      }
    },
    [assets],
  );

  const runExport = useCallback(async () => {
    if (!jobId) return;
    setStatus(null);
    try {
      const res = await fetch(`/api/export/${jobId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Zonelark_Export.xlsx";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setStatus({ text: "Export failed — run an assessment first.", type: "err" });
    }
  }, [jobId]);

  return {
    assets,
    jobId,
    pendingAsset,
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
    extracted,
    setExtracted,
    assessing,
    status,
    setStatus,
    clearAssets,
    runAssess,
    confirmUploadToLog,
    importCsv,
    runExport,
  };
}
