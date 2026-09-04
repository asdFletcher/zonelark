import "server-only";

/**
 * Successor to the removed lib/server/adminApi.ts's provisioningErrorResponse() — maps a
 * Supabase/Postgres error into an HTTP response. Kept intentionally small (this app doesn't yet
 * have the rich typed-error hierarchy the old lib/provisioning/provisioner.ts had); grow this as
 * real conflict/not-found cases show up.
 */
export function supabaseErrorResponse(error: { message: string; code?: string }): Response {
  if (error.code === "23505") {
    return Response.json({ error: "Already exists." }, { status: 409 });
  }
  return Response.json({ error: error.message }, { status: 500 });
}
