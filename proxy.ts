import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    if (pathname === "/login" && req.auth) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const isOrgAdmin = req.auth.user.role === "orgAdmin";
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && !isOrgAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Organization admin only." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
