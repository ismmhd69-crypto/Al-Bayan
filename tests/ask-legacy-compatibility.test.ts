import { describe, expect, it } from "vitest";
import { runPipeline, type PipelineDeps } from "@/lib/ask/core";
import type { JsonRequest } from "@/lib/ai/types";
import baseline from "./fixtures/ask-legacy-promises-requests.json";

// Scripted models, not a paid reproduction or proof of semantic model accuracy.
export async function controlledPromises(run = runPipeline, claimAudit?: boolean, invalidSelection = false) {
  const requests: Record<string, unknown>[] = [];
  const frame = { language: "en", kind: "question", question_type: "general", subjects: ["keeping promises"],
    requested_points: [{ text: "Quran teaching about keeping promises", facet: "general" }], qualifiers: [],
    search_queries_en: ["fulfil sworn pledges"], search_queries_ar: [], search_queries_de: [] };
  const capture = (request: JsonRequest) => {
    const { signal: _signal, ...rest } = request;
    requests.push(JSON.parse(JSON.stringify(rest)));
  };
  const deps: PipelineDeps = {
    claimAudit,
    writer: { id: "controlled-writer", generateJson: async (request) => {
      capture(request);
      return request.system.startsWith("You prepare a search") || request.system.startsWith("You create a safe search plan") ? frame : {
        status: "answer", simple_answer: [{ text: "The Quran tells people to honour their sworn commitments to God.", source_ids: ["Q16:91"], requirement_id: "R1" }],
        list: [], more_explanation: [], limit_note: [],
      };
    } },
    verifier: { id: "controlled-checker", generateJson: async (request) => {
      capture(request);
      if (request.system.startsWith("You select evidence")) return {
        status: "ready", coverage: "complete", conflict_type: "none",
        assessments: [{ source_id: invalidSelection ? "invented" : "Q16:91", relevance: "direct", context_safe: "yes", supported_requirement_ids: ["R1"], position: "" }],
      };
      return { verdicts: ["supported"], requirement_verdicts: [{ requirement_id: "R1", verdict: "yes" }],
        answers_question: "yes", covers_facets: "yes", fair_picture: "yes", context_preserved: "yes",
        direct_answer_complete: "yes", listed_items_complete: "yes", no_repetition: "yes", not_established_ok: "yes" };
    } },
    search: async () => ["16:91"],
    getVerse: async (key) => key !== "16:91" ? undefined : { key, arabic: "وأوفوا بعهد الله إذا عاهدتم ولا تنقضوا الأيمان بعد توكيدها",
      arabicPlain: "وأوفوا بعهد الله إذا عاهدتم ولا تنقضوا الأيمان بعد توكيدها",
      translations: { en: "Fulfil any pledge you make in God’s name and do not break oaths after you have sworn them, for you have made God your surety: God knows everything you do.", de: null },
      url: "https://quran.com/16/91" },
    neighbours: async () => [],
  };
  const diagnostics: string[] = [];
  // Keep the historical failure-code comparison separate from new structural trace events.
  deps.onDiagnostic = (stage, code, _ms, details) => { if (details === undefined) diagnostics.push(`${stage}:${code}`); };
  const result = await run("What does the Quran say about keeping promises?", "en", deps);
  return { requests, status: result.status, diagnostics };
}

describe("claim audit disabled compatibility with pre-audit commit 648b0fd", () => {
  it.each([false, undefined])("preserves every model request and successful outcome when flag is %s", async (flag) => {
    const current = await controlledPromises(runPipeline, flag);
    expect(current.requests).toEqual(baseline.success.requests);
    expect(current.status).toBe(baseline.success.status);
    expect(current.status).toBe("answer");
    expect(current.diagnostics).toEqual([]);
  });
  it("preserves selection refusal and call count, while explaining the failure", async () => {
    const current = await controlledPromises(runPipeline, false, true);
    expect(current.requests).toEqual(baseline.refusal.requests);
    expect(current.status).toBe(baseline.refusal.status);
    expect(current.diagnostics).toEqual(["selection:source_id_invalid_or_unknown"]);
  });
});
