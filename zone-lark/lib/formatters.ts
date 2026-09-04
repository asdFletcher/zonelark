import { CURRENT_YEAR, getRegistry, getUniformat } from "@/lib/config";
import { AssetRecord } from "@/lib/schemas";

export function fmtCurrency(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function fmtCellCurrency(v: number | undefined | null): string {
  return v ? fmtCurrency(v) : "—";
}

export function fmtCellNumber(v: number | undefined | null, maxFractionDigits = 0): string {
  return v !== null && v !== undefined
    ? Number(v).toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits })
    : "—";
}

export function fmtCell(v: string | number | undefined | null): string {
  return v !== null && v !== undefined && v !== "" ? String(v) : "—";
}

export function fcaDotClass(score: number): string {
  if (score <= 2) return "bg-red-100 text-red-900";
  if (score === 3) return "bg-amber-100 text-amber-900";
  return "bg-green-100 text-green-900";
}

export function isImmediateAction(asset: AssetRecord): boolean {
  return (
    asset.fcaScore <= 2 || asset.repairOrReplace === "Replace" || asset.observedLifeRemaining <= 2
  );
}

export interface AssetSummary {
  total: number;
  immediate: number;
  totalCost: number;
  avgFca: string;
}

export function computeSummary(assets: AssetRecord[]): AssetSummary {
  const totalCost = assets.reduce(
    (sum, a) => sum + (a.unitProbableCost || 0) * (a.quantityMultiplier || 1),
    0,
  );
  const avgFca = (assets.reduce((sum, a) => sum + (a.fcaScore || 0), 0) / assets.length).toFixed(1);

  return {
    total: assets.length,
    immediate: assets.filter(isImmediateAction).length,
    totalCost,
    avgFca,
  };
}

export interface AssetRowDerived {
  lifeExp: number;
  uniformat: string;
  indReplYr: number;
  indLifeRem: number;
  extCost: number;
  deprVal: number;
  annMaint: number;
}

export function computeRowDerived(asset: AssetRecord): AssetRowDerived {
  const reg = getRegistry(asset.assetType);
  const lifeExp = reg.life;
  const indReplYr = (asset.installYear || CURRENT_YEAR) + lifeExp;
  const indLifeRem = indReplYr - CURRENT_YEAR;
  const extCost = (asset.unitProbableCost || 0) * (asset.quantityMultiplier || 1);
  const deprVal = indLifeRem > 0 ? extCost * (Math.max(0, indLifeRem) / lifeExp) : 0;
  const annMaint = extCost * reg.maintPct;

  return {
    lifeExp,
    uniformat: getUniformat(asset),
    indReplYr,
    indLifeRem,
    extCost,
    deprVal,
    annMaint,
  };
}
