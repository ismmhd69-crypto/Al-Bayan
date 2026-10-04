// End-to-end tests of the answer pipeline with a fake AI and made-up verses (not Quran text).
// They prove the code refuses, whatever the AI returns.
import { describe, expect, it, vi } from "vitest";
import { hadithAllowed, runPipeline, type PipelineDeps } from "@/lib/ask/core";
import { validateAnswerV2 } from "@/lib/ask/answer-v2";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";
import { CLAIM_AUDIT_FIELDS, parseClaimAudit } from "@/lib/ask/checks";

const verses: Verse[] = [
  {
    key: "2:183",
    arabic: "كتب عليكم الصيام في الشهر المبارك",
    arabicPlain: "كتب عليكم الصيام في الشهر المبارك",
    translations: { en: "Fasting is prescribed for you in the blessed month", de: "Das Fasten ist euch im gesegneten Monat vorgeschrieben" },
    url: "https://quran.com/2/183",
  },
  {
    key: "2:184",
    arabic: "ومن كان مريضا فعدة من أيام أخر",
    arabicPlain: "ومن كان مريضا فعدة من أيام أخر",
    translations: { en: "Whoever is ill makes up the days of fasting later", de: "Wer krank ist, holt die Fastentage später nach" },
    url: "https://quran.com/2/184",
  },
  ...[
    ["2:7", "The example subject is merely named while another group is discussed"],
    ["2:10", "Another group is discussed and the example subject is only mentioned"],
    ["2:19", "A scene concerns other people and merely names the example subject"],
    ["2:255", "The example subject has a direct description with several distinct properties"],
  ].map(([key, text]): Verse => ({
    key,
    arabic: `نص عربي تجريبي للمصدر ${key.replace(":", " ")}`,
    arabicPlain: `نص عربي تجريبي للمصدر ${key.replace(":", " ")}`,
    translations: { en: text, de: null },
    url: `https://quran.com/${key.replace(":", "/")}`,
  })),
];

const understanding = {
  language: "en",
  kind: "question",
  question_type: "general",
  subjects: ["fasting"],
  requested_points: [{ text: "general answer about fasting", facet: "general" }],
  qualifiers: [],
  search_queries_en: ["fasting", "fasting prescribed", "fasting month"],
  search_queries_de: [],
  search_queries_ar: [],
};
const goodDraft = {
  status: "answer",
  claims: [{ text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" }],
};

// A fake AI that answers each step from a script and records what it was sent.
function fakeAI(id: string, script: Record<string, unknown>) {
  const seen: JsonRequest[] = [];
  let understandingCalls = 0;
  let selectionCalls = 0;
  let draftCalls = 0;
  let screeningCalls = 0;
  const ai: AIProvider = {
    id,
    async generateJson(req) {
      seen.push(req);
      if (req.system.startsWith("You prepare a search") || req.system.startsWith("You create a safe search plan")) {
        const understands = script.understands;
        if (Array.isArray(understands)) return understands[Math.min(understandingCalls++, understands.length - 1)];
        return script.understand;
      }
      if (req.system.startsWith("You select evidence")) {
        const selections = script.selections;
        if (Array.isArray(selections)) return selections[Math.min(selectionCalls++, selections.length - 1)];
        if (script.selection !== undefined) return script.selection;
        const prompt = JSON.parse(req.prompt) as { candidates: { source: { id: string } }[] };
        return {
          status: "ready",
          coverage: "complete",
          conflict: "none",
          assessments: prompt.candidates.map((candidate, index) => ({
            source_id: candidate.source.id,
            relevance: index === 0 ? "direct" : "context",
            supported_requirement_ids: index === 0 ? ["R1"] : [],
            context_safe: "yes",
          })),
        };
      }
      if (req.system.startsWith("You write short explanations")) {
        const drafts = script.drafts;
        if (Array.isArray(drafts)) return drafts[Math.min(draftCalls++, drafts.length - 1)];
        return script.draft;
      }
      // Evidence audit for the source-only fallback. Fails closed unless a test provides a result.
      if (req.system.startsWith("You independently audit")) {
        return "audit" in script ? script.audit : AUDIT_FAIL;
      }
      if (req.system.startsWith("You check optional video titles")) {
        const prompt = JSON.parse(req.prompt) as { titles: unknown[] };
        return "videoVerdicts" in script
          ? script.videoVerdicts
          : { verdicts: prompt.titles.map(() => "yes") };
      }
      const screenings = script.screenings;
      if (Array.isArray(screenings)) return screenings[Math.min(screeningCalls++, screenings.length - 1)];
      return script.verdicts;
    },
  };
  return { ai, seen };
}

const OK = {
  direct_answer_complete: "yes",
  listed_items_complete: "yes",
  no_repetition: "yes",
  not_established_ok: "yes",
  requirement_verdicts: [{ requirement_id: "R1", verdict: "yes" }],
  answers_question: "yes",
  covers_facets: "yes",
  fair_picture: "yes",
  context_preserved: "yes",
};
const OK_TWO = {
  ...OK,
  requirement_verdicts: [
    { requirement_id: "R1", verdict: "yes" },
    { requirement_id: "R2", verdict: "yes" },
  ],
};
const AUDIT_OK = { ...OK };
const AUDIT_FAIL = { ...OK, requirement_verdicts: [{ requirement_id: "R1", verdict: "no" }], answers_question: "no", covers_facets: "no", fair_picture: "no", context_preserved: "no" };
const isAudit = (req: JsonRequest) => req.system.startsWith("You independently audit");

function deps(
  writerScript: Record<string, unknown>,
  verdicts: unknown = { verdicts: ["supported"], ...OK },
  selection?: unknown,
  screenings?: unknown[],
) {
  const writer = fakeAI("fake/writer", writerScript);
  const verifier = fakeAI("fake/verifier", {
    verdicts,
    ...(selection === undefined ? {} : { selection }),
    ...(screenings === undefined ? {} : { screenings }),
  });
  const d: PipelineDeps = {
    writer: writer.ai,
    verifier: verifier.ai,
    // Fake search: a verse matches if its English text contains one of the query words.
    search: async (queries, limit) =>
      verses
        .filter((v) => queries.some((q) => q.split(" ").some((w) => v.translations.en?.toLowerCase().includes(w.toLowerCase()))))
        .map((v) => v.key)
        .slice(0, limit),
    getVerse: async (key) => verses.find((v) => v.key === key),
    neighbours: async () => [],
    deadlineMs: 5000,
  };
  return { d, writer, verifier };
}

describe("runPipeline", () => {
  it("answers when every step is clean, showing verses from source data", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const r = await runPipeline("What does the Quran say about fasting?", "en", d);
    expect(r.status).toBe("answer");
    if (r.status !== "answer") return;
    expect(r.answer.claims).toEqual([{ text: "Believers are required to fast during a certain month.", refs: ["2:183"] }]);
    expect(r.answer.evidence[0].arabic).toBe(verses[0].arabic);
    expect((r.answer.evidence[0] as { translation: string | null }).translation).toBe(verses[0].translations.en);
    expect(r.answer.attribution.text).toBe("Quran data provided by Quran Foundation");
  });

  it("keeps mere subject mentions out of the writer's sealed evidence package", async () => {
    const identityFrame = {
      ...understanding,
      question_type: "identity",
      subjects: ["example subject"],
      requested_points: [
        { text: "identity of the example subject", facet: "identity" },
        { text: "attributes of the example subject", facet: "attributes" },
      ],
      search_queries_en: ["example subject", "example subject properties"],
    };
    const identityDraft = {
      status: "answer",
      claims: [
        {
          text: "This passage directly identifies the subject.",
          source_ids: ["Q2:255"],
          requirement_id: "R1",
        },
        {
          text: "This passage directly characterizes the subject.",
          source_ids: ["Q2:255"],
          requirement_id: "R2",
        },
      ],
    };
    const selection = {
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q2:7", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:10", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:19", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:255", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
      ],
    };
    const { d, writer } = deps({ understand: identityFrame, draft: identityDraft }, { verdicts: ["supported", "supported"], ...OK_TWO }, selection);
    const result = await runPipeline("Who is the example subject?", "en", d);
    expect(result.status).toBe("answer");
    const draftPrompt = writer.seen[1].prompt;
    expect(draftPrompt).toContain("Q2:255");
    expect(draftPrompt).not.toContain("Q2:7");
    expect(draftPrompt).not.toContain("Q2:10");
    expect(draftPrompt).not.toContain("Q2:19");
  });

  it("stops before drafting when candidates only mention the subject", async () => {
    const selection = {
      status: "insufficient",
      coverage: "incomplete",
      conflict: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes" },
      ],
    };
    const { d, writer } = deps({ understand: understanding, draft: goodDraft }, undefined, selection);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
    expect(writer.seen).toHaveLength(1);
  });

  it("retries one thin selection with fewer candidates and continues only after the strict gate passes", async () => {
    const thin = {
      status: "insufficient", coverage: "incomplete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "partial", supported_requirement_ids: [], context_safe: "yes", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const ready = {
      status: "ready", coverage: "complete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const reasons: string[] = [];
    const { d, verifier } = deps({ understand: understanding, draft: goodDraft });
    verifier.ai.generateJson = fakeAI("retry/verifier", { selections: [thin, ready], verdicts: { verdicts: ["supported"], ...OK } }).ai.generateJson;
    d.verifier = verifier.ai;
    d.deadlineMs = 20_000;
    d.onRefuse = (reason) => reasons.push(reason);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("answer");
    expect(reasons).toContain("selection_retry_started_thin");
    expect(reasons).toContain("selection_retry_succeeded");
  });

  it("refuses when the correction selection is still thin", async () => {
    const thin = {
      status: "insufficient", coverage: "incomplete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "partial", supported_requirement_ids: [], context_safe: "yes", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const reasons: string[] = [];
    const { d, verifier, writer } = deps({ understand: understanding, draft: goodDraft });
    verifier.ai.generateJson = fakeAI("retry/verifier", { selections: [thin, thin] }).ai.generateJson;
    d.verifier = verifier.ai;
    d.deadlineMs = 20_000;
    d.onRefuse = (reason) => reasons.push(reason);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
    expect(reasons).toContain("selection_retry_failed");
    expect(reasons).toContain("evidence_insufficient");
    expect(writer.seen).toHaveLength(1);
  });

  it("retries when the checker skipped a known candidate", async () => {
    const skipped = {
      status: "insufficient", coverage: "incomplete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const ready = {
      status: "ready", coverage: "complete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const reasons: string[] = [];
    const { d, verifier } = deps({ understand: understanding, draft: goodDraft });
    verifier.ai.generateJson = fakeAI("retry/verifier", { selections: [skipped, ready], verdicts: { verdicts: ["supported"], ...OK } }).ai.generateJson;
    d.verifier = verifier.ai;
    d.deadlineMs = 20_000;
    d.onRefuse = (reason) => reasons.push(reason);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("answer");
    expect(reasons).toContain("selection_retry_started_skipped");
  });

  it("does not retry conflicts, invented ids or unsafe complete selections", async () => {
    const unsafeSelections = [
      { status: "conflicting", coverage: "incomplete", conflict_type: "revelation_conflict", assessments: [] },
      { status: "insufficient", coverage: "incomplete", conflict_type: "none", assessments: [
        { source_id: "Q9:99", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes", position: "" },
      ] },
      { status: "ready", coverage: "complete", conflict_type: "none", assessments: [
        { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "unsure", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ] },
    ];
    for (const selection of unsafeSelections) {
      const reasons: string[] = [];
      const { d, verifier } = deps({ understand: understanding, draft: goodDraft }, undefined, selection);
      d.deadlineMs = 20_000;
      d.onRefuse = (reason) => reasons.push(reason);
      expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
      expect(verifier.seen.filter((call) => call.system.startsWith("You select evidence"))).toHaveLength(1);
      expect(reasons.some((reason) => reason.startsWith("selection_retry_started"))).toBe(false);
    }
  });

  it("refuses safely when the correction selection times out", async () => {
    const thin = {
      status: "insufficient", coverage: "incomplete", conflict_type: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "partial", supported_requirement_ids: [], context_safe: "yes", position: "" },
        { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes", position: "" },
      ],
    };
    const reasons: string[] = [];
    const { d, verifier } = deps({ understand: understanding, draft: goodDraft }, undefined, thin);
    const original = verifier.ai.generateJson;
    let selectionCalls = 0;
    verifier.ai.generateJson = async (request) => {
      if (!request.system.startsWith("You select evidence") || selectionCalls++ === 0) return original(request);
      return new Promise((_, reject) => request.signal?.addEventListener("abort", () => reject(request.signal?.reason), { once: true }));
    };
    d.deadlineMs = 5_000;
    d.selectionRetryTimeoutMs = 10;
    d.onRefuse = (reason) => reasons.push(reason);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
    expect(reasons).toContain("selection_retry_timeout");
    expect(reasons).toContain("evidence_insufficient");
  });

  it("never answers the zakat question when a retry drops the required amount", async () => {
    const zakatFrame = {
      ...understanding,
      question_type: "ruling",
      subjects: ["zakat on gold"],
      requested_points: [
        { text: "conditions that make gold zakat obligatory", facet: "conditions" },
        { text: "amount or rate of gold zakat due", facet: "quantity" },
      ],
      search_queries_en: ["fasting prescribed", "ill makes up"],
    };
    const selection = {
      status: "ready", coverage: "complete", conflict: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
        { source_id: "Q2:184", relevance: "direct", supported_requirement_ids: ["R2"], context_safe: "yes" },
      ],
    };
    const incomplete = {
      status: "answer",
      claims: [{ text: "The obligation begins after its conditions are met.", source_ids: ["Q2:183"], requirement_id: "R1" }],
    };
    const { d, writer } = deps({ understand: zakatFrame, drafts: [incomplete, incomplete] }, undefined, selection);
    const result = await runPipeline("ما شروط وجوب الزكاة في الذهب وكم مقدارها", "ar", d);
    expect(result.status).toBe("no_summary");
    expect(writer.seen[2].prompt).toContain("R2: amount or rate of gold zakat due");
  });

  it("accepts the zakat question only when conditions and quantity are both claimed and screened", async () => {
    const zakatFrame = {
      ...understanding,
      question_type: "ruling",
      subjects: ["zakat on gold"],
      requested_points: [
        { text: "conditions that make gold zakat obligatory", facet: "conditions" },
        { text: "amount or rate of gold zakat due", facet: "quantity" },
      ],
      search_queries_en: ["fasting prescribed", "ill makes up"],
    };
    const selection = {
      status: "ready", coverage: "complete", conflict: "none",
      assessments: [
        { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
        { source_id: "Q2:184", relevance: "direct", supported_requirement_ids: ["R2"], context_safe: "yes" },
      ],
    };
    const complete = { status: "answer", claims: [
      { text: "The duty begins when its stated conditions are met.", source_ids: ["Q2:183"], requirement_id: "R1" },
      { text: "The due amount follows the stated rate.", source_ids: ["Q2:184"], requirement_id: "R2" },
    ] };
    const { d } = deps({ understand: zakatFrame, draft: complete }, { verdicts: ["supported", "supported"], ...OK_TWO }, selection);
    const result = await runPipeline("What are the conditions for gold zakat and how much is due?", "en", d);
    expect(result.status).toBe("answer");
    if (result.status === "answer") expect(result.answer.claims).toHaveLength(2);
  });

  it("refuses mercy and punishment passages that do not resolve their apparent conflict", async () => {
    const objection = {
      ...understanding,
      question_type: "objection",
      subjects: ["divine mercy", "eternal punishment"],
      requested_points: [{ text: "why eternal punishment is compatible with divine mercy", facet: "response" }],
      search_queries_en: ["other group discussed"],
    };
    const selection = {
      status: "insufficient", coverage: "incomplete", conflict: "none",
      assessments: [
        { source_id: "Q2:7", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:10", relevance: "partial", supported_requirement_ids: [], context_safe: "yes" },
        { source_id: "Q2:19", relevance: "partial", supported_requirement_ids: [], context_safe: "yes" },
      ],
    };
    const { d, writer } = deps({ understand: objection, draft: goodDraft }, undefined, selection);
    const result = await runPipeline("If God is merciful, why does He punish people in Hell forever?", "en", d);
    expect(result.status).toBe("no_source");
    expect(writer.seen).toHaveLength(1);
  });

  it("allows an objection only when a direct passage resolves the challenge", async () => {
    const objection = {
      ...understanding,
      question_type: "objection",
      subjects: ["divine mercy", "eternal punishment"],
      requested_points: [{ text: "why eternal punishment is compatible with divine mercy", facet: "response" }],
      search_queries_en: ["direct description"],
    };
    const selection = {
      status: "ready", coverage: "complete", conflict: "none",
      assessments: [{ source_id: "Q2:255", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" }],
    };
    const draft = { status: "answer", claims: [
      { text: "The passage directly resolves the apparent conflict.", source_ids: ["Q2:255"], requirement_id: "R1" },
    ] };
    const { d } = deps({ understand: objection, draft }, undefined, selection);
    expect((await runPipeline("If X, why Y?", "en", d)).status).toBe("answer");
  });

  it("never sends the raw question to the writing or screening step", async () => {
    const question = "What does the Quran say about fasting? SECRET-MARKER";
    const { d, writer, verifier } = deps({ understand: understanding, draft: goodDraft });
    await runPipeline(question, "en", d);
    const later = [...writer.seen.slice(1), ...verifier.seen];
    expect(later.length).toBeGreaterThan(0);
    for (const req of later) expect(req.prompt).not.toContain("SECRET-MARKER");
  });

  it("keeps context away from the writer but gives it to final screening", async () => {
    const { d, writer, verifier } = deps({ understand: understanding, draft: goodDraft });
    d.neighbours = async (key) => key === "2:183" ? [verses[1]] : [];
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("answer");
    const selection = JSON.parse(verifier.seen[0].prompt) as {
      candidates: { surrounding_context: Record<string, unknown>[] }[];
    };
    expect(selection.candidates[0].surrounding_context[0]).not.toHaveProperty("id");
    expect(selection.candidates[0].surrounding_context[0]).toHaveProperty("translation_en", verses[1].translations.en);
    expect(writer.seen[1].prompt).not.toContain("Q2:184");
    expect(verifier.seen[1].prompt).toContain("Q2:184");
  });

  it("does not give Arabic verse wording to the Arabic writer", async () => {
    const arabicFrame = {
      ...understanding,
      language: "ar",
      search_queries_ar: ["الصيام شهر"],
    };
    const arabicDraft = {
      status: "answer",
      claims: [{ text: "يفرض على المؤمنين صيام شهر محدد.", source_ids: ["Q2:183"], requirement_id: "R1" }],
    };
    const { d, writer } = deps({ understand: arabicFrame, draft: arabicDraft });
    expect((await runPipeline("ما حكم الصيام؟", "ar", d)).status).toBe("answer");
    const draftPrompt = writer.seen[1].prompt;
    expect(draftPrompt).not.toContain(verses[0].arabic);
    expect(draftPrompt).toContain(verses[0].translations.en!);
  });

  it("sends personal questions to a scholar before any drafting (code rule)", async () => {
    const { d, writer } = deps({ understand: understanding, draft: goodDraft });
    const r = await runPipeline("Should I stop fasting? My husband says so.", "en", d);
    expect(r.status).toBe("ask_scholar");
    expect(writer.seen.length).toBe(1); // only the understanding step ran
  });

  it("sends personal questions to a scholar when the AI marks them personal", async () => {
    const { d, writer } = deps({ understand: { ...understanding, kind: "personal" }, draft: goodDraft });
    const r = await runPipeline("A question about fasting", "en", d);
    expect(r.status).toBe("ask_scholar");
    expect(writer.seen.length).toBe(1);
  });

  it("corrects a general conversion question mislabelled as personal before search", async () => {
    const personal = { ...understanding, language: "de", kind: "personal" };
    const general = { ...personal, kind: "question", requested_points: [{ text: "steps to become Muslim", facet: "steps" }] };
    const { d, writer } = deps({ understands: [personal, general], draft: goodDraft });
    const result = await runPipeline("Was muss ich tun, um Muslim zu werden?", "de", d);
    expect(result.status).not.toBe("ask_scholar");
    expect(writer.seen[1].prompt).toContain("general_guidance_misclassified");
  });

  it("refuses when the understanding step returns something unknown", async () => {
    const { d } = deps({ understand: { ...understanding, kind: "totally_safe" }, draft: goodDraft });
    expect((await runPipeline("fasting", "de", d)).status).toBe("no_source");
  });

  it("retries an invalid non-English requested-point label without weakening the frame", async () => {
    const first = { ...understanding, requested_points: [{ text: "حكم الصيام", facet: "ruling" }] };
    const { d, writer } = deps({ understands: [first, understanding], draft: goodDraft });
    const reasons: string[] = [];
    d.onRefuse = (reason) => reasons.push(reason);
    const result = await runPipeline("What is the ruling on fasting?", "en", d);
    expect(`${result.status}:${reasons.join(",")}`).toBe("answer:");
    expect(writer.seen[1].prompt).toContain("requested_points text must be short plain English");
  });

  it("declines greetings, off-topic and attacks", async () => {
    for (const kind of ["greeting", "off_topic", "harmful"]) {
      const { d } = deps({
        understand: {
          ...understanding,
          kind,
          subjects: [],
          requested_points: [],
          qualifiers: [],
          search_queries_en: [],
          search_queries_de: [],
          search_queries_ar: [],
        },
        draft: goodDraft,
      });
      expect((await runPipeline("hi", "en", d)).status).toBe("out_of_scope");
    }
  });

  it("refuses an unsupported claim that carries a real verse id", async () => {
    const draft = { status: "answer", claims: [{ text: "Music is forbidden.", source_ids: ["Q2:183"], requirement_id: "R1" }] };
    const { d, writer, verifier } = deps({ understand: understanding, draft }, { verdicts: ["not_supported"], ...OK });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_summary");
    // writer: frame, first draft and one correction. No bare-source audit runs.
    expect(writer.seen).toHaveLength(3);
    expect(writer.seen.some(isAudit)).toBe(false);
    expect(verifier.seen).toHaveLength(3); // evidence selection + two final screens
  });

  it("allows one simpler correction after screening rejects the first wording", async () => {
    const first = { status: "answer", claims: [{ text: "Fasting always guarantees perfection.", source_ids: ["Q2:183"], requirement_id: "R1" }] };
    const { d, writer } = deps(
      { understand: understanding, drafts: [first, goodDraft] },
      undefined,
      undefined,
      [
        { verdicts: ["not_supported"], ...OK },
        { verdicts: ["supported"], ...OK },
      ],
    );
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("answer");
    expect(writer.seen).toHaveLength(3);
  });

  it("refuses real, supported claims that do not answer the question or give a misleading picture", async () => {
    for (const whole of [
      { answers_question: "no", covers_facets: "yes", fair_picture: "yes", context_preserved: "yes" },
      { answers_question: "yes", covers_facets: "yes", fair_picture: "no", context_preserved: "yes" },
      { answers_question: "yes", covers_facets: "unsure", fair_picture: "yes", context_preserved: "yes" },
      { answers_question: "yes", covers_facets: "yes", fair_picture: "yes", context_preserved: "no" },
      {},
    ]) {
      const { d } = deps({ understand: understanding, draft: goodDraft }, { verdicts: ["supported"], ...whole });
      expect((await runPipeline("fasting?", "en", d)).status).toBe("no_summary");
    }
  });

  it("refuses the whole answer if only one claim fails screening", async () => {
    const draft = {
      status: "answer",
      claims: [
        { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" },
        { text: "Sick people must never fast.", source_ids: ["Q2:184"], requirement_id: "R1" },
      ],
    };
    const { d } = deps({ understand: understanding, draft }, { verdicts: ["supported", "unsure"], ...OK });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
  });

  it("refuses when the screening answer is malformed or the wrong length", async () => {
    for (const v of [null, "supported", { verdicts: [] }, { verdicts: ["supported", "supported"] }]) {
      const { d } = deps({ understand: understanding, draft: goodDraft }, v);
      expect(["no_source", "no_summary"]).toContain((await runPipeline("fasting?", "en", d)).status);
    }
  });

  it("refuses a draft citing a verse it was not given", async () => {
    const draft = { status: "answer", claims: [{ text: "Something about the throne.", source_ids: ["Q2:255"], requirement_id: "R1" }] };
    const { d } = deps({ understand: understanding, draft });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
  });

  it("refuses when nothing relevant is found", async () => {
    const { d } = deps({ understand: { ...understanding, subjects: ["music"], search_queries_en: ["music", "instruments"] }, draft: goodDraft });
    expect((await runPipeline("Is music allowed?", "en", d)).status).toBe("no_source");
  });

  it("refuses a broad subject-only query plan before searching or drafting", async () => {
    const broad = {
      ...understanding,
      question_type: "identity",
      subjects: ["Allah", "God in Islam"],
      requested_points: [
        { text: "identity of Allah", facet: "identity" },
        { text: "attributes of Allah", facet: "attributes" },
      ],
      search_queries_en: ["who is Allah", "attributes Allah Islam", "concept of God in Islam"],
      search_queries_de: ["wer ist Allah"],
      search_queries_ar: ["من هو الله"],
    };
    const { d, writer, verifier } = deps({ understand: broad, draft: goodDraft });
    expect((await runPipeline("Who is Allah?", "en", d)).status).toBe("no_source");
    expect(writer.seen).toHaveLength(1);
    expect(verifier.seen).toHaveLength(0);
  });

  it("redoes a draft once after a writing slip, and refuses if it slips again", async () => {
    const copied = { status: "answer", claims: [{ text: "Fasting is prescribed for you in the blessed month.", source_ids: ["Q2:183"], requirement_id: "R1" }] };
    const { d, writer } = deps({ understand: understanding, draft: copied });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_summary");
    // writer: frame and two drafts. No bare-source audit runs.
    expect(writer.seen.length).toBe(3);
    expect(writer.seen.some(isAudit)).toBe(false);
  });

  describe("no-summary fallback", () => {
    // Arabic frame whose drafts keep re-typing the verse (a wording failure, not an evidence failure).
    const arabicFrame = { ...understanding, language: "ar", search_queries_ar: ["الصيام شهر"] };
    const copiedArabic = {
      status: "answer",
      claims: [{ text: "كتب عليكم الصيام في الشهر المبارك", source_ids: ["Q2:183"], requirement_id: "R1" }],
    };

    it("shows no bare sources when wording keeps failing", async () => {
      const { d, writer } = deps({ understand: arabicFrame, draft: copiedArabic, audit: AUDIT_OK });
      const r = await runPipeline("ما حكم الصيام؟", "ar", d);
      expect(r.status).toBe("no_summary");
      expect(writer.seen).toHaveLength(3);
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("never shows rejected AI text or source cards in no-summary mode", async () => {
      // A well-formed Arabic summary that screening rejects twice, so the fallback is reached.
      const aiSummary = "يفرض على المؤمنين صيام شهر محدد";
      const draft = { status: "answer", claims: [{ text: aiSummary, source_ids: ["Q2:183"], requirement_id: "R1" }] };
      const { d } = deps({ understand: arabicFrame, draft, audit: AUDIT_OK }, { verdicts: ["not_supported"], ...OK });
      const r = await runPipeline("ما حكم الصيام؟", "ar", d);
      expect(r).toEqual({ status: "no_summary", language: "ar" });
      expect(JSON.stringify(r)).not.toContain(aiSummary);
    });

    it("returns no-summary after failed claim screening", async () => {
      const { d, verifier } = deps(
        { understand: understanding, draft: goodDraft, audit: AUDIT_OK },
        { verdicts: ["not_supported"], ...OK },
      );
      const r = await runPipeline("What does the Quran say about fasting?", "en", d);
      expect(r.status).toBe("no_summary");
      expect(verifier.seen).toHaveLength(3); // selection + two screens
    });

    it("does not make another model call after a checked wording failure", async () => {
      const identityFrame = {
        ...understanding,
        question_type: "identity",
        subjects: ["example subject"],
        requested_points: [
          { text: "identity of the example subject", facet: "identity" },
          { text: "attributes of the example subject", facet: "attributes" },
        ],
        search_queries_en: ["example subject", "example subject properties"],
      };
      const selection = {
        status: "ready",
        coverage: "complete",
        conflict: "none",
        assessments: [
          { source_id: "Q2:7", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
          { source_id: "Q2:10", relevance: "unrelated", supported_requirement_ids: [], context_safe: "yes" },
          { source_id: "Q2:19", relevance: "mention_only", supported_requirement_ids: [], context_safe: "yes" },
          { source_id: "Q2:255", relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
        ],
      };
      // Drafts copy six words of the approved translation, so wording fails twice.
      const copied = {
        status: "answer",
        claims: [
          { text: "The example subject has a direct description here.", source_ids: ["Q2:255"], requirement_id: "R1" },
          { text: "Several distinct properties are listed.", source_ids: ["Q2:255"], requirement_id: "R2" },
        ],
      };
      const { d, writer } = deps({ understand: identityFrame, draft: copied, audit: OK_TWO }, undefined, selection);
      const r = await runPipeline("Who is the example subject? RAW-QUESTION-MARKER", "en", d);
      expect(r.status).toBe("no_summary");
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("does not depend on the removed source-only audit", async () => {
      for (const audit of [
        AUDIT_FAIL,
        { ...AUDIT_OK, answers_question: "no" },
        { ...AUDIT_OK, covers_facets: "unsure" },
        { ...AUDIT_OK, fair_picture: "no" },
        { ...AUDIT_OK, context_preserved: "unsure" },
        { answers_question: "yes", covers_facets: "yes" },
        null,
        "yes",
        undefined,
      ]) {
        const { d } = deps({ understand: arabicFrame, draft: copiedArabic, audit });
        expect((await runPipeline("ما حكم الصيام؟", "ar", d)).status).toBe("no_summary");
      }
    });

    it("keeps no-summary separate from insufficient evidence", async () => {
      const selection = {
        status: "insufficient",
        coverage: "incomplete",
        conflict: "none",
        assessments: [
          { source_id: "Q2:183", relevance: "partial", supported_requirement_ids: [], context_safe: "yes" },
          { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes" },
        ],
      };
      const { d, writer } = deps({ understand: arabicFrame, draft: copiedArabic, audit: AUDIT_OK }, undefined, selection);
      expect((await runPipeline("ما حكم الصيام؟", "ar", d)).status).toBe("no_source");
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("keeps no-summary separate from model no-answer and malformed output", async () => {
      for (const draft of [{ status: "no_answer", claims: [] }, null, { status: "answer", claims: "x" }]) {
        const { d, writer } = deps({ understand: understanding, draft, audit: AUDIT_OK });
        expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
        expect(writer.seen.some(isAudit)).toBe(false);
      }
    });

    it("keeps no-summary separate from citations outside the sealed package", async () => {
      const draft = { status: "answer", claims: [{ text: "Something about the throne.", source_ids: ["Q2:255"], requirement_id: "R1" }] };
      const { d, writer } = deps({ understand: understanding, draft, audit: AUDIT_OK });
      expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("keeps normal English and German answers as checked claims", async () => {
      const germanFrame = { ...understanding, language: "de" };
      const germanDraft = {
        status: "answer",
        claims: [{ text: "Den Gläubigen ist das Fasten in einem bestimmten Monat vorgeschrieben.", source_ids: ["Q2:183"], requirement_id: "R1" }],
      };
      for (const [frame, draft, lang] of [
        [understanding, goodDraft, "en"],
        [germanFrame, germanDraft, "de"],
      ] as const) {
        const { d, writer } = deps({ understand: frame, draft, audit: AUDIT_OK });
        const r = await runPipeline("fasting?", lang, d);
        if (r.status !== "answer") throw new Error(`expected a normal ${lang} answer`);
        expect(r.answer.claims).toHaveLength(1);
        expect(writer.seen.some(isAudit)).toBe(false);
      }
    });
  });

  it("uses a writer and a screener that are different models", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const r = await runPipeline("fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.model).not.toBe(r.answer.verifier);
  });
});

// ---------- hadith as a second source (made-up texts, not real hadith) ----------
const hadithFast: Hadith = {
  id: "HE9001",
  collection: "agreed",
  numbers: { bukhari: 1904, muslim: 1151 },
  attributionAr: "متفق عليه",
  gradeAr: "صحيح",
  arabic: "نص حديث تجريبي عن الصيام وجزائه",
  translations: { en: "Made-up hadith text: fasting is a shield with a great reward", de: null },
  url: "https://hadeethenc.com/en/browse/hadith/9001",
};
const hadithOther: Hadith = {
  ...hadithFast,
  id: "HE9002",
  collection: "bukhari",
  numbers: { bukhari: 5027, muslim: null },
  attributionAr: "رواه البخاري",
  arabic: "نص حديث تجريبي آخر عن التعلم",
  translations: { en: "Made-up hadith text about learning and teaching", de: "Erfundener Hadith-Text über das Lernen" },
  url: "https://hadeethenc.com/en/browse/hadith/9002",
};
const hadithWeak: Hadith = {
  ...hadithFast,
  id: "HE9003",
  attributionAr: "رواه الترمذي",
  gradeAr: "ضعيف",
  collection: "bukhari",
  numbers: { bukhari: 1, muslim: null },
};

const hadithSelection = (hadithRelevance: string, otherRelevance = "unrelated") => ({
  status: "ready",
  coverage: "complete",
  conflict: "none",
  assessments: [
    { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
    { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes" },
    ...(hadithRelevance === "none"
      ? []
      : [{ source_id: "HE9001", relevance: hadithRelevance, supported_requirement_ids: hadithRelevance === "direct" ? ["R1"] : [], context_safe: "yes" }]),
    { source_id: "HE9002", relevance: otherRelevance, supported_requirement_ids: [], context_safe: "yes" },
  ],
});
const verseAndHadithDraft = {
  status: "answer",
  claims: [
    { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" },
    { text: "The Prophet taught that fasting protects the one who fasts.", source_ids: ["HE9001"], requirement_id: "R1" },
  ],
};
const TWO_SUPPORTED = { verdicts: ["supported", "supported"], ...OK };

describe("hadith from Sahih al-Bukhari and Sahih Muslim", () => {
  it("cites a direct hadith and shows it exactly as the source gives it", async () => {
    const { d } = deps({ understand: understanding, draft: verseAndHadithDraft }, TWO_SUPPORTED, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.claims.map((c) => c.refs)).toEqual([["2:183"], ["HE9001"]]);
    const shown = r.answer.evidence.find((e) => e.key === "HE9001");
    expect(shown).toEqual({
      kind: "hadith",
      key: "HE9001",
      collection: "agreed",
      numbers: { bukhari: 1904, muslim: 1151 },
      gradeAr: "صحيح",
      attributionAr: "متفق عليه",
      arabic: hadithFast.arabic,
      translation: hadithFast.translations.en,
      translationLanguage: "en",
      url: hadithFast.url,
    });
    expect(r.answer.hadithAttribution?.text).toContain("HadeethEnc");
  });

  it("keeps mention-only and unrelated hadith away from the writer and the page", async () => {
    const { d, writer } = deps({ understand: understanding, draft: goodDraft }, undefined, hadithSelection("mention_only"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(writer.seen[1].prompt).not.toContain("HE9001");
    expect(writer.seen[1].prompt).not.toContain("HE9002");
    expect(r.answer.evidence.every((e) => e.kind === "quran")).toBe(true);
    expect(r.answer.hadithAttribution).toBeUndefined();
  });

  it("drops weak or non-Sahihayn hadith before the evidence check ever sees them", async () => {
    const reasons: string[] = [];
    const { d, verifier } = deps({ understand: understanding, draft: goodDraft }, undefined, hadithSelection("none"));
    d.searchHadith = async () => [hadithWeak, hadithOther];
    d.onRefuse = (reason) => reasons.push(reason);
    await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(verifier.seen[0].prompt).not.toContain("HE9003");
    expect(verifier.seen[0].prompt).toContain("HE9002");
    expect(reasons).toContain("hadith_dropped_by_rules");
  });

  it("only allows hadith whose collection is confirmed by its numbers and grade", () => {
    expect(hadithAllowed(hadithFast)).toBe(true);
    expect(hadithAllowed(hadithOther)).toBe(true);
    expect(hadithAllowed(hadithWeak)).toBe(false);
    expect(hadithAllowed({ ...hadithFast, numbers: { bukhari: 1904, muslim: null } })).toBe(false); // "agreed" needs both
    expect(hadithAllowed({ ...hadithOther, numbers: { bukhari: null, muslim: 7 } })).toBe(false);
    expect(hadithAllowed({ ...hadithFast, gradeAr: "حسن لكن في إسناده ضعيف" })).toBe(false);
    expect(hadithAllowed({ ...hadithFast, id: "9001" })).toBe(false);
  });

  it("answers from the Quran alone when the hadith search fails or is too slow", async () => {
    const failing: PipelineDeps["searchHadith"] = async () => {
      throw new Error("down");
    };
    const hanging: PipelineDeps["searchHadith"] = () => new Promise<Hadith[]>(() => {});
    for (const [search, reason] of [
      [failing, "hadith_search_failed"],
      [hanging, "hadith_search_timeout"],
    ] as const) {
      const reasons: string[] = [];
      const { d } = deps({ understand: understanding, draft: goodDraft });
      d.searchHadith = search;
      d.hadithTimeoutMs = 30;
      d.onRefuse = (r) => reasons.push(r);
      const r = await runPipeline("What does Islam teach about fasting?", "en", d);
      expect(r.status).toBe("answer");
      expect(reasons).toContain(reason);
    }
  });

  it("gives the Arabic writer no Arabic hadith text, and nobody later the raw question", async () => {
    const arabicFrame = { ...understanding, language: "ar", search_queries_ar: ["الصيام شهر"] };
    const arabicDraft = {
      status: "answer",
      claims: [
        { text: "يفرض على المؤمنين صيام شهر محدد.", source_ids: ["Q2:183"], requirement_id: "R1" },
        { text: "علم النبي أن الصوم يحمي صاحبه.", source_ids: ["HE9001"], requirement_id: "R1" },
      ],
    };
    const { d, writer, verifier } = deps({ understand: arabicFrame, draft: arabicDraft }, TWO_SUPPORTED, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("ما حكم الصيام؟ RAW-QUESTION-MARKER", "ar", d);
    expect(r.status).toBe("answer");
    expect(writer.seen[1].prompt).not.toContain(hadithFast.arabic);
    expect(writer.seen[1].prompt).toContain(hadithFast.translations.en!);
    for (const req of [...writer.seen.slice(1), ...verifier.seen]) expect(req.prompt).not.toContain("RAW-QUESTION-MARKER");
    if (r.status === "answer") expect((r.answer.evidence.find((e) => e.key === "HE9001") as { translation: string | null } | undefined)?.translation).toBeNull();
  });

  it("returns no-summary without showing hadith cards when wording fails", async () => {
    // The drafts copy six words of the hadith translation, so wording fails twice.
    const copied = {
      status: "answer",
      claims: [{ text: "Fasting is a shield with a great reward for believers.", source_ids: ["HE9001"], requirement_id: "R1" }],
    };
    const { d } = deps({ understand: understanding, draft: copied, audit: AUDIT_OK }, undefined, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(r).toEqual({ status: "no_summary", language: "en" });
  });

  it("shows the English hadith translation, labelled, when no German one exists", async () => {
    const germanFrame = { ...understanding, language: "de" };
    const germanDraft = {
      status: "answer",
      claims: [
        { text: "Den Gläubigen ist das Fasten in einem bestimmten Monat vorgeschrieben.", source_ids: ["Q2:183"], requirement_id: "R1" },
        { text: "Der Prophet lehrte, dass das Fasten den Fastenden schützt.", source_ids: ["HE9001"], requirement_id: "R1" },
      ],
    };
    const { d } = deps({ understand: germanFrame, draft: germanDraft }, TWO_SUPPORTED, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("Was wird über das Fasten gelehrt?", "de", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    const shown = r.answer.evidence.find((e) => e.key === "HE9001");
    expect(shown?.kind === "hadith" && shown.translationLanguage).toBe("en");
    expect((shown as { translation: string | null } | undefined)?.translation).toBe(hadithFast.translations.en);
  });
});

// ---------- scholar quotes as a third source (made-up texts) ----------
const quoteFast: ScholarQuote = {
  id: "S22222222-2222-2222-2222-222222222222",
  scholarId: "ibn-baz",
  scholarName: { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  title: "حكمة تجريبية من الصيام",
  reference: "مجموع فتاوى تجريبي (15/ 7)",
  arabic: "نص تجريبي من كلام الشيخ في بيان حكمة الصيام وأثره في التقوى.",
  url: "https://binbaz.org.sa/fatwas/9/test",
};
const quoteOther: ScholarQuote = { ...quoteFast, id: "S33333333-3333-3333-3333-333333333333", title: "مسألة تجريبية أخرى", arabic: "نص تجريبي عن مسألة أخرى لا علاقة لها." };
const quoteBad: ScholarQuote = { ...quoteFast, id: "S44444444-4444-4444-4444-444444444444", url: "https://example.com/not-official" };

const scholarSelection = (relevance: string) => ({
  status: "ready",
  coverage: "complete",
  conflict: "none",
  assessments: [
    { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
    { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes" },
    { source_id: quoteFast.id, relevance, supported_requirement_ids: relevance === "direct" ? ["R1"] : [], context_safe: "yes" },
    { source_id: quoteOther.id, relevance: "unrelated", supported_requirement_ids: [], context_safe: "yes" },
  ],
});
const arabicQueries = { ...understanding, search_queries_ar: ["حكمة الصيام"] };

describe("scholar quotes", () => {
  it("passes checked topic page URLs to the scholar source adapter", async () => {
    let mapped: string[] | undefined;
    const goldFrame = {
      ...arabicQueries,
      language: "ar",
      question_type: "ruling",
      subjects: ["gold zakat"],
      requested_points: [
        { text: "Conditions for gold zakat", facet: "conditions" },
        { text: "Gold zakat rate due", facet: "quantity" },
      ],
      search_queries_ar: ["زكاة الذهب مقدارها"],
    };
    const { d: gold } = deps({ understand: goldFrame, draft: goodDraft });
    gold.searchScholars = async (_phrases, mappedUrls) => {
      mapped = mappedUrls;
      return [];
    };
    await runPipeline("ما شروط وجوب الزكاة في الذهب وكم مقدارها؟", "ar", gold);
    expect(mapped?.[0]).toContain("binbaz.org.sa/fatwas/5743/");
  });

  it("cites a direct scholar quote, crediting the scholar, and shows his exact words with source and link", async () => {
    const draft = {
      status: "answer",
      claims: [
        { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" },
        { text: "Shaykh Ibn Baz explained that fasting builds mindfulness of God.", source_ids: [quoteFast.id], requirement_id: "R1" },
      ],
    };
    const { d, writer } = deps({ understand: arabicQueries, draft }, TWO_SUPPORTED, scholarSelection("direct"));
    d.searchScholars = async () => [quoteFast, quoteOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.claims[1].refs).toEqual([quoteFast.id]);
    expect(r.answer.evidence.find((e) => e.key === quoteFast.id)).toEqual({
      kind: "scholar",
      key: quoteFast.id,
      scholarId: "ibn-baz",
      scholarName: "Shaykh Abdul-Aziz ibn Baz",
      title: quoteFast.title,
      reference: quoteFast.reference,
      arabic: quoteFast.arabic,
      url: quoteFast.url,
    });
    // Scholar quotes have no translation, so the writer receives the scholar's Arabic words.
    expect(writer.seen[1].prompt).toContain(quoteFast.arabic);
    expect(writer.seen[1].prompt).not.toContain(quoteOther.arabic);
  });

  it("keeps mention-only quotes away from the writer and the page", async () => {
    const { d, writer } = deps({ understand: arabicQueries, draft: goodDraft }, undefined, scholarSelection("mention_only"));
    d.searchScholars = async () => [quoteFast, quoteOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(writer.seen[1].prompt).not.toContain(quoteFast.id);
    expect(r.answer.evidence.some((e) => e.kind === "scholar")).toBe(false);
  });

  it("drops quotes that fail the rules before the evidence check sees them", async () => {
    const reasons: string[] = [];
    const { d, verifier } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchScholars = async () => [quoteBad, quoteOther];
    d.onRefuse = (r) => reasons.push(r);
    await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(verifier.seen[0].prompt).not.toContain(quoteBad.id);
    expect(verifier.seen[0].prompt).toContain(quoteOther.id);
    expect(reasons).toContain("scholar_dropped_by_rules");
  });

  it("answers without scholar quotes when the library search fails, and skips it without Arabic phrases", async () => {
    const reasons: string[] = [];
    const { d } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchScholars = async () => {
      throw new Error("down");
    };
    d.onRefuse = (r) => reasons.push(r);
    expect((await runPipeline("What does Islam teach about fasting?", "en", d)).status).toBe("answer");
    expect(reasons).toContain("scholar_search_failed");

    let called = false;
    const { d: d2 } = deps({ understand: understanding, draft: goodDraft }); // no Arabic phrases
    d2.searchScholars = async () => {
      called = true;
      return [];
    };
    await runPipeline("What does Islam teach about fasting?", "en", d2);
    expect(called).toBe(false);
  });
});

describe("wider source search", () => {
  it("fetches neighbouring verses only for the bounded selector set", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const keys = ["2:183", ...Array.from({ length: 11 }, (_, index) => `2:${index + 1}`)];
    d.search = async () => keys;
    d.getVerse = async (key) => ({ ...verses[0], key, url: `https://quran.com/${key.replace(":", "/")}` });
    let neighbourCalls = 0;
    d.neighbours = async () => { neighbourCalls += 1; return []; };
    await runPipeline("What does Islam teach about fasting?", "en", d);
    expect(neighbourCalls).toBe(8);
  });
});

describe("related videos", () => {
  const video = { youtubeId: "abcdefghijk", channelId: "UCiiJRwQ0MUaQo8ZZuf18pPw", title: "حكم الصيام", minutes: 4, language: "ar" as const };
  const outsider = { ...video, youtubeId: "zzzzzzzzzzz", channelId: "UCnotapproved00000000000" };

  it("does not let optional video search delay evidence selection", async () => {
    let finishVideoSearch: ((videos: typeof video[]) => void) | undefined;
    const { d, verifier } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchVideos = async () => new Promise((resolve) => { finishVideoSearch = resolve; });
    const running = runPipeline("What does Islam teach about fasting?", "en", d);
    for (let i = 0; i < 10 && !verifier.seen.some((call) => call.system.startsWith("You select evidence")); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(verifier.seen.some((call) => call.system.startsWith("You select evidence"))).toBe(true);
    finishVideoSearch?.([]);
    expect((await running).status).toBe("answer");
  });

  it("shows only videos that pass the separate title relevance check", async () => {
    const reasons: string[] = [];
    const { d, writer, verifier } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchVideos = async () => [video, outsider];
    d.onRefuse = (r) => reasons.push(r);
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.videos).toEqual([video]);
    expect(reasons).toContain("video_dropped_by_rules");
    for (const call of writer.seen) expect(call.prompt).not.toContain(video.youtubeId);
    const relevance = verifier.seen.find((call) => call.system.startsWith("You check optional video titles"));
    expect(relevance?.prompt).toContain(video.title);
    for (const call of verifier.seen.filter((item) => item !== relevance)) expect(call.prompt).not.toContain(video.youtubeId);
  });

  it("omits loosely related videos when the title checker says no", async () => {
    const { d, verifier } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchVideos = async () => [video];
    const original = verifier.ai.generateJson;
    verifier.ai.generateJson = async (request) => request.system.startsWith("You check optional video titles")
      ? { verdicts: ["no"] }
      : original(request);
    const result = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (result.status !== "answer") throw new Error("expected an answer");
    expect(result.answer.videos).toBeUndefined();
  });

  it("answers without videos when the video search fails, and refusals carry no videos", async () => {
    const reasons: string[] = [];
    const { d } = deps({ understand: arabicQueries, draft: goodDraft });
    d.searchVideos = async () => {
      throw new Error("down");
    };
    d.onRefuse = (r) => reasons.push(r);
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.videos).toBeUndefined();
    expect(reasons).toContain("video_search_failed");

    const { d: d2 } = deps({ understand: arabicQueries, draft: goodDraft }, undefined, { status: "insufficient", coverage: "none", conflict: "no", assessments: [] });
    d2.searchVideos = async () => [video];
    const refused = await runPipeline("What does Islam teach about fasting?", "en", d2);
    expect(refused.status).not.toBe("answer");
    expect(JSON.stringify(refused)).not.toContain(video.youtubeId);
  });
});

// ---------- AnswerV2 (design phases 1 to 3), made-up texts ----------
const isDraft = (req: JsonRequest) => req.system.startsWith("You write short explanations");
const madeUpVerse = (key: string): Verse => ({
  key,
  arabic: `نص عربي تجريبي للمصدر ${key.replace(":", " ")}`,
  arabicPlain: `نص عربي تجريبي للمصدر ${key.replace(":", " ")}`,
  translations: { en: `Made-up verse text for key ${key.replace(":", " ")}`, de: null },
  url: `https://quran.com/${key.replace(":", "/")}`,
});
const allDirect = (ids: string[]) => ({
  status: "ready", coverage: "complete", conflict: "none",
  assessments: ids.map((id) => ({ source_id: id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" })),
});
const supported = (n: number) => ({ verdicts: Array.from({ length: n }, () => "supported"), ...OK });

describe("AnswerV2 in the live pipeline", () => {
  it("attaches a validated AnswerV2 that keeps internal Quran ids, while the old view keeps display ids", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const r = await runPipeline("What does the Quran say about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    const v2 = r.answer.v2!;
    expect(validateAnswerV2(v2, { origin: "live", review: "automatic", requirementIds: ["R1"] }).ok).toBe(true);
    expect(v2.review).toBe("automatic");
    expect(v2.provenance).toEqual({ model: "fake/writer", verifier: "fake/verifier" });
    expect(v2.simple_answer.sentences).toEqual([{ text: goodDraft.claims[0].text, source_ids: ["Q2:183"], requirement_id: "R1" }]);
    expect(v2.quran.map((card) => card.id)).toEqual(["quran-2-183"]);
    expect(v2.quran[0].verses[0].arabic).toBe(verses[0].arabic); // exactly as served
    expect(r.answer.claims[0].refs).toEqual(["2:183"]);
  });

  it("tells the writer whether code permits a list, and the writer schema has the new fields", async () => {
    const { d, writer } = deps({ understand: understanding, draft: goodDraft });
    await runPipeline("What does the Quran say about fasting?", "en", d);
    const draft = writer.seen.find(isDraft)!;
    expect(draft.prompt).toContain('"list_allowed":false');
    expect(Object.keys((draft.schema as { properties: object }).properties)).toEqual(["status", "simple_answer", "list", "more_explanation", "limit_note"]);
  });

  it("hands the writer at most two scholar quotes and two hadith, whatever the selector marks direct", async () => {
    const quotes = [5, 6, 7, 8].map((n): ScholarQuote => ({ ...quoteFast, id: `S${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`,
      url: `https://binbaz.org.sa/fatwas/${n}/test`, arabic: `نص تجريبي رقم ${n} من كلام الشيخ.` }));
    const { d, writer } = deps({ understand: arabicQueries, draft: goodDraft }, undefined,
      allDirect(["Q2:183", "Q2:184", "HE9001", "HE9002", ...quotes.map((q) => q.id)]));
    d.searchScholars = async () => quotes;
    d.searchHadith = async () => [hadithFast, hadithOther, { ...hadithOther, id: "HE9004", url: "https://hadeethenc.com/en/browse/hadith/9004" }];
    await runPipeline("What does Islam teach about fasting?", "en", d);
    const prompt = writer.seen.find(isDraft)!.prompt;
    expect(quotes.filter((q) => prompt.includes(q.id))).toHaveLength(2);
    expect(["HE9001", "HE9002", "HE9004"].filter((id) => prompt.includes(id))).toHaveLength(2);
  });

  it("shows cited consecutive verses as one passage card and hides uncited package sources", async () => {
    const { d } = deps({ understand: understanding, draft: { status: "answer", claims: [
      { text: "Believers are told about the first matter.", source_ids: ["Q2:183"], requirement_id: "R1" },
      { text: "Believers are told about a second matter.", source_ids: ["Q2:184"], requirement_id: "R1" },
      { text: "Believers are told about a third matter.", source_ids: ["Q2:185"], requirement_id: "R1" },
    ] } }, supported(3), allDirect(["Q2:183", "Q2:184", "Q2:185", "Q3:1", "Q4:1"]));
    d.search = async () => ["2:183", "2:184", "2:185", "3:1", "4:1"];
    d.getVerse = async (key) => madeUpVerse(key);
    const r = await runPipeline("What does the Quran say about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.v2!.quran.map((card) => card.source_ids)).toEqual([["Q2:183", "Q2:184", "Q2:185"]]);
    expect(r.answer.evidence.map((e) => e.key)).toEqual(["2:183", "2:184", "2:185"]);
  });

  it("fails closed rather than dropping a cited verse when the rendered cards would exceed three", async () => {
    const reasons: string[] = [];
    const { d } = deps({ understand: understanding, draft: { status: "answer", claims: [
      { text: "Believers are told about the first matter.", source_ids: ["Q2:183"], requirement_id: "R1" },
      { text: "Believers are told about a later matter.", source_ids: ["Q2:185"], requirement_id: "R1" },
      { text: "Believers are told about another matter.", source_ids: ["Q3:1"], requirement_id: "R1" },
      { text: "Believers are told about a last matter.", source_ids: ["Q4:1"], requirement_id: "R1" },
    ] } }, supported(4), allDirect(["Q2:183", "Q2:184", "Q2:185", "Q3:1", "Q4:1"]));
    d.search = async () => ["2:183", "2:184", "2:185", "3:1", "4:1"];
    d.getVerse = async (key) => madeUpVerse(key);
    d.onRefuse = (reason) => reasons.push(reason);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
    expect(reasons).toContain("answer_v2_rendered_quran_cards_over_cap");
  });

  it("shows a complete named passage (al-Fatiha) as one card, but cites and lists only what the answer uses", async () => {
    const fatihaFrame = { ...understanding, question_type: "reference", subjects: ["al-Fatiha"],
      requested_points: [{ text: "meaning of al-Fatiha", facet: "meaning" }], search_queries_en: ["praise guidance path"] };
    const fatiha = Array.from({ length: 7 }, (_, i) => `Q1:${i + 1}`);
    const { d } = deps({ understand: fatihaFrame, draft: { status: "answer", claims: [
      { text: "The chapter praises God as the Lord of all.", source_ids: ["Q1:2"], requirement_id: "R1" },
      { text: "It asks to be guided on the straight way.", source_ids: ["Q1:6"], requirement_id: "R1" },
    ] } }, supported(2), allDirect(fatiha));
    d.search = async () => [];
    d.getVerse = async (key) => madeUpVerse(key);
    const r = await runPipeline("What does al-Fatiha say?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.v2!.quran).toHaveLength(1);
    expect(r.answer.v2!.quran[0].id).toBe("quran-1-1-7");
    expect(r.answer.v2!.quran[0].verses.map((v) => v.key)).toEqual(fatiha.map((id) => id.slice(1)));
    expect(r.answer.evidence.map((e) => e.key)).toEqual(["1:2", "1:6"]);
  });

  it("returns no-summary with no AnswerV2 payload when checked wording fails", async () => {
    const arabicFrame = { ...understanding, language: "ar", search_queries_ar: ["الصيام شهر"] };
    const copied = { status: "answer", claims: [{ text: "كتب عليكم الصيام في الشهر المبارك", source_ids: ["Q2:183"], requirement_id: "R1" }] };
    const { d } = deps({ understand: arabicFrame, draft: copied, audit: AUDIT_OK });
    const r = await runPipeline("ما حكم الصيام؟", "ar", d);
    expect(r).toEqual({ status: "no_summary", language: "ar" });
  });

  describe("steps list and the draft budget", () => {
    const quoteRepent: ScholarQuote = { ...quoteFast, id: "S66666666-6666-6666-6666-666666666666", title: "شروط التوبة",
      arabic: "التوبة تكون بالندم على الذنب والإقلاع عنه والعزم ألا يعود إليه.", url: "https://binbaz.org.sa/fatwas/66/test" };
    const repentFrame = { ...understanding, question_type: "practice", subjects: ["repentance"],
      requested_points: [{ text: "steps of repentance", facet: "steps" }], search_queries_en: ["repentance steps"], search_queries_ar: ["شروط التوبة من الذنب"] };
    const cite = (text: string) => ({ text, source_ids: [quoteRepent.id], requirement_id: "R1" });
    const quoted = { status: "answer", claims: [cite("Say \"I repent\" now.")] }; // wording slip, retryable
    const oneStep = { status: "answer", claims: [cite("Shaykh Ibn Baz explained that repentance requires regret.")] }; // misses two steps
    const complete = { status: "answer", simple_answer: [cite("Shaykh Ibn Baz explained that repentance has three conditions.")],
      list: [cite("Stop the sin."), cite("Regret the sin."), cite("Resolve never to return to it.")], more_explanation: [], limit_note: [] };
    const run = (screenings: unknown[]) => {
      const setup = deps({ understand: repentFrame, drafts: [quoted, oneStep, complete, complete] }, undefined, allDirect([quoteRepent.id]), screenings);
      setup.d.searchScholars = async () => [quoteRepent];
      return setup;
    };

    const backbitingQuestion = "What are the conditions for backbiting repentance, and must the person tell the one they spoke about?";
    const backbitingFrame = { ...repentFrame, subjects: ["backbiting repentance"], requested_points: [
      { text: "conditions for backbiting repentance", facet: "conditions" },
      { text: "whether the person must tell the one they spoke about", facet: "ruling" },
    ], search_queries_en: ["backbiting repentance conditions", "whether to tell the person"],
    search_queries_ar: ["شروط التوبة من الغيبة", "هل يخبر من اغتابه"] };
    const quoteBackbiting: ScholarQuote = { ...quoteFast, id: "S77777777-7777-7777-7777-777777777777", title: "كيفية تكفير ذنب الغيبة",
      arabic: "من تاب من الغيبة فإن تيسر أن يستحله ويخبره فعل وإذا خاف الشر واشتداد البغضاء لا يعلمه ويذكره بخير ويستغفر له.", url: "https://binbaz.org.sa/fatwas/11907/test" };

    it("refuses a general repentance source falsely marked direct for a specific backbiting ruling", async () => {
      const selection = { status: "ready", coverage: "complete", conflict: "none", assessments: [
        { source_id: quoteRepent.id, relevance: "direct", supported_requirement_ids: ["R1", "R2"], context_safe: "yes" },
      ] };
      const { d, writer } = deps({ understand: backbitingFrame, draft: complete }, undefined, selection);
      d.searchScholars = async () => [quoteRepent];
      expect((await runPipeline(backbitingQuestion, "en", d)).status).toBe("no_source");
      expect(writer.seen.filter(isDraft)).toHaveLength(0);
    });

    it("answers both points only with general conditions and a specific qualified backbiting source", async () => {
      const selection = { status: "ready", coverage: "complete", conflict: "none", assessments: [
        { source_id: quoteRepent.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
        { source_id: quoteBackbiting.id, relevance: "direct", supported_requirement_ids: ["R2"], context_safe: "yes" },
      ] };
      const r1 = (text: string) => ({ text, source_ids: [quoteRepent.id], requirement_id: "R1" });
      const r2 = (text: string) => ({ text, source_ids: [quoteBackbiting.id], requirement_id: "R2" });
      const answer = { status: "answer", simple_answer: [
        r1("Shaykh Ibn Baz explained that repentance has three general conditions."),
        r2("The person may be told when that is safe, but if telling could cause hostility or greater harm, they should not be told and should instead mention their good qualities and ask Allah to forgive them."),
      ], list: [r1("Stop the sin."), r1("Regret the sin."), r1("Resolve never to return to it.")], more_explanation: [], limit_note: [] };
      const screening = { verdicts: Array.from({ length: 5 }, () => "supported"), ...OK_TWO };
      const { d } = deps({ understand: backbitingFrame, draft: answer }, screening, selection);
      d.searchScholars = async () => [quoteRepent, quoteBackbiting];
      const result = await runPipeline(backbitingQuestion, "en", d);
      expect(result.status).toBe("answer");
      if (result.status === "answer") expect(result.answer.claims.some((claim) => /should not be told/i.test(claim.text))).toBe(true);
    });

    it("puts the steps in a checked list that counts as the direct answer", async () => {
      const { d, writer } = run([{ verdicts: ["not_supported", "supported", "supported", "supported"], ...OK }, supported(4)]);
      const r = await runPipeline("How do I repent from a sin?", "en", d);
      if (r.status !== "answer") throw new Error("expected an answer");
      expect(writer.seen.filter(isDraft)).toHaveLength(4);
      expect(writer.seen.find(isDraft)!.prompt).toContain('"list_allowed":true');
      expect(r.answer.v2!.simple_answer.list!.map((item) => item.text)).toEqual(["Stop the sin.", "Regret the sin.", "Resolve never to return to it."]);
      expect(r.answer.direct_answer).toHaveLength(4); // the old view shows the list after the simple answer
      expect(validateAnswerV2(r.answer.v2, { origin: "live", review: "automatic", requirementIds: ["R1"], listAllowed: true }).ok).toBe(true);
    });

    it("never makes more than four draft calls, and refuses when they are used up", async () => {
      const { d, writer } = run([{ verdicts: ["not_supported", "supported", "supported", "supported"], ...OK }]);
        expect((await runPipeline("How do I repent from a sin?", "en", d)).status).toBe("no_summary");
      expect(writer.seen.filter(isDraft)).toHaveLength(4);
    });
  });
});

// ---------- stored library hadith (HADITH_SOURCE=library) ----------
const LIB_UUID = "11111111-2222-4333-8444-555555555555";
const storedFast: Hadith = {
  id: `SH${LIB_UUID}`,
  collection: "bukhari",
  numbers: { bukhari: 1904, muslim: null },
  attributionAr: "رواه البخاري",
  gradeAr: "صحيح",
  arabic: "نص حديث تجريبي عن الصيام وجزائه",
  translations: { en: null, de: null },
  url: "https://sunnah.com/bukhari:1904",
};
const storedSelection = {
  status: "ready", coverage: "complete", conflict: "none",
  assessments: [
    { source_id: "Q2:183", relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
    { source_id: "Q2:184", relevance: "context", supported_requirement_ids: [], context_safe: "yes" },
    { source_id: storedFast.id, relevance: "direct", supported_requirement_ids: ["R1"], context_safe: "yes" },
  ],
};
const storedDraft = {
  status: "answer",
  claims: [
    { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], requirement_id: "R1" },
    { text: "The Prophet taught that fasting protects the one who fasts.", source_ids: [storedFast.id], requirement_id: "R1" },
  ],
};

describe("stored library hadith in the pipeline", () => {
  it("cites a stored hadith, shows Sunnah.com attribution and the Sunnah.com link, and builds a valid AnswerV2", async () => {
    const { d } = deps({ understand: understanding, draft: storedDraft }, TWO_SUPPORTED, storedSelection);
    d.searchHadith = async () => [storedFast];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    const shown = r.answer.evidence.find((e) => e.key === storedFast.id);
    expect(shown).toMatchObject({ kind: "hadith", url: "https://sunnah.com/bukhari:1904", arabic: storedFast.arabic, translation: null });
    expect(r.answer.hadithAttribution).toEqual({ text: "Hadith text: Sunnah.com", url: "https://sunnah.com" });
    expect(r.answer.v2?.hadith.map((h) => h.id)).toEqual([storedFast.id]);
    expect(r.answer.v2?.attribution.hadith?.text).toBe("Hadith text: Sunnah.com");
  });

  it("the AI steps see the full hadith text, never the chapter heading or a split; the answer carries the chapter", async () => {
    const quoted: Hadith = {
      ...storedFast,
      arabic: "حدثنا فلان عن فلان عن النبي صلى الله عليه وسلم قال ‏\"‏ نص تجريبي عن الصيام وجزائه ‏\"‏‏.‏",
      chapter: "باب عنوان تجريبي للفصل",
    };
    const { d, writer, verifier } = deps({ understand: understanding, draft: storedDraft }, TWO_SUPPORTED, storedSelection);
    d.searchHadith = async () => [quoted];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    const prompts = [...writer.seen, ...verifier.seen].map((s) => s.prompt);
    const full = JSON.stringify(quoted.arabic).slice(1, -1);
    expect(verifier.seen.some((s) => s.prompt.includes(full))).toBe(true);
    expect(prompts.some((p) => p.includes("عنوان تجريبي للفصل"))).toBe(false);
    const item = r.answer.v2?.hadith[0];
    expect(item).toMatchObject({ arabic: quoted.arabic, chapter: quoted.chapter });
    expect(item && "display_split" in item).toBe(false);
  });

  it("fails closed: if the library lookup fails there is no hadith and no fallback", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const fallback = vi.fn(async () => hadithFast as Hadith | null);
    d.searchHadith = async () => { throw new Error("library down"); };
    d.getHadith = fallback;
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status === "answer") expect(r.answer.evidence.some((e) => e.kind === "hadith")).toBe(false);
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe("lean candidate limits (ASK_LEAN)", () => {
  it("sends fewer candidates to the evidence check and never more than the defaults", async () => {
    const { d, verifier } = deps({ understand: understanding, draft: goodDraft });
    d.candidateLimits = { quran: 1, hadith: 1, scholar: 1 };
    await runPipeline("What does the Quran say about fasting?", "en", d);
    const lean = JSON.parse(verifier.seen[0].prompt) as { candidates: unknown[] };
    expect(lean.candidates.length).toBe(1);
    const wide = deps({ understand: understanding, draft: goodDraft });
    wide.d.candidateLimits = { quran: 999, hadith: 999, scholar: 999 };
    await runPipeline("What does the Quran say about fasting?", "en", wide.d);
    const normal = deps({ understand: understanding, draft: goodDraft });
    await runPipeline("What does the Quran say about fasting?", "en", normal.d);
    expect(JSON.parse(wide.verifier.seen[0].prompt).candidates.length).toBe(JSON.parse(normal.verifier.seen[0].prompt).candidates.length);
  });
});


describe("runPipeline claim audit", () => {
  const assessment = (overrides: Record<string, unknown> = {}) => ({
    claim_id: "C1", source_ids: ["Q2:183"],
    ...Object.fromEntries(CLAIM_AUDIT_FIELDS.map((field) => [field, "yes"])),
    reason_codes: [], explanation: "", ...overrides,
  });
  const auditOk = () => ({ ...OK, claim_assessments: [assessment()] });
  const auditFail = () => ({ ...OK, claim_assessments: [assessment({
    audience_preserved: "no", reason_codes: ["audience_changed"], explanation: "Keep the source's addressed group explicit.",
  })] });

  it("explains both malformed screens without logging answer or feedback text", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft }, { ...OK,
      claim_assessments: [assessment({ claim_id: "C999", explanation: "Private checker text." })] });
    d.claimAudit = true;
    const diagnostics: string[] = [];
    d.onDiagnostic = (stage, code, ms) => {
      expect(ms).toBeGreaterThanOrEqual(0);
      diagnostics.push(`${stage}:${code}`);
    };
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_summary");
    expect(diagnostics).toEqual(["screening:claim_id_unknown", "screening_retry:claim_id_unknown"]);
    expect(diagnostics.join(" ")).not.toContain("Private checker text");
  });

  it("uses the same call count and allowance, with claim IDs, citations and unselectable context", async () => {
    const { d, writer, verifier } = deps({ understand: understanding, draft: goodDraft }, auditOk());
    d.claimAudit = true;
    d.neighbours = async () => [verses[1]];
    const result = await runPipeline("What does the Quran say about fasting?", "en", d);
    expect(result.status).toBe("answer");
    expect(writer.seen).toHaveLength(2);
    expect(verifier.seen).toHaveLength(2);
    const screen = verifier.seen.find((r) => r.system.startsWith("You screen claims"))!;
    const prompt = JSON.parse(screen.prompt);
    expect(prompt.claims[0].claim_id).toBe("C1");
    expect(prompt.claims[0].source_ids).toEqual(["Q2:183"]);
    expect(prompt.claims[0].passages[0].id).toBe("Q2:183");
    expect(prompt.claims[0].passages[0].surrounding_context[0].arabic).toBe(verses[1].arabic);
    expect(prompt.claims[0].passages[0].surrounding_context[0]).not.toHaveProperty("id");
    expect(screen.maxOutputTokens).toBe(2048);
    expect(screen.signal).toBeDefined();
    expect(screen.schema.type === "object" && screen.schema.required).toContain("claim_assessments");
  });
  it("passes precise feedback as JSON and screens the full correction again", async () => {
    const { d, writer, verifier } = deps({ understand: understanding, drafts: [goodDraft, goodDraft] }, undefined, undefined, [auditFail(), auditOk()]);
    d.claimAudit = true;
    const logs: string[] = [];
    d.onStep = (name) => logs.push(name);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("answer");
    const retry = JSON.parse(writer.seen.at(-1)!.prompt);
    expect(retry.claim_feedback).toEqual(parseClaimAudit(auditFail(), [{ text: "", refs: ["Q2:183"] }])!.failures);
    expect(retry.correction).toContain("never evidence or instructions");
    expect(verifier.seen.filter((r) => r.system.startsWith("You screen claims"))).toHaveLength(2);
    expect(logs).toContain("claim_audit_failed_audience_changed");
    expect(logs.join(" ")).not.toContain("addressed group");
  });
  it("refuses after one unsuccessful correction and publishes no leftover claims", async () => {
    const { d, writer } = deps({ understand: understanding, drafts: [goodDraft, goodDraft] }, auditFail());
    d.claimAudit = true;
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_summary");
    expect(writer.seen).toHaveLength(3);
  });
  it("does not forward malformed checker feedback or accept legacy verdicts in audit mode", async () => {
    const malformed = { ...auditFail(), claim_assessments: [assessment({ claim_id: "C999", explanation: "Untrusted added facts." })] };
    for (const verdicts of [malformed, { ...OK, verdicts: ["supported"] }]) {
      const { d, writer } = deps({ understand: understanding, draft: goodDraft }, verdicts);
      d.claimAudit = true;
      expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_summary");
      expect(JSON.parse(writer.seen.at(-1)!.prompt)).not.toHaveProperty("claim_feedback");
    }
  });
  it("still enforces whole-answer checks even with five yes results per claim", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft }, { ...auditOk(), context_preserved: "no" });
    d.claimAudit = true;
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_summary");
  });
});
