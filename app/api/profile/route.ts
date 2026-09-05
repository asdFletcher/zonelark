/**
 * Signed-in user's profile.
 *
 * GET   → { profile, email }  profile includes role, display_name, org
 * PATCH → { profile }  body: { displayName? }
 */
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/server/session";

async function loadProfile(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      role: users.role,
      displayName: users.displayName,
      orgId: users.orgId,
      orgName: organizations.name,
    })
    .from(users)
    .innerJoin(organizations, eq(users.orgId, organizations.id))
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

function serializeProfile(
  email: string,
  row: { role: string; displayName: string | null; orgId: string; orgName: string },
) {
  return {
    email,
    profile: {
      role: row.role,
      display_name: row.displayName,
      org: { id: row.orgId, name: row.orgName },
    },
  };
}

export async function GET() {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const row = await loadProfile(result.user.id);
  if (!row) {
    return Response.json({ profile: null, email: result.user.email });
  }
  return Response.json(serializeProfile(result.user.email, row));
}

export async function PATCH(request: Request) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const displayNameRaw = (body as { displayName?: unknown }).displayName;
  if (
    displayNameRaw !== undefined &&
    displayNameRaw !== null &&
    typeof displayNameRaw !== "string"
  ) {
    return Response.json({ error: "displayName must be a string." }, { status: 400 });
  }

  const displayName =
    typeof displayNameRaw === "string" && displayNameRaw.trim() ? displayNameRaw.trim() : null;

  const db = getDb();
  await db.update(users).set({ displayName }).where(eq(users.id, result.user.id));

  const row = await loadProfile(result.user.id);
  if (!row) {
    return Response.json({ profile: null, email: result.user.email });
  }
  return Response.json(serializeProfile(result.user.email, row));
}
