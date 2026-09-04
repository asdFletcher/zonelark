import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PUBLIC_PATHS = ["/api/health", "/login"];

// If IP_ALLOWLIST is unset, every request is let through.
function getAllowedIps(): string[] | null {
  const raw = process.env.IP_ALLOWLIST;
  if (!raw) return null;
  return raw
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

/** Returns the client IP as seen by an edge proxy, or null for direct/local requests. */
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0].trim() || null;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const allowedIps = getAllowedIps();
  if (allowedIps && pathname !== "/api/health") {
    const clientIp = getClientIp(req);
    if (clientIp && !allowedIps.includes(clientIp)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Supabase isn't configured yet (local dev without a project) — there's no user/admin data to
  // protect in that state, so let requests through rather than locking out demo mode entirely.
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  if (!supabaseConfigured) {
    return NextResponse.next();
  }

  const { response, userId } = await refreshSupabaseSession(req);

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminPath(pathname)) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.role !== "admin") {
        return pathname.startsWith("/api/")
          ? NextResponse.json({ error: "Admin access required." }, { status: 403 })
          : NextResponse.redirect(new URL("/", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
