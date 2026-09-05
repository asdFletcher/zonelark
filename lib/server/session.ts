import "server-only";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/server/auth";
import type { UserRole } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type AuthedUser = {
  id: string;
  email: string;
  orgId: string;
  role: UserRole;
  displayName: string | null;
  isSiteAdmin: boolean;
};

export async function requireUser(): Promise<{ user: AuthedUser } | { error: Response }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Not authenticated." }, { status: 401 }) };
  }

  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!row || row.deactivatedAt) {
    return { error: Response.json({ error: "Not authenticated." }, { status: 401 }) };
  }

  return {
    user: {
      id: row.id,
      email: row.email,
      orgId: row.orgId,
      role: row.role,
      displayName: row.displayName,
      isSiteAdmin: row.isSiteAdmin,
    },
  };
}

export async function requireOrgAdmin(): Promise<{ user: AuthedUser } | { error: Response }> {
  const result = await requireUser();
  if ("error" in result) return result;
  if (result.user.role !== "orgAdmin") {
    return { error: Response.json({ error: "Organization admin only." }, { status: 403 }) };
  }
  return result;
}
