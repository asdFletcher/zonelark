"use client";

import { useCallback, useState } from "react";

import { BuildingFormValues } from "@/components/form/BuildingDetailsForm";
import { EMPTY_BUILDING_FORM } from "@/lib/portfolioMapper";

export interface PersistedBuilding extends BuildingFormValues {
  id: string;
}

/**
 * Session-local portfolio/buildings. Persistence will return when the remote database is wired.
 */
export function usePortfolio() {
  const [name, setName] = useState("");
  const [buildings, setBuildings] = useState<PersistedBuilding[]>([]);

  const setPortfolioName = useCallback((newName: string) => {
    setName(newName);
  }, []);

  const addBuilding = useCallback(() => {
    setBuildings((prev) => [...prev, { ...EMPTY_BUILDING_FORM, id: crypto.randomUUID() }]);
  }, []);

  const updateBuilding = useCallback((id: string, values: BuildingFormValues) => {
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...values, id } : b)));
  }, []);

  const removeBuilding = useCallback((id: string) => {
    setBuildings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    portfolioName: name,
    setPortfolioName,
    buildings,
    addBuilding,
    updateBuilding,
    removeBuilding,
    loading: false,
    error: null as string | null,
  };
}
