import "server-only";

import { buildingFormToPayload, BuildingRowLike, EMPTY_BUILDING_FORM } from "@/lib/portfolioMapper";
import { getLocalDb, newId, nowIso } from "@/lib/server/db/local/connection";

interface RawBuildingRow {
  id: string;
  portfolio_id: string;
  building_name: string;
  building_type: string;
  total_sqft: number;
  above_grade_floors: number;
  basement_levels: number;
  has_roof_level: number;
  build_date: string | null;
  remodel_dates: string;
  created_at: string;
}

function toRowLike(row: RawBuildingRow): BuildingRowLike {
  return {
    id: row.id,
    building_name: row.building_name,
    building_type: row.building_type,
    total_sqft: row.total_sqft,
    above_grade_floors: row.above_grade_floors,
    basement_levels: row.basement_levels,
    has_roof_level: Boolean(row.has_roof_level),
    build_date: row.build_date,
    remodel_dates: JSON.parse(row.remodel_dates) as string[],
  };
}

export function list(portfolioId?: string): BuildingRowLike[] {
  const db = getLocalDb();
  const rows = (portfolioId
    ? db
        .prepare("SELECT * FROM buildings WHERE portfolio_id = ? ORDER BY created_at")
        .all(portfolioId)
    : db
        .prepare("SELECT * FROM buildings ORDER BY created_at")
        .all()) as unknown as RawBuildingRow[];
  return rows.map(toRowLike);
}

export function create(portfolioId: string): BuildingRowLike {
  const db = getLocalDb();
  const payload = buildingFormToPayload(EMPTY_BUILDING_FORM);
  const id = newId();
  const created_at = nowIso();
  db.prepare(
    `INSERT INTO buildings
      (id, portfolio_id, building_name, building_type, total_sqft, above_grade_floors,
       basement_levels, has_roof_level, build_date, remodel_dates, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    portfolioId,
    payload.building_name,
    payload.building_type,
    payload.total_sqft,
    payload.above_grade_floors,
    payload.basement_levels,
    payload.has_roof_level ? 1 : 0,
    payload.build_date,
    JSON.stringify(payload.remodel_dates),
    created_at,
  );
  return toRowLike({
    id,
    portfolio_id: portfolioId,
    building_name: payload.building_name,
    building_type: payload.building_type,
    total_sqft: payload.total_sqft,
    above_grade_floors: payload.above_grade_floors,
    basement_levels: payload.basement_levels,
    has_roof_level: payload.has_roof_level ? 1 : 0,
    build_date: payload.build_date,
    remodel_dates: JSON.stringify(payload.remodel_dates),
    created_at,
  });
}

export function update(
  id: string,
  payload: ReturnType<typeof buildingFormToPayload>,
): BuildingRowLike | null {
  const db = getLocalDb();
  db.prepare(
    `UPDATE buildings SET
       building_name = ?, building_type = ?, total_sqft = ?, above_grade_floors = ?,
       basement_levels = ?, has_roof_level = ?, build_date = ?, remodel_dates = ?
     WHERE id = ?`,
  ).run(
    payload.building_name,
    payload.building_type,
    payload.total_sqft,
    payload.above_grade_floors,
    payload.basement_levels,
    payload.has_roof_level ? 1 : 0,
    payload.build_date,
    JSON.stringify(payload.remodel_dates),
    id,
  );
  const row = db.prepare("SELECT * FROM buildings WHERE id = ?").get(id) as unknown as
    RawBuildingRow | undefined;
  return row ? toRowLike(row) : null;
}

export function remove(id: string): void {
  getLocalDb().prepare("DELETE FROM buildings WHERE id = ?").run(id);
}
