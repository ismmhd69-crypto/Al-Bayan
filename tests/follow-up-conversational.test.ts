import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const ask = vi.hoisted(() => vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ status: "out_of_scope", language: "en" })));
vi.mock("@/lib/ask/pipeline", () => ({ ask }));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true, takeSlot: () => "ok", visitorKey: () => "fixture", withSlot: async (work: () => Promise<unknown>) => work() }));
import { POST } from "@/app/api/ask/stream/route";
import { verifyParentReference } from "@/lib/ask/parent-reference";
import { runPipeline, type PipelineDeps } from "@/lib/ask/core";
import { consumeRichStream, emptyRichState, reduceRichEvent, type RichAnswer, type RichCallbacks, type RichEvent, type RichStreamState } from "@/lib/ask/rich-answer";
import type { ProgressiveCheckpoint } from "@/lib/ask/progressive-checkpoint";
import { describePlannerOutput, followUpMode, socialMessage, type FollowUpContext } from "@/lib/ask/follow-up";
import { reloadCheckedPassages } from "@/lib/ask/explain-reload";
import { passageRecord } from "@/lib/ask/passage-record";
import type { Hadith } from "@/lib/sources/hadith-rules";
import { audit, dependencies, pack, scholarId } from "./fixtures/rich";
import { selectionReply } from "./fixtures/selection";

// Invented wording. These fixtures establish behaviour, not theology.
const hadithId = "SH11111111-1111-1111-1111-111111111111";
const hadithText = "حدثنا راو تجريبي في اختبار مستقل عن أي نص حقيقي لبيان سلوك النظام عند العرض";
const hadith = (arabic = hadithText): Hadith => ({ id: hadithId, collection: "bukhari", numbers: { bukhari: 1904, muslim: null }, gradeAr: "صحيح",
  attributionAr: "رواه البخاري", arabic, translations: { en: null, de: null }, url: "https://sunnah.com/bukhari:1904" });
const verse = pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
const quote = pack.passages[2].source.kind === "scholar" ? pack.passages[2].source.quote : undefined;

type Script = { followUp?: { relation: "related" | "none"; resolved_question: string; intent: string }; conditions?: string[]; storedHadith?: Hadith | null; failFirstSelection?: boolean; notFound?: boolean; conditionIgnored?: boolean };
const seen = { searches: 0, selections: 0, plannerCalls: 0, summaryRequests: [] as { system: string; prompt: Record<string, unknown> }[], reviewSystems: [] as string[] };
function wire(script: Script) {
  ask.mockImplementation(async (question: unknown, lang: unknown, _trace: unknown, history: unknown, options: unknown) => {
    const opts = (options ?? {}) as { rich?: RichCallbacks; signal?: AbortSignal; followUpContext?: FollowUpContext; checkpoint?: ProgressiveCheckpoint };
    const base: PipelineDeps = dependencies();
    base.simpleResearch = true;
    base.search = async () => { seen.searches++; return ["2:183"]; };
    base.getVerse = async key => key === "2:183" ? verse : undefined;
    base.neighbours = async () => [];
    base.searchHadith = async () => [hadith()];
    base.searchScholars = async () => [quote!];
    base.getStoredHadith = async uuid => uuid === hadithId.slice(2) ? script.storedHadith === undefined ? hadith() : script.storedHadith : null;
    base.getStoredScholar = async id => id === scholarId ? quote! : null;
    base.revalidateStable = async () => ({ unavailable: false, rejectedIds: [] });
    base.sourceAvailability = { hadith: true, scholar: true };
    base.libraryFlow = true; base.recordCheckedPassages = true; base.tiered = { videoBudgetMs: 0, maxVideos: 0 };
    base.previousUserMessages = Array.isArray(history) ? history as string[] : [];
    if (opts.followUpContext) base.followUpContext = opts.followUpContext;
    if (opts.checkpoint) { base.progressiveCheckpoint = opts.checkpoint; base.meaningApprovals = opts.checkpoint.meaningApprovals; }
    if (opts.signal) base.abortSignal = opts.signal;
    base.rich = opts.rich;
    base.writer = { id: "fake/writer", generateJson: async req => {
      const input = JSON.parse(req.prompt);
      if ("visitor_text" in input) {
        seen.plannerCalls++;
        const followUp = "parent_unavailable" in input;
        return { language: "en", kind: "question", question_type: "general", subjects: ["care"],
          requested_points: [{ text: "Explain care", facet: "general", scope: "general", essential_conditions: followUp ? script.conditions ?? [] : [],
            ...(followUp ? { essential_condition_quotes: script.conditions ?? [] } : {}),
            search_queries: { en: ["care responsibility"], ar: ["عناية يومية"], de: [] }, quran_ar: ["عناية يومية"], hadith_ar: ["عناية يومية"] }],
          search_queries_en: ["care responsibility"], search_queries_ar: ["عناية يومية"], search_queries_de: [],
          search_queries_quran_ar: ["عناية يومية"], search_queries_hadith_ar: ["عناية يومية"], qualifiers: [], interpretations: [],
          clarification_needed: false, checklist_status: "complete", backup_queries: [],
          ...(followUp ? { follow_up: script.followUp ?? { relation: "related", resolved_question: "Explain care in simpler words", intent: "re_explain" } } : {}) };
      }
      seen.summaryRequests.push({ system: req.system, prompt: input });
      // The originals speak about the topic, not about the visitor's new condition.
      if (script.notFound && input.conversation?.mode === "look_further") return { status: "no_answer", next_step: [], summary: [],
        no_answer_feedback: [{ group: "summary", reason: "missing_evidence", missing_requirement_ids: ["R1"] }] };
      return { status: "answer", next_step: [], no_answer_feedback: [],
        summary: [{ text: "Put simply, these sources describe care as a thoughtful responsibility.", source_ids: ["Q2:183", scholarId], requirement_id: "R1" }] };
    } };
    base.verifier = { id: "fake/checker", generateJson: async req => {
      const input = JSON.parse(req.prompt);
      if (input.candidates) {
        seen.selections++;
        // An unreadable assessment of the chat's own sources: the reply must search, never guess.
        if (script.failFirstSelection && seen.searches === 0) return {};
        return selectionReply(input, { status: "ready", coverage: "complete", conflict_type: "none", missing_requirement_ids: [],
          assessments: input.candidates.map((p: { source: { id: string } }) => ({ source_id: p.source.id, relevance: "direct", supported_requirement_ids: ["R1"],
            context_safe: "yes", position: "", contribution: { role: "direct", scope: "general", conditions: [] }, scope_matches_question: "yes", related_requirement_ids: [], distinct_contribution: "yes" })) });
      }
      seen.reviewSystems.push(req.system);
      const reviewed = audit(req.prompt);
      // The checker names the sentence and the passage that speak about what the visitor added, or says none does.
      if (input.visitor_conditions) reviewed.condition_coverage = input.visitor_conditions.map((c: { requirement_id: string; condition: string }) => {
        const claim = input.claim_evidence.find((e: { claim_id: string }) => input.summary_claim_ids.includes(e.claim_id));
        return script.conditionIgnored ? { ...c, addressed: "no", claim_id: "", anchor_id: "" } : { ...c, addressed: "yes", claim_id: claim.claim_id, anchor_id: claim.excerpt_choices[0].anchor_id };
      });
      return reviewed;
    } };
    return runPipeline(question as string, lang as "en", base);
  });
}

async function send(body: Record<string, unknown>) {
  vi.stubEnv("ASK_RICH_ENABLED", "true"); vi.stubEnv("ASK_STREAM_ENABLED", "true"); vi.stubEnv("ASK_SIMPLE_PIPELINE", "true");
  vi.stubEnv("ASK_FOLLOW_UP_SECRET", "synthetic-conversation-secret");
  const response = await POST(new Request("https://bayan.test/api/ask/stream", { method: "POST",
    headers: { origin: "https://bayan.test", "content-type": "application/json" }, body: JSON.stringify({ lang: "en", stream_version: 3, ...body }) }));
  expect(response.status).toBe(200);
  // Thanks is answered before any research starts, as a plain JSON reply.
  if (response.headers.get("content-type")?.startsWith("application/json")) return { state: emptyRichState(), result: await response.json() as { status: string; answer?: RichAnswer; failureKind?: string } };
  const events: RichEvent[] = [];
  await consumeRichStream(response.body!, event => { events.push(event); });
  // The browser's own reducer and integrity checks, not a copy of them.
  let state: RichStreamState = emptyRichState();
  for (const event of events) state = reduceRichEvent(state, event);
  return { state, result: state.result as { status: string; answer?: RichAnswer; failureKind?: string } };
}
const sentences = (answer: RichAnswer) => answer.sections.find(s => s.group === "summary")!.claims.map(c => c.text);
async function firstAnswer() {
  const first = await send({ question: "Explain care" });
  expect(first.result.status).toBe("rich_answer");
  const answer = first.result.answer!;
  expect(answer.conversational).toBeUndefined(); expect(first.state.conversational).toBeUndefined();
  expect(answer.parentReference).toBeTruthy();
  Object.assign(seen, { searches: 0, selections: 0, plannerCalls: 0, summaryRequests: [], reviewSystems: [] });
  return { answer, parent: { ref: answer.parentReference!, sentences: sentences(answer) } };
}
const followUp = (parent: { ref: string; sentences: string[] }, question = "Explain that more simply.") =>
  send({ question, previous_user_messages: ["Explain care"], parent });

// Research sessions live in process memory with a 16-session cap. Each test starts after the
// previous test's sessions have expired, so the cap itself is never changed or bypassed.
let clock = Date.parse("2026-11-12T08:00:00Z");
beforeEach(() => { clock += 30 * 60_000; vi.useFakeTimers({ toFake: ["Date"], now: clock }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); ask.mockReset(); Object.assign(seen, { searches: 0, selections: 0, plannerCalls: 0, summaryRequests: [], reviewSystems: [] }); });

it("explains from the chat's own sources without searching, and the browser accepts the finished reply", async () => {
  wire({});
  const { answer: parentAnswer, parent } = await firstAnswer();
  const reply = await followUp(parent);
  expect(reply.result.status).toBe("rich_answer");
  expect(reply.state.conversational).toBe("explain");
  expect(reply.result.answer!.conversational).toBe("explain");
  expect(seen.searches).toBe(0);
  // Planner, one selection over the reloaded sources, one writer call. The reviewer is the fourth.
  expect(seen.plannerCalls).toBe(1); expect(seen.selections).toBe(1); expect(seen.summaryRequests).toHaveLength(1);
  const shown = (a: RichAnswer) => new Set(a.sections.flatMap(s => s.sources.map(x => x.id)));
  for (const id of shown(reply.result.answer!)) expect(shown(parentAnswer).has(id)).toBe(true);
  // Natural wording is asked for; earlier reply text is context only and never enters the evidence.
  const request = seen.summaryRequests[0];
  expect(request.system).toContain("follow-up inside an ongoing chat");
  expect(request.prompt.conversation).toEqual({ mode: "explain", visitor_message: "Explain that more simply.", earlier_reply: parent.sentences });
  expect(JSON.stringify(request.prompt.evidence_package)).not.toContain(parent.sentences[0]);
});

it("lets follow-ups chain: an explain reply issues a reference the next follow-up can use", async () => {
  wire({});
  const { parent } = await firstAnswer();
  const reply = await followUp(parent);
  const next = { ref: reply.result.answer!.parentReference!, sentences: sentences(reply.result.answer!) };
  vi.stubEnv("ASK_FOLLOW_UP_SECRET", "synthetic-conversation-secret");
  expect(verifyParentReference(next, "en").parentRecords?.length).toBeGreaterThan(0);
  const again = await send({ question: "Summarize that.", previous_user_messages: ["Explain care", "Explain that more simply."], parent: next });
  expect(again.result.status).toBe("rich_answer"); expect(again.result.answer!.conversational).toBe("explain"); expect(seen.searches).toBe(0);
});

it("searches when the visitor adds a condition, even if the planner wrongly says re_explain", async () => {
  wire({ conditions: ["traveling"] });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent, "Explain that for someone who is traveling.");
  expect(reply.result.status).toBe("rich_answer");
  expect(reply.result.answer!.conversational).toBe("look_further"); expect(reply.state.conversational).toBe("look_further");
  expect(seen.searches).toBeGreaterThan(0);
  expect(seen.summaryRequests[0].prompt.conversation).toMatchObject({ mode: "look_further" });
});

it("searches for new information and other views", async () => {
  wire({ followUp: { relation: "related", resolved_question: "What do other scholars say about care?", intent: "other_view" } });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent, "What do other scholars say?");
  expect(reply.result.answer!.conversational).toBe("look_further"); expect(seen.searches).toBeGreaterThan(0);
});

it.each([["changed", hadith(`${hadithText} تغيير`)], ["removed", null]] as const)("searches instead of explaining when a signed source was %s", async (_label, stored) => {
  wire({});
  const { parent } = await firstAnswer();
  wire({ storedHadith: stored });
  const reply = await followUp(parent);
  expect(reply.result.status).toBe("rich_answer");
  expect(reply.result.answer!.conversational).toBe("look_further"); expect(seen.searches).toBeGreaterThan(0);
});

it("falls back to one search when the chat's sources cannot be assessed, and the browser accepts the result", async () => {
  wire({ failFirstSelection: true });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent);
  expect(reply.result.status).toBe("rich_answer");
  expect(reply.result.answer!.conversational).toBe("look_further"); expect(reply.state.conversational).toBe("look_further");
  expect(seen.searches).toBeGreaterThan(0); expect(seen.plannerCalls).toBe(1);
});

it("treats a new question in the same chat as a full answer, not a conversational reply", async () => {
  wire({ followUp: { relation: "none", resolved_question: "", intent: "none" } });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent, "New question: what does care mean?");
  expect(reply.result.status).toBe("rich_answer");
  expect(reply.result.answer!.conversational).toBeUndefined(); expect(reply.state.conversational).toBeUndefined(); expect(seen.searches).toBeGreaterThan(0);
});

it("answers thanks inside a chat with a fixed reply and no model call", async () => {
  wire({});
  const reply = await send({ question: "Thank you!", previous_user_messages: ["Explain care"] });
  expect(reply.result.status).toBe("social"); expect(seen.plannerCalls).toBe(0); expect(seen.selections).toBe(0); expect(seen.searches).toBe(0);
  // A first message is never treated as small talk by this rule.
  const first = await send({ question: "Thank you!" });
  expect(first.result.status).not.toBe("social");
});

it("still rejects a finished conversational reply whose sections were altered", async () => {
  wire({});
  const { parent } = await firstAnswer();
  vi.stubEnv("ASK_RICH_ENABLED", "true"); vi.stubEnv("ASK_STREAM_ENABLED", "true"); vi.stubEnv("ASK_SIMPLE_PIPELINE", "true"); vi.stubEnv("ASK_FOLLOW_UP_SECRET", "synthetic-conversation-secret");
  const response = await POST(new Request("https://bayan.test/api/ask/stream", { method: "POST", headers: { origin: "https://bayan.test", "content-type": "application/json" },
    body: JSON.stringify({ lang: "en", stream_version: 3, question: "Explain that more simply.", previous_user_messages: ["Explain care"], parent }) }));
  const events: RichEvent[] = []; await consumeRichStream(response.body!, event => { events.push(event); });
  let state: RichStreamState = emptyRichState();
  for (const event of events.slice(0, -1)) state = reduceRichEvent(state, event);
  const terminal = structuredClone(events.at(-1)!) as RichEvent & { result: { answer: RichAnswer } };
  terminal.result.answer.sections[3].claims[0].text = "An altered sentence that was never sent.";
  expect(() => reduceRichEvent(state, terminal)).toThrow("invalid_stable_completion");
});

it.each([
  ["Thanks!", true], ["thank you so much", true], ["Okay, thanks", true], ["Jazak Allah khair", true], ["شكرًا لك", true], ["جزاك الله خيرا", true], ["بارك الله فيكم", true],
  ["Thanks, and what about travel?", false], ["What is zakat?", false], ["شكرا، وما حكم السفر؟", false], ["Is thanking Allah obligatory?", false], ["ما حكم الشكر؟", false],
])("recognises only a bare thanks as small talk: %s", (message, expected) => expect(socialMessage(message)).toBe(expected));

it("chooses explain only for rewording with signed sources and no new visitor condition", () => {
  const records = [passageRecord({ id: "Q2:183", kind: "quran", original: "نص", context: [] })!];
  const context = (parentRecords = records): FollowUpContext => ({ language: "en", message: "Explain that for travel", history: ["Explain care"], parentUnavailable: false, parentRecords });
  const output = (intent: string, relation = "related", conditions: { kept: boolean; source: string | null }[] = []) =>
    ({ followUp: { relation, intent, resolved_question: relation === "related" ? "Explain care" : "" }, conditions }) as unknown as ReturnType<typeof describePlannerOutput>;
  expect(followUpMode(output("re_explain"), context())).toBe("explain");
  expect(followUpMode(output("re_explain", "related", [{ kept: true, source: "history:1" }]), context())).toBe("explain");
  expect(followUpMode(output("re_explain", "related", [{ kept: true, source: "message" }]), context())).toBe("look_further");
  expect(followUpMode(output("re_explain"), context([]))).toBe("look_further");
  expect(followUpMode(output("new_information"), context())).toBe("look_further");
  expect(followUpMode(output("other_view"), context())).toBe("look_further");
  expect(followUpMode(output("none", "none"), context())).toBeNull();
  expect(followUpMode(output("none", "ambiguous"), context())).toBeNull();
});

it("reloads signed passages only when every one is present, unchanged and still eligible", async () => {
  const signal = new AbortController().signal;
  const records = [passageRecord({ id: "Q2:183", kind: "quran", original: verse!.arabic, context: [] })!, passageRecord({ id: hadithId, kind: "hadith", original: hadithText })!,
    passageRecord({ id: scholarId, kind: "scholar", original: quote!.arabic })!];
  const loaders = (over: Partial<Parameters<typeof reloadCheckedPassages>[1]> = {}) => ({ getVerse: async () => verse, neighbours: async () => [],
    getStoredHadith: async () => hadith(), getStoredScholar: async () => quote!, ...over });
  expect((await reloadCheckedPassages(records, loaders(), signal, ["R1"]))?.map(p => p.id)).toEqual(["Q2:183", hadithId, scholarId]);
  expect(await reloadCheckedPassages(records, loaders({ getStoredHadith: async () => hadith(`${hadithText} تغيير`) }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages(records, loaders({ getStoredScholar: async () => null }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages(records, loaders({ getStoredHadith: undefined }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages(records, loaders({ getVerse: async () => undefined }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages(records, loaders({ neighbours: async () => [{ ...verse!, key: "2:184", arabic: "سياق جديد" }] }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages(records, loaders({ getStoredHadith: async () => { throw new Error("offline"); } }), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages([], loaders(), signal, ["R1"])).toBeNull();
  expect(await reloadCheckedPassages([records[0], records[0]], loaders(), signal, ["R1"])).toBeNull();
});

it("says nothing rather than repeating the earlier answer when a search follow-up finds nothing on the new point", async () => {
  wire({ conditions: ["on purpose"], notFound: true });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent, "What about someone who does it on purpose?");
  expect(reply.result.status).toBe("incomplete"); expect(reply.result.failureKind).toBe("question_coverage");
  expect(reply.state.conversational).toBe("look_further");
  // No summary was published, and the writer was asked once: a clear "not found" is not retried.
  expect(reply.state.publication?.groups.summary.commitId).toBeUndefined(); expect(seen.summaryRequests).toHaveLength(1);
});

it("gives each mode its own writing and checking instructions", async () => {
  wire({});
  const { parent } = await firstAnswer();
  await followUp(parent);
  const explain = seen.summaryRequests[0].system;
  expect(explain).toContain("put another way"); expect(explain).not.toContain("asking something NEW");
  expect(seen.reviewSystems.at(-1)).not.toContain("asks something new");
  Object.assign(seen, { searches: 0, selections: 0, plannerCalls: 0, summaryRequests: [], reviewSystems: [] });
  wire({ conditions: ["on purpose"] });
  await send({ question: "What about someone who does it on purpose?", previous_user_messages: ["Explain care", "Explain that more simply."], parent });
  const further = seen.summaryRequests[0].system;
  expect(further).toContain("asking something NEW"); expect(further).toContain("must itself name that scholar"); expect(further).not.toContain("put another way");
  expect(seen.reviewSystems.at(-1)).toContain("asks something new");
});

it("tells the visitor no source covers the added condition when the checker cannot point to one, without a rewrite", async () => {
  wire({ conditions: ["on purpose"], conditionIgnored: true });
  const { parent } = await firstAnswer();
  const reply = await followUp(parent, "What about someone who does it on purpose?");
  expect(reply.result.status).toBe("incomplete"); expect(reply.result.failureKind).toBe("question_coverage");
  expect(reply.state.publication?.groups.summary.commitId).toBeUndefined();
  // One draft and one review: a missing source is not something a rewrite can fix.
  expect(seen.summaryRequests).toHaveLength(1); expect(seen.reviewSystems).toHaveLength(1);
  expect(seen.reviewSystems[0]).toContain("visitor_conditions lists what the visitor ADDED");
});

it("asks about added conditions only in a search follow-up, never for a first answer or a rewording", async () => {
  wire({});
  const { parent } = await firstAnswer();
  await followUp(parent);
  expect(seen.reviewSystems.every(system => !system.includes("visitor_conditions lists"))).toBe(true);
  expect(seen.reviewSystems.at(-1)).toContain("Simpler wording must not change a ruling");
});
