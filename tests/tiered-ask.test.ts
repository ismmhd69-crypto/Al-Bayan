// Tiered evidence (ASK_TIERED=true): Quran, then hadith, then scholars, then videos.
// Pure helper tests plus end-to-end runs with a fake AI and made-up texts (not Quran or hadith text).
import { describe, expect, it } from "vitest";
import { runPipeline, type PipelineDeps } from "@/lib/ask/core";
import { chooseSealedPackage } from "@/lib/ask/package";
import { askMaxVideos, askTiered, askVideoBudgetMs } from "@/lib/ask/settings";
import {
  TIER_PACKAGE_CAPS,
  flattenTieredSelection,
  missingTiers,
  orderDraftByTier,
  rulingWithoutScholar,
  videoBudgetAllows,
  type Tier,
} from "@/lib/ask/tiered";
import type { PassageForSelection, SelectedPassage, Source } from "@/lib/ask/retrieval";
import type { StructuredDraft } from "@/lib/ask/checks";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";

// ---------- made-up sources ----------
const verse = (key: string, en: string): Verse => ({
  key,
  arabic: `نص عربي تجريبي للآية ${key.replace(":", " ")}`,
  arabicPlain: `نص عربي تجريبي للآية ${key.replace(":", " ")}`,
  translations: { en, de: null },
  url: `https://quran.com/${key.replace(":", "/")}`,
});
const verses: Verse[] = [
  verse("2:183", "Fasting is prescribed for you in the blessed month"),
  verse("2:184", "Whoever is ill makes up the days of fasting later"),
  verse("2:187", "Eat and drink until the white thread of dawn becomes clear"),
];
const hadith = (id: string, n: number, en: string): Hadith => ({
  id,
  collection: "agreed",
  numbers: { bukhari: n, muslim: n + 1 },
  attributionAr: "متفق عليه",
  gradeAr: "صحيح",
  arabic: `نص حديث تجريبي رقم ${n}`,
  translations: { en, de: null },
  url: `https://hadeethenc.com/en/browse/hadith/${id.slice(2)}`,
});
const hadithFast = hadith("HE9001", 1904, "Made-up hadith text: fasting is a shield with a great reward");
const hadithMore = hadith("HE9004", 1905, "Made-up hadith text about the joy of the one who breaks his fast");
const hadithThird = hadith("HE9005", 1906, "Made-up hadith text about the gate of fasting in paradise");
const quote = (n: number, arabic: string): ScholarQuote => ({
  id: `S${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`,
  scholarId: "ibn-baz",
  scholarName: { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  title: `فتوى تجريبية رقم ${n}`,
  reference: `مجموع فتاوى تجريبي (${n}/ 7)`,
  arabic,
  url: `https://binbaz.org.sa/fatwas/${n}/test`,
});
const quoteA = quote(2, "نص تجريبي من كلام الشيخ في بيان فرض الصيام على المسلم المكلف.");
const quoteB = quote(3, "نص تجريبي آخر من كلام الشيخ في فضل الصيام.");
const quoteC = quote(4, "نص تجريبي ثالث من كلام الشيخ في آداب الصيام.");
const quoteD = quote(5, "نص تجريبي رابع من كلام الشيخ في أحكام الصيام.");

const passage = (source: Source, id: string, requirementIds = ["R1"]): SelectedPassage => ({
  id, source, context: [], requirementIds, facets: ["general"],
});
const q = (v: Verse) => passage({ kind: "quran", verse: v }, `Q${v.key}`);
const h = (x: Hadith) => passage({ kind: "hadith", hadith: x }, x.id);
const s = (x: ScholarQuote) => passage({ kind: "scholar", quote: x }, x.id);

// ---------- settings ----------
describe("tiered settings", () => {
  it("is off unless ASK_TIERED is exactly true", () => {
    expect(askTiered("true")).toBe(true);
    expect(askTiered(undefined)).toBe(false);
    expect(askTiered("false")).toBe(false);
    expect(askTiered("TRUE")).toBe(false);
  });
  it("reads the video budget with a 20 s default and safe bounds", () => {
    expect(askVideoBudgetMs(undefined)).toBe(20_000);
    expect(askVideoBudgetMs("")).toBe(20_000);
    expect(askVideoBudgetMs("abc")).toBe(20_000);
    expect(askVideoBudgetMs("-5")).toBe(20_000);
    expect(askVideoBudgetMs("15000")).toBe(15_000);
    expect(askVideoBudgetMs("0")).toBe(0);
    expect(askVideoBudgetMs("999999")).toBe(55_000);
  });
  it("reads MAX_VIDEOS with a default of 4 and never more than 4", () => {
    expect(askMaxVideos(undefined)).toBe(4);
    expect(askMaxVideos("2")).toBe(2);
    expect(askMaxVideos("9")).toBe(4);
    expect(askMaxVideos("x")).toBe(4);
  });
});

// ---------- pure helpers ----------
describe("tiered selection helpers", () => {
  const candidates: PassageForSelection[] = [q(verses[0]), h(hadithFast), s(quoteA)];
  const item = (id: string) => ({ source_id: id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" });

  it("flattens three tier lists into the existing shape", () => {
    const flat = flattenTieredSelection({
      status: "ready", coverage: "complete", conflict_type: "none",
      quran_assessments: [item("Q2:183")], hadith_assessments: [item("HE9001")], scholar_assessments: [item(quoteA.id)],
    }, candidates);
    expect(flat).toEqual({
      status: "ready", coverage: "complete", conflict_type: "none",
      assessments: [item("Q2:183"), item("HE9001"), item(quoteA.id)],
    });
  });

  it("fails closed when an id sits in another tier's list or a list is missing", () => {
    expect(flattenTieredSelection({
      status: "ready", coverage: "complete", conflict_type: "none",
      quran_assessments: [item("Q2:183"), item(quoteA.id)], hadith_assessments: [], scholar_assessments: [],
    }, candidates)).toBeNull();
    expect(flattenTieredSelection({
      status: "ready", coverage: "complete", conflict_type: "none", quran_assessments: [], hadith_assessments: [],
    }, candidates)).toBeNull();
    expect(flattenTieredSelection(null, candidates)).toBeNull();
  });

  it("keeps every tier full up to its cap: 2 verses, 2 hadith, 3 fatwas, in tier order", () => {
    const direct = [s(quoteA), s(quoteB), s(quoteC), s(quoteD), h(hadithFast), h(hadithMore), h(hadithThird),
      q(verses[0]), q(verses[2]), q(verses[1])];
    const chosen = chooseSealedPackage(direct, ["R1"], { caps: TIER_PACKAGE_CAPS, tierOrder: true });
    if (!chosen) throw new Error("expected a package");
    const kinds = chosen.passages.map((p) => p.source.kind);
    expect(kinds).toEqual(["quran", "quran", "hadith", "hadith", "scholar", "scholar", "scholar"]);
    expect(chosen.cards.length).toBeLessThanOrEqual(2);
  });

  it("skips an empty tier and still builds the package", () => {
    const chosen = chooseSealedPackage([s(quoteA), q(verses[0])], ["R1"], { caps: TIER_PACKAGE_CAPS, tierOrder: true });
    expect(chosen?.passages.map((p) => p.id)).toEqual(["Q2:183", quoteA.id]);
    const onlyFatwas = chooseSealedPackage([s(quoteA), s(quoteB)], ["R1"], { caps: TIER_PACKAGE_CAPS, tierOrder: true });
    expect(onlyFatwas?.passages.map((p) => p.source.kind)).toEqual(["scholar", "scholar"]);
  });

  it("never lets fatwas displace a direct verse, even when they cover more points", () => {
    const fatwaBoth = (x: ScholarQuote) => passage({ kind: "scholar", quote: x }, x.id, ["R1", "R2"]);
    const direct = [fatwaBoth(quoteA), fatwaBoth(quoteB), fatwaBoth(quoteC), fatwaBoth(quoteD), q(verses[0])];
    const chosen = chooseSealedPackage(direct, ["R1", "R2"], { caps: TIER_PACKAGE_CAPS, tierOrder: true });
    expect(chosen?.passages[0].id).toBe("Q2:183");
    expect(chosen?.passages.filter((p) => p.source.kind === "scholar")).toHaveLength(3);
  });

  it("the old caps are unchanged when no tier options are given", () => {
    const chosen = chooseSealedPackage([s(quoteA), s(quoteB), s(quoteC)], ["R1"]);
    expect(chosen?.passages).toHaveLength(2);
  });

  const kinds: Record<string, Tier> = { "Q2:183": "quran", HE9001: "hadith", [quoteA.id]: "scholar" };
  const kindOf = (id: string) => kinds[id];
  const claim = (text: string, refs: string[]) => ({ text, refs, requirementId: "R1" });
  const draftOf = (direct: ReturnType<typeof claim>[], list: ReturnType<typeof claim>[] = []): StructuredDraft => ({
    directAnswer: direct, list, explanation: [], notEstablished: [], claims: [...direct, ...list],
  });

  it("orders the simple answer Quran, Prophet, scholars (stable, list untouched)", () => {
    const draft = draftOf([claim("scholar", [quoteA.id]), claim("hadith", ["HE9001"]), claim("verse", ["Q2:183"]), claim("mixed", [quoteA.id, "HE9001"])],
      [claim("step b", [quoteA.id]), claim("step a", ["Q2:183"])]);
    const ordered = orderDraftByTier(draft, kindOf);
    expect(ordered.directAnswer.map((c) => c.text)).toEqual(["verse", "hadith", "mixed", "scholar"]);
    expect(ordered.list.map((c) => c.text)).toEqual(["step b", "step a"]);
    expect(ordered.claims.map((c) => c.text)).toEqual(["verse", "hadith", "mixed", "scholar", "step b", "step a"]);
  });

  it("finds package tiers the answer leaves out", () => {
    const draft = draftOf([claim("verse", ["Q2:183"])]);
    expect(missingTiers(draft, ["quran", "hadith", "scholar"], kindOf)).toEqual(["hadith", "scholar"]);
    expect(missingTiers(draft, ["quran"], kindOf)).toEqual([]);
  });

  it("allows ruling words only in sentences citing a scholar quote", () => {
    expect(rulingWithoutScholar([claim("Fasting is obligatory for believers.", ["Q2:183"])], kindOf)).toBe(true);
    expect(rulingWithoutScholar([claim("Fasten ist Pflicht.", ["HE9001"])], kindOf)).toBe(true);
    expect(rulingWithoutScholar([claim("Shaykh Ibn Baz explained that fasting is obligatory.", [quoteA.id])], kindOf)).toBe(false);
    expect(rulingWithoutScholar([claim("Believers are told to fast in a certain month.", ["Q2:183"])], kindOf)).toBe(false);
  });

  it("allows videos only within the budget", () => {
    expect(videoBudgetAllows(12_000, 20_000)).toBe(true);
    expect(videoBudgetAllows(20_000, 20_000)).toBe(true);
    expect(videoBudgetAllows(20_001, 20_000)).toBe(false);
    expect(videoBudgetAllows(1, 0)).toBe(false);
  });
});

// ---------- end to end with a fake AI ----------
const OK = {
  direct_answer_complete: "yes", listed_items_complete: "yes", no_repetition: "yes", not_established_ok: "yes",
  requirement_verdicts: [{ requirement_id: "R1", verdict: "yes" }],
  answers_question: "yes", covers_facets: "yes", fair_picture: "yes", context_preserved: "yes",
};
const frame = {
  language: "en", kind: "question", question_type: "general", subjects: ["fasting"],
  requested_points: [{ text: "general answer about fasting", facet: "general" }], qualifiers: [],
  search_queries_en: ["fasting prescribed"], search_queries_de: [], search_queries_ar: ["حكم الصيام في رمضان"],
  search_queries_quran_ar: ["كتب عليكم الصيام"], search_queries_hadith_ar: ["الصوم جنة"],
};
const verseClaim = { text: "Believers are told to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" };
const hadithClaim = { text: "The Prophet taught that fasting protects the one who fasts.", source_ids: ["HE9001"], requirement_id: "R1" };
const scholarClaim = { text: "Shaykh Ibn Baz explained that fasting this month is obligatory for every accountable Muslim.", source_ids: [quoteA.id], requirement_id: "R1" };
const draft = (...claims: unknown[]) => ({ status: "answer", claims });

type Script = { drafts: unknown[]; selection?: (prompt: Record<string, unknown>) => unknown };

function fake(id: string, script: Script) {
  const seen: JsonRequest[] = [];
  let drafts = 0;
  const ai: AIProvider = {
    id,
    async generateJson(req) {
      seen.push(req);
      const prompt = JSON.parse(req.prompt) as Record<string, unknown>;
      if (req.system.startsWith("You create a safe search plan")) return frame;
      if (req.system.startsWith("You select evidence")) {
        if (script.selection) return script.selection(prompt);
        const all = (key: string) => ((prompt[key] as { source: { id: string } }[] | undefined) ?? [])
          .map((c) => ({ source_id: c.source.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" }));
        return { status: "ready", coverage: "complete", conflict_type: "none",
          quran_assessments: all("quran_candidates"), hadith_assessments: all("hadith_candidates"), scholar_assessments: all("scholar_candidates") };
      }
      if (req.system.startsWith("You write short explanations")) return script.drafts[Math.min(drafts++, script.drafts.length - 1)];
      if (req.system.startsWith("You check optional video titles")) {
        return { verdicts: (prompt.titles as unknown[]).map(() => "yes") };
      }
      // Final screening: every claim supported.
      return { verdicts: (prompt.claims as unknown[]).map(() => "supported"), ...OK };
    },
  };
  return { ai, seen };
}

const video = (n: number) => ({ youtubeId: `abcdefghij${n}`, channelId: "UCiiJRwQ0MUaQo8ZZuf18pPw", title: `حكم الصيام ${n}`, minutes: 4, language: "ar" as const });

function setup(script: Script, tiered: PipelineDeps["tiered"] | null = { videoBudgetMs: 60_000, maxVideos: 4 }) {
  const writer = fake("fake/writer", script);
  const verifier = fake("fake/verifier", script);
  const searches: { quran: string[][]; hadith: string[][] } = { quran: [], hadith: [] };
  const reasons: string[] = [];
  const d: PipelineDeps = {
    writer: writer.ai,
    verifier: verifier.ai,
    search: async (queries, limit) => {
      searches.quran.push(queries);
      return ["2:183", "2:184"].slice(0, limit);
    },
    getVerse: async (key) => verses.find((v) => v.key === key),
    neighbours: async () => [],
    searchHadith: async (queries) => {
      searches.hadith.push(queries.ar ?? []);
      return [hadithFast];
    },
    searchScholars: async () => [quoteA],
    searchVideos: async () => [1, 2, 3, 4, 5].map(video),
    deadlineMs: 5000,
    onRefuse: (reason) => reasons.push(reason),
    ...(tiered ? { tiered } : {}),
  };
  return { d, writer, verifier, searches, reasons };
}

describe("tiered pipeline", () => {
  it("states existing sentence and list limits before the first draft and in its schema", async () => {
    const { d, writer } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] });
    expect((await runPipeline("What does Islam teach about fasting?", "en", d)).status).toBe("answer");
    const request = writer.seen.find((call) => call.system.startsWith("You write short explanations"))!;
    expect(request.system).toContain("at most 300 characters");
    expect(request.system).toContain("at most 160 characters");
    expect(request.system).toContain("Do not turn adjacent statements into a causal explanation");
    expect(request.schema).toMatchObject({ properties: {
      simple_answer: { items: { properties: { text: { maxLength: 300 } } } },
      list: { items: { properties: { text: { maxLength: 160 } } } },
      more_explanation: { items: { properties: { sentences: { items: { properties: { text: { maxLength: 300 } } } } } } },
    } });
  });
  it("rejects an overlong claim, allows one shorter sourced correction, and still refuses a stuck writer", async () => {
    const long = { ...verseClaim, text: `Believers ${"observe ".repeat(40)}a certain month.` };
    const fixed = setup({ drafts: [draft(long), draft(verseClaim, hadithClaim, scholarClaim)] });
    expect((await runPipeline("What does Islam teach about fasting?", "en", fixed.d)).status).toBe("answer");
    const stuck = setup({ drafts: [draft(long)] });
    expect((await runPipeline("What does Islam teach about fasting?", "en", stuck.d)).status).toBe("no_summary");
    expect(stuck.reasons).toContain("no_summary_after_draft_claim_length");
  });
  it("corrects source attribution without letting Quran-only claims impersonate hadith", async () => {
    const wrong = { ...verseClaim, text: "The Prophet explained that people fast during a certain month." };
    const { d, writer } = setup({ drafts: [draft(wrong), draft(verseClaim, hadithClaim, scholarClaim)] });
    expect((await runPipeline("What does Islam teach about fasting?", "en", d)).status).toBe("answer");
    const corrected = writer.seen.filter((call) => call.system.startsWith("You write short explanations"))[1];
    expect(JSON.parse(corrected.prompt).correction).toContain("only with a hadith citation");
    const stuck = setup({ drafts: [draft(wrong)] });
    expect((await runPipeline("What does Islam teach about fasting?", "en", stuck.d)).status).toBe("no_summary");
    expect(stuck.reasons).toContain("no_summary_after_draft_source_attribution");
  });
  it("shows the verse, the hadith and the fatwa, written in that order, even when the writer starts with the fatwa", async () => {
    const { d, writer, verifier } = setup({ drafts: [draft(scholarClaim, hadithClaim, verseClaim)] });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(r.answer.claims.map((c) => c.refs[0])).toEqual(["2:183", "HE9001", quoteA.id]);
    expect(r.answer.v2?.quran).toHaveLength(1);
    expect(r.answer.v2?.hadith).toHaveLength(1);
    expect(r.answer.v2?.scholars).toHaveLength(1);
    // One selection call with three separate lists.
    const selections = verifier.seen.filter((call) => call.system.startsWith("You select evidence"));
    expect(selections).toHaveLength(1);
    expect(selections[0].system).toContain("TIERED INPUT");
    expect(Object.keys(JSON.parse(selections[0].prompt))).toEqual(["question", "quran_candidates", "hadith_candidates", "scholar_candidates"]);
    expect(writer.seen.find((call) => call.system.startsWith("You write short explanations"))?.system).toContain("TIERED ORDER");
    // Screening sees the final (reordered) wording.
    const screening = verifier.seen.find((call) => call.system.startsWith("You screen claims"));
    expect(JSON.parse(screening!.prompt).simple_answer).toEqual([verseClaim.text, hadithClaim.text, scholarClaim.text]);
  });

  it("sends Quran-wording phrases to Quran search and the Prophet's wording first to hadith search", async () => {
    const { d, searches } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] });
    await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(searches.quran[0]).toContain("كتب عليكم الصيام");
    expect(searches.quran[0]).not.toContain("حكم الصيام في رمضان");
    expect(searches.hadith[0]).toEqual(["الصوم جنة", "حكم الصيام في رمضان"]);
  });

  it("keeps the old request shape when the switch is off", async () => {
    const { d, writer, verifier, searches } = setup({
      drafts: [draft(verseClaim)],
      selection: (prompt) => ({ status: "ready", coverage: "complete", conflict_type: "none",
        assessments: (prompt.candidates as { source: { id: string } }[]).map((c, i) => ({ source_id: c.source.id,
          relevance: i === 0 ? "direct" : "unrelated", supported_requirement_ids: i === 0 ? ["R1"] : [], context_safe: "yes", position: "" })) }),
    }, null);
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(r.status).toBe("answer");
    const understand = writer.seen[0];
    expect(understand.system).not.toContain("search_queries_quran_ar");
    expect(JSON.stringify(understand.schema)).not.toContain("search_queries_quran_ar");
    const selection = verifier.seen.find((call) => call.system.startsWith("You select evidence"))!;
    expect(selection.system).not.toContain("TIERED");
    expect(Object.keys(JSON.parse(selection.prompt))).toEqual(["question", "candidates"]);
    expect(searches.quran[0]).toContain("حكم الصيام في رمضان");
    if (r.status === "answer") expect(r.answer.videos).toHaveLength(2);
  });

  it("refuses when the selector puts a source in another tier's list", async () => {
    const { d, reasons } = setup({
      drafts: [draft(verseClaim)],
      selection: () => ({ status: "ready", coverage: "complete", conflict_type: "none",
        quran_assessments: [{ source_id: quoteA.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" }],
        hadith_assessments: [], scholar_assessments: [] }),
    });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(r.status).toBe("no_source");
    expect(reasons).toContain("evidence_insufficient");
  });

  it("answers from the tiers that have direct evidence and skips an empty tier", async () => {
    const { d } = setup({
      drafts: [draft(verseClaim, scholarClaim)],
      selection: (prompt) => {
        const mark = (key: string, relevance: string) => ((prompt[key] as { source: { id: string } }[]) ?? []).map((c) => ({
          source_id: c.source.id, relevance, supported_requirement_ids: relevance === "direct" ? ["R1"] : [], context_safe: "yes", position: "" }));
        return { status: "ready", coverage: "complete", conflict_type: "none", quran_assessments: mark("quran_candidates", "direct"),
          hadith_assessments: mark("hadith_candidates", "mention_only"), scholar_assessments: mark("scholar_candidates", "direct") };
      },
    });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(r.answer.v2?.hadith).toHaveLength(0);
    expect(r.answer.claims.map((c) => c.refs[0])).toEqual(["2:183", quoteA.id]);
  });

  it("asks once for a missing tier and uses the corrected draft", async () => {
    const { d, reasons } = setup({ drafts: [draft(verseClaim), draft(verseClaim, hadithClaim, scholarClaim)] });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(reasons).toContain("tier_missing_fixed");
    expect(r.answer.claims).toHaveLength(3);
  });

  it("keeps a checked draft when the tier correction does not help", async () => {
    const { d, reasons } = setup({ drafts: [draft(verseClaim)] });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(reasons).toContain("tier_missing_kept");
    expect(r.answer.claims.map((c) => c.refs[0])).toEqual(["2:183"]);
  });

  it("never lets a verse or hadith sentence carry a ruling: one correction, then no summary", async () => {
    const rulingFromVerse = { ...verseClaim, text: "Fasting in a certain month is obligatory for believers." };
    const fixed = setup({ drafts: [draft(rulingFromVerse, hadithClaim, scholarClaim), draft(verseClaim, hadithClaim, scholarClaim)] });
    const ok = await runPipeline("What does Islam teach about fasting?", "en", fixed.d);
    expect(ok.status).toBe("answer");
    const stuck = setup({ drafts: [draft(rulingFromVerse, hadithClaim, scholarClaim)] });
    const refused = await runPipeline("What does Islam teach about fasting?", "en", stuck.d);
    expect(refused.status).toBe("no_summary");
    expect(stuck.reasons).toContain("no_summary_after_draft_ruling_without_scholar");
  });

  it("adds up to 4 videos when the answer is ready within the budget", async () => {
    const { d } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(r.answer.videos).toHaveLength(4);
    expect(r.answer.v2?.videos).toHaveLength(4);
  });

  it("skips videos when the answer took longer than the budget", async () => {
    const { d, reasons, verifier } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] }, { videoBudgetMs: 0, maxVideos: 4 });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(r.answer.videos).toBeUndefined();
    expect(reasons).toContain("video_skipped_budget");
    expect(verifier.seen.some((call) => call.system.startsWith("You check optional video titles"))).toBe(false);
  });

  it("returns a checked answer when optional video checking ignores its deadline", async () => {
    const { d } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] });
    const generate = d.verifier.generateJson;
    d.deadlineMs = 400;
    d.verifier = { id: d.verifier.id, generateJson: (request) => request.system.startsWith("You check optional video titles")
      ? new Promise(() => {}) : generate(request) };
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(r.status).toBe("answer");
    if (r.status === "answer") expect(r.answer.videos).toBeUndefined();
  });

  it("respects a smaller MAX_VIDEOS", async () => {
    const { d } = setup({ drafts: [draft(verseClaim, hadithClaim, scholarClaim)] }, { videoBudgetMs: 60_000, maxVideos: 1 });
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error(`expected an answer, got ${r.status}`);
    expect(r.answer.videos).toHaveLength(1);
  });
});
