import { requireUser } from "@/lib/server/requireUser";
import * as localPortfolios from "@/lib/server/db/local/portfolioRepo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  const { portfolioId } = await params;
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : undefined;
  if (name === undefined) return Response.json({ error: "name is required." }, { status: 400 });

  if (!configured) return Response.json({ portfolio: localPortfolios.update(portfolioId, name) });

  const { data, error } = await supabase
    .from("portfolios")
    .update({ name })
    .eq("id", portfolioId)
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ portfolio: data });
}
