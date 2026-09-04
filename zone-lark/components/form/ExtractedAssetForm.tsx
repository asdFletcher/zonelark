"use client";

import { APPROVED_ASSET_TYPES } from "@/lib/config";

export interface ExtractedAssetValues {
  assetName: string;
  assetType: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  installYear: string;
  roomNumber: string;
  roomName: string;
  areaServed: string;
  assetSize: string;
  fcaScore: string;
}

export const EMPTY_EXTRACTED: ExtractedAssetValues = {
  assetName: "",
  assetType: "",
  manufacturer: "",
  modelNumber: "",
  serialNumber: "",
  installYear: "",
  roomNumber: "",
  roomName: "",
  areaServed: "",
  assetSize: "",
  fcaScore: "",
};

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-0.5 text-[11px] text-muted">{children}</div>;
}

interface ExtractedAssetFormProps {
  values: ExtractedAssetValues;
  onChange: (values: ExtractedAssetValues) => void;
  disabled?: boolean;
}

export function ExtractedAssetForm({ values, onChange, disabled }: ExtractedAssetFormProps) {
  const set = (key: keyof ExtractedAssetValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <fieldset disabled={disabled} className="grid grid-cols-2 gap-2 disabled:opacity-60">
      <div className="mb-2.5">
        <FieldLabel>Asset name</FieldLabel>
        <input
          type="text"
          value={values.assetName}
          onChange={(e) => set("assetName", e.target.value)}
          placeholder="e.g. AHU-3"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Asset type</FieldLabel>
        <select
          value={values.assetType}
          onChange={(e) => set("assetType", e.target.value)}
          className={fieldClass}
        >
          <option value="">— select —</option>
          {APPROVED_ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2.5">
        <FieldLabel>Manufacturer</FieldLabel>
        <input
          type="text"
          value={values.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value)}
          placeholder="e.g. Carrier"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Model number</FieldLabel>
        <input
          type="text"
          value={values.modelNumber}
          onChange={(e) => set("modelNumber", e.target.value)}
          placeholder="e.g. 39MBB030"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Serial number</FieldLabel>
        <input
          type="text"
          value={values.serialNumber}
          onChange={(e) => set("serialNumber", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Install year</FieldLabel>
        <input
          type="number"
          value={values.installYear}
          onChange={(e) => set("installYear", e.target.value)}
          placeholder="e.g. 2015"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Room number</FieldLabel>
        <input
          type="text"
          value={values.roomNumber}
          onChange={(e) => set("roomNumber", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Room name</FieldLabel>
        <input
          type="text"
          value={values.roomName}
          onChange={(e) => set("roomName", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Area served</FieldLabel>
        <input
          type="text"
          value={values.areaServed}
          onChange={(e) => set("areaServed", e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Asset size</FieldLabel>
        <input
          type="text"
          value={values.assetSize}
          onChange={(e) => set("assetSize", e.target.value)}
          placeholder="e.g. 5 Ton"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>FCA score</FieldLabel>
        <select
          value={values.fcaScore}
          onChange={(e) => set("fcaScore", e.target.value)}
          className={fieldClass}
        >
          <option value="">— select —</option>
          <option value="1">1 — Failing</option>
          <option value="2">2 — Poor</option>
          <option value="3">3 — Fair</option>
          <option value="4">4 — Good</option>
          <option value="5">5 — Excellent</option>
        </select>
      </div>
    </fieldset>
  );
}
