"use client";

import { IconArrowRight, IconLayoutGrid } from "@tabler/icons-react";
import Link from "next/link";

interface PortfolioStatusHeroProps {
  portfolioName: string;
  buildingCount: number;
  assetCount: number;
  immediateActionCount: number;
}

export function PortfolioStatusHero({
  portfolioName,
  buildingCount,
  assetCount,
  immediateActionCount,
}: PortfolioStatusHeroProps) {
  const headline =
    assetCount === 0
      ? "No assets logged yet — start with Asset Capture."
      : immediateActionCount > 0
        ? `${immediateActionCount} asset${immediateActionCount === 1 ? "" : "s"} need${immediateActionCount === 1 ? "s" : ""} immediate attention.`
        : "All tracked assets are in acceptable condition.";

  const cta = immediateActionCount > 0 ? "Review Asset Grid" : "Open Asset Grid";

  return (
    <div className="glass-card flex flex-col gap-3 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.7px] text-hint">
        {portfolioName.trim() || "Your Organization"}
      </p>
      <p className="text-xl font-semibold text-text">{headline}</p>
      <p className="text-[13px] text-muted">
        {buildingCount} building{buildingCount === 1 ? "" : "s"} · {assetCount} asset
        {assetCount === 1 ? "" : "s"} tracked — remote visibility, no site visit required.
      </p>
      <Link
        href="/grid"
        className="mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/15"
      >
        <IconLayoutGrid size={16} />
        {cta}
        <IconArrowRight size={14} />
      </Link>
    </div>
  );
}
