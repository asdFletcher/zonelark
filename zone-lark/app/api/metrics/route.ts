import { requireUser } from "@/lib/server/requireUser";

export async function GET() {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });
  if (!configured) {
    return Response.json(
      { error: "Metrics require Supabase — unavailable in local mode." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("metric_snapshots")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ snapshots: data });
}
