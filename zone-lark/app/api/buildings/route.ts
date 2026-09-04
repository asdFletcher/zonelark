import { buildingFormToPayload, EMPTY_BUILDING_FORM } from "@/lib/portfolioMapper";
import { requireUser } from "@/lib/server/requireUser";
import * as localBuildings from "@/lib/server/db/local/buildingRepo";

export async function GET(request: Request) {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const portfolioId = new URL(request.url).searchParams.get("portfolio_id") ?? undefined;

  if (!configured) return Response.json({ buildings: localBuildings.list(portfolioId) });

  let query = supabase.from("buildings").select("*").order("created_at");
  if (portfolioId) query = query.eq("portfolio_id", portfolioId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ buildings: data });
}

export async function POST(request: Request) {
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const portfolioId = typeof body.portfolio_id === "string" ? body.portfolio_id : undefined;
  if (!portfolioId) return Response.json({ error: "portfolio_id is required." }, { status: 400 });

  if (!configured) return Response.json({ building: localBuildings.create(portfolioId) });

  const { data, error } = await supabase
    .from("buildings")
    .insert({ portfolio_id: portfolioId, ...buildingFormToPayload(EMPTY_BUILDING_FORM) })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ building: data });
}
