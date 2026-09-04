import { CURRENT_YEAR } from "@/lib/config";

export async function GET() {
  return Response.json({
    status: "ok",
    year: CURRENT_YEAR,
    version: "2.0.0",
  });
}
