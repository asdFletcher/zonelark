export type KpiTone = "neutral" | "good" | "warn" | "bad";

export interface KpiTileProps {
  label: string;
  value: string;
  delta?: string;
  tone?: KpiTone;
}

const TONE_CLASSES: Record<KpiTone, string> = {
  neutral: "text-text",
  good: "text-green",
  warn: "text-amber-600",
  bad: "text-red-600",
};

export function KpiTile({ label, value, delta, tone = "neutral" }: KpiTileProps) {
  return (
    <div className="kpi-tile">
      <p className="text-[10px] font-semibold uppercase tracking-[0.6px] text-hint">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
      {delta && <p className="mt-0.5 text-[11px] text-muted">{delta}</p>}
    </div>
  );
}
