"use client";

export interface AssetFormValues {
  facilityName: string;
  facilityType: string;
  facilitySqft: string;
  cmmsId: string;
  facilityLevel: string;
  operationalStatus: string;
  installDate: string;
  room: string;
  notes: string;
}

export const EMPTY_FORM: AssetFormValues = {
  facilityName: "",
  facilityType: "",
  facilitySqft: "",
  cmmsId: "",
  facilityLevel: "",
  operationalStatus: "Operational",
  installDate: "",
  room: "",
  notes: "",
};

const FLOOR_LEVELS = [
  "Sub-Basement",
  "Basement",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "5th Floor",
  "6th Floor",
  "7th Floor",
  "8th Floor",
  "Mezzanine",
  "Penthouse",
  "Roof Level",
  "Rooftop Mechanical",
];

const OPERATIONAL_STATUSES = [
  "Operational",
  "Impaired",
  "Non-Operational",
  "Standby",
  "Decommissioned",
  "Unknown",
];

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

interface AssetDetailsFormProps {
  values: AssetFormValues;
  onChange: (values: AssetFormValues) => void;
  /** Building names from the portfolio, shown in the Building name dropdown. */
  buildingOptions: string[];
  selectedBuilding: number;
  onSelectBuilding: (index: number) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-0.5 text-[11px] text-muted">{children}</div>;
}

export function AssetDetailsForm({
  values,
  onChange,
  buildingOptions,
  selectedBuilding,
  onSelectBuilding,
}: AssetDetailsFormProps) {
  const set = (key: keyof AssetFormValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 mb-2.5">
          <FieldLabel>Facility name</FieldLabel>
          <input
            type="text"
            value={values.facilityName}
            onChange={(e) => set("facilityName", e.target.value)}
            placeholder="e.g. Riverside Medical"
            className={fieldClass}
          />
        </div>
        <div className="col-span-2 mb-2.5">
          <FieldLabel>Building name</FieldLabel>
          <select
            value={selectedBuilding}
            onChange={(e) => onSelectBuilding(Number(e.target.value))}
            className={fieldClass}
          >
            {buildingOptions.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2.5">
          <FieldLabel>Room name / number</FieldLabel>
          <input
            type="text"
            value={values.room}
            onChange={(e) => set("room", e.target.value)}
            placeholder="e.g. B-101 Mechanical Room"
            className={fieldClass}
          />
        </div>
        <div className="mb-2.5">
          <FieldLabel>Asset / CMMS ID</FieldLabel>
          <input
            type="text"
            value={values.cmmsId}
            onChange={(e) => set("cmmsId", e.target.value)}
            placeholder="e.g. AHU-001"
            className={fieldClass}
          />
        </div>
        <div className="mb-2.5">
          <FieldLabel>Floor / level</FieldLabel>
          <select
            value={values.facilityLevel}
            onChange={(e) => set("facilityLevel", e.target.value)}
            className={fieldClass}
          >
            <option value="">— select —</option>
            {FLOOR_LEVELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2.5">
          <FieldLabel>Operational status</FieldLabel>
          <select
            value={values.operationalStatus}
            onChange={(e) => set("operationalStatus", e.target.value)}
            className={fieldClass}
          >
            <option value="">— select —</option>
            {OPERATIONAL_STATUSES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2.5">
        <FieldLabel>Install / activation year</FieldLabel>
        <input
          type="number"
          min={1800}
          max={2100}
          step={1}
          value={values.installDate}
          onChange={(e) => set("installDate", e.target.value)}
          placeholder="e.g. 2015"
          className={fieldClass}
        />
      </div>
      <div className="mb-2.5">
        <FieldLabel>Assessment notes</FieldLabel>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Describe observed condition..."
          className={`${fieldClass} min-h-16 resize-y`}
        />
      </div>
    </div>
  );
}
