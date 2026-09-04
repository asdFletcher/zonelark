"use client";

import { AssetGridTab } from "@/components/assets/AssetGridTab";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";

export default function GridPage() {
  const { assetSession, portfolio } = useDashboardContext();
  const activeBuilding = portfolio.buildings[0];

  return (
    <AssetGridTab
      assets={assetSession.assets}
      onImportCsv={assetSession.importCsv}
      status={assetSession.status}
      buildingId={activeBuilding?.id}
    />
  );
}
