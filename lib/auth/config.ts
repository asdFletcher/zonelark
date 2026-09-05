import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";

import type { UserRole } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    orgId: string;
    role: UserRole;
    displayName: string | null;
    isSiteAdmin: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    role: UserRole;
    displayName: string | null;
    isSiteAdmin: boolean;
  }
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email;
        token.orgId = user.orgId;
        token.role = user.role;
        token.displayName = user.displayName;
        token.isSiteAdmin = user.isSiteAdmin;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email ?? "";
      session.user.orgId = token.orgId;
      session.user.role = token.role;
      session.user.displayName = token.displayName;
      session.user.isSiteAdmin = token.isSiteAdmin;
      return session;
    },
  },
} satisfies NextAuthConfig;
