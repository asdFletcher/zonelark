import "server-only";

import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth/config";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/server/email";

function toAuthUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    email: row.email,
    orgId: row.orgId,
    role: row.role,
    displayName: row.displayName,
    isSiteAdmin: row.isSiteAdmin,
  };
}

async function bootstrapFirstUser(email: string, password: string) {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const domain = email.split("@")[1];
  const orgName = domain ? domain : "Organization";

  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: users.id }).from(users).limit(1);
    if (existing) {
      return null;
    }
    const [org] = await tx.insert(organizations).values({ name: orgName }).returning();
    const [user] = await tx
      .insert(users)
      .values({
        orgId: org.id,
        email,
        passwordHash,
        role: "orgAdmin",
        isSiteAdmin: true,
      })
      .returning();
    return user;
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
          return null;
        }

        const db = getDb();
        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existing) {
          if (existing.deactivatedAt) return null;
          const ok = await verifyPassword(password, existing.passwordHash);
          if (!ok) return null;
          return toAuthUser(existing);
        }

        const created = await bootstrapFirstUser(email, password);
        if (!created) return null;
        return toAuthUser(created);
      },
    }),
  ],
});
