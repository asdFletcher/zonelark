import { jobStore } from "@/lib/server/jobStore";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const buf = await jobStore.getBuffer(jobId);

  if (!buf) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Zonelark_FCA_${jobId.slice(0, 8)}.xlsx"`,
    },
  });
}
