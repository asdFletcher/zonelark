"use client";

import { BuildingSystemsPanel } from "@/components/dashboard/BuildingSystemsPanel";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { FacilitiesPerformancePanel } from "@/components/dashboard/FacilitiesPerformancePanel";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { PortfolioStatusHero } from "@/components/dashboard/PortfolioStatusHero";
import { computeSummary, isImmediateAction } from "@/lib/formatters";

export default function HomePage() {
  const { assetSession, portfolio } = useDashboardContext();
  const { assets } = assetSession;
  const summary = assets.length > 0 ? computeSummary(assets) : null;
  const immediateActionCount = assets.filter(isImmediateAction).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-5">
      <PortfolioStatusHero
        portfolioName={portfolio.portfolioName}
        buildingCount={portfolio.buildings.length}
        assetCount={assets.length}
        immediateActionCount={immediateActionCount}
      />
      <KpiGrid summary={summary} />
      <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2">
        <BuildingSystemsPanel assets={assets} />
        <FacilitiesPerformancePanel />
      </div>
    </div>
  );
}
