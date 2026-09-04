import "server-only";

/** Single source of truth for "is a real Supabase project wired up" (vs. local SQLite fallback). */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}
