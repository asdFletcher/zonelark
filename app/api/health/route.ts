import { CURRENT_YEAR } from "@/lib/config";

export async function GET() {
  return Response.json({
    status: "ok",
    year: CURRENT_YEAR,
    version: "0.1.0",
  });
}
