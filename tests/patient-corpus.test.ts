// Scripted providers establish orchestration and source boundaries, not answer accuracy.
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPatientPipeline, type PatientPipelineDeps } from "@/lib/ask/patient-pipeline";
import type { QuestionFrame } from "@/lib/ask/retrieval";
import type { PatientEvent } from "@/lib/ask/patient-protocol";
import type { PatientCheckpoint } from "@/lib/ask/patient-engine";
import { pack, dependencies, audit } from "./fixtures/rich";
import { reducePatientEvent, emptyPatientState } from "@/lib/ask/patient-protocol";

const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: { en: ["care responsibility"], ar: ["عناية يومية"] } };
function setup(questionFrame: QuestionFrame = frame) {
  const events: PatientEvent[] = [], selections: string[][] = [], base = dependencies();
  const deps: PatientPipelineDeps = { ...base, engineRevision: "c".repeat(64), revalidate: async () => true,
    append: async event => { events.push(event); },
    search: async () => ["2:183"], getVerse: async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined,
    searchHadith: async () => pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [],
    searchScholars: async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : [],
  };
  deps.verifier.generateJson = async req => {
    if (!req.system.startsWith("You select evidence")) return audit(req.prompt);
    const data = JSON.parse(req.prompt);
    const ids = data.candidates.map((p: { source: { id: string } }) => p.source.id); selections.push(ids);
    return { status: "ready", coverage: "complete", conflict_type: "none",
      ...(req.schema.type === "object" && "missing_requirement_ids" in req.schema.properties ? { missing_requirement_ids: [] } : {}), assessments: ids.map((id: string) => ({
      source_id: id, relevance: pack.passages.some(p => p.id === id) ? "direct" : "unrelated",
      supported_requirement_ids: pack.passages.some(p => p.id === id) ? ["R1"] : [], context_safe: "yes", position: "",
      contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes",
    })) };
  };
  const run = (signal = new AbortController().signal, checkpoint?: PatientCheckpoint) => runPatientPipeline({ jobId: "00000000-0000-4000-8000-000000000031", question: "Explain care", language: "en", frame: questionFrame, checkpoint }, deps, signal);
  return { deps, events, selections, run };
}

it("delivers Quran and Sunnah while original-passage scholar discovery is still pending", async () => {
  const { deps, events, run } = setup(), append = deps.append;
  let release!: () => void, scholarIndexReady = false;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const requested: unknown[] = [];
  deps.retrieveCorpusCandidates = async (_frame, _signal, families) => {
    requested.push(families);
    if (families?.[0] === "hadith") return [pack.passages[1]];
    await delayed; scholarIndexReady = true; return [pack.passages[2]];
  };
  deps.append = async (event, checkpoint) => {
    if (event.type === "section" && ["quran", "hadith"].includes(event.section.group)) expect(scholarIndexReady).toBe(false);
    if (event.type === "section" && event.section.group === "hadith") release();
    await append(event, checkpoint);
  };
  try {
    const result = await run(); expect(result.state.status).toBe("complete");
    expect(requested).toEqual([["hadith"], ["scholar"]]);
    expect(events.filter(e => e.type === "section").map(e => e.section.group)).toEqual(["quran", "hadith", "scholar", "summary"]);
  } finally { release(); }
});

it("streams checked educational sections for a case-specific concern while necessary scholar research is pending", async () => {
  const local: QuestionFrame = { ...frame, requirements: [{ ...frame.requirements[0], facet: "ruling", scope: "case_specific" }] };
  const { deps, events, run } = setup(local), append = deps.append;
  let release!: () => void, scholarFinished = false;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  deps.searchScholars = async () => { await delayed; scholarFinished = true; return []; };
  deps.append = async (event, checkpoint) => {
    if (event.type === "section" && ["quran", "hadith"].includes(event.section.group)) expect(scholarFinished).toBe(false);
    if (event.type === "section" && event.section.group === "hadith") release();
    await append(event, checkpoint);
  };
  try {
    const paused = await run(); expect(paused.state.status).toBe("paused");
    expect(events.filter(e => e.type === "section").map(e => e.section.group)).toEqual(["quran", "hadith"]);
    expect(paused.retryGroups).toEqual(["scholar"]);
    expect(paused.state.answer).toBeUndefined();
  } finally { release(); }
});

it("still withholds personal instructions rejected by independent source checking", async () => {
  const local: QuestionFrame = { ...frame, requirements: [{ ...frame.requirements[0], facet: "ruling", scope: "case_specific" }] };
  const { deps, events, run } = setup(local), check = deps.verifier.generateJson;
  deps.searchScholars = async () => [];
  deps.verifier.generateJson = async req => {
    const value = await check(req) as Record<string, unknown>;
    if (!req.system.startsWith("You select evidence")) value.personal_application_avoided = "no";
    return value;
  };
  expect((await run()).state.status).toBe("paused");
  expect(events.some(e => e.type === "section")).toBe(false);
});

it("treats valid unrelated candidates as an empty source group rather than a provider outage", async () => {
  const { deps, events, run } = setup(), check = deps.verifier.generateJson, write = deps.writer.generateJson;
  deps.verifier.generateJson = async req => {
    const value = await check(req) as Record<string, unknown>;
    if (req.system.startsWith("You select evidence")) value.assessments = (value.assessments as Record<string, unknown>[])
      .map(row => row.source_id === "HE9001" ? { ...row, relevance: "unrelated", supported_requirement_ids: [] } : row);
    return value;
  };
  deps.writer.generateJson = async req => {
    const value = await write(req) as Record<string, unknown>;
    if (Array.isArray(value.summary)) value.summary = value.summary.map(row => ({ ...row, source_ids: ["Q2:183"] }));
    return value;
  };
  const result = await run(); expect(result.state.status).toBe("complete");
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.state === "empty" && !e.reason)).toBe(true);
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.reason === "source_failed")).toBe(false);
  expect(result.state.answer?.sections[1].outcome).toBe("no_direct_evidence");
});

it("reports a malformed partial selector as an explanation problem and can recover it in combined checking", async () => {
  const { deps, events, run } = setup(), check = deps.verifier.generateJson;
  deps.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt);
    if (req.system.includes("Assess useful contributions") && input.candidates.every((p: { source: { id: string } }) => p.source.id === "HE9001")) return null;
    return check(req);
  };
  const result = await run(); expect(result.state.status).toBe("complete");
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.reason === "explanation_failed")).toBe(true);
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.reason === "source_failed")).toBe(false);
  expect(result.state.answer?.sections[1]).toMatchObject({ outcome: "ready" });
  expect(result.state.answer?.sections[1].searchOutcome).toBeUndefined();
});

it.each(["disabled", "outage"])("preserves the actual optional-source %s outcome in the final answer", async problem => {
  const { deps, run } = setup(), write = deps.writer.generateJson;
  if (problem === "disabled") deps.sourceAvailability = { hadith: false, scholar: true };
  else deps.searchHadith = async () => { throw Error("mock source outage"); };
  deps.writer.generateJson = async req => {
    const value = await write(req) as Record<string, unknown>;
    if (Array.isArray(value.summary)) value.summary = value.summary.map(row => ({ ...row, source_ids: ["Q2:183"] }));
    return value;
  };
  const result = await run(); expect(result.state.status).toBe("complete");
  expect(result.state.answer?.sections[1].outcome).toBe(problem === "disabled" ? "unavailable" : "search_failed");
});

it("offers corpus-discovered candidates to meaning ranking before the old twelve-source cutoff", async () => {
  const { deps, run } = setup(), source = pack.passages[1];
  if (source.source.kind !== "hadith") throw Error("fixture");
  const h = source.source.hadith;
  const earlier = Array.from({ length: 19 }, (_, i) => ({ ...source, id: `HE${9100 + i}`, source: { kind: "hadith" as const,
    hadith: { ...h, id: `HE${9100 + i}`, numbers: { bukhari: 100 + i, muslim: null }, collection: "bukhari" as const, attributionAr: "رواه البخاري" } }, retrievedFor: ["R1"] }));
  deps.searchHadith = async () => [];
  deps.retrieveCorpusCandidates = async (_frame, _signal, families) => families?.includes("hadith") ? [...earlier, { ...source, retrievedFor: ["R1"] }] : [];
  const ranked: string[][] = [];
  deps.meaningRankCandidates = async (_frame, candidates) => { ranked.push(candidates.map(c => c.id)); return candidates; };
  expect((await run()).state.status).toBe("complete");
  const fullHadithInput = ranked.find(ids => ids.filter(id => id.startsWith("HE")).length === 20);
  expect(fullHadithInput).toContain(source.id);
});

it("uses independently eligible index evidence during a provider outage and reports the partial failure", async () => {
  const { deps, events, run } = setup();
  deps.searchHadith = async () => { throw Error("mock provider unavailable"); };
  deps.retrieveCorpusCandidates = async (_frame, _signal, families) => families?.includes("hadith") ? [pack.passages[1]] : [];
  const result = await run(); expect(result.state.status).toBe("complete");
  expect(result.research.hadith).toMatchObject({ status: "ready", searchOutcome: "search_failed" });
  const hadith = events.find(e => e.type === "section" && e.section.group === "hadith");
  expect(hadith?.type === "section" && hadith.section).toMatchObject({ outcome: "ready", searchOutcome: "search_failed" });
});

it("does not label a failed index and empty provider as a successful empty search", async () => {
  const { deps, events, run } = setup();
  deps.searchHadith = async () => [];
  deps.retrieveCorpusCandidates = async (_frame, _signal, families) => {
    if (families?.includes("hadith")) throw Error("mock index unavailable"); return [];
  };
  expect((await run()).state.status).toBe("paused");
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.state === "needs_attention" && e.reason === "source_failed")).toBe(true);
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.state === "empty")).toBe(false);
});

it("does not query a disabled family through the index", async () => {
  const { deps, events, run } = setup(), requested: unknown[] = [];
  deps.sourceAvailability = { hadith: false, scholar: true };
  deps.retrieveCorpusCandidates = async (_frame, _signal, families) => { requested.push(families); return []; };
  await run(); expect(requested).toEqual([["scholar"]]);
  expect(events.some(e => e.type === "state" && e.group === "hadith" && e.state === "needs_attention" && e.reason === "source_unavailable")).toBe(true);
});

it("keeps usable scholarly evidence but reports a failed parallel scholar provider", async () => {
  const { deps, events, run } = setup();
  deps.searchScholarsLive = async () => { throw Error("mock live lookup unavailable"); };
  const result = await run(); expect(result.state.status).toBe("complete");
  expect(result.research.scholar).toMatchObject({ status: "ready", searchOutcome: "search_failed" });
  expect(events.some(e => e.type === "section" && e.section.group === "scholar" && e.section.searchOutcome === "search_failed")).toBe(true);
});

it("does not turn a failed scholarly lookup into successful emptiness when other results fail eligibility", async () => {
  const { deps, events, run } = setup(), source = pack.passages[2].source;
  if (source.kind !== "scholar") throw Error("fixture");
  deps.searchScholars = async () => [{ ...source.quote, url: "https://unapproved.invalid/fatwa" }];
  deps.searchScholarsLive = async () => { throw Error("mock live lookup unavailable"); };
  await run();
  expect(events.some(e => e.type === "state" && e.group === "scholar" && e.state === "needs_attention" && e.reason === "source_failed")).toBe(true);
  expect(events.some(e => e.type === "state" && e.group === "scholar" && e.state === "empty" && !e.reason)).toBe(false);
});

it("stops waiting for source providers that ignore cancellation without starting model work", async () => {
  const { deps, run } = setup(), controller = new AbortController();
  let began!: () => void;
  const started = new Promise<void>(resolve => { began = resolve; });
  deps.search = async () => { began(); return new Promise(() => {}); };
  deps.searchHadith = async () => new Promise(() => {});
  deps.searchScholars = async () => new Promise(() => {});
  const model = vi.fn(deps.verifier.generateJson); deps.verifier.generateJson = model;
  const work = run(controller.signal); await started; controller.abort();
  await expect(work).rejects.toMatchObject({ name: "AbortError" });
  expect(model).not.toHaveBeenCalled();
});

it.each([null, { status: ["ready"] }, { status: "ready", coverage: "complete", conflict_type: "none", assessments: [{ source_id: "invented" }] }])
("pauses a broken combined selector without treating it as failed source research %#", async malformed => {
  const first = setup(), check = first.deps.verifier.generateJson;
  first.deps.verifier.generateJson = async req => req.system.includes("Assess the combined evidence") ? malformed : check(req);
  first.deps.planEvidenceRecovery = vi.fn(async () => []);
  const paused = await first.run();
  expect(paused.state.status).toBe("paused"); expect(paused.retryGroups).toEqual([]);
  expect(paused.state.groups.scholar.section).toBeDefined();
  expect(first.deps.planEvidenceRecovery).not.toHaveBeenCalled();
  expect(first.events.at(-1)).toMatchObject({ type: "pause", reason: "explanation_failed" });
  const next = setup();
  next.deps.search = vi.fn(next.deps.search); next.deps.searchHadith = vi.fn(next.deps.searchHadith!); next.deps.searchScholars = vi.fn(next.deps.searchScholars!);
  expect((await next.run(undefined, paused)).state.status).toBe("complete");
  expect(next.deps.search).not.toHaveBeenCalled(); expect(next.deps.searchHadith).not.toHaveBeenCalled(); expect(next.deps.searchScholars).not.toHaveBeenCalled();
});

it("stops recovery after a malformed reassessment without spending on a second research round", async () => {
  const { deps, run, events } = setup(), check = deps.verifier.generateJson, source = pack.passages[1].source;
  if (source.kind !== "hadith") throw Error("fixture");
  let combined = 0, hadithLookups = 0;
  deps.searchHadith = async () => ++hadithLookups === 1 ? [source.hadith] : [{ ...source.hadith, id: "HE9002", collection: "bukhari", attributionAr: "رواه البخاري", numbers: { bukhari: 9002, muslim: null }, url: "https://hadeethenc.com/en/browse/hadith/9002" }];
  deps.verifier.generateJson = async req => {
    if (!req.system.includes("Assess the combined evidence")) return check(req);
    if (++combined === 1) return { ...await check(req) as object, status: "insufficient", coverage: "incomplete", missing_requirement_ids: ["R1"] };
    return null;
  };
  deps.planEvidenceRecovery = vi.fn(async () => [{ requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "novel care evidence" }]);
  const paused = await run();
  expect(paused.state.status).toBe("paused"); expect(paused.retryGroups).toEqual([]);
  expect(combined).toBe(2); expect(deps.planEvidenceRecovery).toHaveBeenCalledTimes(1);
  expect(events.at(-1)).toMatchObject({ type: "pause", reason: "explanation_failed" });
  expect(paused.state.groups.quran.section).toBeDefined(); expect(paused.state.groups.hadith.section).toBeDefined();
});

it("targets only the unresolved concern during recovery and continuation while preserving earlier checked work", async () => {
  const local: QuestionFrame = { ...frame, requiredFacets: ["general", "conditions"], requirements: [
    { ...frame.requirements[0], searchQueries: { en: ["care basics"], ar: ["عناية عامة"] } },
    { id: "R2", text: "Explain care limitations", facet: "conditions", searchQueries: { en: ["care limitations"], ar: ["حدود العناية"] } },
  ] };
  const installGap = (deps: PatientPipelineDeps) => {
    const check = deps.verifier.generateJson;
    deps.verifier.generateJson = async req => req.system.includes("Assess the combined evidence")
      ? { ...await check(req) as object, status: "insufficient", coverage: "incomplete", missing_requirement_ids: ["R2"] } : check(req);
  };
  const first = setup(local); installGap(first.deps);
  first.deps.planEvidenceRecovery = vi.fn<NonNullable<PatientPipelineDeps["planEvidenceRecovery"]>>(async input => { expect(input.gaps.map(g => g.requirementId)).toEqual(["R2"]); return []; });
  const paused = await first.run();
  expect(paused.state.status).toBe("paused"); expect(paused.retryRequirementIds).toEqual(["R2"]);
  expect(first.deps.planEvidenceRecovery).toHaveBeenCalledOnce();
  const next = setup(local); installGap(next.deps);
  next.deps.search = vi.fn(next.deps.search); next.deps.searchHadith = vi.fn(next.deps.searchHadith!); next.deps.searchScholars = vi.fn(next.deps.searchScholars!);
  next.deps.writer.generateJson = vi.fn(next.deps.writer.generateJson);
  const indexScopes: string[][] = [];
  next.deps.retrieveCorpusCandidates = async frame => { indexScopes.push(frame.requirements.map(r => r.id)); return []; };
  const again = await next.run(undefined, paused);
  expect(again.state.status).toBe("paused"); expect(again.retryRequirementIds).toEqual(["R2"]);
  expect(next.deps.search).toHaveBeenCalledTimes(1); expect(next.deps.searchHadith).toHaveBeenCalledTimes(1); expect(next.deps.searchScholars).toHaveBeenCalledTimes(1);
  expect(vi.mocked(next.deps.searchHadith!).mock.calls[0][0].en).toEqual(["care limitations"]);
  expect(indexScopes).toEqual([["R2"], ["R2"]]);
  expect(next.deps.writer.generateJson).not.toHaveBeenCalled();
  expect(again.research.quran?.status === "ready" && again.research.quran.passages[0].requirementIds).toEqual(["R1"]);
  expect(again.state.answer).toBeUndefined();
});

it("serializes concurrent discovery saves and replays the exact final state", async () => {
  const { deps, events, run } = setup(), append = deps.append;
  let writing = false;
  deps.append = async (event, checkpoint) => {
    expect(writing).toBe(false); writing = true;
    await Promise.resolve();
    if (event.type === "research_checkpoint") {
      expect(checkpoint.discovery?.hash).toBe(event.hash);
      expect(checkpoint.state.researchRevision).toBe(event.revision);
    }
    await append(event, checkpoint); writing = false;
  };
  const result = await run();
  expect(result.state.status).toBe("complete");
  const metadata = events.filter(e => e.type === "research_checkpoint");
  expect(metadata.map(e => e.revision)).toEqual(metadata.map((_, i) => i + 1));
  let state = emptyPatientState(result.state.jobId, "en");
  for (const event of events) state = reducePatientEvent(state, event);
  expect(state).toEqual(result.state);
  expect(Object.keys(result.discovery!.batches).sort()).toEqual(["hadith", "quran", "scholar"]);
});

it("reuses a saved source discovery after interruption before selection", async () => {
  const first = setup(), controller = new AbortController();
  let saved: PatientCheckpoint | undefined;
  first.deps.append = async (event, checkpoint) => {
    if (event.type === "research_checkpoint" && checkpoint.discovery?.batches.quran) {
      saved = structuredClone(checkpoint); controller.abort();
    }
  };
  await expect(first.run(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(saved?.state.status).toBe("working");
  const next = setup(); next.deps.search = vi.fn(next.deps.search);
  const result = await next.run(undefined, saved);
  expect(result.state.status).toBe("complete");
  expect(next.deps.search).not.toHaveBeenCalled();
});

it("stops before model selection when discovery cannot be saved", async () => {
  const { deps, run } = setup();
  const model = vi.fn(deps.verifier.generateJson); deps.verifier.generateJson = model;
  deps.append = async event => {
    if (event.type === "research_checkpoint") throw Object.assign(Error("private storage unavailable"), { name: "ResearchStorageError" });
  };
  await expect(run()).rejects.toMatchObject({ name: "ResearchStorageError" });
  expect(model).not.toHaveBeenCalled();
});

it("includes newly discovered candidates after explicit continuation instead of reusing an old working pool", async () => {
  const first = setup(), check = first.deps.verifier.generateJson;
  first.deps.verifier.generateJson = async req => req.system.includes("Assess the combined evidence") ? null : check(req);
  const paused = await first.run();
  paused.retryGroups = ["hadith"]; paused.attempt = 1;
  const next = setup(), source = pack.passages[1].source;
  if (source.kind !== "hadith") throw Error("fixture");
  next.deps.searchHadith = async () => [{ ...source.hadith, id: "HE9002", collection: "bukhari", attributionAr: "رواه البخاري", numbers: { bukhari: 9002, muslim: null }, url: "https://hadeethenc.com/en/browse/hadith/9002" }];
  const combined: string[][] = [], verify = next.deps.verifier.generateJson;
  next.deps.verifier.generateJson = async req => {
    if (req.system.includes("Assess the combined evidence")) combined.push(JSON.parse(req.prompt).candidates.map((p: { source: { id: string } }) => p.source.id));
    return verify(req);
  };
  expect((await next.run(undefined, paused)).state.status).toBe("complete");
  expect(combined[0]).toContain("HE9002");
});

it("retains unselected recovery originals and consumes pending query history across a resumed attempt", async () => {
  const first = setup(), verify = first.deps.verifier.generateJson;
  first.deps.verifier.generateJson = async req => req.system.includes("Assess the combined evidence") ? null : verify(req);
  const paused = await first.run();
  const { nextResearchProgress } = await import("@/lib/ask/research-progress");
  const query = { requirementId: "R1", family: "hadith" as const, language: "en" as const, text: "unfinished care inquiry" };
  const discovery = nextResearchProgress(paused.discovery, { queries: [{ query, attempt: 0, status: "planned" }], recoveryRounds: [{ attempt: 0, round: 2 }] });
  // Simulate a checkpointed recovery plan followed by worker interruption.
  paused.discovery = discovery; paused.state.researchRevision = discovery.revision; paused.state.researchHash = discovery.hash;
  paused.attempt = 1;
  const next = setup(), check = next.deps.verifier.generateJson, source = pack.passages[1].source;
  if (source.kind !== "hadith") throw Error("fixture");
  next.deps.searchHadith = vi.fn(async () => [{ ...source.hadith, id: "HE9002", collection: "bukhari" as const, attributionAr: "رواه البخاري", numbers: { bukhari: 9002, muslim: null }, url: "https://hadeethenc.com/en/browse/hadith/9002" }]);
  next.deps.verifier.generateJson = async req => req.system.includes("Assess the combined evidence")
    ? { ...await check(req) as object, status: "insufficient", coverage: "incomplete", missing_requirement_ids: ["R1"] } : check(req);
  const result = await next.run(undefined, paused);
  expect(next.deps.searchHadith).toHaveBeenCalledOnce();
  expect(result.discovery?.candidates.map(p => p.id)).toContain("HE9002");
  expect(result.discovery?.queries).toEqual([{ query, attempt: 0, status: "finished" }]);
  const restart = setup(); restart.deps.searchHadith = vi.fn(restart.deps.searchHadith!);
  const resumed = await restart.run(undefined, result);
  expect(vi.mocked(restart.deps.searchHadith).mock.calls.every(([terms]) => !JSON.stringify(terms).includes(query.text))).toBe(true);
  expect(resumed.discovery?.queries).toEqual([{ query, attempt: 0, status: "finished" }]);
});
