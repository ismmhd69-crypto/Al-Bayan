import { researchJobRoute } from "@/lib/ask/search-engine/server-job-api";
export const maxDuration = 30;
export async function POST(request: Request) {
  return researchJobRoute(request, "session");
}
