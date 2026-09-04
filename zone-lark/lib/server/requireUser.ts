import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOCAL_USER_EMAIL, LOCAL_USER_ID } from "@/lib/server/db/local/connection";
import { isSupabaseConfigured } from "@/lib/server/supabaseConfigured";

const LOCAL_USER = { id: LOCAL_USER_ID, email: LOCAL_USER_EMAIL };

/**
 * Session-scoped Supabase client + the current user — OR, when Supabase isn't configured (local
 * dev without a project, see lib/server/supabaseConfigured.ts), a fixed local identity backed by
 * the sqlite fallback (lib/server/db/local/*) instead. `supabase` is deliberately `null` in that
 * branch: every direct caller of `supabase.from(...)` must add a local-mode branch rather than
 * running queries against a client that was never really connected to anything.
 */
export async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { supabase: null, user: LOCAL_USER, configured: false as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user, configured: true as const };
}
