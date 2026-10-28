import { NextResponse } from "next/server";
import { getChapterVerses } from "@/lib/quran/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ surah: string }> }
) {
  const { surah } = await params;
  const surahNumber = parseInt(surah, 10);

  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json(
      { error: "Invalid surah number. The Quran contains surahs 1 to 114." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const perPageParam = parseInt(searchParams.get("per_page") ?? "30", 10);

  const page = isNaN(pageParam) ? 1 : Math.max(1, pageParam);
  const perPage = isNaN(perPageParam) ? 30 : Math.min(50, Math.max(1, perPageParam));

  try {
    const data = await getChapterVerses(surahNumber, { page, perPage });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error(`Failed to fetch verses for surah ${surahNumber}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch verses" },
      { status: 502 }
    );
  }
}

