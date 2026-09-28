import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { searchHadith } from "@/lib/sources/hadith";

// Private test tool for the HadeethEnc hadith connector. Never available on the live site.
// The search text is not logged or stored.

const devOnly = () => process.env.NODE_ENV !== "production";

export async function POST(request: Request) {
  if (!devOnly()) return NextResponse.json({ status: "not_found" }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { q?: unknown; lang?: unknown } | null;
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 200) : "";
  const lang = typeof body?.lang === "string" && isLocale(body.lang) ? body.lang : "en";
  if (!q) return NextResponse.json({ status: "bad_request" }, { status: 400 });
  try {
    const hadith = await searchHadith([q], lang, 8);
    return NextResponse.json({ status: "ok", hadith }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("hadith test failed:", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
