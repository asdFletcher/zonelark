/**
 * Portfolios owned by the caller's organization.
 *
 * GET  → { portfolios: { id, name, created_at }[] }
 * POST → { portfolio }  body: { name? }
 *
 * Creating the first portfolio also creates the user's organization if they
 * do not have one yet, and makes them its orgAdmin. First-user sign-in already
 * creates the organization, so this path is a fallback for older rows.
 */
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { organizations, portfolios, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/server/session";

function serializePortfolio(row: typeof portfolios.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    created_at: row.createdAt.toISOString(),
  };
}

async function ensureOrg(userId: string, orgId: string, email: string) {
  if (orgId) return orgId;
  const db = getDb();
  const domain = email.split("@")[1];
  const [org] = await db
    .insert(organizations)
    .values({ name: domain ?? "Organization" })
    .returning();
  await db.update(users).set({ orgId: org.id, role: "orgAdmin" }).where(eq(users.id, userId));
  return org.id;
}

export async function GET() {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const db = getDb();
  const rows = await db.select().from(portfolios).where(eq(portfolios.orgId, result.user.orgId));
  return Response.json({ portfolios: rows.map(serializePortfolio) });
}

export async function POST(request: Request) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  let body: unknown = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") body = parsed;
  } catch {
    body = {};
  }

  const name =
    typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name : "";

  const orgId = await ensureOrg(result.user.id, result.user.orgId, result.user.email);
  const db = getDb();
  const [created] = await db.insert(portfolios).values({ orgId, name }).returning();
  return Response.json({ portfolio: serializePortfolio(created) });
}
