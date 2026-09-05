import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;
type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { postgres?: SqlClient; db?: Database };

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  const client = globalForDb.postgres ?? postgres(url, { prepare: false, max: 10 });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgres = client;
  }
  return drizzle(client, { schema });
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}
