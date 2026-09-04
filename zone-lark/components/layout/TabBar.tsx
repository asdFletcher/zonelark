"use client";

import { IconBuildingSkyscraper, IconCamera, IconHome, IconLayoutGrid } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardTab = "home" | "building" | "capture" | "grid";

const TABS: {
  id: DashboardTab;
  href: string;
  label: string;
  icon: typeof IconCamera;
}[] = [
  { id: "home", href: "/", label: "Home", icon: IconHome },
  {
    id: "building",
    href: "/portfolio",
    label: "Build Your Portfolio",
    icon: IconBuildingSkyscraper,
  },
  { id: "capture", href: "/capture", label: "Asset Capture", icon: IconCamera },
  { id: "grid", href: "/grid", label: "Asset Grid", icon: IconLayoutGrid },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-[90] flex gap-1 border-b border-border bg-surface px-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
              active ? "border-green text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
