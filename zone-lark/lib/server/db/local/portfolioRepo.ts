import "server-only";

import { getLocalDb, LOCAL_ORG_ID, newId, nowIso } from "@/lib/server/db/local/connection";

export interface LocalPortfolioRow {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export function list(): LocalPortfolioRow[] {
  return getLocalDb()
    .prepare("SELECT * FROM portfolios ORDER BY created_at")
    .all() as unknown as LocalPortfolioRow[];
}

export function create(name: string): LocalPortfolioRow {
  const db = getLocalDb();
  const id = newId();
  const created_at = nowIso();
  db.prepare("INSERT INTO portfolios (id, org_id, name, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    LOCAL_ORG_ID,
    name || "My Organization",
    created_at,
  );
  return { id, org_id: LOCAL_ORG_ID, name: name || "My Organization", created_at };
}

export function update(id: string, name: string): LocalPortfolioRow | null {
  const db = getLocalDb();
  db.prepare("UPDATE portfolios SET name = ? WHERE id = ?").run(name, id);
  return db
    .prepare("SELECT * FROM portfolios WHERE id = ?")
    .get(id) as unknown as LocalPortfolioRow | null;
}
