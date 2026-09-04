import { KpiTile } from "@/components/dashboard/KpiTile";
import { fmtCurrency } from "@/lib/formatters";
import { AssetSummary } from "@/lib/formatters";

interface KpiGridProps {
  summary: AssetSummary | null;
}

/**
 * Sourced from the existing lib/formatters.ts computeSummary() today — the same 4 numbers the
 * old SummaryBar showed. Once Phase 4's metric_snapshots exist, swap the data source here without
 * touching KpiTile's {label, value, delta, tone} shape.
 */
export function KpiGrid({ summary }: KpiGridProps) {
  const total = summary?.total ?? 0;
  const immediate = summary?.immediate ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4">
      <KpiTile label="Assets Tracked" value={String(total)} />
      <KpiTile
        label="Needs Immediate Action"
        value={String(immediate)}
        tone={immediate > 0 ? "bad" : "good"}
        delta={total > 0 ? `${Math.round((immediate / total) * 100)}% of portfolio` : undefined}
      />
      <KpiTile label="Replacement Backlog" value={summary ? fmtCurrency(summary.totalCost) : "—"} />
      <KpiTile label="Avg Condition (FCA)" value={summary?.avgFca ?? "—"} />
    </div>
  );
}
