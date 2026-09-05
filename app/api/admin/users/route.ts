/**
 * Admin user directory for the caller's organization.
 *
 * GET  → { users: [{ id, email, displayName, role, isSiteAdmin, createdAt }] }
 * POST → { userId }  body: { email, password, role?, displayName? }
 *
 * Invite creates an account in the orgAdmin's organization. Roles:
 * `orgAdmin` | `regional` | `ownership` | `individual` (default individual).
 * Email and password are required. Password must meet MIN_PASSWORD_LENGTH.
 */
import { and, eq, isNull } from "drizzle-orm";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { isUserRole } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/server/email";
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

export async function GET() {
  const result = await requireOrgAdmin();
  if ("error" in result) return result.error;

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.orgId, result.user.orgId), isNull(users.deactivatedAt)));

  return Response.json({ users: rows.map(serializeUser) });
}

export async function POST(request: Request) {
  const result = await requireOrgAdmin();
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    role?: unknown;
    displayName?: unknown;
  };

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const displayName =
    typeof payload.displayName === "string" && payload.displayName.trim()
      ? payload.displayName.trim()
      : null;
  const role = isUserRole(payload.role) ? payload.role : "individual";

  if (!isValidEmail(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return Response.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const [created] = await db
    .insert(users)
    .values({
      orgId: result.user.orgId,
      email,
      passwordHash: await hashPassword(password),
      role,
      displayName,
    })
    .returning({ id: users.id });

  return Response.json({ userId: created.id });
}
