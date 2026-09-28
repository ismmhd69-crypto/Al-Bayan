// End-to-end tests of the answer pipeline with a fake AI and made-up verses (not Quran text).
// They prove the code refuses, whatever the AI returns.
import { describe, expect, it } from "vitest";
import { runPipeline, type PipelineDeps } from "@/lib/ask/core";
import type { AIProvider, JsonRequest } from "@/lib/ai/types";
import type { Verse } from "@/lib/sources/quran-meta";

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
];

const understanding = {
  language: "en",
  kind: "question",
  subjects: ["fasting"],
  keywords_en: ["fasting", "prescribed", "month"],
  keywords_de: [],
  keywords_ar: [],
};
const goodDraft = { status: "answer", claims: [{ text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"] }] };

// A fake AI that answers each step from a script and records what it was sent.
function fakeAI(id: string, script: Record<string, unknown>) {
  const seen: JsonRequest[] = [];
  const ai: AIProvider = {
    id,
    async generateJson(req) {
      seen.push(req);
      if (req.system.startsWith("You prepare a search")) return script.understand;
      if (req.system.startsWith("You write short explanations")) return script.draft;
      return script.verdicts;
    },
  };
  return { ai, seen };
}

const OK = { answers_topics: "yes", fair_picture: "yes" };

function deps(writerScript: Record<string, unknown>, verdicts: unknown = { verdicts: ["supported"], ...OK }) {
  const writer = fakeAI("fake/writer", writerScript);
  const verifier = fakeAI("fake/verifier", { verdicts });
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
    expect(r.answer.evidence[0].translation).toBe(verses[0].translations.en);
    expect(r.answer.attribution.text).toBe("Quran data provided by Quran Foundation");
  });

  it("never sends the raw question to the writing or screening step", async () => {
    const question = "What does the Quran say about fasting? SECRET-MARKER";
    const { d, writer, verifier } = deps({ understand: understanding, draft: goodDraft });
    await runPipeline(question, "en", d);
    const later = [...writer.seen.slice(1), ...verifier.seen];
    expect(later.length).toBeGreaterThan(0);
    for (const req of later) expect(req.prompt).not.toContain("SECRET-MARKER");
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
    const draft = { status: "answer", claims: [{ text: "Music is forbidden.", source_ids: ["Q2:183"] }] };
    const { d } = deps({ understand: understanding, draft }, { verdicts: ["not_supported"], ...OK });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
  });

  it("refuses real, supported claims that do not answer the question or give a misleading picture", async () => {
    for (const whole of [
      { answers_topics: "no", fair_picture: "yes" },
      { answers_topics: "yes", fair_picture: "no" },
      { answers_topics: "unsure", fair_picture: "yes" },
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
        { text: "Believers are required to fast during a certain month.", source_ids: ["Q2:183"] },
        { text: "Sick people must never fast.", source_ids: ["Q2:184"] },
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
    const draft = { status: "answer", claims: [{ text: "Something about the throne.", source_ids: ["Q2:255"] }] };
    const { d } = deps({ understand: understanding, draft });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
  });

  it("refuses when nothing relevant is found", async () => {
    const { d } = deps({ understand: { ...understanding, subjects: ["music"], keywords_en: ["music", "instruments"] }, draft: goodDraft });
    expect((await runPipeline("Is music allowed?", "en", d)).status).toBe("no_source");
  });

  it("redoes a draft once after a writing slip, and refuses if it slips again", async () => {
    const copied = { status: "answer", claims: [{ text: "Fasting is prescribed for you in the blessed month.", source_ids: ["Q2:183"] }] };
    const { d, writer } = deps({ understand: understanding, draft: copied });
    expect((await runPipeline("fasting?", "en", d)).status).toBe("no_source");
    expect(writer.seen.length).toBe(3); // understand + 2 drafts
  });

  it("uses a writer and a screener that are different models", async () => {
    const { d } = deps({ understand: understanding, draft: goodDraft });
    const r = await runPipeline("fasting?", "en", d);
    if (r.status !== "answer") throw new Error("expected an answer");
    expect(r.answer.model).not.toBe(r.answer.verifier);
  });
});
