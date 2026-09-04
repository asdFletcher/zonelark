import { ensureUserOrg } from "@/lib/server/orgBootstrap";
import { requireUser } from "@/lib/server/requireUser";
import * as localPortfolios from "@/lib/server/db/local/portfolioRepo";

export async function GET() {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });
  if (!configured) return Response.json({ portfolios: localPortfolios.list() });

  const { data, error } = await supabase.from("portfolios").select("*").order("created_at");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ portfolios: data });
}

export async function POST(request: Request) {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";

  if (!configured) return Response.json({ portfolio: localPortfolios.create(name) });

  let orgId: string;
  try {
    orgId = await ensureUserOrg(user.id, name);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve organization.";
    return Response.json({ error: message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({ org_id: orgId, name: name || "My Organization" })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ portfolio: data });
}
