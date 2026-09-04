import "server-only";

import { requireUser } from "@/lib/server/requireUser";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import * as localAssessments from "@/lib/server/db/local/assessmentRepo";

export interface AssessmentContext {
  userId: string;
  assessmentId: string;
}

export interface AssessmentContextError {
  error: string;
  status: number;
}

/**
 * Authenticates the current request and creates the `assessments` row a capture/import job's
 * assets get persisted under (assets -> assessment -> building -> portfolio -> org is what makes
 * RLS scoping possible). Every assess/import route calls this before touching jobStore.
 */
export async function requireAssessmentContext(params: {
  buildingId: string;
  assessmentDate?: string;
  facilityLevel?: string;
  floorId?: string;
}): Promise<AssessmentContext | AssessmentContextError> {
  const { user, configured } = await requireUser();
  if (!user) return { error: "Not authenticated.", status: 401 };

  if (!params.buildingId) return { error: "building_id is required.", status: 400 };

  if (!configured) {
    const { id } = localAssessments.create({
      buildingId: params.buildingId,
      assessmentDate: params.assessmentDate,
      facilityLevel: params.facilityLevel,
      floorId: params.floorId,
    });
    return { userId: user.id, assessmentId: id };
  }

  const admin = createSupabaseAdminClient();
  const { data: assessment, error } = await admin
    .from("assessments")
    .insert({
      building_id: params.buildingId,
      assessment_date: params.assessmentDate,
      facility_level: params.facilityLevel,
      floor_id: params.floorId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !assessment) {
    return {
      error: `Failed to create assessment: ${error?.message ?? "unknown error"}`,
      status: 500,
    };
  }

  return { userId: user.id, assessmentId: assessment.id };
}

export function isAssessmentContextError(
  ctx: AssessmentContext | AssessmentContextError,
): ctx is AssessmentContextError {
  return "error" in ctx;
}
