"use client";

import { createContext, useContext } from "react";

import { useAssetSession } from "@/hooks/useAssetSession";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useServerHealth } from "@/hooks/useServerHealth";

type AssetSession = ReturnType<typeof useAssetSession>;
type Portfolio = ReturnType<typeof usePortfolio>;
type ServerHealth = ReturnType<typeof useServerHealth>;

interface DashboardContextValue {
  assetSession: AssetSession;
  portfolio: Portfolio;
  serverHealth: ServerHealth;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * Now that the four dashboard tabs are real routes (app/(dashboard)/**), each page mounts
 * separately — calling useAssetSession()/usePortfolio() per-page would lose state on navigation
 * (e.g. assets logged in Capture disappearing from Grid). This provider calls them once at the
 * shared layout and exposes them via context instead.
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const assetSession = useAssetSession();
  const portfolio = usePortfolio();
  const serverHealth = useServerHealth();

  return (
    <DashboardContext.Provider value={{ assetSession, portfolio, serverHealth }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardContext must be used within DashboardProvider");
  return ctx;
}
