"use client";

import { DashboardProvider, useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { TabBar } from "@/components/layout/TabBar";
import { TopBar } from "@/components/layout/TopBar";

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { serverHealth } = useDashboardContext();
  return (
    <div className="flex min-h-full flex-col bg-bg text-text">
      <TopBar serverOnline={serverHealth.online} />
      <TabBar />
      {children}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </DashboardProvider>
  );
}
