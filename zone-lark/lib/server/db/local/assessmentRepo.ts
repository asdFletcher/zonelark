import "server-only";

import { getLocalDb, LOCAL_USER_ID, newId, nowIso } from "@/lib/server/db/local/connection";

export function create(params: {
  buildingId: string;
  assessmentDate?: string;
  facilityLevel?: string;
  floorId?: string;
}): { id: string } {
  const db = getLocalDb();
  const id = newId();
  db.prepare(
    `INSERT INTO assessments
      (id, building_id, assessment_date, facility_level, floor_id, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    params.buildingId,
    params.assessmentDate ?? null,
    params.facilityLevel ?? null,
    params.floorId ?? null,
    LOCAL_USER_ID,
    nowIso(),
  );
  return { id };
}
