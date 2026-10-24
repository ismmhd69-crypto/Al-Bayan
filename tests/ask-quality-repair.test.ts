// Offline regressions for the October 20 failure. Scripted wording/verdicts test behaviour,
// not religious accuracy. No providers, source requests, database or billing calls.
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { rankHadithTitles } from "@/lib/sources/hadith";
import { matchingTopicHints } from "@/data/topic-source-hints";
import { anchoredExcerpt } from "@/lib/sources/scholar-excerpt";
import { parseEvidencePackage, type QuestionFrame } from "@/lib/ask/retrieval";
import { parseRichClaims, richCoverageChecked, runRichAnswer } from "@/lib/ask/rich-engine";
import { validRichAnswer } from "@/lib/ask/rich-answer";
import { audit, dependencies, drafts, pack, richAnswer } from "./fixtures/rich";

describe("search preserves independent concerns and checked reference hints", () => {
  it("does not combine unrelated single-word matches into a false hadith hit", () => {
    const entry = (id: string, text: string) => ({ id, title: text, terms: new Set(text.split(" ")) });
    expect(rankHadithTitles([
      entry("wrong", "harm prayer"), entry("rights", "harm debt"), entry("prayer", "prayer duty"),
    ], ["harm debt", "prayer duty"], 2)).toEqual(["rights", "prayer"]);
  });
  it.each([
    "What does Islam teach about repentance if someone has hurt another person? Is asking Allah for forgiveness enough?",
    "How can I repent after harming someone?",
    "كيف أتوب بعدما ظلمت شخصا وهل تكفي التوبة؟",
    "Wie bereue ich, wenn ich jemandem geschadet habe?",
  ])("seeds the verified hadith candidate for %s without approving an answer", question => {
    const hints = matchingTopicHints(question);
    expect(hints.flatMap(h => h.hadith)).toContain("HE5438");
    expect(hints.flatMap(h => h.fatwas).some(url => url.includes("/17964/"))).toBe(true);
  });
});

describe("source context is required, not a nearby topic", () => {
  it("keeps a checked complete span unchanged and refuses changed or ambiguous boundaries", () => {
    // Invented text: exact extraction mechanics only, not a scholar quotation.
    const text = "Opening paragraph.\nConditions begin: first condition.\nSecond condition.\nRights condition ends.\nLater material.";
    expect(anchoredExcerpt(text, "Conditions begin:", "Rights condition ends.")).toBe("Conditions begin: first condition. Second condition. Rights condition ends.");
    expect(anchoredExcerpt(text, "Changed beginning:", "Rights condition ends.")).toBeNull();
    expect(anchoredExcerpt(text + " Rights condition ends.", "Conditions begin:", "Rights condition ends.")).toBeNull();
    expect(anchoredExcerpt(text, "Conditions begin:", "Rights condition ends.", 40)).toBeNull();
  });
  const frame: QuestionFrame = { ...pack.question, kind: "question", searchQueries: {} };
  const selection = (scopeMatch: string, role = "direct") => ({ status: "ready", coverage: "complete", conflict_type: "none", assessments: pack.passages.map(p => ({
    source_id: p.id, relevance: "direct", context_safe: "yes", supported_requirement_ids: ["R1"], position: "",
    contribution: { role, scope: "case_specific", conditions: ["Only the specific case stated in this passage"] }, scope_matches_question: scopeMatch,
  })) });
  it("refuses using case-specific evidence as a universal answer", () => {
    expect(parseEvidencePackage(selection("no"), frame, pack.passages, { requireContributions: true })).toBeNull();
    expect(parseEvidencePackage(selection("unsure"), frame, pack.passages, { requireContributions: true })).toBeNull();
    expect(parseEvidencePackage(selection("yes", "limited_example"), frame, pack.passages, { requireContributions: true })).toBeNull();
  });
  it("does not trust a selector scope-match yes for a general requested point", () => {
    expect(parseEvidencePackage(selection("yes"), { ...frame, requirements: frame.requirements.map(r => ({ ...r, scope: "general" })) }, pack.passages, { requireContributions: true })).toBeNull();
  });
  it("keeps other direct evidence when a case-specific candidate fails the general-scope gate", () => {
    const raw = selection("yes");
    for (const row of raw.assessments) if (!row.source_id.startsWith("Q")) row.contribution.scope = "general";
    const rejected = vi.fn();
    const selected = parseEvidencePackage(raw, frame, pack.passages, { requireContributions: true }, rejected);
    expect(selected?.passages.map(p => p.source.kind)).toEqual(["hadith", "scholar"]);
    expect(rejected).toHaveBeenCalledWith("source_scope_rejected");
  });
  it("retains the restrictions of evidence that directly matches the requested case", () => {
    const selected = parseEvidencePackage(selection("yes"), { ...frame, requirements: frame.requirements.map(r => ({ ...r, scope: "case_specific" })) }, pack.passages, { requireContributions: true });
    expect(selected?.passages[0].contribution).toEqual({ role: "direct", scope: "case_specific", conditions: ["Only the specific case stated in this passage"] });
  });
});

describe("diagnosable writing and checked surviving coverage", () => {
  it.each([
    ["en", "The Quran describes the stated conduct as forbidden.", "This conduct is forbidden."],
    ["de", "Der Koran bezeichnet das genannte Verhalten als verboten.", "Dieses Verhalten ist verboten."],
    ["ar", "القرآن يبين أن هذا الفعل محرم في الحالة المذكورة.", "هذا الفعل محرم."],
  ] as const)("leaves semantic attribution to the independent checker rather than a sentence-prefix rule in %s", (lang, attributed, independent) => {
    expect(parseRichClaims([{ ...drafts.quran[0], text: attributed }], "quran", pack, lang)).not.toBeNull();
    const failure = vi.fn();
    expect(parseRichClaims([{ ...drafts.quran[0], text: independent }], "quran", pack, lang, failure)).not.toBeNull();
    expect(failure).not.toHaveBeenCalled(); // Parser is not religious approval; the independent audit must reject this.
  });
  it("rejects invented citations with the actual reason", () => {
    const failure = vi.fn();
    expect(parseRichClaims([{ ...drafts.quran[0], source_ids: ["Q4:92"] }], "quran", pack, "en", failure)).toBeNull();
    expect(failure).toHaveBeenCalledWith("unknown_ref");
  });
  it("does not let unknown claims, wrong sources or lost conditions establish completeness", () => {
    const claims = [{ text: "Test explanation.", refs: ["Q2:183"], requirementId: "R1" }];
    const row = { requirement_id: "R1", claim_ids: ["C1"], source_ids: ["Q2:183"], fully_answered: "yes", conditions_preserved: "yes" };
    expect(richCoverageChecked([row], claims, pack)).toBe(true);
    expect(richCoverageChecked([{ ...row, claim_ids: ["C2"] }], claims, pack)).toBe(false);
    expect(richCoverageChecked([{ ...row, source_ids: ["HE9001"] }], claims, pack)).toBe(false);
    expect(richCoverageChecked([{ ...row, conditions_preserved: "no" }], claims, pack)).toBe(false);
    expect(richCoverageChecked([row, row], claims, pack)).toBe(false);
  });
  it("counts a checked synthesis backed by the sources already explained, without counting summary-only evidence", () => {
    const explanation = { text: "Checked explanation of the underlying source.", refs: ["Q2:183"], requirementId: "R1" };
    const synthesis = { text: "Checked synthesis directly answering the question.", refs: ["Q2:183"], requirementId: "R1" };
    const row = { requirement_id: "R1", claim_ids: ["C2"], source_ids: ["Q2:183"], fully_answered: "yes", conditions_preserved: "yes" };
    expect(richCoverageChecked([row], [explanation, synthesis], pack, 1)).toBe(true);
    const failure = vi.fn();
    expect(richCoverageChecked([{ ...row, source_ids: ["HE9001"] }], [explanation, { ...synthesis, refs: ["HE9001"] }], pack, 1, failure)).toBe(false);
    expect(failure).toHaveBeenCalledWith("coverage_summary_without_explanation", expect.objectContaining({ requirement_id: "R1" }));
  });
  it("derives the complete citation union from checked claims when coverage names only a primary source", () => {
    const claims = [{ text: "Checked explanation jointly supported by two cited sources.", refs: ["Q2:183", "HE9001"], requirementId: "R1" }];
    const row = { requirement_id: "R1", claim_ids: ["C1"], source_ids: ["Q2:183"], fully_answered: "yes", conditions_preserved: "yes" };
    expect(richCoverageChecked([row], claims, pack)).toBe(true);
    const failure = vi.fn();
    expect(richCoverageChecked([{ ...row, source_ids: ["Q4:92"] }], claims, pack, 0, failure)).toBe(false);
    expect(failure).toHaveBeenCalledWith("coverage_citation_map_mismatch", expect.any(Object));
  });
  it("can reuse a checked claim for a second independently supported point but cannot invent source-to-point support", () => {
    const local = structuredClone(pack);
    local.question.requirements.push({ id: "R2", text: "Explain another point", facet: "general" });
    const claim = { text: "Checked explanation with meaning relevant to both requested points.", refs: ["Q2:183"], requirementId: "R1" };
    const rows = ["R1", "R2"].map(requirement_id => ({ requirement_id, claim_ids: ["C1"], source_ids: ["Q2:183"], fully_answered: "yes", conditions_preserved: "yes" }));
    expect(richCoverageChecked(rows, [claim], local)).toBe(false);
    local.passages[0].requirementIds.push("R2");
    expect(richCoverageChecked(rows, [claim], local)).toBe(true);
    expect(richCoverageChecked([{ ...rows[0], conditions_preserved: "unsure" }, rows[1]], [claim], local)).toBe(false);
  });
  it("finishes without Quran evidence when the checked summary answers a point supported by the displayed explanations", async () => {
    const local = structuredClone(pack), deps = dependencies();
    local.question.requirements = [{ id: "R1", text: "Answer the first requested point", facet: "ruling", scope: "general" }, { id: "R2", text: "Explain the requested steps", facet: "steps", scope: "general" }];
    local.passages = local.passages.filter(p => p.source.kind !== "quran").map(p => ({ ...p, requirementIds: ["R1", "R2"] })); local.cards = [];
    const scholar = local.passages.find(p => p.source.kind === "scholar")!.id;
    deps.writer.generateJson = async () => ({ status: "answer", no_answer_feedback: [],
      next_step: { text: "Compare the two cited explanations and ask which stated step needs clarification.", kind: "learning", refs: [] },
      hadith: [{ text: "The Prophet taught the detail asked about in the second point.", source_ids: ["HE9001"], requirement_id: "R2" }],
      scholar: [{ text: "Ibn Baz explains the relevant details and their stated conditions.", source_ids: [scholar], requirement_id: "R2" }],
      summary: [{ text: "This checked synthesis directly answers the first requested point.", source_ids: ["HE9001", scholar], requirement_id: "R1" }],
    });
    deps.verifier.generateJson = async req => ({ ...audit(req.prompt), requirement_coverage: [
      { requirement_id: "R1", claim_ids: ["C3"], source_ids: ["HE9001", scholar], fully_answered: "yes", conditions_preserved: "yes" },
      { requirement_id: "R2", claim_ids: ["C1", "C2"], source_ids: ["HE9001", scholar], fully_answered: "yes", conditions_preserved: "yes" },
    ] });
    const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain both points", {});
    expect(result.status).toBe("rich_answer");
    if (result.status === "rich_answer") expect(result.answer.sections.map(s => s.outcome)).toEqual(["no_direct_evidence", "ready", "ready", "ready"]);
  });
  it("uses at most one correction shared by both writers and keeps diagnostic text private", async () => {
    const deps = dependencies(), calls: object[] = [], logs: unknown[] = [];
    deps.onDiagnostic = (...args) => logs.push(args);
    deps.writer.generateJson = async req => { calls.push(JSON.parse(req.prompt)); return { status: "answer", quran: [{ ...drafts.quran[0], source_ids: ["Q4:92"] }], hadith: [], scholar: [], summary: [] }; };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Private visitor wording", {});
    expect(result.status).toBe("incomplete");
    expect(calls.filter(c => "correction" in c)).toHaveLength(1);
    expect(JSON.stringify(logs)).toContain("unknown_ref");
    expect(JSON.stringify(logs)).not.toContain("Private visitor wording");
    expect(JSON.stringify(logs)).not.toContain(drafts.quran[0].text);
  });
  it("corrects malformed wording using the same evidence before checking and emitting it", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    let broken = true;
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.sections_to_write[0] === "quran" && broken) { broken = false; return { status: "answer", quran: [{ ...drafts.quran[0], source_ids: ["Q4:92"] }] }; }
      return write(req);
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "rich_answer" });
  });
  it("does not spend a correction call when the processing budget is nearly exhausted", async () => {
    const deps = dependencies();
    deps.writer.generateJson = vi.fn(async () => ({ status: "no_answer" }));
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {}, 100)).toMatchObject({ status: "incomplete" });
    expect(deps.writer.generateJson).toHaveBeenCalledTimes(2);
  });
  it("rejects duplicated source claims even when a scripted checker approves everything", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    deps.writer.generateJson = async req => ({ ...await write(req) as object, scholar: [drafts.scholar[0], drafts.scholar[0]] });
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete" });
  });
  it("refuses missing final coverage even if the checker says complete_coverage yes", async () => {
    const deps = dependencies();
    deps.verifier.generateJson = async req => ({ ...audit(req.prompt), requirement_coverage: [] });
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "incomplete" });
  });
  it("cannot deserialize a failed selected section as a completed answer", () => {
    const unsafe = structuredClone(richAnswer);
    unsafe.sections[0] = { group: "quran", outcome: "failed_check", claims: [], sources: [] };
    expect(validRichAnswer(unsafe)).toBe(false);
  });
  it("keeps an independently checked Quran section when the final checker is unavailable", async () => {
    const deps = dependencies(), write = vi.fn(deps.writer.generateJson);
    deps.writer.generateJson = write;
    deps.verifier.generateJson = async req => { if (JSON.parse(req.prompt).full_answer) throw new Error("checker down"); return audit(req.prompt); };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result).toMatchObject({ status: "incomplete", withdraw: false });
    if (result.status === "incomplete") expect(result.sections?.[0].outcome).toBe("ready");
    expect(write).toHaveBeenCalledTimes(3);
  });

  it("repairs both failed writing jobs together instead of letting Quran consume the only correction", async () => {
    const deps = dependencies(), write = deps.writer.generateJson;
    const rejectionCodes: string[] = [];
    deps.onDiagnostic = (_stage, code) => rejectionCodes.push(code);
    let release!: () => void;
    const gate = new Promise<void>(r => release = r);
    const corrected: string[][] = [];
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.correction) { corrected.push(input.sections_to_write); return write(req); }
      if (input.sections_to_write.includes("summary")) return write(req);
      if (input.sections_to_write[0] === "quran") { release(); return { status: "answer", quran: [{ ...drafts.quran[0], text: "The Quran presents invented source wording solely for tests." }] }; }
      await gate;
      return { status: "no_answer", no_answer_feedback: [{ group: "hadith", reason: "cannot_paraphrase", missing_requirement_ids: [] }], hadith: [], scholar: [], summary: [] };
    };
    const result = await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer");
    expect(corrected).toEqual([["quran", "hadith", "scholar"]]);
    expect(rejectionCodes).toContain("rich_quran_copied_source");
  });
  it("preserves immediate Quran streaming when its draft is valid and only the rest needs repair", async () => {
    const deps = dependencies(), write = deps.writer.generateJson, events: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>(r => release = r);
    deps.rich = { onSection: s => { events.push(s.group); if (s.group === "quran") release(); } };
    deps.writer.generateJson = async req => {
      const input = JSON.parse(req.prompt);
      if (input.sections_to_write[0] === "hadith" && !input.correction) { await gate; return { status: "no_answer", no_answer_feedback: [{ group: "summary", reason: "cannot_paraphrase", missing_requirement_ids: [] }], hadith: [], scholar: [], summary: [] }; }
      return write(req);
    };
    expect(await runRichAnswer(pack, "en", deps, new AbortController().signal, "Explain care", {})).toMatchObject({ status: "rich_answer" });
    expect(events).toEqual(["quran", "hadith", "scholar", "summary"]);
  });

});
