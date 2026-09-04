"use client";

import { AssetSummary, fmtCurrency } from "@/lib/formatters";

interface SummaryBarProps {
  summary: AssetSummary;
}

export function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className="grid grid-cols-2 gap-px border-b border-border bg-border min-[701px]:grid-cols-4">
      <StatCard label="Total assets" value={String(summary.total)} />
      <StatCard label="Immediate action" value={String(summary.immediate)} variant="danger" />
      <StatCard label="Portfolio cost" value={fmtCurrency(summary.totalCost)} />
      <StatCard label="Avg FCA score" value={summary.avgFca} variant="good" />
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "danger" | "good";
}) {
  const valueClass = variant === "danger" ? "text-red-600" : variant === "good" ? "text-green" : "";

  return (
    <div className="bg-surface px-4 py-3">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-hint">{label}</div>
      <div className={`text-xl font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}
