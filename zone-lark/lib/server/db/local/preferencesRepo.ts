import "server-only";

import { getLocalDb, LOCAL_USER_ID, nowIso } from "@/lib/server/db/local/connection";

export function get(): { preferences: Record<string, unknown>; updatedAt: string | null } {
  const row = getLocalDb()
    .prepare("SELECT preferences, updated_at FROM user_preferences WHERE user_id = ?")
    .get(LOCAL_USER_ID) as unknown as { preferences: string; updated_at: string } | undefined;
  if (!row) return { preferences: {}, updatedAt: null };
  return { preferences: JSON.parse(row.preferences), updatedAt: row.updated_at };
}

export function upsert(preferences: Record<string, unknown>): {
  preferences: Record<string, unknown>;
  updatedAt: string;
} {
  const db = getLocalDb();
  const updatedAt = nowIso();
  db.prepare(
    `INSERT INTO user_preferences (user_id, preferences, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET preferences = excluded.preferences, updated_at = excluded.updated_at`,
  ).run(LOCAL_USER_ID, JSON.stringify(preferences), updatedAt);
  return { preferences, updatedAt };
}
