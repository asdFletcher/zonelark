import { requireUser } from "@/lib/server/requireUser";
import * as localProfiles from "@/lib/server/db/local/profileRepo";

export async function GET() {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!configured) return Response.json({ profile: localProfiles.get(), email: user.email });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ profile: data, email: user.email });
}

export async function PATCH(request: Request) {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const displayName = typeof body.displayName === "string" ? body.displayName : undefined;

  if (!configured) {
    return Response.json({ profile: localProfiles.update({ displayName }) });
  }

  const updates: { display_name?: string } = {};
  if (displayName !== undefined) updates.display_name = displayName;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ profile: data });
}
