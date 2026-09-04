import { requireUser } from "@/lib/server/requireUser";
import * as localPreferences from "@/lib/server/db/local/preferencesRepo";

export async function GET() {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!configured) {
    const { preferences, updatedAt } = localPreferences.get();
    return Response.json({ preferences, updatedAt });
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    preferences: data?.preferences ?? {},
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PATCH(request: Request) {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const preferences =
    typeof body.preferences === "object" && body.preferences !== null ? body.preferences : {};

  if (!configured) {
    const { preferences: saved, updatedAt } = localPreferences.upsert(preferences);
    return Response.json({ preferences: saved, updatedAt });
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, preferences, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ preferences: data.preferences, updatedAt: data.updated_at });
}
