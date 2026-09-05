"use client";

import { useCallback, useEffect, useState } from "react";

import { BuildingFormValues } from "@/components/form/BuildingDetailsForm";
import { buildingRowToForm, BuildingRowLike } from "@/lib/portfolioMapper";

export interface PersistedBuilding extends BuildingFormValues {
  id: string;
}

interface PortfolioRow {
  id: string;
  name: string;
}

/**
 * Loads the caller's first portfolio and its buildings from Postgres via
 * `/api/portfolios` and `/api/buildings`. Creating a name or a building
 * creates the portfolio if one does not exist yet.
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioRow | null>(null);
  const [name, setName] = useState("");
  const [buildings, setBuildings] = useState<PersistedBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolios");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? `Server error ${res.status}`);
        return;
      }
      const { portfolios } = (await res.json()) as { portfolios: PortfolioRow[] };
      const first = portfolios?.[0] ?? null;
      setPortfolio(first);
      setName(first?.name ?? "");

      if (first) {
        const bRes = await fetch(`/api/buildings?portfolio_id=${first.id}`);
        if (bRes.ok) {
          const { buildings: rows } = (await bRes.json()) as { buildings: BuildingRowLike[] };
          setBuildings(rows.map(buildingRowToForm));
        }
      } else {
        setBuildings([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ensurePortfolio = useCallback(
    async (nameHint?: string) => {
      if (portfolio) return portfolio;
      try {
        const res = await fetch("/api/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameHint ?? "" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? `Server error ${res.status}`);
          return null;
        }
        const { portfolio: created } = (await res.json()) as { portfolio: PortfolioRow };
        setError(null);
        setPortfolio(created);
        return created;
      } catch {
        setError("Could not reach the server.");
        return null;
      }
    },
    [portfolio],
  );

  const setPortfolioName = useCallback(
    (newName: string) => {
      setName(newName);
      void (async () => {
        const current = await ensurePortfolio(newName);
        if (!current) return;
        setPortfolio((prev) => (prev ? { ...prev, name: newName } : prev));
        if (current.name === newName) return;
        try {
          await fetch(`/api/portfolios/${current.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          });
        } catch {
          // Local name already reflects the input.
        }
      })();
    },
    [ensurePortfolio],
  );

  const addBuilding = useCallback(async () => {
    const current = await ensurePortfolio();
    if (!current) return;
    const res = await fetch("/api/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolio_id: current.id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? `Server error ${res.status}`);
      return;
    }
    const { building } = (await res.json()) as { building: BuildingRowLike };
    setError(null);
    setBuildings((prev) => [...prev, buildingRowToForm(building)]);
  }, [ensurePortfolio]);

  const updateBuilding = useCallback((id: string, values: BuildingFormValues) => {
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...values, id } : b)));
    fetch(`/api/buildings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => {});
  }, []);

  const removeBuilding = useCallback((id: string) => {
    setBuildings((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/buildings/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  return {
    portfolioName: name,
    setPortfolioName,
    buildings,
    addBuilding,
    updateBuilding,
    removeBuilding,
    loading,
    error,
  };
}
