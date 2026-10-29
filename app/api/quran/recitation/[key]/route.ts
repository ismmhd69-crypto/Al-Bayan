import { NextResponse } from "next/server";
import { getVerseRecitation } from "@/lib/quran/service";

/** One verse's recitation link, words and word timings (read-only, cached a day like the Quran page). */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  try {
    const recitation = await getVerseRecitation(decodeURIComponent(key));
    if (!recitation) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(recitation, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
