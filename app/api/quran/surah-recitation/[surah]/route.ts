import { NextResponse } from "next/server";
import { getSurahRecitation } from "@/lib/quran/service";

/** One surah's continuous recitation with verse and word timings (read-only, cached a day). */
export async function GET(_request: Request, { params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  try {
    const recitation = await getSurahRecitation(Number(surah));
    if (!recitation) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(recitation, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
