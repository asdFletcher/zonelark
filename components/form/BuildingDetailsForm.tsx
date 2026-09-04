"use client";

import { IconPlus, IconX } from "@tabler/icons-react";

export interface BuildingFormValues {
  buildingName: string;
  buildingType: string;
  totalSqft: string;
  aboveGradeFloors: string;
  basementLevels: string;
  hasRoofLevel: boolean;
  buildDate: string;
  remodelDates: string[];
}

const BUILDING_TYPES = [
  "Healthcare",
  "Office",
  "Education",
  "Retail",
  "Industrial",
  "Multifamily",
  "Government",
  "Hospitality",
  "Mixed Use",
  "Other",
];

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

interface BuildingDetailsFormProps {
  values: BuildingFormValues;
  onChange: (values: BuildingFormValues) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-0.5 text-[11px] text-muted">{children}</div>;
}

export function BuildingDetailsForm({ values, onChange }: BuildingDetailsFormProps) {
  const set = <K extends keyof BuildingFormValues>(key: K, value: BuildingFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  const addRemodelDate = () => set("remodelDates", [...values.remodelDates, ""]);

  const updateRemodelDate = (index: number, value: string) => {
    const next = values.remodelDates.slice();
    next[index] = value;
    set("remodelDates", next);
  };

  const removeRemodelDate = (index: number) => {
    set(
      "remodelDates",
      values.remodelDates.filter((_, i) => i !== index),
    );
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div className="mb-2.5">
          <FieldLabel>Building name</FieldLabel>
          <input
            type="text"
            value={values.buildingName}
            onChange={(e) => set("buildingName", e.target.value)}
            placeholder="e.g. Riverside Medical Center"
            className={fieldClass}
          />
        </div>
        <div className="mb-2.5">
          <FieldLabel>Building type</FieldLabel>
          <select
            value={values.buildingType}
            onChange={(e) => set("buildingType", e.target.value)}
            className={fieldClass}
          >
            <option value="">— select —</option>
            {BUILDING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2.5 col-span-2">
          <FieldLabel>Total square footage</FieldLabel>
          <input
            type="number"
            min={0}
            value={values.totalSqft}
            onChange={(e) => set("totalSqft", e.target.value)}
            placeholder="e.g. 85000"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="mb-2.5">
          <FieldLabel>Above-grade floors</FieldLabel>
          <input
            type="number"
            min={0}
            value={values.aboveGradeFloors}
            onChange={(e) => set("aboveGradeFloors", e.target.value)}
            placeholder="e.g. 4"
            className={fieldClass}
          />
        </div>
        <div className="mb-2.5">
          <FieldLabel>Basement levels</FieldLabel>
          <input
            type="number"
            min={0}
            value={values.basementLevels}
            onChange={(e) => set("basementLevels", e.target.value)}
            placeholder="e.g. 1"
            className={fieldClass}
          />
        </div>
        <div className="mb-2.5 flex items-end pb-2">
          <label className="flex items-center gap-1.5 text-[13px] text-text">
            <input
              type="checkbox"
              checked={values.hasRoofLevel}
              onChange={(e) => set("hasRoofLevel", e.target.checked)}
              className="h-3.5 w-3.5 accent-green"
            />
            Roof level
          </label>
        </div>
      </div>

      <div className="mb-2.5">
        <FieldLabel>Build date</FieldLabel>
        <input
          type="date"
          value={values.buildDate}
          onChange={(e) => set("buildDate", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="mb-2.5">
        <FieldLabel>Remodel / renovation dates</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {values.remodelDates.map((date, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="date"
                value={date}
                onChange={(e) => updateRemodelDate(i, e.target.value)}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => removeRemodelDate(i)}
                className="shrink-0 text-hint transition-colors hover:text-text"
                aria-label="Remove remodel date"
              >
                <IconX size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRemodelDate}
            className="flex w-fit items-center gap-1 text-[12px] font-medium text-green hover:underline"
          >
            <IconPlus size={14} />
            Add remodel date
          </button>
        </div>
      </div>
    </div>
  );
}
