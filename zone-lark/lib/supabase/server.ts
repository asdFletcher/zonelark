import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/database.types";

/**
 * Server client for use in Server Components, Route Handlers, and Server Functions. Reads the
 * session from cookies; can also write refreshed cookies when called from a Route Handler or
 * Server Function (writes are silently skipped when called from a Server Component, matching
 * the Next.js 16 `cookies()` contract — see the "Using Cookies" section of the proxy docs).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  // @supabase/ssr's createServerClient throws synchronously on an empty URL/key rather than
  // degrading gracefully. Fall back to harmless placeholders when unconfigured (local dev without
  // a Supabase project) so construction never throws — lib/server/requireUser.ts is what actually
  // gates the real `.auth.getUser()` network call behind the same env-var check, so these
  // placeholders are never queried.
  return createServerClient<Database>(
    process.env.SUPABASE_URL || "http://localhost:54321",
    process.env.SUPABASE_ANON_KEY || "unconfigured",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — cookies are read-only there. The proxy's session
            // refresh (lib/supabase/middleware.ts) is what actually persists refreshed tokens.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the service-role key — bypasses RLS entirely. Only ever import this from
 * `app/api/admin/**` route handlers (never from a Client Component, never send this key to the
 * browser). Used for `supabase.auth.admin.*` (invite/create/deactivate users) and for writes that
 * legitimately cross RLS boundaries (e.g. the integration sync pipeline, the metrics engine).
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin operations.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
