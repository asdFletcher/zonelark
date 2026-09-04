import { BuildingFormValues } from "@/components/form/BuildingDetailsForm";

/**
 * Defined here (not in components/form/BuildingDetailsForm.tsx, which is "use client") so
 * server-only code can use the real value — importing a plain constant from a "use client"
 * module into server code doesn't come through as the actual value, only component references do.
 */
export const EMPTY_BUILDING_FORM: BuildingFormValues = {
  buildingName: "",
  buildingType: "",
  totalSqft: "",
  aboveGradeFloors: "",
  basementLevels: "",
  hasRoofLevel: false,
  buildDate: "",
  remodelDates: [],
};

/** BuildingFormValues (all-string form state) -> API payload (typed) for POST/PATCH /api/buildings. */
export function buildingFormToPayload(values: BuildingFormValues) {
  return {
    building_name: values.buildingName,
    building_type: values.buildingType,
    total_sqft: values.totalSqft ? Number(values.totalSqft) : 0,
    above_grade_floors: values.aboveGradeFloors ? Number(values.aboveGradeFloors) : 0,
    basement_levels: values.basementLevels ? Number(values.basementLevels) : 0,
    has_roof_level: values.hasRoofLevel,
    build_date: values.buildDate || null,
    remodel_dates: values.remodelDates.filter(Boolean),
  };
}

export interface BuildingRowLike {
  id: string;
  building_name: string;
  building_type: string;
  total_sqft: number;
  above_grade_floors: number;
  basement_levels: number;
  has_roof_level: boolean;
  build_date: string | null;
  remodel_dates: string[];
}

/** `buildings` table row -> BuildingFormValues (+id) for the existing form components. */
export function buildingRowToForm(row: BuildingRowLike): BuildingFormValues & { id: string } {
  return {
    id: row.id,
    buildingName: row.building_name,
    buildingType: row.building_type,
    totalSqft: row.total_sqft ? String(row.total_sqft) : "",
    aboveGradeFloors: row.above_grade_floors ? String(row.above_grade_floors) : "",
    basementLevels: row.basement_levels ? String(row.basement_levels) : "",
    hasRoofLevel: row.has_roof_level,
    buildDate: row.build_date ?? "",
    remodelDates: row.remodel_dates ?? [],
  };
}
