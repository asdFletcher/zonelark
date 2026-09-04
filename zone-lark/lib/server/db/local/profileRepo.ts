import "server-only";

import { getLocalDb, LOCAL_USER_ID } from "@/lib/server/db/local/connection";

export interface LocalProfileRow {
  id: string;
  org_id: string;
  role: string;
  is_site_admin: boolean;
  display_name: string | null;
  created_at: string;
}

interface RawProfileRow {
  id: string;
  org_id: string;
  role: string;
  is_site_admin: number;
  display_name: string | null;
  created_at: string;
}

function toRow(row: RawProfileRow): LocalProfileRow {
  return { ...row, is_site_admin: Boolean(row.is_site_admin) };
}

export function get(): LocalProfileRow {
  const row = getLocalDb()
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(LOCAL_USER_ID) as unknown as RawProfileRow;
  return toRow(row);
}

export function update(patch: { displayName?: string }): LocalProfileRow {
  const db = getLocalDb();
  if (typeof patch.displayName === "string") {
    db.prepare("UPDATE profiles SET display_name = ? WHERE id = ?").run(
      patch.displayName,
      LOCAL_USER_ID,
    );
  }
  return get();
}
