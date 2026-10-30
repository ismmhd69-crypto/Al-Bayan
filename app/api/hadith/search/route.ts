import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { allowSearch, cleanQuery, readPage } from "@/lib/search/limit";
import { searchHadithText } from "@/lib/hadith/word-search";

const noStore = { "Cache-Control": "no-store" };

// Word search in the stored hadith. The words typed are never logged or cached.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") ?? "";
  const query = cleanQuery(searchParams.get("q"));
  if (!isLocale(lang) || !query) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: noStore });
  if (!allowSearch(request.headers.get("x-forwarded-for"))) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: noStore });
  try {
    const result = await searchHadithText(query, lang, readPage(searchParams.get("page")), request.signal);
    return NextResponse.json(result, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "search_failed" }, { status: 502, headers: noStore });
  }
}
