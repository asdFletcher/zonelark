"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";

import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { BuildingDetailsForm } from "@/components/form/BuildingDetailsForm";
import { StatusMessage } from "@/components/ui/StatusMessage";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
      {children}
    </p>
  );
}

export default function PortfolioPage() {
  const { portfolio } = useDashboardContext();
  const {
    portfolioName,
    setPortfolioName,
    buildings,
    addBuilding,
    updateBuilding,
    removeBuilding,
    error,
  } = portfolio;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-5">
      <div className="rounded-lg border border-border bg-surface p-5">
        <SectionLabel>Portfolio</SectionLabel>
        <div className="mb-0.5 text-[11px] text-muted">Portfolio name</div>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          placeholder="e.g. Northeast Region Portfolio"
          className="w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green"
        />
        {error && <StatusMessage message={error} type="err" />}
      </div>
      {buildings.map((building, i) => (
        <div key={building.id} className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-2.5 flex items-center justify-between">
            <SectionLabel>
              {buildings.length > 1 ? `Building ${i + 1}` : "Building Details"}
            </SectionLabel>
            {buildings.length > 1 && (
              <button
                type="button"
                onClick={() => removeBuilding(building.id)}
                className="-mt-2 shrink-0 text-hint transition-colors hover:text-text"
                aria-label={`Remove building ${i + 1}`}
              >
                <IconTrash size={16} />
              </button>
            )}
          </div>
          <BuildingDetailsForm
            values={building}
            onChange={(values) => updateBuilding(building.id, values)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addBuilding}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-surface py-3 text-[13px] font-medium text-green transition-colors hover:border-green hover:bg-green/[0.04]"
      >
        <IconPlus size={16} />
        Add building
      </button>
    </div>
  );
}
