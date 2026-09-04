import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { Database } from "@/lib/supabase/database.types";

export interface SessionResult {
  response: NextResponse;
  userId: string | null;
}

/**
 * The `@supabase/ssr` proxy session-refresh pattern: reads the session cookie, refreshes the
 * token if it's stale, and writes the refreshed cookie onto the response so the browser and the
 * next request both see it. Consumed by proxy.ts, which layers route protection on top.
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // No Supabase project configured yet — treat every request as unauthenticated rather than
    // throwing, so the rest of the app (demo mode, IP allowlist) keeps working.
    return { response, userId: null };
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
