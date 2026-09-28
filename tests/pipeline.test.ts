// End-to-end tests of the answer pipeline with a fake AI and made-up verses (not Quran text).
// They prove the code refuses, whatever the AI returns.
import { describe, expect, it } from "vitest";
import { hadithAllowed, runPipeline, type PipelineDeps } from "@/lib/ask/core";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";
import type { Verse } from "@/lib/sources/quran-meta";
import type { Hadith } from "@/lib/sources/hadith-rules";
import type { ScholarQuote } from "@/lib/sources/scholar-rules";

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
  required_facets: ["general"],
  qualifiers: [],
  search_queries_en: ["fasting", "fasting prescribed", "fasting month"],
  search_queries_de: [],
  search_queries_ar: [],
};
const goodDraft = {
  status: "answer",
  claims: [{ text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], facet_ids: ["general"] }],
};

// A fake AI that answers each step from a script and records what it was sent.
function fakeAI(id: string, script: Record<string, unknown>) {
  const seen: JsonRequest[] = [];
  let draftCalls = 0;
  let screeningCalls = 0;
  const ai: AIProvider = {
    id,
    async generateJson(req) {
      seen.push(req);
      if (req.system.startsWith("You prepare a search")) return script.understand;
      if (req.system.startsWith("You create a safe search plan")) return script.understand;
      if (req.system.startsWith("You select evidence")) {
        if (script.selection !== undefined) return script.selection;
        const prompt = JSON.parse(req.prompt) as { candidates: { source: { id: string } }[] };
        return {
          status: "ready",
          coverage: "complete",
          conflict: "none",
          assessments: prompt.candidates.map((candidate, index) => ({
            source_id: candidate.source.id,
            relevance: index === 0 ? "direct" : "context",
            supported_facets: index === 0 ? ["general"] : [],
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
      const screenings = script.screenings;
      if (Array.isArray(screenings)) return screenings[Math.min(screeningCalls++, screenings.length - 1)];
      return script.verdicts;
    },
  };
  return { ai, seen };
}

const OK = { answers_question: "yes", covers_facets: "yes", fair_picture: "yes", context_preserved: "yes" };
const AUDIT_OK = { ...OK };
const AUDIT_FAIL = { answers_question: "no", covers_facets: "no", fair_picture: "no", context_preserved: "no" };
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
      required_facets: ["identity", "attributes"],
      search_queries_en: ["example subject", "example subject properties"],
    };
    const identityDraft = {
      status: "answer",
      claims: [
        {
          text: "This passage directly identifies the subject.",
          source_ids: ["Q2:255"],
          facet_ids: ["identity"],
        },
        {
          text: "This passage directly characterizes the subject.",
          source_ids: ["Q2:255"],
          facet_ids: ["attributes"],
        },
      ],
    };
    const selection = {
      status: "ready",
      coverage: "complete",
      conflict: "none",
      assessments: [
        { source_id: "Q2:7", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
        { source_id: "Q2:10", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
        { source_id: "Q2:19", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
        { source_id: "Q2:255", relevance: "direct", supported_facets: ["identity", "attributes"], context_safe: "yes" },
      ],
    };
    const { d, writer } = deps({ understand: identityFrame, draft: identityDraft }, { verdicts: ["supported", "supported"], ...OK }, selection);
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
        { source_id: "Q2:183", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
        { source_id: "Q2:184", relevance: "context", supported_facets: [], context_safe: "yes" },
      ],
    };
    const { d, writer } = deps({ understand: understanding, draft: goodDraft }, undefined, selection);
    expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
    expect(writer.seen).toHaveLength(1);
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
      claims: [{ text: "يفرض على المؤمنين صيام شهر محدد.", source_ids: ["Q2:183"], facet_ids: ["general"] }],
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

  it("refuses when the understanding step returns something unknown", async () => {
    const { d } = deps({ understand: { ...understanding, kind: "totally_safe" }, draft: goodDraft });
    expect((await runPipeline("fasting", "de", d)).status).toBe("no_source");
  });

  it("declines greetings, off-topic and attacks", async () => {
    for (const kind of ["greeting", "off_topic", "harmful"]) {
      const { d } = deps({ understand: { ...understanding, kind }, draft: goodDraft });
      expect((await runPipeline("hi", "en", d)).status).toBe("out_of_scope");
    }
  });

  it("refuses an unsupported claim that carries a real verse id", async () => {
    const draft = { status: "answer", claims: [{ text: "Music is forbidden.", source_ids: ["Q2:183"], facet_ids: ["general"] }] };
    const { d, writer, verifier } = deps({ understand: understanding, draft }, { verdicts: ["not_supported"], ...OK });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
    // writer: frame, first draft, one correction, then the source-only evidence audit (default: fails)
    expect(writer.seen).toHaveLength(4);
    expect(isAudit(writer.seen[3])).toBe(true);
    expect(verifier.seen).toHaveLength(3); // evidence selection + two final screens
  });

  it("allows one simpler correction after screening rejects the first wording", async () => {
    const first = { status: "answer", claims: [{ text: "Fasting always guarantees perfection.", source_ids: ["Q2:183"], facet_ids: ["general"] }] };
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
      expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
    }
  });

  it("refuses the whole answer if only one claim fails screening", async () => {
    const draft = {
      status: "answer",
      claims: [
        { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], facet_ids: ["general"] },
        { text: "Sick people must never fast.", source_ids: ["Q2:184"], facet_ids: ["general"] },
      ],
    };
    const { d } = deps({ understand: understanding, draft }, { verdicts: ["supported", "unsure"], ...OK });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
  });

  it("refuses when the screening answer is malformed or the wrong length", async () => {
    for (const v of [null, "supported", { verdicts: [] }, { verdicts: ["supported", "supported"] }]) {
      const { d } = deps({ understand: understanding, draft: goodDraft }, v);
      expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
    }
  });

  it("refuses a draft citing a verse it was not given", async () => {
    const draft = { status: "answer", claims: [{ text: "Something about the throne.", source_ids: ["Q2:255"], facet_ids: ["general"] }] };
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
      required_facets: ["identity", "attributes"],
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
    const copied = { status: "answer", claims: [{ text: "Fasting is prescribed for you in the blessed month.", source_ids: ["Q2:183"], facet_ids: ["general"] }] };
    const { d, writer } = deps({ understand: understanding, draft: copied });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
    // writer: frame, 2 drafts, then the evidence audit, which fails by default
    expect(writer.seen.length).toBe(4);
    expect(isAudit(writer.seen[3])).toBe(true);
  });

  describe("source-only fallback", () => {
    // Arabic frame whose drafts keep re-typing the verse (a wording failure, not an evidence failure).
    const arabicFrame = { ...understanding, language: "ar", search_queries_ar: ["الصيام شهر"] };
    const copiedArabic = {
      status: "answer",
      claims: [{ text: "كتب عليكم الصيام في الشهر المبارك", source_ids: ["Q2:183"], facet_ids: ["general"] }],
    };

    it("shows only the exact approved passages when wording keeps failing but the audit passes", async () => {
      const { d, writer } = deps({ understand: arabicFrame, draft: copiedArabic, audit: AUDIT_OK });
      const r = await runPipeline("ما حكم الصيام؟", "ar", d);
      expect(r.status).toBe("answer");
      if (r.status !== "answer") return;
      expect(r.answer.sourceOnly).toBe(true);
      expect(r.answer.claims).toEqual([]);
      // Evidence is the selected passage exactly as the source gave it; no translation for Arabic readers.
      expect(r.answer.evidence).toEqual([
        { kind: "quran", key: "2:183", arabic: verses[0].arabic, translation: null, translationName: null, url: verses[0].url },
      ]);
      // writer: frame, draft, correction, audit
      expect(writer.seen).toHaveLength(4);
      expect(isAudit(writer.seen[3])).toBe(true);
    });

    it("never shows AI-written text as Quran text in source-only mode", async () => {
      // A well-formed Arabic summary that screening rejects twice, so the fallback is reached.
      const aiSummary = "يفرض على المؤمنين صيام شهر محدد";
      const draft = { status: "answer", claims: [{ text: aiSummary, source_ids: ["Q2:183"], facet_ids: ["general"] }] };
      const { d } = deps({ understand: arabicFrame, draft, audit: AUDIT_OK }, { verdicts: ["not_supported"], ...OK });
      const r = await runPipeline("ما حكم الصيام؟", "ar", d);
      if (r.status !== "answer") throw new Error("expected a source-only answer");
      expect(r.answer.sourceOnly).toBe(true);
      // The AI summary appears nowhere; every displayed Arabic text is a source passage unchanged.
      expect(JSON.stringify(r.answer)).not.toContain(aiSummary);
      expect(r.answer.evidence.length).toBeGreaterThan(0);
      for (const e of r.answer.evidence) expect(verses.find((v) => v.key === e.key)!.arabic).toBe(e.arabic);
    });

    it("falls back after failed claim screening too, still only with a passing audit", async () => {
      const { d, verifier } = deps(
        { understand: understanding, draft: goodDraft, audit: AUDIT_OK },
        { verdicts: ["not_supported"], ...OK },
      );
      const r = await runPipeline("What does the Quran say about fasting?", "en", d);
      if (r.status !== "answer") throw new Error("expected a source-only answer");
      expect(r.answer.sourceOnly).toBe(true);
      expect(r.answer.claims).toEqual([]);
      expect(verifier.seen).toHaveLength(3); // selection + two screens; the audit runs on the writer model
    });

    it("keeps the raw question and rejected candidates out of the audit", async () => {
      const identityFrame = {
        ...understanding,
        question_type: "identity",
        subjects: ["example subject"],
        required_facets: ["identity", "attributes"],
        search_queries_en: ["example subject", "example subject properties"],
      };
      const selection = {
        status: "ready",
        coverage: "complete",
        conflict: "none",
        assessments: [
          { source_id: "Q2:7", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
          { source_id: "Q2:10", relevance: "unrelated", supported_facets: [], context_safe: "yes" },
          { source_id: "Q2:19", relevance: "mention_only", supported_facets: [], context_safe: "yes" },
          { source_id: "Q2:255", relevance: "direct", supported_facets: ["identity", "attributes"], context_safe: "yes" },
        ],
      };
      // Drafts copy six words of the approved translation, so wording fails twice.
      const copied = {
        status: "answer",
        claims: [
          { text: "The example subject has a direct description here.", source_ids: ["Q2:255"], facet_ids: ["identity"] },
          { text: "Several distinct properties are listed.", source_ids: ["Q2:255"], facet_ids: ["attributes"] },
        ],
      };
      const { d, writer } = deps({ understand: identityFrame, draft: copied, audit: AUDIT_OK }, undefined, selection);
      const r = await runPipeline("Who is the example subject? RAW-QUESTION-MARKER", "en", d);
      if (r.status !== "answer") throw new Error("expected a source-only answer");
      expect(r.answer.sourceOnly).toBe(true);
      expect(r.answer.evidence.map((e) => e.key)).toEqual(["2:255"]);
      const audit = writer.seen.find(isAudit)!;
      expect(audit.prompt).toContain("Q2:255");
      for (const hidden of ["RAW-QUESTION-MARKER", "Q2:7", "Q2:10", "Q2:19", "merely named", "only mentioned"]) {
        expect(audit.prompt).not.toContain(hidden);
      }
    });

    it("refuses when the audit says no or unsure, or is malformed or missing", async () => {
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
        expect((await runPipeline("ما حكم الصيام؟", "ar", d)).status).toBe("no_source");
      }
    });

    it("is never used when evidence selection itself is insufficient", async () => {
      const selection = {
        status: "insufficient",
        coverage: "incomplete",
        conflict: "none",
        assessments: [
          { source_id: "Q2:183", relevance: "partial", supported_facets: [], context_safe: "yes" },
          { source_id: "Q2:184", relevance: "context", supported_facets: [], context_safe: "yes" },
        ],
      };
      const { d, writer } = deps({ understand: arabicFrame, draft: copiedArabic, audit: AUDIT_OK }, undefined, selection);
      expect((await runPipeline("ما حكم الصيام؟", "ar", d)).status).toBe("no_source");
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("is never used when the writer says the evidence does not answer, or returns malformed output", async () => {
      for (const draft of [{ status: "no_answer", claims: [] }, null, { status: "answer", claims: "x" }]) {
        const { d, writer } = deps({ understand: understanding, draft, audit: AUDIT_OK });
        expect((await runPipeline("What does the Quran say about fasting?", "en", d)).status).toBe("no_source");
        expect(writer.seen.some(isAudit)).toBe(false);
      }
    });

    it("is never used when the writer cites a source outside the sealed package", async () => {
      const draft = { status: "answer", claims: [{ text: "Something about the throne.", source_ids: ["Q2:255"], facet_ids: ["general"] }] };
      const { d, writer } = deps({ understand: understanding, draft, audit: AUDIT_OK });
      expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
      expect(writer.seen.some(isAudit)).toBe(false);
    });

    it("keeps normal English and German answers as checked claims, not source-only", async () => {
      const germanFrame = { ...understanding, language: "de" };
      const germanDraft = {
        status: "answer",
        claims: [{ text: "Den Gläubigen ist das Fasten in einem bestimmten Monat vorgeschrieben.", source_ids: ["Q2:183"], facet_ids: ["general"] }],
      };
      for (const [frame, draft, lang] of [
        [understanding, goodDraft, "en"],
        [germanFrame, germanDraft, "de"],
      ] as const) {
        const { d, writer } = deps({ understand: frame, draft, audit: AUDIT_OK });
        const r = await runPipeline("fasting?", lang, d);
        if (r.status !== "answer") throw new Error(`expected a normal ${lang} answer`);
        expect(r.answer.sourceOnly).toBeUndefined();
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
    { source_id: "Q2:183", relevance: "direct", supported_facets: ["general"], context_safe: "yes" },
    { source_id: "Q2:184", relevance: "context", supported_facets: [], context_safe: "yes" },
    ...(hadithRelevance === "none"
      ? []
      : [{ source_id: "HE9001", relevance: hadithRelevance, supported_facets: hadithRelevance === "direct" ? ["general"] : [], context_safe: "yes" }]),
    { source_id: "HE9002", relevance: otherRelevance, supported_facets: [], context_safe: "yes" },
  ],
});
const verseAndHadithDraft = {
  status: "answer",
  claims: [
    { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], facet_ids: ["general"] },
    { text: "The Prophet taught that fasting protects the one who fasts.", source_ids: ["HE9001"], facet_ids: ["general"] },
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
        { text: "يفرض على المؤمنين صيام شهر محدد.", source_ids: ["Q2:183"], facet_ids: ["general"] },
        { text: "علم النبي أن الصوم يحمي صاحبه.", source_ids: ["HE9001"], facet_ids: ["general"] },
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

  it("shows a hadith in source-only mode when wording fails but the audit passes", async () => {
    // The drafts copy six words of the hadith translation, so wording fails twice.
    const copied = {
      status: "answer",
      claims: [{ text: "Fasting is a shield with a great reward for believers.", source_ids: ["HE9001"], facet_ids: ["general"] }],
    };
    const { d } = deps({ understand: understanding, draft: copied, audit: AUDIT_OK }, undefined, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("What does Islam teach about fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected a source-only answer");
    expect(r.answer.sourceOnly).toBe(true);
    expect(r.answer.claims).toEqual([]);
    expect(r.answer.evidence.map((e) => e.key)).toEqual(["2:183", "HE9001"]);
  });

  it("shows the English hadith translation, labelled, when no German one exists", async () => {
    const germanFrame = { ...understanding, language: "de" };
    const germanDraft = {
      status: "answer",
      claims: [
        { text: "Den Gläubigen ist das Fasten in einem bestimmten Monat vorgeschrieben.", source_ids: ["Q2:183"], facet_ids: ["general"] },
        { text: "Der Prophet lehrte, dass das Fasten den Fastenden schützt.", source_ids: ["HE9001"], facet_ids: ["general"] },
      ],
    };
    const { d } = deps({ understand: germanFrame, draft: germanDraft }, TWO_SUPPORTED, hadithSelection("direct"));
    d.searchHadith = async () => [hadithFast, hadithOther];
    const r = await runPipeline("Warum fasten Muslime?", "de", d);
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
    { source_id: "Q2:183", relevance: "direct", supported_facets: ["general"], context_safe: "yes" },
    { source_id: "Q2:184", relevance: "context", supported_facets: [], context_safe: "yes" },
    { source_id: quoteFast.id, relevance, supported_facets: relevance === "direct" ? ["general"] : [], context_safe: "yes" },
    { source_id: quoteOther.id, relevance: "unrelated", supported_facets: [], context_safe: "yes" },
  ],
});
const arabicQueries = { ...understanding, search_queries_ar: ["حكمة الصيام"] };

describe("scholar quotes", () => {
  it("cites a direct scholar quote, crediting the scholar, and shows his exact words with source and link", async () => {
    const draft = {
      status: "answer",
      claims: [
        { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"], facet_ids: ["general"] },
        { text: "Shaykh Ibn Baz explained that fasting builds mindfulness of God.", source_ids: [quoteFast.id], facet_ids: ["general"] },
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
