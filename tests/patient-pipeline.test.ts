import { selectionReply } from "./fixtures/selection";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPatientPipeline, type PatientPipelineDeps } from "@/lib/ask/patient-pipeline";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import type { PatientEvent } from "@/lib/ask/patient-protocol";
import { pack, dependencies, audit } from "./fixtures/rich";

afterEach(() => vi.unstubAllEnvs());
it.each([false, true])("runs actual search/selection/writing/checking while scholars are pending, stable=%s", async stable => {
  vi.stubEnv("NEXT_PUBLIC_ASK_STABLE_STREAMING", String(stable));
  const base = dependencies(), events: PatientEvent[] = [];
  let release!: () => void, scholarFinished = false;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care responsibility"], ar: ["عناية يومية"] } };
  const deps: PatientPipelineDeps = {
    ...base, engineRevision: "c".repeat(64), revalidate: async () => true,
    append: async event => {
      events.push(event);
      if (event.type === "section" && event.section.group === "hadith") { expect(scholarFinished).toBe(false); release(); }
    },
    search: async () => ["2:183"],
    getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined,
    searchHadith: async () => pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [],
    searchScholars: async () => { await delayed; scholarFinished = true; return pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : []; },
  };
  deps.verifier.generateJson = async req => {
    if (!req.system.startsWith("You select evidence")) return audit(req.prompt);
    const data = JSON.parse(req.prompt);
    return selectionReply(data, { status: "ready", coverage: "complete", conflict_type: "none",
      ...(req.schema.type === "object" && "missing_requirement_ids" in req.schema.properties ? { missing_requirement_ids: [] } : {}), assessments: data.candidates.map((p: { source: { id: string } }) => ({
      source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "",
      contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes",
    })) });
  };
  const result = await runPatientPipeline({ jobId: "00000000-0000-4000-8000-000000000021", question: "Explain care", language: "en", frame }, deps, new AbortController().signal);
  expect(result.state.status).toBe("complete");
  expect(events.filter(e => e.type === "section").map(e => e.section.group)).toEqual(["quran", "hadith", "scholar", "summary"]);
});
