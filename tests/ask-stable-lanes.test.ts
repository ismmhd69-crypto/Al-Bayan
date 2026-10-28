import { selectionReply } from "./fixtures/selection";
import { positiveMeaningFixture } from "./fixtures/meaning";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runStableLanes } from "@/lib/ask/stable-lanes";
import { pack, dependencies, audit } from "./fixtures/rich";
import type { QuestionFrame, PassageForSelection } from "@/lib/ask/retrieval";
import type { RichSection } from "@/lib/ask/rich-answer";
import { emptyRichState, reduceRichEvent, type RichEvent } from "@/lib/ask/rich-answer";
import type { ProgressiveCheckpoint } from "@/lib/ask/progressive-checkpoint";
const frame: QuestionFrame = { ...pack.question, kind: "question", checklistStatus: "complete", searchQueries: { en: ["care responsibility"], ar: ["عناية يومية"] } };
const hints = { quran: [], hadith: [], scholars: [] };
it.each([
  ["quran"], ["hadith"], ["scholar"], ["quran", "hadith"], ["quran", "scholar"], ["hadith", "scholar"], ["quran", "hadith", "scholar"],
])("delivers an approved summary with only these available source families: %j", async (...available) => {
  const base = deps(), shown: RichSection[] = [];
  base.rich!.onSection = section => { shown.push(section); };
  if (!available.includes("quran")) base.search = async () => [];
  base.sourceAvailability = { hadith: available.includes("hadith"), scholar: available.includes("scholar") };
  base.writer.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    return { status: "answer", summary: [{ text: available.includes("scholar") ? "Ibn Baz explains care as a thoughtful responsibility." : "These sources describe care as a thoughtful responsibility.",
      source_ids: input.citable_source_ids_by_section.summary, requirement_id: "R1" }], next_step: [], no_answer_feedback: [] };
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  if (result.status !== "rich_answer") return;
  expect(result.answer.sections.map(s => s.group)).toEqual(["quran", "hadith", "scholar", "summary"]);
  expect(result.answer.sections[3].outcome).toBe("ready");
  expect(shown.filter(s => s.group === "summary")).toHaveLength(1);
  for (const section of result.answer.sections.slice(0, 3)) {
    if (available.includes(section.group)) expect(section.outcome).toBe("ready");
    else { expect(section.outcome).not.toBe("ready"); expect(section.sources).toEqual([]); }
  }
  let reader = emptyRichState(), sequence = 0;
  for (const [index, section] of result.answer.sections.entries()) {
    const event = section.outcome === "ready" ? { type: "section_committed", section, commit_id: String(index + 1).repeat(64), evidence_snapshot: "a".repeat(64) }
      : { type: "group_status", group: section.group, status: section.outcome === "no_direct_evidence" ? "empty" : "blocked", section };
    reader = reduceRichEvent(reader, { ...event, version: 3, request_id: "source-matrix", sequence: ++sequence } as RichEvent);
  }
  reader = reduceRichEvent(reader, { type: "terminal", result, version: 3, request_id: "source-matrix", sequence: ++sequence });
  expect(reader.terminal).toBe(true);
  expect((reader.result as typeof result).status).toBe("rich_answer");
});
it("delivers a checked Sunnah summary while retaining a failed Quran selection outcome", async () => {
  const base = deps(), verify = base.verifier.generateJson;
  base.sourceAvailability = { scholar: false, hadith: true };
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence") && input.candidates.some((c: any) => c.source.id.startsWith("Q"))) return { selection_contract: "candidate_refs_v1", assessments: [{ source_ref: "P999" }] };
    return verify(request);
  };
  base.writer.generateJson = async () => ({ status: "answer", summary: [{ text: "The Prophet taught people to take care with their actions.", source_ids: ["HE9001"], requirement_id: "R1" }], next_step: [], no_answer_feedback: [] });
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") expect(result.answer.sections.map(s => s.outcome)).toEqual(["failed_check", "ready", "unavailable", "ready"]);
});
it("recovers a useful Sunnah contribution before publishing that group", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, retry: 0, meaningApprovals: new Set() };
  base.progressiveCheckpoint = checkpoint; base.sourceAvailability = { scholar: false, hadith: true };
  let searches = 0;
  base.searchHadith = async () => ++searches < 3 ? [] : pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [];
  base.planEvidenceRecovery = async input => [{ requirementId: "R1", family: "hadith", language: "en", text: `care evidence ${input.round}` }];
  const shown: RichSection[] = []; base.rich!.onSection = section => { shown.push(section); };
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(checkpoint.recoveryRounds?.hadith).toBe(2);
  expect(shown.filter(s => s.group === "hadith")).toHaveLength(1);
  expect(shown.find(s => s.group === "hadith")?.outcome).toBe("ready");
});
it("uses two persisted recovery rounds before giving up Sunnah, without resetting them on Continue", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, retry: 0, meaningApprovals: new Set() };
  base.progressiveCheckpoint = checkpoint;
  base.sourceAvailability = { scholar: false, hadith: true };
  let searches = 0, plans = 0;
  base.searchHadith = async () => { searches++; return []; };
  base.planEvidenceRecovery = async input => {
    plans++;
    return [{ requirementId: "R1", family: "hadith", language: "en", text: `care example round ${input.round}` }];
  };
  base.revalidateStable = async () => ({ unavailable: false, rejectedIds: [] });
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(checkpoint.recoveryRounds?.hadith).toBe(2); expect(plans).toBe(2); expect(searches).toBe(3);
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(plans).toBe(2); expect(searches).toBe(4);
});
it("shares two recovery rounds across parallel groups and Continue", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, retry: 0, meaningApprovals: new Set() };
  base.progressiveCheckpoint = checkpoint;
  base.search = async () => []; base.searchHadith = async () => []; base.searchScholars = async () => [];
  const rounds: number[] = [];
  base.planEvidenceRecovery = vi.fn(async input => {
    rounds.push(input.round);
    return [{ requirementId: "R1", family: input.gaps[0].families[0], language: "en" as const, text: `new search round ${input.round}` }];
  });
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(rounds.sort()).toEqual([1, 2]);
  expect(Object.values(checkpoint.recoveryRounds ?? {}).reduce((sum, n) => sum + (n ?? 0), 0)).toBe(2);
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(base.planEvidenceRecovery).toHaveBeenCalledTimes(2);
});
it("does not reselect unchanged candidates after an unsuccessful new search", async () => {
  const base = deps(), verify = base.verifier.generateJson;
  base.sourceAvailability = { scholar: false, hadith: false };
  let selections = 0;
  base.verifier.generateJson = async request => {
    const value: any = await verify(request);
    if (request.system.startsWith("You select evidence")) {
      selections++;
      value.status = "insufficient"; value.coverage = "incomplete";
      for (const row of value.assessments) {
        row.relevance = "unrelated"; row.supported_requirement_ids = []; row.related_requirement_ids = [];
        row.contribution.role = "background"; row.distinct_contribution = "no";
      }
    }
    return value;
  };
  base.planEvidenceRecovery = vi.fn(async input => [{ requirementId: "R1", family: "quran" as const, language: "en" as const, text: `care source search ${input.round}` }]);
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete");
  expect(base.planEvidenceRecovery).toHaveBeenCalledTimes(2);
  expect(selections).toBe(1);
});
it.each([false, true])("reuses only identical ranking input; changed context=%s", async changedContext => {
  const base = deps(), ranking = vi.fn(async (_frame: QuestionFrame, candidates: PassageForSelection[]) => candidates);
  base.meaningRankCandidates = ranking;
  if (changedContext) base.neighbours = async () => pack.passages[0].source.kind === "quran" ? [{ ...pack.passages[0].source.verse, key: "2:182" }] : [];
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  const quranCalls = ranking.mock.calls.filter(([, candidates]) => candidates.some(p => p.source.kind === "quran"));
  expect(quranCalls).toHaveLength(changedContext ? 2 : 1);
});
function deps() {
  const base = dependencies();
  base.search = async () => ["2:183"];
  base.getVerse = async key => key === "2:183" && pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
  base.searchHadith = async () => pack.passages[1].source.kind === "hadith" ? [pack.passages[1].source.hadith] : [];
  base.searchScholars = async () => pack.passages[2].source.kind === "scholar" ? [pack.passages[2].source.quote] : [];
  base.rich = { progressive: true, stable: true };
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence")) return selectionReply(input, { status: "ready", coverage: "complete", conflict_type: "none", assessments: input.candidates.map((p: any) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) });
    if (input.stage === "narrow_meaning_review_v1") return positiveMeaningFixture(input);
    return audit(request.prompt);
  };
  return base;
}
it("publishes each settled group once and writes only the conclusion afterward", async () => {
  const base = deps(), shown: RichSection[] = [], writes: string[][] = [], write = base.writer.generateJson;
  base.rich!.onSection = s => { shown.push(structuredClone(s)); };
  base.rich!.onCard = () => { throw Error("preview must remain private"); };
  base.rich!.onWithdraw = () => { throw Error("normal research must not withdraw"); };
  base.writer.generateJson = req => { writes.push(JSON.parse(req.prompt).sections_to_write); return write(req); };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  expect(shown.map(s => s.group).sort()).toEqual(["hadith", "quran", "scholar", "summary"]);
  expect(writes).toEqual([["summary"]]);
  for (const section of shown.filter(s => s.group !== "summary")) { expect(section.presentation).toBe("originals"); expect(section.claims).toEqual([]); expect(section.sources.length).toBeGreaterThan(0); }
  if (result.status === "rich_answer") expect(result.answer.sections[0]).toEqual(shown.find(s => s.group === "quran"));
});
it("lets incomplete complementary selections reach the writer, then checks actual summary coverage", async () => {
  const base = deps(), verify = base.verifier.generateJson, write = vi.fn(base.writer.generateJson);
  let selections = 0;
  base.writer.generateJson = write;
  base.verifier.generateJson = async request => {
    const value: any = await verify(request);
    if (request.system.startsWith("You select evidence")) {
      selections++;
      value.status = "insufficient"; value.coverage = "incomplete";
    }
    return value;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(selections).toBe(3); // No fourth, pre-writing whole-answer selector.
  expect(write).toHaveBeenCalledOnce();
  expect(result.status).toBe("rich_answer"); // Final semantic/coverage verdicts are scripted here.
});
it.each([true, false])("judges actual summary support despite background planning labels: supported=%s", async supported => {
  const base = deps(), verify = base.verifier.generateJson;
  base.verifier.generateJson = async request => {
    const value: any = await verify(request);
    if (request.system.startsWith("You select evidence")) {
      value.status = "insufficient"; value.coverage = "incomplete";
      for (const row of value.assessments) {
        row.relevance = "context"; row.contribution.role = "background";
        row.supported_requirement_ids = []; row.related_requirement_ids = ["R1"];
      }
    }
    const input = JSON.parse(request.prompt);
    if (!supported && input.full_answer) {
      const row = value.claim_assessments[0], anchor = input.claim_evidence[0].negative_excerpt_choices[0];
      row.direct_support = "no"; row.explanation = "Invented negative control: the claim is not established.";
      row.finding = { category: "source_support", claim_quote: input.claims[0].claim, source_id: anchor.source_id, source_anchor_id: anchor.anchor_id };
      value.complete_coverage = "no"; value.all_claims_consistent = "no";
    }
    return value;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe(supported ? "rich_answer" : "incomplete"); // Scripted semantic controls, not religious judgments.
  if (result.status === "rich_answer") expect(result.answer.sections.slice(0, 3).every(s => s.sources.every(p => p.role === "background" && p.requirementIds?.length === 0))).toBe(true);
});
it("retains a mapped source when search fills its result cap, without replacing its identity", async () => {
  const base = deps(), verify = base.verifier.generateJson;
  if (pack.passages[1].source.kind !== "hadith") throw Error("fixture");
  const mapped = pack.passages[1].source.hadith;
  base.resolveHadithHint = vi.fn(async () => [mapped]);
  base.getHadith = vi.fn(async () => null);
  base.searchHadith = async () => Array.from({ length: 8 }, (_, i) => ({ ...mapped, id: `HE${900 + i}`, numbers: { bukhari: 900 + i, muslim: 1900 + i },
    arabic: `${mapped.arabic} ${String.fromCharCode(1575 + i)}`, url: `https://hadeethenc.com/en/browse/hadith/${900 + i}` }));
  let seen: string[] = [];
  base.verifier.generateJson = request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence") && input.candidates.length === 8) seen = input.candidates.map((p: any) => p.source.id);
    return verify(request);
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, { ...hints, hadith: ["HE123"] });
  expect(base.resolveHadithHint).toHaveBeenCalledOnce(); expect(base.getHadith).not.toHaveBeenCalled();
  expect(seen).toContain(mapped.id); expect(seen).toHaveLength(8);
  expect(result.status).toBe("rich_answer");
});

it("publishes useful background without automatically searching again for a direct label", async () => {
  const base = deps(), verify = base.verifier.generateJson;
  let hadithSelections = 0;
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt);
    if (request.system.startsWith("You select evidence") && input.candidates.length === 1 && input.candidates[0].source.id === pack.passages[1].id) {
      hadithSelections++;
      if (hadithSelections === 1) return selectionReply(input, { status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [{
        source_id: pack.passages[1].id, relevance: "context", supported_requirement_ids: [], related_requirement_ids: ["R1"],
        context_safe: "yes", scope_matches_question: "yes", distinct_contribution: "yes", position: "",
        contribution: { role: "background", scope: "general", conditions: [] },
      }] });
    }
    return verify(request);
  };
  base.planEvidenceRecovery = vi.fn(async input => [{ requirementId: "R1", family: input.gaps[0].families[0], language: "ar" as const, text: "عناية وحدود المسؤولية" }]);
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(base.planEvidenceRecovery).not.toHaveBeenCalled();
  expect(hadithSelections).toBe(1); expect(result.status).toBe("rich_answer");
});
it("keeps all committed source work when complete-question coverage fails", async () => {
  const base = deps(), verify = base.verifier.generateJson, shown: RichSection[] = [];
  base.rich!.onSection = s => { shown.push(s); };
  base.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), value: any = await verify(req);
    if (input.full_answer) {
      value.requirement_coverage[0].fully_answered = "no";
      value.complete_coverage = "no";
      value.question_checklist_complete = "no";
    }
    return value;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete"); expect(shown).toHaveLength(3);
  if (result.status === "incomplete") expect(result.sections).toEqual([shown.find(s => s.group === "quran"), shown.find(s => s.group === "hadith"), shown.find(s => s.group === "scholar")]);
});
it("reports broken selection distinctly from a search with no evidence", async () => {
  const base = deps(), write = vi.fn(base.writer.generateJson);
  base.writer.generateJson = write;
  base.verifier.generateJson = async () => ({ selection_contract: "candidate_refs_v1", status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [{ source_ref: "P999" }] });
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete");
  if (result.status === "incomplete") {
    expect(result.failureKind).toBe("selection_failure");
    expect(result.sections?.every(s => s.outcome === "failed_check" && s.searchFailureStage === "evidence_selection")).toBe(true);
  }
  expect(write).not.toHaveBeenCalled();
});
it("keeps a committed Quran section while the conclusion provider fails", async () => {
  const base = deps(), write = base.writer.generateJson, shown: RichSection[] = [];
  base.rich!.onSection = s => { shown.push(s); };
  base.writer.generateJson = req => JSON.parse(req.prompt).sections_to_write.includes("summary") ? Promise.reject(Error("invented provider failure")) : write(req);
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete"); expect(shown).toHaveLength(3);
  expect(shown.find(s => s.group === "quran")?.outcome).toBe("ready");
});
it("withholds an unsupported summary without blaming or rewriting original source sections", async () => {
  const base = deps(), verify = base.verifier.generateJson, notices: unknown[] = [], writes: string[][] = [], write = base.writer.generateJson, diagnostics: string[] = [];
  base.progressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.onDiagnostic = (_stage, code) => { diagnostics.push(code); };
  base.rich!.onIntegrity = n => { notices.push(n); };
  base.writer.generateJson = req => { writes.push(JSON.parse(req.prompt).sections_to_write); return write(req); };
  base.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), result: any = await verify(req);
    if (input.full_answer && result.claim_assessments) {
      result.claim_assessments[0].direct_support = "no";
      result.claim_assessments[0].reason_codes = ["unsupported_meaning"];
      result.claim_assessments[0].explanation = "Invented negative control with an exact cited original and affected claim.";
    }
    return result;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete");
  expect(notices, diagnostics.join(",")).toEqual([]);
  expect(writes.filter(g => g.includes("quran"))).toHaveLength(0);
  expect(base.progressiveCheckpoint.integrityBlocked).not.toBe(true);
  if (result.status === "incomplete") expect(result.sections?.find(s => s.group === "quran")?.outcome).toBe("ready");
});
it("checks only generated summary claims against the published originals", async () => {
  const base = deps(), verify = base.verifier.generateJson, reviewed: { text: string; evidence: string }[] = [], fullAudits: any[] = [];
  base.verifier.generateJson = req => {
    const input = JSON.parse(req.prompt);
    if (input.stage === "narrow_meaning_review_v1") reviewed.push(...input.claims.map((c: any) => ({ text: c.text, evidence: JSON.stringify([c.originals, c.restrictive_context]) })));
    if (input.full_answer) fullAudits.push(input);
    return verify(req);
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  if (result.status !== "rich_answer") return;
  for (const section of result.answer.sections) for (const claim of section.claims) {
    const checks = reviewed.filter(row => row.text === claim.text);
    expect(checks.length, section.group).toBeGreaterThan(0);
    expect(new Set(checks.map(row => row.evidence)).size, section.group).toBe(checks.length);
  }
  expect(result.answer.sections.slice(0, 3).every(s => s.claims.length === 0)).toBe(true);
  expect(reviewed).toHaveLength(result.answer.sections[3].claims.length);
  expect(fullAudits[0].publication_mode).toBe("originals_then_summary");
  expect(fullAudits.length).toBeGreaterThan(0);
  expect(fullAudits[0].claims).toHaveLength(result.answer.sections.flatMap(s => s.claims).length);
});
it("requires a new summary meaning check when the configured reviewer changes", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  const verify = base.verifier.generateJson, reviewed: string[] = [];
  base.revalidateStable = async () => ({ unavailable: false, rejectedIds: [] });
  base.verifier = { id: "fake/replacement-reviewer", generateJson: req => {
    const input = JSON.parse(req.prompt); if (input.stage === "narrow_meaning_review_v1") reviewed.push(...input.claims.map((c: any) => c.text));
    return verify(req);
  } };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  if (result.status === "rich_answer") for (const claim of result.answer.sections[3].claims) expect(reviewed).toContain(claim.text);
  for (const group of ["quran", "hadith", "scholar"] as const) expect(checkpoint.stable![group]!.section.claims).toEqual([]);
});
it("continues frozen sections without running their writers again", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  const write = vi.fn(base.writer.generateJson); base.writer.generateJson = write;
  base.revalidateStable = async () => ({ unavailable: false, rejectedIds: [] });
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  expect(write.mock.calls.every(([req]) => JSON.stringify(JSON.parse(req.prompt).sections_to_write) === '["summary"]')).toBe(true);
});
it("sends a grounded summary rejection to bounded correction without rewriting source cards", async () => {
  const base = deps(), verify = base.verifier.generateJson, writes = vi.fn(base.writer.generateJson), diagnostics: string[] = [];
  let reviews = 0;
  base.writer.generateJson = writes;
  base.onDiagnostic = (_stage, code) => { diagnostics.push(code); };
  base.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), value: any = await verify(req);
    if (input.full_answer && ++reviews === 1) {
      const row = value.claim_assessments[0], choice = input.claim_evidence[0].negative_excerpt_choices[0];
      row.conditions_preserved = "no";
      row.explanation = "Invented bounded correction control: preserve the cited qualification.";
      row.finding = { category: "missing_qualification", claim_quote: input.claims[0].claim, source_id: choice.source_id, source_anchor_id: choice.anchor_id };
      value.all_claims_consistent = "no";
    }
    return value;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("rich_answer");
  expect(diagnostics).not.toContain("rich_checker_response_invalid");
  expect(diagnostics).toContain("rich_summary_meaning_correction");
  expect(writes).toHaveBeenCalledTimes(2);
  expect(writes.mock.calls.every(([req]) => JSON.parse(req.prompt).sections_to_write.join() === "summary")).toBe(true);
});
it.each([true, false])("rechecks a targeted summary repair using a different displayed source: supported=%s", async supported => {
  const base = deps(), verify = base.verifier.generateJson, write = base.writer.generateJson;
  let audits = 0, writes = 0;
  base.writer.generateJson = async request => {
    writes++;
    const input = JSON.parse(request.prompt), choices = input.correction?.summary_citation_choices;
    if (choices) return { status: "answer", summary: { P0: { text: "The Prophet taught people to take care with their actions.", source_refs: [choices.find((c: any) => c.id === "HE9001").reference] } }, next_step: [], no_answer_feedback: [] };
    return write(request);
  };
  base.verifier.generateJson = async request => {
    const input = JSON.parse(request.prompt), value: any = await verify(request);
    if (input.full_answer && (++audits === 1 || !supported)) {
      const row = value.claim_assessments[0], choice = input.claim_evidence[0].negative_excerpt_choices[0];
      row.direct_support = "no"; row.explanation = "Invented support rejection used to test source-bound repair.";
      row.finding = { category: "source_support", claim_quote: input.claims[0].claim, source_id: choice.source_id, source_anchor_id: choice.anchor_id };
      value.all_claims_consistent = "no";
    }
    return value;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe(supported ? "rich_answer" : "incomplete");
  expect(writes).toBe(2); // No additional correction allowance.
  const shown = result.status === "rich_answer" ? result.answer.sections : result.status === "incomplete" ? result.sections! : [];
  expect(shown.filter(s => s.group !== "summary").every(s => s.presentation === "originals" && s.outcome === "ready")).toBe(true);
  if (result.status === "rich_answer") expect(result.answer.sections[3].claims[0].refs).toEqual(["HE9001"]);
});
it("keeps prior checked content when rechecking is unavailable without inventing a source error", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  const notices = vi.fn(); base.rich!.onIntegrity = notices;
  base.revalidateStable = async () => ({ unavailable: true, rejectedIds: [] });
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete"); expect(notices).not.toHaveBeenCalled();
  if (result.status === "incomplete") expect(result.failureKind).toBe("source_revalidation_unavailable");
  expect(checkpoint.stable!.quran!.section.outcome).toBe("ready");
});
it("flags a changed original on Continue while retaining its committed card container", async () => {
  const base = deps(), checkpoint: ProgressiveCheckpoint = { lanes: {}, meaningApprovals: new Set(), retry: 0 };
  base.progressiveCheckpoint = checkpoint;
  await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  const original = structuredClone(checkpoint.stable!.quran!.section);
  const notices = vi.fn(), write = vi.fn(base.writer.generateJson);
  base.rich!.onIntegrity = notices; base.writer.generateJson = write;
  base.revalidateStable = async sources => ({ unavailable: false, rejectedIds: sources.filter(p => p.id === "Q2:183").map(p => p.id) });
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete");
  expect(notices).toHaveBeenCalledWith({ group: "quran", claimIndexes: [], sourceIds: ["Q2:183"], reason: "source_changed" });
  expect(checkpoint.stable!.quran!.section).toEqual(original);
  expect(write).not.toHaveBeenCalled();
});
it("does not treat a later repetition preference as grounds to hide or redraft committed sources", async () => {
  const base = deps(), verify = base.verifier.generateJson, notices: unknown[] = [], write = vi.fn(base.writer.generateJson);
  base.writer.generateJson = write; base.rich!.onIntegrity = n => { notices.push(n); };
  base.verifier.generateJson = async req => {
    const input = JSON.parse(req.prompt), result: any = await verify(req);
    if (input.full_answer && result.contribution_map) {
      result.no_repetition = "no";
      result.contribution_map[0].adds_value = "no";
      result.contribution_map[0].duplicates = ["C2"];
    }
    return result;
  };
  const result = await runStableLanes("Explain care", frame, base, new AbortController().signal, hints);
  expect(result.status).toBe("incomplete"); expect(notices).toEqual([]);
  expect(write.mock.calls.filter(([req]) => JSON.parse(req.prompt).sections_to_write.includes("quran"))).toHaveLength(0);
});
