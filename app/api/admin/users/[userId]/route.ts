/**
 * One user in the caller's organization.
 *
 * GET    → { id, email, displayName, role, isSiteAdmin, createdAt }  (404 if missing or a different org)
 * PATCH  → { ok: true }  body: { role?, displayName? }
 * DELETE → { ok: true }  deactivates the account
 *
 * Domain rules: same-org only; role must be one of
 * `orgAdmin` | `regional` | `ownership` | `individual`; an orgAdmin cannot
 * deactivate themselves.
 */
import { and, eq, isNull } from "drizzle-orm";

import { isUserRole } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireOrgAdmin } from "@/lib/server/session";

function serializeUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    isSiteAdmin: row.isSiteAdmin,
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadOrgUser(userId: string, orgId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.orgId, orgId), isNull(users.deactivatedAt)))
    .limit(1);
  return row ?? null;
}

export async function GET(_request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const result = await requireOrgAdmin();
  if ("error" in result) return result.error;

  const { userId } = await ctx.params;
  const row = await loadOrgUser(userId, result.user.orgId);
  if (!row) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }
  return Response.json(serializeUser(row));
}

export async function PATCH(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const result = await requireOrgAdmin();
  if ("error" in result) return result.error;

  const { userId } = await ctx.params;
  const row = await loadOrgUser(userId, result.user.orgId);
  if (!row) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = (body ?? {}) as { role?: unknown; displayName?: unknown };
  const patch: { role?: typeof row.role; displayName?: string | null } = {};

  if (payload.role !== undefined) {
    if (!isUserRole(payload.role)) {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }
    patch.role = payload.role;
  }
  if (payload.displayName !== undefined) {
    if (payload.displayName !== null && typeof payload.displayName !== "string") {
      return Response.json({ error: "displayName must be a string." }, { status: 400 });
    }
    patch.displayName =
      typeof payload.displayName === "string" && payload.displayName.trim()
        ? payload.displayName.trim()
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ ok: true });
  }

  const db = getDb();
  await db.update(users).set(patch).where(eq(users.id, row.id));
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const result = await requireOrgAdmin();
  if ("error" in result) return result.error;

  const { userId } = await ctx.params;
  if (userId === result.user.id) {
    return Response.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  }

  const row = await loadOrgUser(userId, result.user.orgId);
  if (!row) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const db = getDb();
  await db.update(users).set({ deactivatedAt: new Date() }).where(eq(users.id, row.id));
  return Response.json({ ok: true });
}
