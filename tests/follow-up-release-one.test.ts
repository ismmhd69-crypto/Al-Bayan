import { createHash } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { runPipeline } from "@/lib/ask/core";
import { checkedPassages } from "@/lib/ask/checked-passages";
import { signParentReference, verifyParentReference } from "@/lib/ask/parent-reference";
import { premiseCheck, bareDependentReference, followUpPersonalGate } from "@/lib/ask/follow-up";
import { parentRequestBody, MAX_ASK_BODY_BYTES } from "@/lib/ask/conversation";
import { pack, dependencies } from "./fixtures/rich";
import type { JsonRequest } from "@/lib/ai/types";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { audit } from "./fixtures/rich";

const oldSecret = process.env.ASK_FOLLOW_UP_SECRET;
afterEach(() => { if (oldSecret === undefined) delete process.env.ASK_FOLLOW_UP_SECRET; else process.env.ASK_FOLLOW_UP_SECRET = oldSecret; });
it.each(["حيث إن", "وحيث إنه", "فحيث إنها", "إذ إن", "وإذ إنني", "فإذ إننا"])("recognizes additional Arabic connector forms: %s", connector => {
  expect(premiseCheck(`${connector} الأمر واجب`, []).introduced).toHaveLength(1);
  expect(premiseCheck(`${connector} الأمر واجب`, [`${connector} الأمر واجب`]).introduced).toEqual([]);
});
it.each(["Explain the second one in simpler words.", "اشرح الثاني بكلمات أبسط", "اشرح الثانية", "الأولى", "والثاني؟"])("recognizes the requested short dependent form: %s", text => expect(bareDependentReference(text)).toBe(true));
it.each(["What is the second pillar of Islam?", "ما هو الركن الثاني من أركان الإسلام؟"])("keeps the self-contained pillar question: %s", text => expect(bareDependentReference(text)).toBe(false));
it("retains the accepted rare false alarm for لان as a separate word", () => expect(premiseCheck("ما حكم من لان قلبه؟", []).introduced).toHaveLength(1));

it("verifies signed ordered sentences, language, expiry and rotation without trusting browser source IDs", () => {
  process.env.ASK_FOLLOW_UP_SECRET = "synthetic-test-secret-not-a-real-key";
  const records = checkedPassages(pack, new Map(), new Set()), sentences = ["First fixture sentence.", "Second fixture sentence."];
  const ref = signParentReference(sentences, records, "en", 1000)!;
  expect(verifyParentReference({ ref, sentences }, "en", 1001).parent?.displayed_sentences).toEqual(sentences);
  for (const bad of [{ ref: ref.slice(0, -1) + "!", sentences }, { ref, sentences: [...sentences].reverse() }, { ref, sentences: ["Forged text"] }])
    expect(verifyParentReference(bad, "en", 1001).parentUnavailable).toBe(true);
  expect(verifyParentReference({ ref, sentences }, "ar", 1001).parentUnavailable).toBe(true);
  expect(verifyParentReference({ ref, sentences }, "en", 1000 + 86_400_000).parentUnavailable).toBe(true);
  const [payload, signature] = ref.split("."), decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  decoded.sources[0].id = "Q2:184";
  expect(verifyParentReference({ ref: `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${signature}`, sentences }, "en", 1001).parentUnavailable).toBe(true);
  process.env.ASK_FOLLOW_UP_SECRET = "rotated-synthetic-secret";
  expect(verifyParentReference({ ref, sentences }, "en", 1001).parentUnavailable).toBe(true);
  delete process.env.ASK_FOLLOW_UP_SECRET;
  expect(signParentReference(sentences, records, "en")).toBeUndefined();
});
it("sorts fetched Quran neighbours before hashing without changing the fetched order", () => {
  const source = structuredClone(pack), q = source.passages[0]; if (q.source.kind !== "quran") throw Error("fixture");
  const verse = q.source.verse;
  q.context = [{ ...verse, key: "2:184", arabic: "نص تجريبي ثان" }, { ...verse, key: "2:182", arabic: "نص تجريبي أول" }];
  const before = q.context.map(v => v.key), first = checkedPassages(source, new Map(), new Set());
  q.context.reverse(); expect(checkedPassages(source, new Map(), new Set())).toEqual(first);
  expect(before).toEqual(["2:184", "2:182"]);
});
it("fingerprints translations only after their check passed", () => {
  const id = pack.passages[2].id;
  const translation = { status: "ready" as const, text: "Synthetic checked translation", original: "fixture", originalHash: "0".repeat(64), origin: "ai" as const, language: "en" as const };
  const row = (approved: Set<string>, value = translation) => checkedPassages(pack, new Map([[id, value]]), approved).find(p => p.id === id)!;
  expect(row(new Set()).translation).toBeUndefined(); expect(row(new Set([id])).translation).toMatch(/^[a-f0-9]{64}$/);
  expect(checkedPassages(pack, new Map([[id, { status: "rejected" }]]), new Set([id])).find(p => p.id === id)?.translation).toBeUndefined();
});
it("fits the largest Arabic request by dropping the optional parent intact, never truncating it", () => {
  const body = { question: "س".repeat(500), previous_user_messages: Array(4).fill("س".repeat(500)), lang: "ar" };
  const parent = { ref: "x".repeat(8192), sentences: Array(8).fill("س".repeat(600)) };
  const encoded = parentRequestBody(body, parent);
  expect(new TextEncoder().encode(encoded).length).toBeLessThanOrEqual(MAX_ASK_BODY_BYTES);
  expect(JSON.parse(encoded).parent).toEqual({ ref: "", sentences: [] }); expect(parent.sentences[0]).toHaveLength(600);
});
it("preserves the first-question planner contract frozen before this port", async () => {
  const deps = dependencies(); deps.simpleResearch = true; deps.tiered = { videoBudgetMs: 0, maxVideos: 0 };
  let captured: JsonRequest | undefined;
  deps.writer.generateJson = async request => { captured = request; return { language: "en", kind: "greeting", question_type: "general", subjects: [], requested_points: [], backup_queries: [], qualifiers: [], search_queries_en: [], search_queries_ar: [], search_queries_de: [], interpretations: [], clarification_needed: false, checklist_status: "complete" }; };
  expect((await runPipeline("Hello", "en", deps)).status).toBe("out_of_scope");
  const request = captured!;
  expect(request.system).not.toContain("Return follow_up"); expect(JSON.parse(request.prompt)).toEqual({ visitor_text: "Hello" });
  expect(request.schema.type === "object" && request.schema.properties.follow_up).toBeUndefined();
  expect(createHash("sha256").update(JSON.stringify({ system: request.system, schema: request.schema, maxOutputTokens: request.maxOutputTokens })).digest("hex"))
    .toBe("008b1c6165ce67278c260da1ba4af0cbcaad5830707c35429c7f3eb6975448e2");
});
it.each([true, false])("issues a reference only after final review, approved=%s", async approved => {
  process.env.ASK_FOLLOW_UP_SECRET = "synthetic-reference-test-key";
  const local = structuredClone(pack), deps = dependencies();
  local.passages = local.passages.filter(p => p.source.kind === "quran");
  deps.recordCheckedPassages = true;
  const write = deps.writer.generateJson;
  deps.writer.generateJson = async request => {
    const value = await write(request) as { summary?: { text: string; source_ids: string[]; requirement_id: string }[] };
    if (value.summary) value.summary = [{ text: "The Quran connects care with a thoughtful daily responsibility.", source_ids: ["Q2:183"], requirement_id: "R1" }];
    return value;
  };
  let fullReview = false;
  deps.verifier.generateJson = async request => {
    const reply = audit(request.prompt), input = JSON.parse(request.prompt);
    if (input.full_answer) { fullReview = true; if (!approved) reply.complete_coverage = "no"; }
    return reply;
  };
  const result = await runRichAnswer(local, "en", deps, new AbortController().signal, "Explain care", {});
  expect(fullReview).toBe(true);
  if (approved) {
    expect(result.status).toBe("rich_answer"); if (result.status !== "rich_answer") return;
    const sentences = result.answer.sections.find(s => s.group === "summary")!.claims.map(c => c.text);
    expect(verifyParentReference({ ref: result.answer.parentReference, sentences }, "en").parent).toBeDefined();
    expect(result.answer.checkedHashes?.["Q2:183"]?.original).toMatch(/^[a-f0-9]{64}$/);
  } else { expect(result.status).toBe("incomplete"); expect(result).not.toHaveProperty("answer"); }
});
it.each([
  "Does that apply to my journey tomorrow?",
  "هل ينطبق ذلك على رحلتي غدا؟",
  "I need a ruling for my own journey tomorrow.",
  "سأسافر غدا وأريد حكما لحالتي.",
  "My father died, what should I do?",
  "والدي مريض",
  "زوجي لا يصلي",
  "أمي مريضة",
])("matches own-situation wording for scholar referral: %s", text => expect(followUpPersonalGate(text)).toBe(true));
it.each([
  "What should I say after prayer?",
  "Am I allowed to listen to music?",
  "What should I do if I miss Fajr?",
  "هل يجوز لي الصلاة في الجوارب؟",
  "هل يجوز لي جمع الصلاة في السفر؟",
  "How do I pray Witr?",
  "كيف أصلي الوتر؟",
  "What is zakat?",
  "My question is about zakat.",
  "ما رأي أبي حنيفة في صلاة الوتر؟",
  "ما حديث أبي هريرة في الصيام؟",
  "ماذا روى علي بن أبي طالب؟",
  "حديث في سنن أبي داود عن الصلاة",
  "ماذا قال ابن أبي شيبة؟",
  "ما فضل أبي بكر الصديق؟",
  "ما قصة ابني آدم؟",
])("does not match general first-person or topic questions: %s", text => expect(followUpPersonalGate(text)).toBe(false));
it("does not return ask_scholar for a related follow-up after 'ما رأي أبي حنيفة في صلاة الوتر؟'", async () => {
  const deps = dependencies(); deps.simpleResearch = true; deps.rich = {};
  deps.previousUserMessages = ["ما رأي أبي حنيفة في صلاة الوتر؟"];
  deps.followUpContext = { message: "اشرح ذلك", history: deps.previousUserMessages, language: "ar", parentUnavailable: false };
  deps.sourceAvailability = { hadith: false, scholar: false };
  deps.search = async () => [];
  deps.writer.generateJson = async () => ({
    language: "ar", kind: "question", question_type: "ruling", subjects: ["witr", "prayer"],
    requested_points: [{ text: "Explain Witr prayer ruling", facet: "ruling", scope: "general", essential_conditions: [], essential_condition_quotes: [], search_queries: { en: ["witr prayer"], ar: ["حكم صلاة الوتر"], de: [] }, quran_ar: [], hadith_ar: [] }],
    search_queries_en: ["witr prayer"], search_queries_ar: ["حكم صلاة الوتر"], search_queries_de: [], qualifiers: [], interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [],
    follow_up: { relation: "related", resolved_question: "ما القول في حكم صلاة الوتر؟", intent: "re_explain" },
  });
  const result = await runPipeline("اشرح ذلك", "ar", deps);
  expect(result.status).not.toBe("ask_scholar");
});
it("does not return ask_scholar for a related follow-up after 'What should I say after prayer?'", async () => {
  const deps = dependencies(); deps.simpleResearch = true; deps.rich = {};
  deps.previousUserMessages = ["What should I say after prayer?"];
  deps.followUpContext = { message: "Explain that more simply.", history: deps.previousUserMessages, language: "en", parentUnavailable: false };
  deps.sourceAvailability = { hadith: false, scholar: false };
  deps.search = async () => [];
  deps.writer.generateJson = async () => ({
    language: "en", kind: "question", question_type: "practice", subjects: ["prayer", "dhikr"],
    requested_points: [{ text: "Explain recommended remembrance after prayer", facet: "steps", scope: "general", essential_conditions: [], essential_condition_quotes: [], search_queries: { en: ["remembrance after prayer"], ar: ["الأذكار بعد الصلاة"], de: [] }, quran_ar: [], hadith_ar: [] }],
    search_queries_en: ["remembrance after prayer"], search_queries_ar: ["الأذكار بعد الصلاة"], search_queries_de: [], qualifiers: [], interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [],
    follow_up: { relation: "related", resolved_question: "What are the recommended adhkar after prayer in simpler words?", intent: "re_explain" },
  });
  const result = await runPipeline("Explain that more simply.", "en", deps);
  expect(result.status).not.toBe("ask_scholar");
});
it("returns ask_scholar when history has 'I need a ruling for my own journey tomorrow.' even if planner kind is question", async () => {
  const deps = dependencies(); deps.simpleResearch = true; deps.rich = {};
  deps.previousUserMessages = ["I need a ruling for my own journey tomorrow."];
  deps.followUpContext = { message: "Explain that more simply.", history: deps.previousUserMessages, language: "en", parentUnavailable: false };
  deps.writer.generateJson = async () => ({
    language: "en", kind: "question", question_type: "ruling", subjects: ["travel", "prayer"],
    requested_points: [{ text: "Explain travel prayer concessions", facet: "ruling", scope: "general", essential_conditions: [], essential_condition_quotes: [], search_queries: { en: ["combining prayers travel"], ar: ["جمع الصلاة في السفر"], de: [] }, quran_ar: [], hadith_ar: [] }],
    search_queries_en: ["combining prayers travel"], search_queries_ar: ["جمع الصلاة في السفر"], search_queries_de: [], qualifiers: [], interpretations: [], clarification_needed: false, checklist_status: "complete", backup_queries: [],
    follow_up: { relation: "related", resolved_question: "What is the general teaching on combining prayers during travel?", intent: "re_explain" },
  });
  const result = await runPipeline("Explain that more simply.", "en", deps);
  expect(result.status).toBe("ask_scholar");
});

