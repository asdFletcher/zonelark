import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { assessments, assets, buildings, portfolios } from "@/lib/db/schema";
import { AssetRecord } from "@/lib/schemas";

export async function persistAssessment(opts: {
  orgId: string;
  userId: string;
  buildingId: string | null | undefined;
  assets: AssetRecord[];
  assessmentDate?: string;
  facilityLevel?: string;
  floorId?: string;
}): Promise<void> {
  if (!opts.buildingId || opts.assets.length === 0) return;

  const db = getDb();
  const [building] = await db
    .select({ id: buildings.id })
    .from(buildings)
    .innerJoin(portfolios, eq(buildings.portfolioId, portfolios.id))
    .where(and(eq(buildings.id, opts.buildingId), eq(portfolios.orgId, opts.orgId)))
    .limit(1);

  if (!building) return;

  const [assessment] = await db
    .insert(assessments)
    .values({
      buildingId: building.id,
      createdBy: opts.userId,
      assessmentDate: opts.assessmentDate ?? opts.assets[0]?.assessmentDate ?? null,
      facilityLevel: opts.facilityLevel ?? null,
      floorId: opts.floorId ?? null,
    })
    .returning({ id: assessments.id });

  await db.insert(assets).values(
    opts.assets.map((record) => ({
      assessmentId: assessment.id,
      record,
    })),
  );
}
