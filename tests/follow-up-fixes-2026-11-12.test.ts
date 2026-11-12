import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const admit = vi.hoisted(() => vi.fn(async () => ({ status: "ok" as const })));
vi.mock("@/lib/ask/quota", () => ({ admitQuestion: admit }));
const ask = vi.hoisted(() => vi.fn(async (): Promise<unknown> => ({ status: "out_of_scope", language: "en" })));
vi.mock("@/lib/ask/pipeline", () => ({ ask }));
import { POST } from "@/app/api/ask/stream/route";
import { repeatsEarlierReply } from "@/lib/ask/follow-up";
import { previousUserMessages } from "@/lib/ask/conversation";
import { sourceKindMismatch, sourceCopyMatch } from "@/lib/ask/checks";

// Real sentences from Mo's live test, 2026-11-12. Invented wording elsewhere. Behaviour, not theology.
const earlier = [
  "Put simply, Ibn Baz explains that if you sincerely repent for a sin—meaning you feel regret, stop doing it, and truly intend not to repeat it—that sin is wiped away.",
  "Ibn Baz teaches that if you happen to fall into that same sin again later, you are not held responsible for the first one you already repented from, but you must repent again for this new instance.",
  "Ibn Baz emphasizes that you should keep turning back to Allah in repentance every single time you slip up, because He accepts sincere repentance no matter how often the cycle repeats.",
];
const earlierIds = new Set(["S23c4fc51", "Sbd7d2051", "Sab4c7a29"]);
const onPurpose = [
  { text: "The Quran describes the righteous as those who do not knowingly persist in their sins, meaning they do not continue in wrongdoing while aware of its nature.", refs: ["Q3:135"] },
  { text: "Shaykh Abdul-Aziz ibn Baz explains that if a person sincerely repents—feeling regret, stopping the act, and resolving not to return—the sin is erased, even if they later fall into it again.", refs: ["S23c4fc51"] },
  { text: "Shaykh Abdul-Aziz ibn Baz clarifies that one is not held accountable for previously repented sins, but each new instance of sin requires its own sincere repentance.", refs: ["Sab4c7a29"] },
];

it("drops only the restatements when a search follow-up found something new", () => {
  expect(onPurpose.map(c => repeatsEarlierReply(c.text, c.refs, earlier, earlierIds, true))).toEqual([false, true, true]);
});

it("drops nothing when every sentence cites earlier sources, since those may answer the new point", () => {
  // Fajr and Maghrib, 2026-11-12: an earlier scholar source answered the new question.
  const fajr = "Shaykh Muhammad ibn Salih al-Uthaymeen further notes that one adds the phrase yuhyi wa yumit to this specific remembrance during these two prayers.";
  expect(repeatsEarlierReply(fajr, ["Sc4c481f6"], ["One should recite the remembrance after the prayer, as Ibn Uthaymeen notes about this specific phrase."], new Set(["Sc4c481f6"]), false)).toBe(false);
});

it("never drops a sentence that adds a negation, condition or intent the earlier reply lacked", () => {
  const ids = new Set(["S1"]);
  const before = ["Ibn Baz explains that repeated sincere repentance is accepted for every repeated sin."];
  expect(repeatsEarlierReply("Ibn Baz explains that repeated sincere repentance is accepted for every repeated sin.", ["S1"], before, ids, true)).toBe(true);
  for (const changed of ["Ibn Baz explains that repeated sincere repentance is not accepted for every repeated sin.",
    "Ibn Baz explains that repeated sincere repentance is accepted for every repeated sin unless it is intentional.",
    "Ibn Baz explains that repeated sincere repentance is accepted only for every repeated sin."])
    expect(repeatsEarlierReply(changed, ["S1"], before, ids, true)).toBe(false);
  // A sentence citing any new source is always kept.
  expect(repeatsEarlierReply(before[0], ["S1", "S2"], before, ids, true)).toBe(false);
});

it("handles Arabic restatements and Arabic conditions", () => {
  const ids = new Set(["S1"]), before = ["يبين الشيخ عبد العزيز بن باز أن التوبة الصادقة تمحو ما قبلها من الذنوب حتى لو عاد العبد إليها."];
  expect(repeatsEarlierReply("ويوضح الشيخ عبد العزيز بن باز أن التوبة الصادقة تمحو الذنوب السابقة حتى لو عاد العبد إليها.", ["S1"], before, ids, true)).toBe(true);
  expect(repeatsEarlierReply("ويوضح الشيخ عبد العزيز بن باز أن التوبة الصادقة لا تمحو الذنوب السابقة إذا عاد العبد إليها عمدا.", ["S1"], before, ids, true)).toBe(false);
});

it("keeps thanks out of the earlier messages the planner reads", () => {
  expect(previousUserMessages([{ role: "user", text: "What is zakat?" }, { role: "bayan" }, { role: "user", text: "Thank you!" }, { role: "user", text: "جزاك الله خيرا" }]))
    .toEqual(["What is zakat?"]);
});

it("allows a named scholar's report of a prophetic teaching only when that scholar's cited text mentions the Prophet", () => {
  const text = "Ibn Baz explains that the Prophet taught people to repent after every sin.";
  const scholar = { id: "S11111111-1111-1111-1111-111111111111", arabic: "هكذا جاءت السنة عن النبي صلى الله عليه وسلم" };
  expect(sourceKindMismatch(text, [scholar.id], [scholar])).toBe(false);
  expect(sourceKindMismatch(text, [scholar.id], [{ ...scholar, arabic: "التوبة واجبة من كل ذنب" }])).toBe(true);
  expect(sourceKindMismatch(text, [scholar.id])).toBe(true);
  // In Bayan's own voice it still needs a hadith.
  expect(sourceKindMismatch("The Prophet taught people to repent after every sin.", [scholar.id], [scholar])).toBe(true);
});

it("names the shared wording in a near-copy finding, so a rewrite knows what to change", () => {
  const source = { id: "S11111111-1111-1111-1111-111111111111", kind: "scholar" as const, arabic: "إذا تاب العبد توبة صادقة من الذنب ثم عاد إليه فإنه لا يؤاخذ بالذنب الأول لأنه تاب منه توبة صادقة" };
  const match = sourceCopyMatch("إذا تاب العبد توبة صادقة من الذنب ثم عاد إليه فإنه لا يؤاخذ بالذنب الأول عند الشيخ", [source as never]);
  expect(match?.normalizedMatch).toBeTruthy();
});

const post = (body: Record<string, unknown>) => POST(new Request("https://bayan.test/api/ask/stream", { method: "POST",
  headers: { origin: "https://bayan.test", "content-type": "application/json" }, body: JSON.stringify({ lang: "en", ...body }) }));

it("answers thanks inside a chat before any limit is counted", async () => {
  vi.stubEnv("ASK_ENABLED", "true"); vi.stubEnv("ASK_RICH_ENABLED", "true"); admit.mockClear(); ask.mockClear();
  const response = await post({ question: "Thank you!", previous_user_messages: ["What is zakat?"] });
  expect(await response.json()).toEqual({ status: "social" }); expect(admit).not.toHaveBeenCalled(); expect(ask).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

it("returns the limit message without starting research, and sets the browser identity cookie", async () => {
  vi.stubEnv("ASK_ENABLED", "true"); vi.stubEnv("ASK_RICH_ENABLED", "true"); ask.mockClear();
  admit.mockResolvedValueOnce({ status: "quota_daily", scope: "browser", limit: 25, retry_on: "2026-11-13" } as never);
  const response = await post({ question: "What is zakat?" });
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual({ status: "quota_daily", scope: "browser", limit: 25, retry_on: "2026-11-13" });
  expect(response.headers.get("set-cookie")).toContain("bayan_ask_session_v1=");
  expect(ask).not.toHaveBeenCalled();
  admit.mockResolvedValueOnce({ status: "quota_unavailable" } as never);
  expect((await post({ question: "What is zakat?" })).status).toBe(503);
  vi.unstubAllEnvs();
});

// Second round, after Codex's review of the live failures (2026-11-12).
import { nameSingleScholar, checkScholarAttributions } from "@/lib/ask/scholar-attribution-check";
import { visitorConditionPhrase, followUpMode, type describePlannerOutput } from "@/lib/ask/follow-up";
import { normalizeRichReview } from "@/lib/ask/rich-review-request";
import { reviewAnchors } from "@/lib/ask/review-excerpts";
import { passageRecord } from "@/lib/ask/passage-record";

const baz = [{ id: "S1aaaaaaa-0000-0000-0000-000000000000", scholarId: "ibn-baz", name: "Abdul-Aziz ibn Baz" }, { id: "S2aaaaaaa-0000-0000-0000-000000000000", scholarId: "ibn-baz", name: "Abdul-Aziz ibn Baz" },
  { id: "S3aaaaaaa-0000-0000-0000-000000000000", scholarId: "ibn-uthaymeen", name: "Muhammad ibn Salih al-Uthaymeen" }];
it("names the one cited scholar when a summary sentence leaves him out, and only then", () => {
  const live = "Should the individual fall into the same sin again, they are not held accountable for the prior act.";
  const named = nameSingleScholar(live, [baz[0].id, baz[1].id], baz, "en");
  expect(named).toBe("According to Ibn Baz, should the individual fall into the same sin again, they are not held accountable for the prior act.");
  expect(checkScholarAttributions([{ text: named, refs: [baz[0].id] }], baz, "en").blocked).toEqual([]);
  // Already named, two scholars, another authority named, a hadith cited, or German: unchanged.
  for (const [text, refs, language] of [
    ["Ibn Baz explains that repentance erases the sin.", [baz[0].id], "en"],
    [live, [baz[0].id, baz[2].id], "en"],
    ["The Prophet taught that repentance erases the sin.", [baz[0].id], "en"],
    ["Scholars explain that repentance erases the sin.", [baz[0].id], "en"],
    [live, [baz[0].id, "SH11111111-1111-1111-1111-111111111111"], "en"],
    [live, [baz[0].id], "de"],
  ] as const) expect(nameSingleScholar(text, [...refs], baz, language)).toBe(text);
  expect(nameSingleScholar("Allah accepts sincere repentance every time.", [baz[0].id], baz, "en")).toBe("According to Ibn Baz, Allah accepts sincere repentance every time.");
  const ar = nameSingleScholar("التوبة الصادقة تمحو ما قبلها من الذنوب.", [baz[0].id], baz, "ar");
  expect(ar).toBe("التوبة الصادقة تمحو ما قبلها من الذنوب، كما بيّن الشيخ ابن باز.");
  expect(checkScholarAttributions([{ text: ar, refs: [baz[0].id] }], baz, "ar").blocked).toEqual([]);
});

it("always searches when a follow-up adds an intent or condition word, and keeps the visitor's phrase", () => {
  expect(visitorConditionPhrase("What about someone who keeps repeating it on purpose?")).toBe("keeps repeating it on purpose");
  expect(visitorConditionPhrase("وماذا عمن يكرر الذنب عمدًا؟")).toBe("وماذا عمن يكرر الذنب عمدًا");
  for (const plain of ["Explain that more simply.", "Summarize that in two sentences.", "اشرح ذلك بكلمات أبسط", "لخّص ذلك في جملتين"]) expect(visitorConditionPhrase(plain)).toBeNull();
  const records = [passageRecord({ id: "Q2:183", kind: "quran", original: "نص", context: [] })!];
  const reExplain = { followUp: { relation: "related", intent: "re_explain", resolved_question: "x" }, conditions: [] } as unknown as ReturnType<typeof describePlannerOutput>;
  const ctx = (message: string) => ({ language: "ar" as const, message, history: ["ماذا يقول ابن باز عن التوبة؟"], parentUnavailable: false, parentRecords: records });
  expect(followUpMode(reExplain, ctx("اشرح ذلك بكلمات أبسط"))).toBe("explain");
  expect(followUpMode(reExplain, ctx("وماذا عمن يكرر الذنب عمدًا؟"))).toBe("look_further");
});

it("resolves a consequence proof from a code-supplied excerpt, and refuses an unknown or borrowed one", () => {
  const original = "فالتوبة الأولى صحيحة إذا كانت صادقة تشتمل على شروطها المعلومة وهي الندم على الماضي والإقلاع من الذنب";
  const items = [{ text: "Ibn Baz explains that the repentance is valid.", refs: [baz[0].id] }, { text: "Ibn Baz explains that repentance is accepted.", refs: [baz[1].id] }];
  const serialized = { passages: [{ id: baz[0].id, arabic: original }, { id: baz[1].id, arabic: "نص آخر مختلف تماما عن الأول في هذا الاختبار" }] };
  const anchors = reviewAnchors(items, serialized);
  const raw = (anchor_id: string) => ({ consequence_checks: [{ claim_id: "C1", claim_effect: "validity", original_effect: "validity", same_consequence: "yes", anchor_id }] });
  const ok = normalizeRichReview(raw(anchors.C1[0].anchor_id), items, serialized) as { consequence_checks: { source_id: string; original_excerpt: string }[] };
  expect(ok.consequence_checks[0]).toMatchObject({ source_id: baz[0].id, original_excerpt: original });
  expect(normalizeRichReview(raw("C1E9"), items, serialized)).toBeNull();
  // An excerpt belonging to another sentence's source cannot prove this one.
  expect(normalizeRichReview(raw(anchors.C2[0].anchor_id), items, serialized)).toBeNull();
});

import { conditionCoverageOk, withConditionCoverage } from "@/lib/ask/condition-coverage";
it("accepts an added condition only with a summary sentence and an excerpt from that sentence's own sources", () => {
  const items = [{ text: "Ibn Baz explains the general rule.", refs: [baz[0].id] }, { text: "Ibn Baz explains what applies when it is done on purpose.", refs: [baz[1].id] }];
  const serialized = { passages: [{ id: baz[0].id, arabic: "نص أول عن القاعدة العامة في هذا الاختبار" }, { id: baz[1].id, arabic: "نص ثان يتحدث عن التعمد في هذا الاختبار" }] };
  const conditions = [{ requirement_id: "R1", condition: "on purpose" }];
  const anchors = reviewAnchors(items, serialized);
  const row = (over: object) => ({ condition_coverage: [{ requirement_id: "R1", condition: "on purpose", addressed: "yes", claim_id: "C2", anchor_id: anchors.C2[0].anchor_id, ...over }] });
  expect(conditionCoverageOk(row({}), conditions, items, serialized, 2)).toBe(true);
  for (const bad of [row({ addressed: "no", claim_id: "", anchor_id: "" }), row({ addressed: "unsure" }), row({ anchor_id: anchors.C1[0].anchor_id }), row({ claim_id: "C9" }), row({ anchor_id: "" }),
    row({ condition: "something else" }), { condition_coverage: [] }, {}, null])
    expect(conditionCoverageOk(bad, conditions, items, serialized, 2)).toBe(false);
  // Only the final summary's sentences count: with one summary sentence, C1 is an earlier section.
  expect(conditionCoverageOk(row({ claim_id: "C1", anchor_id: anchors.C1[0].anchor_id }), conditions, items, serialized, 1)).toBe(false);
  // Nothing is asked when the visitor added nothing.
  expect(conditionCoverageOk({}, [], items, serialized, 2)).toBe(true);
  const base = { system: "s", prompt: "{}", schema: { type: "object" as const, properties: {}, required: [] } };
  expect(withConditionCoverage(base, [], items, serialized, 2)).toBe(base);
  const asked = withConditionCoverage(base, conditions, items, serialized, 2);
  expect(asked.schema.type === "object" && asked.schema.required).toContain("condition_coverage");
  expect(JSON.parse(asked.prompt).visitor_conditions).toEqual(conditions);
});
