import { NextResponse } from "next/server";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { attachScholarTranslations } from "@/lib/ask/display-translations";
import { handleSavedHydrate } from "@/lib/saved/hydrate-route";

// Opens one saved answer from the Saved page. Rules and limits: lib/saved/hydrate-route.ts.
export async function POST(request: Request) {
  try {
    return await handleSavedHydrate(request, {
      hydrate: async (stored) => {
        const result = await hydrateAnswer(stored);
        return result.ok && result.answer.version === 2 ? { ok: true, answer: await attachScholarTranslations(result.answer) } : result;
      },
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
