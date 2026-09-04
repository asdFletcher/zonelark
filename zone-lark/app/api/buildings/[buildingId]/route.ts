import { buildingFormToPayload } from "@/lib/portfolioMapper";
import { BuildingFormValues } from "@/components/form/BuildingDetailsForm";
import { requireUser } from "@/lib/server/requireUser";
import * as localBuildings from "@/lib/server/db/local/buildingRepo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ buildingId: string }> },
) {
  const { buildingId } = await params;
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<BuildingFormValues>;
  const payload = buildingFormToPayload({
    buildingName: body.buildingName ?? "",
    buildingType: body.buildingType ?? "",
    totalSqft: body.totalSqft ?? "",
    aboveGradeFloors: body.aboveGradeFloors ?? "",
    basementLevels: body.basementLevels ?? "",
    hasRoofLevel: body.hasRoofLevel ?? false,
    buildDate: body.buildDate ?? "",
    remodelDates: body.remodelDates ?? [],
  });

  if (!configured) return Response.json({ building: localBuildings.update(buildingId, payload) });

  const { data, error } = await supabase
    .from("buildings")
    .update(payload)
    .eq("id", buildingId)
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ building: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ buildingId: string }> },
) {
  const { buildingId } = await params;
  const { supabase, user, configured } = await requireUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  if (!configured) {
    localBuildings.remove(buildingId);
    return Response.json({ ok: true });
  }

  const { error } = await supabase.from("buildings").delete().eq("id", buildingId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
