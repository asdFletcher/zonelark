"use client";

import { useMemo } from "react";

import { CURRENT_YEAR } from "@/lib/config";
import { AssetRecord } from "@/lib/schemas";

interface BathtubCurveChartProps {
  assets: AssetRecord[];
  selectedIndices: Set<number>;
}

const DOMAIN_MAX = 1.3; // plot out to 130% of useful life

/** Four-phase asset lifecycle model (FCA scoring / capital planning), each spanning up to `end`. */
interface LifecyclePhase {
  key: string;
  label: string;
  shortLabel: string;
  end: number; // upper bound of this phase, as a fraction of expected life
  color: string;
}

const PHASES: LifecyclePhase[] = [
  {
    key: "new",
    label: "New / Commissioning (Validation)",
    shortLabel: "New / Commissioning",
    end: 0.15,
    color: "#3b82f6",
  },
  {
    key: "stable",
    label: "Stable / Reliable Operation (Optimization)",
    shortLabel: "Stable / Reliable",
    end: 0.6,
    color: "#1d9e75",
  },
  {
    key: "planning",
    label: "Replacement Planning / Capital Prioritization",
    shortLabel: "Replacement Planning",
    end: 1,
    color: "#f59e0b",
  },
  {
    key: "failure",
    label: "Failure / Replacement Execution",
    shortLabel: "Failure / Replacement",
    end: DOMAIN_MAX,
    color: "#dc2626",
  },
];

// Where capital planning is supposed to start — Replacement Planning's explicit focus is
// forecasting capital needs and evaluating repair vs. replacement, so the "Plan for
// replacement" line marks the Stable → Planning boundary.
const WEAROUT_START = PHASES[1].end;

const W = 860;
const H = 300;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

/** Classic bathtub shape: high infant-mortality risk, flat useful-life floor, rising wear-out risk. */
function bathtubRisk(x: number): number {
  const baseline = 0.15;
  const infant = Math.exp(-16 * x);
  const wearout = 0.3 * Math.exp(4.2 * (x - 1));
  return baseline + infant + wearout;
}

function phaseForX(x: number): LifecyclePhase {
  return PHASES.find((phase) => x < phase.end) ?? PHASES[PHASES.length - 1];
}

const approxTextWidth = (text: string) => text.length * 5.6;

/**
 * Picks which side of a vertical reference line a label should sit on. Each reference line
 * spans the full plot height, so a label fixed to one side can end up crossing a *different*
 * line if that line happens to fall close by — this checks the other lines' pixel positions
 * and flips the label to whichever side has room, instead of always defaulting to one side.
 */
function pickLabelSide(
  px: number,
  text: string,
  otherPx: number[],
  leftEdge: number,
  rightEdge: number,
): "start" | "end" {
  const width = approxTextWidth(text) + 8;
  const leftLimit = Math.max(leftEdge, ...otherPx.filter((o) => o < px));
  const rightLimit = Math.min(rightEdge, ...otherPx.filter((o) => o > px));
  const roomRight = rightLimit - px;
  const roomLeft = px - leftLimit;
  if (roomRight >= width) return "start";
  if (roomLeft >= width) return "end";
  return roomRight >= roomLeft ? "start" : "end";
}

/** Reference-line label with a halo behind the glyphs so it stays legible over any line, curve, or zone fill it crosses. */
function LineLabel({
  x,
  y,
  anchor,
  color,
  children,
}: {
  x: number;
  y: number;
  anchor: "start" | "end" | "middle";
  color: string;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={9}
      fill={color}
      textAnchor={anchor}
      className="uppercase tracking-wide"
      stroke="var(--color-surface)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  );
}

/**
 * Zone asset-count label — deliberately styled unlike `LineLabel` (bold, larger, mixed-case,
 * no letter-tracking) so a "how many assets" figure doesn't read as just another timeline
 * marker like "Today" or "Expected replacement".
 */
function ZoneCountLabel({
  x,
  y,
  color,
  children,
}: {
  x: number;
  y: number;
  color: string;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={13}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      stroke="var(--color-surface)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  );
}

const xScale = (x: number) => PAD_L + (x / DOMAIN_MAX) * PLOT_W;

interface PlottedAsset {
  idx: number;
  asset: AssetRecord;
  x: number;
  rawPct: number;
  y: number;
}

export function BathtubCurveChart({ assets, selectedIndices }: BathtubCurveChartProps) {
  const { curvePoints, points, maxY, refInstallYear, refLife } = useMemo(() => {
    const steps = 130;
    const curvePoints: { x: number; y: number }[] = [];
    let maxY = 0;
    for (let i = 0; i <= steps; i++) {
      const x = (DOMAIN_MAX * i) / steps;
      const y = bathtubRisk(x);
      curvePoints.push({ x, y });
      if (y > maxY) maxY = y;
    }

    const points: PlottedAsset[] = [];
    let sumLife = 0;
    let sumInstall = 0;
    assets.forEach((asset, idx) => {
      const installYear = asset.installYear || CURRENT_YEAR;
      // Each asset's own FCA-assessed replacement date — not the generic industry-average
      // life for its asset type — drives its position, so condition (not just age) decides
      // how close a dot sits to the "expected replacement" line.
      const obsReplYr = asset.observedReplacementYear ?? CURRENT_YEAR + asset.observedLifeRemaining;
      const life = obsReplYr - installYear;
      if (life <= 0) return;
      const age = Math.max(0, CURRENT_YEAR - installYear);
      const rawPct = age / life;
      const x = Math.min(Math.max(rawPct, 0), DOMAIN_MAX);
      const y = bathtubRisk(x);
      points.push({ idx, asset, x, rawPct, y });
      sumLife += life;
      sumInstall += installYear;
      if (y > maxY) maxY = y;
    });

    // Representative install year + expected life for the plotted set, used to label
    // the x-axis in calendar years (0 = install year, 1.0 = expected replacement).
    const refLife = points.length ? sumLife / points.length : 25;
    const refInstallYear = points.length ? Math.round(sumInstall / points.length) : CURRENT_YEAR;

    return { curvePoints, points, maxY: maxY * 1.08, refInstallYear, refLife };
  }, [assets]);

  const yearForFraction = (t: number) => Math.round(refInstallYear + t * refLife);

  // Where "today" (CURRENT_YEAR) falls on the shared calendar-year x-axis, using the
  // same install-year/life reference the axis tick labels are derived from.
  const todayFraction = refLife > 0 ? (CURRENT_YEAR - refInstallYear) / refLife : 0;
  const todayX = Math.min(Math.max(todayFraction, 0), DOMAIN_MAX);

  const yScale = (y: number) => PAD_T + PLOT_H - (y / maxY) * PLOT_H;

  const curvePath = curvePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
    .join(" ");

  const xTicks = [0, 0.25, 0.5, 0.75, 1, 1.25];
  const hasSelection = selectedIndices.size > 0;
  const showLabels = hasSelection && selectedIndices.size <= 8;

  const phaseCounts = new Map<string, number>(PHASES.map((phase) => [phase.key, 0]));
  points.forEach((p) => {
    const phase = phaseForX(p.x);
    phaseCounts.set(phase.key, (phaseCounts.get(phase.key) ?? 0) + 1);
  });

  // Pixel positions of the three vertical reference lines, and which side each label should
  // sit on so it never spans across one of the other lines.
  const pxExpected = xScale(1);
  const pxPlanning = xScale(WEAROUT_START);
  const pxToday = xScale(todayX);
  const leftEdge = PAD_L;
  const rightEdge = PAD_L + PLOT_W;

  const expectedText = "Expected replacement";
  const planningText = `Plan for replacement — ${yearForFraction(WEAROUT_START)}`;
  const todayText = "Today";

  const expectedSide = pickLabelSide(
    pxExpected,
    expectedText,
    [pxPlanning, pxToday],
    leftEdge,
    rightEdge,
  );
  const planningSide = pickLabelSide(
    pxPlanning,
    planningText,
    [pxExpected, pxToday],
    leftEdge,
    rightEdge,
  );
  const todaySide = pickLabelSide(
    pxToday,
    todayText,
    [pxExpected, pxPlanning],
    leftEdge,
    rightEdge,
  );

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Asset bathtub curve">
        {/* Zone backgrounds — one per lifecycle phase, with an asset count at the top */}
        {PHASES.map((phase, i) => {
          const start = i === 0 ? 0 : PHASES[i - 1].end;
          const centerX = (xScale(start) + xScale(phase.end)) / 2;
          const count = phaseCounts.get(phase.key) ?? 0;
          return (
            <g key={phase.key}>
              <rect
                x={xScale(start)}
                y={PAD_T}
                width={xScale(phase.end) - xScale(start)}
                height={PLOT_H}
                fill={phase.color}
                opacity={0.22}
              />
              <ZoneCountLabel x={centerX} y={PAD_T + 16} color={phase.color}>
                {`${count} Asset${count === 1 ? "" : "s"}`}
              </ZoneCountLabel>
            </g>
          );
        })}

        {/* Expected-replacement line */}
        <line
          x1={pxExpected}
          y1={PAD_T}
          x2={pxExpected}
          y2={PAD_T + PLOT_H}
          stroke="var(--color-muted)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <LineLabel
          x={expectedSide === "start" ? pxExpected + 4 : pxExpected - 4}
          y={PAD_T + 26}
          anchor={expectedSide}
          color="var(--color-muted)"
        >
          {expectedText}
        </LineLabel>

        {/* Plan-for-replacement line — start of the Replacement Planning phase */}
        <line
          x1={pxPlanning}
          y1={PAD_T}
          x2={pxPlanning}
          y2={PAD_T + PLOT_H}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <LineLabel
          x={planningSide === "start" ? pxPlanning + 4 : pxPlanning - 4}
          y={PAD_T + 38}
          anchor={planningSide}
          color="#f59e0b"
        >
          {planningText}
        </LineLabel>

        {/* Today line */}
        <line
          x1={pxToday}
          y1={PAD_T}
          x2={pxToday}
          y2={PAD_T + PLOT_H}
          stroke="var(--color-navy)"
          strokeWidth={1.5}
        />
        <LineLabel
          x={todaySide === "start" ? pxToday + 4 : pxToday - 4}
          y={PAD_T + 50}
          anchor={todaySide}
          color="var(--color-navy)"
        >
          {todayText}
        </LineLabel>

        {/* Axes */}
        <line
          x1={PAD_L}
          y1={PAD_T + PLOT_H}
          x2={PAD_L + PLOT_W}
          y2={PAD_T + PLOT_H}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {xTicks.map((t) => (
          <g key={t}>
            <line
              x1={xScale(t)}
              y1={PAD_T + PLOT_H}
              x2={xScale(t)}
              y2={PAD_T + PLOT_H + 4}
              stroke="var(--color-border)"
            />
            <text
              x={xScale(t)}
              y={PAD_T + PLOT_H + 16}
              fontSize={9.5}
              fill="var(--color-muted)"
              textAnchor="middle"
            >
              {yearForFraction(t)}
            </text>
          </g>
        ))}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 4}
          fontSize={10}
          fill="var(--color-hint)"
          textAnchor="middle"
          className="uppercase tracking-wide"
        >
          Calendar year
        </text>
        <text
          x={14}
          y={PAD_T + PLOT_H / 2}
          fontSize={10}
          fill="var(--color-hint)"
          textAnchor="middle"
          className="uppercase tracking-wide"
          transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
        >
          Relative failure risk
        </text>

        {/* Bathtub curve */}
        <path d={curvePath} fill="none" stroke="var(--color-navy)" strokeWidth={2} opacity={0.55} />

        {/* Asset markers */}
        {points.map((p) => {
          const isSelected = !hasSelection || selectedIndices.has(p.idx);
          const jitter = ((p.idx * 13) % 9) - 4;
          const cy = yScale(p.y) + jitter;
          const cx = xScale(p.x);
          const r = hasSelection ? (isSelected ? 6.5 : 3) : 5;
          const opacity = hasSelection ? (isSelected ? 1 : 0.2) : 0.85;
          const pctRemaining = Math.round((1 - p.rawPct) * 100);
          const phase = phaseForX(p.x);
          const label = `${p.asset.assetName || p.asset.assetType} (${p.asset.cmmsId || "no ID"}) — ${pctRemaining}% of expected life remaining — ${phase.shortLabel}`;

          return (
            <g key={p.idx}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={phase.color}
                stroke="var(--color-surface)"
                strokeWidth={1.25}
                opacity={opacity}
              >
                <title>{label}</title>
              </circle>
              {showLabels && isSelected && (
                <text
                  x={cx}
                  y={cy - r - 4}
                  fontSize={9}
                  fill="var(--color-text)"
                  textAnchor="middle"
                >
                  {p.asset.assetName || p.asset.assetType}
                </text>
              )}
            </g>
          );
        })}

        {/* Plot border — marks the chart edges */}
        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={1.5}
        />
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {PHASES.map((phase, i) => (
          <LegendDot
            key={phase.key}
            color={phase.color}
            label={`${i + 1}. ${phase.shortLabel}`}
            title={phase.label}
          />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label, title }: { color: string; label: string; title?: string }) {
  return (
    <span className="flex items-center gap-1.5" title={title}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
