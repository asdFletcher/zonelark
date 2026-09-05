/**
 * One portfolio.
 *
 * PATCH → { portfolio }  body: { name }  (name is required)
 */
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getPortfolioInOrg } from "@/lib/server/portfolioAccess";
import { requireUser } from "@/lib/server/session";

export async function PATCH(request: Request, ctx: { params: Promise<{ portfolioId: string }> }) {
  const result = await requireUser();
  if ("error" in result) return result.error;

  const { portfolioId } = await ctx.params;
  const existing = await getPortfolioInOrg(portfolioId, result.user.orgId);
  if (!existing) {
    return Response.json({ error: "Portfolio not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name =
    typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name : null;
  if (name === null) {
    return Response.json({ error: "name is required." }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(portfolios)
    .set({ name })
    .where(eq(portfolios.id, existing.id))
    .returning();

  return Response.json({
    portfolio: {
      id: updated.id,
      name: updated.name,
      created_at: updated.createdAt.toISOString(),
    },
  });
}
