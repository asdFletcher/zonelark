import { jobStore } from "@/lib/server/jobStore";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const assets = await jobStore.getAssets(jobId);

  if (!assets) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json({ job_id: jobId, assets });
}
