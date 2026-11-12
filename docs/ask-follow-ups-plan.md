# Ask follow-up questions: technical plan

Status: version 5.1, 2026-11-12. Phases 0 to 3 and phase 5 are built locally and uncommitted, with no deployment. Mo tested Release 1 on 2026-10-31 and rejected it as the finished feature: **a follow-up must feel like a conversation, not a repeated answer.** Conversational replies (Release 2) and saved-chat continuation were built on 2026-11-12 and pass their offline tests. **No real model has run them yet:** Mo's live tests (phase 4) decide whether they ship. Section 15 lists where the build differs from the text below. Earlier review outcomes are in section 14. Owner decisions are in section 12. Mockup: `mockups/ask-followups.html`.

## 1. Scope and invariants

**The goal, in Mo's words (2026-10-31):** "the follow-ups should be more about natural wording than restating the same stuff." A follow-up is a natural explanation from the AI, based on the context of the chat. It may use other sources when it needs them, but it does not repeat five to nine source cards on every reply.

**How each message is handled:**

| The visitor says | Mode | Bayan does |
|---|---|---|
| "Explain that more simply", "what do you mean?", "summarize it", "explain the second one" | **Explain** | Replies in natural words from the sources already in this chat. No search and no repeated cards, only small links back to them |
| "What about when traveling?", "what do other scholars say?" | **Look further** | Searches, then replies in natural words. Shows only sources not already in the chat |
| A new topic | **New question** | Full answer with all source cards, as today |
| "Thank you" | **Social** | A short fixed reply. No sources and no paid answer |

**Release 1, contextual search (built):** a follow-up is understood in context and rewritten into a clear question. It is the foundation for the modes above: signed parent reference, planner fields, personal gate, task context and hash storage. On its own it does not meet the goal, because it runs a full search and shows full cards every time.

**Release 2, conversational replies (required):** Explain and Look further, as described in section 8.

Saved-chat continuation is separate and comes last. New answers already record source hashes, so they stay verifiable later.

**What Mo's test showed (2026-10-31), "Explain that more simply":**

| Follow-up after | Time | Cost | Model calls | Cards shown |
|---|---|---|---|---|
| Ibn Baz on repeated sin | 38 s | 3.2 c | 7 | 4 (3 of them new) |
| "What should I say after prayer?" | 70 s | 6.0 c | 8 | 6 |

The prayer rewrite also lost "more simply" and became the original question again, so nothing was explained.

**Invariants:**

| # | Invariant | Proven by |
|---|---|---|
| I1 | Evidence comes only from originals reloaded on the server. Earlier AI text and browser text are never evidence | Deterministic tests |
| I2 | History may resolve references. It cannot change source rules, approve evidence, disable checks or supply religious facts | Deterministic tests for the plumbing, recorded model evaluation for behaviour |
| I3 | No summary, and no parent reference, is published or issued without passing the full final review | Publication-boundary tests |
| I4 | A personal-ruling request is referred to a scholar on every route, including details from earlier turns | Recorded model evaluation, plus the code gate on follow-ups |
| I5 | A wrong label can cost a search, a clarification, a refusal or a weak reply. It can never authorize an answer: an Explain reply still has to pass the full final review | Forced wrong-label tests |
| I6 | Differing approved scholars stay cited with equal weight. An Explain reply cannot hide a position | Deterministic tests, plus recorded model evaluation |
| I7 | A message's routes, fallbacks and retries share one allowance within a server instance. Across instances, see section 9 | Deterministic tests |
| I8 | Natural wording changes how something is said, never what is claimed. Every religious point in a conversational reply must trace to a source in the chat. The AI can simplify, but cannot add its own opinions, rulings, facts or religious examples | Deterministic tests for the plumbing, recorded model evaluation and Mo's review for behaviour |

A passed test set is evidence from that set, not proof of the invariant in general.

Sources stay Sunni only, with hadith graded sahih or hasan. The AI quotes approved scholars and issues no ruling of its own. Launch languages are Arabic and English.

## 2. Verified current behaviour

Checked in the code and database on 2026-10-30.

| Area | Behaviour | Where |
|---|---|---|
| History | Up to 4 user messages, 500 characters each. AI replies are not sent | `lib/ask/conversation.ts` |
| History use | Sent only to the planning call, and forms part of the research key | `lib/ask/core.ts:717`, `lib/ask/private-research.ts` |
| Personal check | With rich answers, only the planner's `kind === "personal"`. The regex `looksPersonal` is skipped | `lib/ask/core.ts:807` |
| Publication | The summary is emitted only after final review passes, and it's the last step | `lib/ask/rich-engine.ts:1203` |
| Summary over checked originals | `runRichAnswer(..., { checkedSections, committedSources: true })` compares each section's evidence with the pack, then writes and fully reviews a summary | `lib/ask/rich-engine.ts:179,203` |
| Review input | The reviewer gets the `question` string and the frame's requirements | `lib/ask/rich-engine.ts:560` |
| **Passage size** | **Stored scholar sources are single rows of at most 600 characters, and `arabic` is the whole `text_original`. Hadith are whole rows. Nothing is excerpted from them at search time** | `lib/sources/scholars.ts`, database |
| Freshness | Quran and hadith compare exact text; Quran also neighbouring verses | `lib/ask/pipeline.ts:157`, `search-engine/server-job-freshness.ts` |
| **Scholar freshness** | **Re-runs a search with the frame's phrases and looks for the same quote** | `progressiveScholarFreshness`, `lib/ask/pipeline.ts:76` |
| **Session memory** | **In-process only. Lost on restart, and not shared between server instances. Owner secret is random per process** | `lib/ask/continuation-session.ts`, `private-research.ts` |
| Durable jobs | A database-backed job system exists, but is off unless `ASK_DURABLE_ENABLED=true` | `lib/ask/settings.ts`, `search-engine/job-store.ts` |
| Saved chats | Store references without Quran and hadith text. Reopening loads current text, with no record of what was checked | `stripAnswer`, `lib/chat/hydrate.ts` |
| Limits | 9 AI calls and $0.50 per session. 50-second run limit on hosting. Per-visitor limit, and a default of 200 requests per day per process | `continuation-session.ts`, `lib/ask/limits.ts` |

## 3. Passage record

One definition, used by signing, reloading, selection, citations and saved chats.

```ts
type PassageRecord = {
  id: string;                 // "Q2:183", "SH<uuid>", "S<uuid>"
  kind: "quran" | "hadith" | "scholar";
  original: string;           // sha256 of the exact stored text (whole row, or the verse)
  translation?: string;       // sha256 of the translation that passed the translation check
  context?: string;           // Quran only: sha256 of the ordered neighbouring verses
};
```

- **The whole row is the passage,** so selection can't reach unchecked text inside the same record. Paragraph-level location isn't needed for stored sources.
- **Only stored sources are reusable.** Anything without a stored row, such as a live scholar excerpt, isn't a `PassageRecord` and means search.
- **Hash once:** `passageRecord()` in a new `lib/ask/passage-record.ts` is the only place hashes are computed.

## 4. Pipeline

```text
message + history + optional parent reference
  |
  v
verify parent reference and sentence hash, BEFORE building planner input
  |  valid --> parent context goes to the planner
  |  invalid or expired --> parent material dropped, parent_unavailable: true
  v
planner (existing call, new fields)
  |
  v
parse and validate field combinations (section 5)
  |
  v
route (section 6)
  |-- greeting/off-topic/harmful --> existing reply
  |-- personal, by either gate ---> scholar referral
  |-- unresolved reference -------> clarification
  |-- known refused topic --------> refusal (checked on message AND resolved question)
  |-- social ----------------------> short fixed reply
  |-- re_explain, valid parent, no new visitor condition --> EXPLAIN (section 8), at most one move to LOOK FURTHER
  |-- related ---------------------> LOOK FURTHER (section 8), search with resolved question
  '-- new question ----------------> SEARCH, full answer as today
  |
  v
full final review, with task context --> publish and issue reference, or no reply
```

## 5. Planner fields

Added to the existing planning call. No extra AI call, but extra tokens.

```ts
type FollowUp = {
  relation: "none" | "related" | "ambiguous";
  resolved_question: string;   // standalone, max 300 chars; "" when relation is none
  intent: "none" | "re_explain" | "new_information" | "other_view";
};
```

**Valid combinations, everything else is invalid:**

| relation | resolved_question | intent |
|---|---|---|
| `none` | empty | `none` |
| `related` | required | `re_explain`, `new_information` or `other_view` |
| `ambiguous` | empty | `none` |

**Invalid or missing data is not `none`.** The existing one-correction retry runs first. If it's still invalid:
- Invalid or missing `follow_up`, with no history and no parent: treat it as a first question.
- Invalid or missing `follow_up`, with history or a parent present: clarify, because lost context must not become a standalone question. An unavailable supplied parent still counts as context.
- A valid `none` with an invalid frame uses the existing frame-failure path, never clarification just because history exists. First-question behavior stays unchanged.
- A genuinely lost reference requests clarification. `ambiguous`, `clarification_needed: true`, `checklist_status: ambiguous` and empty `requested_points` is a valid clarification contract; all other frame checks remain.
- An introduced premise connector follows the specific correction/clarification rule below.

**Other rules:**
- Release 1 searches for every answerable plan, and intent is diagnostic only there. **From Release 2, intent chooses the route,** so it must be accurate and guarded (section 6). `other_view` and `new_information` always search.
- Unsure means Look further, never Explain.
- Keep the form of the request in `resolved_question`. "Explain that more simply" must stay a request to explain more simply, not become the original question again. The Explain writer and reviewer also receive `visitor_message` directly.
- `parent_unavailable: true` plus a message that depends on the parent means `ambiguous`. "Explain the second one" can't become an ordinary search just because the reference expired.
- Deterministic dependent-reference backstop: a valid `none` is invalid when history or a parent is present and the entire message is a bare reference. Use the one correction with that specific reason, then clarify if it persists. The narrow list covers English first/second/third/fourth/last (optionally "the", "one" and an explain/clarify/simplify request), bare that/this/it, and Arabic الأول/الاول/الأولى/الاولى/الثاني/الثانية/الثالث/الثالثة/الأخير/الاخير/ذلك/هذا (optionally اشرح/وضح/فسر and a leading و). Short endings "in simpler words", "more simply" and "بكلمات أبسط/ابسط" are allowed. Trailing sentence punctuation is ignored. Self-contained questions such as "What is the second pillar of Islam?", its Arabic equivalent, and either zakat new-topic question are not rejected. This does not catch all paraphrases, mixed substantive requests, other languages, longer references or a wrong personal kind on an otherwise related plan; it does not replace personalGate or model evaluation.
- Answerable plans must retain a main Arabic search query after parsing. Query phrases have a six-word limit. Missing parsed Arabic queries get the one correction with that specific reason. Invalid requirement text gets `questionFrameRejection`'s specific reason, including that requirement text must be plain English.

**Rewrites name topics, never state parent claims:**
- Preserve negation, conditions, uncertainty and personal details from the visitor's message and earlier user messages.
- Parent sentences only identify the topic or attribution the visitor refers to. A rewrite may ask about the cited scholar's view, but must never state a parent claim as true or use it as a premise. Do not require preservation of parent claims, conditions or exceptions inside the rewrite. The exact parent sentences reach the reviewer separately through `task_context`.
- Code detects whole-word premise connectors including `given that`, `since`, `because`, `بما أن`, `حيث أن`, `حيث إن`, `إذ إن`, `علما أن` and `لأن`, using Unicode letter/mark/number boundaries on both sides. Supported Arabic conjunction prefixes and attached pronouns are recognized; prefixed hamza-less لان is excluded to avoid matching فلان. Visitor text is checked with the same whole-word matching, rather than substring matching. Normal words such as بطلان, إعلان, فلان and الان are not connectors. Mo accepts the rare false alarm for standalone لان in "ما حكم من لان قلبه؟" because it leads only to clarification. If a connector appears in the rewrite but not in the visitor's own current or earlier user text, the rewrite is invalid. Use the existing one correction with the specific reason; if it persists, clarify. A connector the visitor wrote is not rejected. This lexical backstop is not proof that a rewrite has no unsupported claim.

**Visitor conditions, with exact quotes:**
- For related follow-ups, each `requested_points.essential_conditions` entry has a same-index string in `essential_condition_quotes`, quoting the current visitor message or an earlier user message exactly. An English condition can quote Arabic visitor text.
- Code checks nonempty exact substring membership in those user messages only. Parent sentences are never a quote source. Missing or nonmatching quotes cause that condition to be dropped; the topic can remain in requirement text. Quote existence does not itself prove the condition's interpretation is correct.
- First questions/new questions (`relation: none`) keep their existing condition handling. No source, review or spending check is weakened.

**FIRST phase 2 deliverable, before planner fields go live:** implement false-claim isolation tests covering a deliberately false religious claim in both `resolved_question` and `parent_sentences`. Prove neither reaches the evidence pack or cited originals, and that a sentence supported only by either field is rejected at final review. Task context must remain separate from evidence. If these tests cannot pass, stop and report; phase 2 cannot ship without them. The planner cannot establish whether a parent claim is false, so the false-parent planner result is not itself a planner blocker. This ordering does not authorize starting phase 2 now.

A lost "scholar" object in rewrites (including second-ar and parent-injection-en) and virtues search drift are diagnostics only. Measure them again in phase 4. **Wrong intent labels are no longer only a diagnostic,** because intent now chooses the route. Phase 1 showed the risk: the Arabic "what if the person is unable to perform Hajj?" was labelled `re_explain`. Section 6 guards against this.

**Production port:** the single guard implementation is `lib/ask/follow-up.ts`; offline tooling imports it. All tests call the production guards. First questions with no history/parent keep their existing planner request; a frozen pre-port request-contract test covers this. The retained non-rich AnswerV2 flow keeps its original contract. The current rich stream handles signed parent context. Existing personal/greeting/harmful handling runs before follow-up validation; related follow-ups also run the code-based personal gate over message, resolved question and user history.

**Planner input,** with parent material present only if verified:

```json
{
  "visitor_text": "...",
  "previous_user_messages": ["..."],
  "parent_unavailable": false,
  "parent_context": {
    "displayed_sentences": ["..."],
    "sources": [{ "id": "SH...", "label": "Muslim 1341a", "kind": "hadith" }]
  }
}
```

All of it is marked as untrusted, for resolving references only. It never enters the evidence pack.

## 6. Routing

In `lib/ask/core.ts`, after the existing `kind` handling and before retrieval.

```ts
function routeFollowUp(frame, parent, question, history): Route {
  const followUp = frame.followUp;
  if (followUp.relation === "related" && personalGate(question, followUp.resolved_question, history)) return { kind: "scholar" };
  if (followUp.relation === "ambiguous") return { kind: "clarify" };
  const resolved = followUp.resolved_question || question;
  if (asksKnownUnresolvedView(question, frame.questionType) || asksKnownUnresolvedView(resolved, frame.questionType)) return { kind: "refuse" };
  if (frame.kind === "social") return { kind: "social" };
  if (followUp.relation !== "related") return { kind: "search", question };
  if (parent && followUp.intent === "re_explain" && !hasConditionQuotedFromCurrentMessage(frame, question)) return { kind: "explain", parent, resolved };
  return { kind: "look_further", question: resolved };
}
```

**Guarding the Explain route.** A wrong `re_explain` could answer a changed question from old sources, so four separate checks stand behind it:
1. **In code:** a condition quoted from the current message means the visitor added something new, so the route is Look further. This catches the Arabic Hajj inability case above, whose condition quotes "غير قادر على الحج".
2. **Planner rule:** only rewording of what was already said is `re_explain`. Changed conditions, new facts and other views are not. Unsure means Look further.
3. **Writer exit:** the Explain writer returns `not_enough` if the sources in the chat can't answer, which moves the message to Look further.
4. **Reviewer:** the final review rejects a reply that doesn't address what the visitor asked (section 7).

The personal, clarification and refusal checks run first on every route, as above.

**`personalGate`** runs the narrow `followUpPersonalGate` (`lib/ask/follow-up.ts`) over the message, the resolved question and each earlier user message, for related follow-ups. It matches explicit own-situation wording in English and Arabic (such as "my journey", "my situation", "my case", "my father/mother/wife/husband/son/daughter", "for me personally", "رحلتي", "لحالتي", "حالتي", "وضعي", "زوجي", "زوجتي", "والدي", "أمي", and "ابني" except before "آدم") without matching plain first-person general questions, so earlier personal details aren't lost if the planner drops them while general first-person questions do not block later follow-ups. `أبي` is deliberately excluded because of common names like `أبي حنيفة`, so "my father" written that way relies on the planner's `kind` check. `looksPersonal` itself stays unchanged for non-rich flows.

**First questions:** they keep today's planner-only check. `looksPersonal` was deliberately skipped in rich mode, because it would refuse general questions phrased with "I". So I4 on first questions is measured by the recorded evaluation, not guaranteed by code.

## 7. Final review context

`richReviewRequest` gains a `task_context` block, separate from evidence:

```ts
task_context: {
  visitor_message: string;
  resolved_question: string;
  parent_sentences: string[];       // verified sentences only
  relevant_user_messages: string[];
}
```

The reviewer must check that the answer addresses what the visitor asked, given that context, before approving. If it doesn't, the rewrite failed, and the summary is rejected. Claims must still be supported only by cited originals.

## 8. Release 2: conversational replies

Runs in `lib/ask/simple-pipeline.ts`, in the same session. Kept behind one flag, `ASK_FOLLOW_UP_REUSE=true`, until Mo accepts it, then on by default.

**Example, from Mo's Ibn Baz answer:**

> **Visitor:** Explain that more simply.
> **Bayan:** Put simply, Ibn Baz is saying that sincere repentance wipes the sin away. Sincere means three things: you regret it, you stop, and you truly intend not to go back. [Ibn Baz]

**Writing style for both modes:** plain, natural sentences that answer the message directly. Short by default, and only as long as the question needs. No headings, no restating the earlier answer, and no long quotations. Sentences carrying a religious point link to their source. In the visitor's language.

### Explain mode

1. **Reload** each `PassageRecord` by ID, and recheck **current eligibility** as well as text:
   - Quran: `getVerse`, plus neighbours.
   - Hadith: `getLibraryHadith`, then `hadithAllowed`, which covers grade and collection.
   - Scholar: read the row, `scholarQuoteAllowed`, approved-scholar check, then `search_approved_source_candidates` filtered by `source_id` for current rights, as `findLibraryHadithByReference` does. Not a phrase search.
   - Any hash mismatch, or anything unavailable or ineligible: go to Look further.
2. **Write** from the reloaded originals only, using a new conversational writing prompt. Earlier reply sentences show what the visitor is referring to, and are never evidence. The writer can return `not_enough`, which moves the message to Look further once, in the same session. There is no separate selection call. The reply can still say the same thing as the parent, because rewording is its job, so the existing copy rules are checked against sources and not against the parent's sentences.
3. **Review** with the full final review and `task_context`. Rejected sentences are dropped and the rest rechecked, as summaries do today, with one rewrite at most.
4. **If nothing passes,** show a short honest fixed message saying it couldn't reword this safely and that the sources above still stand. It never publishes unchecked text.
5. **Publish** as a separate reply type (see below), with its own parent reference.

**Differences between scholars (I6):** the parent reference gains a signed `differing: boolean`, set when the answer's selection reported a scholar difference. When true, the reply must keep every view attributed to its scholar at equal weight, and "just tell me which is right" goes to the existing rules and never to a ranking.

### Look further mode

Runs the normal search with the resolved question and all the normal checks. Then:
- The reply uses the conversational writing style in place of the full summary.
- Sources already shown in this chat are not repeated as cards. They appear as small links. Only new sources get cards.
- If the search finds nothing new, the reply says so plainly. It does not pad the reply with repeats.
- The spending allowance is shared with any earlier Explain attempt (I7). If it runs out, the visitor gets an honest message.

### Reply type

Add a new type, for example `FollowUpReply`, with reply sentences and their source links, any new source cards, `parentReference` and `checkedHashes`. **Do not loosen `validRichAnswer` or the stream comparison in `lib/ask/rich-answer.ts` to fit it.** It gets its own validator and its own terminal status, and the integrity rule still applies: what is finally published must match what was sent. Lesson from 2026-10-31: adding data to sections after sending them made the browser throw away every finished answer. So every new reply path needs a test replaying a real finished stream through `reduceRichEvent`, in stable and progressive modes.

Each reply issues a new parent reference, so follow-ups can chain. It covers the reply's sentences and the sources in play, with the newest kept if the 8-source limit is reached. A reference to a source outside that set goes to Look further.

### Parent reference (built in Release 1)

Release 1 needs this too: it is what lets the verified earlier sentences reach the planner and final review. Release 1 signs and checks the sentences and records. Only Release 2 reloads and reuses the sources. Release 2 adds the signed `differing` flag described above.

```ts
type ParentRef = {
  v: 1; tid: string; lang: "ar" | "en"; exp: number;  // 24 hours
  sentences: string;                                  // sha256 of the canonical sentence list
  sources: PassageRecord[];
};
// wire: base64url(canonical JSON) + "." + HMAC-SHA256(ASK_FOLLOW_UP_SECRET) over the whole encoded payload
```

- **Sentence hash input:** `JSON.stringify(sentences)`, in display order, NFC normalized, so editing or reordering fails.
- **Issued only** with a `rich_answer` that passed final review.
- **Replay** is accepted: the sources are reloaded and reviewed again. A reference proves which answer was signed. It doesn't prove the answer is the latest one, so personal checks and spending never rely on it.
- **Secret rotation** invalidates old references, which then follow the `parent_unavailable` rule. If `ASK_FOLLOW_UP_SECRET` is missing, Bayan issues no references: follow-ups use user history only, with no parent sentences, and reuse is off.
- Release 1 issues a reference only when all shown source IDs have stored passage records and the bounded reference fits its source/sentence limits. Otherwise the client marks the parent unavailable; it never submits unsigned earlier AI text as valid parent context. Oversize optional parent payloads are replaced with an unavailable-parent marker, never truncated.
- **Holds hashes only,** with no visitor text, so no retention rules are needed beyond expiry.
- **Removed from version 3:** `frame` (no consumer), `cid`, and the planner's `parent_source_ids` (not needed).

## 9. Spending and duplicates

**Known limit:** sessions live in one server instance, so a reconnect reaching another instance can start a second paid run for the same message. That risk exists today. This plan doesn't make it worse, but it doesn't remove it either, so the plan doesn't claim a per-message limit across instances.

**For Release 1:**
- Measure it in phase 0, with two local server processes.
- Use a Google Cloud **spend cap** on a dedicated Bayan project as the shared ceiling. That's the protection that works across instances, at no build cost.
- Keep `ASK_DAILY_LIMIT` deliberately set.
- Only build shared enforcement if phase 0 shows duplicates are common. The existing durable job store is the first place to look.

## 10. Saved chats and citations

- **From Release 1,** each new answer carries `PassageRecord` hashes in a top-level `checkedHashes` map on the answer (leaving streamed `sections` untouched) and keeps them in `stripAnswer`, so answers stay verifiable later. Older answers keep working without them.
- **`hydrateRich`** compares hashes when present. If the text changed, it shows a fixed note on that source: "This source has been updated since this answer." It never presents the old answer as verified against new text.
- Scholar hydration reads the current row by source ID and its approved index terms by that same ID, then retains the existing RPC's current rights/publication gates. It does not search with the follow-up's phrases. New source hashes are carried by completed API answers and preserved when source text is stripped. Parent references are removed on saving and hydration; saved-chat continuation is not built.
- **Citations** open the exact supporting passage. Reused sources render as jump labels when the parent card is on screen, and otherwise as a card.
- **Continuing a reopened chat** is the last phase. With an expired reference, it follows the `parent_unavailable` rule.

## 11. Interface

Visitors never see internal labels.

- **Explain reply:** looks like a chat message, with natural text and small source links. No source cards, no group headings and no four-stage progress. Links jump to the card if it's on screen, and otherwise open the exact passage.
- **Look further reply:** natural text, plus cards only for new sources. Shows "Checking more sources…" while searching.
- **New question:** the full answer, unchanged.
- **Fixed notices** (clarification, referral, failure) carry no citations.
- The composer says "Ask a follow-up or a new question…".
- `mockups/ask-followups.html` is a rough visual reference. Where it differs, this section wins: it shows visible tags, which stay hidden (decision 1).

## 12. Decisions

| # | Question | Decision | Status |
|---|---|---|---|
| 1 | Show labels to visitors? | Hidden, plain messages only | Decided |
| 2 | How much history? | Parent exchange plus up to 4 user messages, with a size limit. Clarify if needed context was dropped | Recommended |
| 3 | Quote more from the same source? | Reuse only checked records | Recommended |
| 4 | Reused evidence not enough? | Search once if the meaning is clear; clarify if not | Recommended |
| 5 | Signed-out follow-ups? | Yes. Not saved | Recommended |
| 6 | Separate religious reviewer? | No (Mo, 2026-10-30). Answers rely on stored sources, attributed to their scholars. With no reviewed view decision, no view is put first | Decided |
| 7 | What is a follow-up? | A natural explanation from the AI based on the chat, using other sources only when needed, and not a repeated answer (Mo, 2026-10-31). Conversational replies are required before launch | Decided |
| 8 | Can the AI explain in its own words? | Yes for wording. No for content: every religious point must come from a source in the chat (I8). Mo accepted this limit on 2026-10-31 | Decided |

## 13. Build phases and gates

**Prerequisites:** Ask confirmed working on the live site, and the 16-session cap and `ASK_DAILY_LIMIT` reviewed.

Mo confirmed live Ask works and directed that the 16-session cap and `ASK_DAILY_LIMIT` stay unchanged for now, to be reviewed before the live push. Neither limit was changed. `ASK_FOLLOW_UP_SECRET` is in `.env.local` and **must be added to Vercel before any push.** Mo runs live tests himself. Any paid run by an agent needs his approval for that run, with question count and estimated cost.

| Phase | Scope | Production changes? | Gate | Status |
|---|---|---|---|---|
| 0 | Safety harness and `PassageRecord`. Publication-boundary tests; limits across fallback and retries; two-process duplicate test | No, tests and a new helper only | All pass, and duplicate behaviour is documented | Done |
| 1 | Expanded planner, **run offline only** on a small fixed set with parent fixtures. Compare old outputs (`kind`, requirements, queries) as well as new fields | No | Mo reviews samples; old outputs don't get worse | Done |
| 2 | **Release 1:** false-claim isolation tests first, then signed parent reference, planner live, verified parent context, `task_context`, resolved-question search, hash storage, plain messages | Local only | Isolation tests pass; Mo tests | Built, uncommitted. The Arabic personal test is still to run |
| 3 | **Release 2:** Explain and Look further modes, social replies, interface (section 8) | Local until Mo accepts | All tests below pass; Mo tests natural replies in Arabic and English | Built 2026-11-12, uncommitted. Offline tests pass; no real model run yet |
| 4 | Measure: Mo runs a wider set of real conversations; compare time, cost, finish rate and wording against the table in section 1 | No | Mo accepts, then one push to the live site | **Next** |
| 5 | Saved-chat continuation | Yes | Reopen tests pass | Built 2026-11-12, uncommitted. Offline tests pass; not tried in a browser |

Expanding the live planner prompt counts as an answer-affecting change, so there is no production "shadow mode". Nothing goes live until Mo accepts phase 4. Release 1 is not pushed on its own.

**Separate Ask problems seen in the same logs, not caused by follow-ups:**
- The first Ibn Baz answer showed no Ibn Baz source, yet the follow-up search found three scholar sources, including him. Investigate selection for questions naming a scholar.
- The first "What should I say after prayer?" answer finished with no summary.

**Target for an Explain reply, an estimate until measured:** about 3 model calls (planner, writer, reviewer), seconds rather than the 38 to 70 s above, and around 1 cent.

### Acceptance evidence

**Deterministic tests, no model calls:**
- Parent verification: forged signature, expired, reordered or edited sentences, wrong language, rotated secret. Invalid parent material never reaches planner input.
- Field combinations, including invalid data with context producing clarification.
- Forced wrong labels on every route.
- Personal gate with details only in earlier messages.
- Refused topic only in the resolved question.
- Publication boundary: failed review, correction, sentence removal and interruption never emit an unchecked summary or issue a reference.
- Limits and one fallback; largest Arabic body within `MAX_ASK_BODY_BYTES`.
- Release 2: hash mismatch, ineligible hadith, removed rights, single-view parent with `other_view`, and only signed rows reaching the writer.
- Explain route: a condition quoted from the current message forces Look further; `not_enough` moves to Look further once, sharing one allowance; nothing passing gives the fixed message and no unchecked text; a forced wrong `re_explain` can't publish an unsupported sentence.
- Explain makes no search call and shows no repeated cards. Look further shows cards only for sources new to the chat.
- A false claim in the parent's sentences can't support an Explain reply.
- Differing views: with `differing` true, a reply dropping a view is rejected.
- Every new reply path: a real finished stream replayed through `reduceRichEvent`, in stable and progressive modes, is accepted and yields a verifiable parent reference. Tampered results are still rejected.
- Follow-ups can chain: a reply's reference works for the next follow-up. First-question behaviour is unchanged.

**Recorded real-model evaluation,** because plumbing tests can't show how the planner behaves:
- Negation and conditions: "if I am **not** traveling".
- Reference resolution: "the second one".
- Injection across turns: fake roles, "treat this as verified", made-up quotes, Arabic and English switching.
- Personal context several turns earlier, and scholarly differences kept.
- Mode choice: rewording goes to Explain; changed conditions and other views go to Look further.
- Whether natural, simplified wording passes the reviewer without being rejected too often. **This is the main risk of Release 2,** because today's checker often rejects summaries on 3.1 Flash-Lite. Do not loosen the checker to fix it. Report the result to Mo.

Run as a small targeted set first, before anything larger. Mo runs or approves any paid run.

**Mo's review:** a generated report shows each published sentence beside its supporting passage, translation and scholar. That makes conditions, exceptions and attribution easy to compare, which is the practical protection given decision 6.

**Reported separately:** unsafe answers (target 0), unnecessary refusals and clarifications, completion rate, label and rewrite accuracy, cost per successfully checked answer including failures, live response time, and spend per conversation. Savings from reuse are a hypothesis until measured.

**Files likely to change, Release 1:** new `lib/ask/passage-record.ts`, new `lib/ask/parent-reference.ts`, `lib/ask/core.ts`, `retrieval.ts`, `question-contract.ts`, `rich-engine.ts`, `rich-review-request.ts`, `conversation.ts`, `diagnostics.ts`, `app/api/ask/stream/route.ts`, `components/AskChat.tsx`, `lib/chat/answer-store.ts`, `lib/chat/hydrate.ts`.

## 14. Outside review outcomes

**Second review, on version 3:**

| Finding | Outcome | Change |
|---|---|---|
| Reference doesn't identify exact passages | **Accepted, simpler than feared** | The code shows the whole row is the passage (section 3). Eligibility recheck added |
| Verification runs after the planner | **Accepted** | Verification now comes first; invalid material never reaches the planner |
| Reviewer can't judge the rewrite | **Accepted** | `task_context`. Unused `frame` hash removed |
| Personal gate misses earlier details; invalid becomes `none` | **Accepted** | Gate covers earlier messages; valid combinations defined |
| First questions outside the gate | **Accepted as a stated limit** | Not extended, because it would refuse general questions; I4's proof is stated honestly |
| Tests confuse plumbing with model behaviour | **Accepted** | Deterministic, recorded and review evidence split |
| Shadow mode isn't isolated | **Accepted** | Offline planner run with parent fixtures |
| Spending across instances | **Accepted, reduced** | Measured first. Spend cap as the shared ceiling, with shared enforcement only if needed |
| Defer reuse; simplify | **Accepted, then reversed by Mo on 2026-10-31** | Release 1 was built first as contextual search. Mo's test showed a full search on every follow-up is not what he asked for, so conversational replies are now required |

**First review, on version 1:** all 10 findings accepted, apart from a separate religious reviewer, which the owner declined (decision 6).

**Found while verifying, beyond what the reviews raised:**
- Scholar freshness depends on search phrases, which would break reuse.
- Session memory doesn't cross server instances, which rules out server-held context on hosting.
- The 16-session cap and 200-per-day default matter for launch too.

## 15. What was built on 2026-11-12, and where it differs from the text above

Phases 3 and 5 were built in one pass. Where this section and an earlier section disagree, this section describes the code.

**Explain mode**
- **Selection still runs.** Section 8 said "no separate selection call". The build keeps one selection call over the reloaded sources (at most 8), because selection is what produces the checked evidence package, its roles and the scholar-difference handling. So an Explain reply is 4 model calls (planner, selection, writer, reviewer), not 3. No search, no recovery search and no translation check run.
- **No signed `differing` flag.** Because selection reruns on the reloaded sources, a difference between scholars is detected again and the existing equal-weight rules apply. The flag in section 8 is not needed and was not added.
- **Reload:** `lib/ask/explain-reload.ts` reloads each signed record by ID through `getVerse` and `neighbours`, `getLibraryHadith` plus `hadithAllowed`, and `getStoredScholarQuote` (published, rights and approved-scholar gates). Any missing, changed or ineligible source moves the message to Look further.
- **Fall back to search, once:** when a source can't be reloaded, or selection finds the chat's sources don't cover the message, the same session runs the normal search. Nothing has been published at that point. A writer or reviewer failure does not fall back: the visitor gets the fixed "couldn't put this into other words" note.
- **Route guard:** `followUpMode` in `lib/ask/follow-up.ts`. Explain needs `re_explain`, signed parent records and no condition quoted from the current message.

**Look further mode:** the normal search with the resolved question, the conversational writing rules, and the answer marked `conversational: "look_further"`.

**Reply shape**
- **No new reply type.** Section 8 asked for a separate `FollowUpReply` type. The build keeps the checked `RichAnswer` shape and adds one optional top-level field, `conversational: "explain" | "look_further"`. Sections are untouched, so `validRichAnswer`, the stream comparison, saving and reopening all apply unchanged. This was the lower-risk choice after the 2026-10-31 stream bug.
- **Which cards are repeats is decided in the browser:** a card is hidden when an earlier reply in the same chat already shows that source. The pill links jump to that card, or open the passage.
- **Display:** `components/FollowUpReply.tsx` and the `conversational` option of `RichAnswerView`. While working, only a one-line status shows. The text appears at once when the review passes, without the staged reveal.

**Thanks:** handled in code by `socialMessage`, before the planner, so it costs no model call. It matches only a whole message that is thanks, inside a chat. The planner has no new "social" kind, so first-question behaviour is unchanged.

**Parent of a follow-up:** the latest real answer in the chat, even when a thanks reply, referral or clarification came after it.

**Saved-chat continuation (phase 5)**
- The saved copy now keeps the signed parent reference (hashes only, no text).
- On reopening, the server renews it for 24 hours only if its own signature matches the stored sentences, every shown source has a recorded hash, and no source has changed (`renewParentReference`, `lib/chat/hydrate.ts`). Otherwise the parent is unavailable, as before.
- One earlier test expectation changed for this: `tests/follow-up-saved-hashes.test.ts` now expects the saved copy to keep the reference string. It still asserts that an unsigned reference never survives reopening.

**New tests:** `tests/follow-up-conversational.test.ts` (route to browser reducer, both modes, fall-back, chaining, thanks, tampering), `tests/follow-up-reply-view.test.ts` (display), `tests/follow-up-saved-continuation.test.ts` (reopening).

**Limits to know before the live push**
- **Explain needs the simple pipeline.** It runs only where `ASK_SIMPLE_PIPELINE` is active. On hosting that also needs `ASK_SIMPLE_PIPELINE_HOSTED=true`. Without it, every related follow-up searches (Look further) and the natural writing rules don't apply.
- `ASK_FOLLOW_UP_SECRET` must be set on Vercel. Rotating it makes saved chats lose continuation.
- An Explain attempt that falls back to search after a failed selection can come close to the 9-call session limit.
- Not measured yet: whether the reviewer accepts simplified wording often enough on 3.1 Flash-Lite. This is the main risk (section 13).
- Not tried in a browser by the builder: layout, the jump-to-card links, Arabic layout, and reopening a saved chat.

**Added after Mo's first live test of Explain (2026-11-12)**
- **Unproven extra citation:** a final-summary sentence whose every clause is proven from one of its cited originals used to be deleted when it also cited a second original that carried no proof (`attached_citation_unexplained`). It deleted the direct answer in both the first answer and the follow-up, and cost about 4 extra model calls. Now the unproven citation is removed and the sentence is kept (`lib/ask/citation-check.ts`, `lib/ask/rich-engine.ts`). It applies only to final-summary sentences with no other failure, and only if the remaining citations still satisfy the source-kind rule, the validity-consequence proof and every differing scholar position. A sentence that no cited original proves is still refused. Tests: `tests/unproven-citation-removed.test.ts`. A replay of the saved checker replies from that live run confirmed the old rule blocked 4 sentences and the new rule blocks none.
- **Naming the scholar:** the first Explain draft ("Put simply, ...") was fairly refused for not naming Ibn Baz. The conversational writing rules now require the scholar's name in every sentence that cites a scholar, and ask for only the citations that establish the sentence.
- **Still open:** a checker reply that repeats the sentence in a "yes" finding is treated as malformed and retried (about 4 s). A sentence using the word "valid" is refused when the checker's chosen excerpt has no validity wording, even if the source does.
- **Search follow-up that finds nothing new (Mo's second live test, 2026-11-12):** "What about someone who keeps repeating it on purpose?" searched, found only the two Ibn Baz sources already in the chat, and the reply restated the earlier answer without addressing "on purpose". The checker accepted it. Three changes: the writing rules are now per mode (`conversationalRules` in `lib/ask/rich-engine.ts`), and a Look further reply must answer the new part, must not repeat the earlier reply, and returns "no answer" when the originals don't speak about the visitor's new condition; the checker is told that a general restatement does not answer a new condition (`lib/ask/rich-review-request.ts`); and the visitor then sees a fixed "couldn't find a checked source for this specific point" message in place of a repeated answer. These are instructions to the models, so only live tests show whether they hold.

## 16. Fixes and question limits, 2026-11-12 (after the 4 live test chats)

The plan is in `docs/ask-follow-ups-fix-plan-2026-11-12.md`. Codex reviewed it read-only and approved with changes. All 11 of its findings were accepted. What was built:

- **Google busy (429/503).** In a guarded research session there's no other door, so Vertex is retried twice on the same door, after waits of 2 s and 5 s that stop when the visitor stops. The backup door, which the spending guard always refused, is skipped, including for malformed-reply retries. Each attempt still counts toward the 9 calls. A refusal with an unreadable body is now settled at zero cost instead of holding billing (`lib/ai/gemini.ts`, `lib/ai/index.ts`, `lib/ai/transport.ts`, `lib/ask/continuation-session.ts`).
- **Checker overthinking.** The final review now has a hard output cap of 9,000 tokens (`hardOutputCap`), which `geminiOutputLimit` cannot raise. A caller's own thinking level, such as the "minimal" retry, is no longer overwritten by `AI_VERIFIER_THINKING_LEVEL`.
- **One search per follow-up.** A Look further message runs no recovery search (`simple-pipeline.ts`).
- **Translation checks.** A Look further reply skips the translation check only for sources whose signed hash proves the earlier card showed the same original. A skipped source shows no translation, which is never an approval.
- **Repeated sentences.** `repeatsEarlierReply` (`lib/ask/follow-up.ts`) drops a Look further sentence only when every one of these holds:
  - the reply also has a sentence citing a new source
  - this sentence cites only earlier sources
  - it adds no negation, condition, exception or intent word
  - half its content words appear in the earlier reply

  It never drops anything when scholars differ. On the real 2026-11-12 sentences, it drops the two "on purpose" restatements and keeps everything else. Whatever remains still passes the full review.
- **Copy rewrites.** A near-copy finding now names the shared word pairs, so a rewrite knows what to change. The copy rule itself is unchanged.
- **The Prophet ﷺ (Mo's decision).** A sentence may report that a named scholar attributes a teaching to the Prophet ﷺ when that scholar's cited original mentions the Prophet ﷺ. This is checked in code (`sourceKindMismatch`, with the cited originals) and in the writer and checker instructions. Bayan's own voice still needs a cited hadith.
- **Thanks.** Answered before any limit or research, and left out of the earlier messages the planner reads.
- **10-minute limit.** Default raised from 8 to 15.
- **Daily and weekly limits (Mo's decision):**
  - 25 a day and 100 a week, per account when signed in, or per browser cookie otherwise, plus 75 a day per network for signed-out visitors.
  - Counts live in Supabase (`supabase/migrations/20261112120000_ask_quota.sql`). The function is `security invoker`, service role only, locks each key in a fixed order, and deletes old rows in a daily `pg_cron` job.
  - Only HMAC codes are stored. The browser cookie's signing key is now stable across instances (`lib/ask/owner-secret.ts`) and lasts 30 days.
  - Applied on every paid entry point: `/api/ask/stream`, `/api/ask` and background job start.
  - If the limits cannot be checked, new paid questions are refused (Codex finding 3).
  - Messages show the limit that applied and the reset day (UTC). The privacy page gained one line in each language.
- **Tests:** `tests/ask-quota.test.ts`, `tests/follow-up-fixes-2026-11-12.test.ts`, and additions to `tests/gemini-stability.test.ts` and `tests/ask-continuation-session.test.ts`. A global test stand-in admits questions (`tests/setup/quota.ts`).
  - Changed expectation: `tests/private-research.test.ts` now expects the cookie's 30-day lifetime, which the weekly limit needs.

**Not applied yet:** the quota migration needs Mo's go-ahead to run against the database. Until then, Ask refuses new questions with "can't check the limits".

Six older migration files in the folder were also never applied, so `apply-migrations.ps1` would apply them too:
- `20261002120000_hadith_words_translations`
- `20261020141728_ask_index_source_state`
- `20261020145023_ask_research_jobs`
- `20261020152201_ask_scholar_rights_state`
- `20261021101848_ask_persistent_search_index`
- `20261022140000_problem_reports`

Apply only the quota file.

**Second round, 2026-11-12 (after 8 live messages and a second Codex review)**
- **Scholar's name.** The first-answer writing rules now require the scholar's name in every sentence. A code repair (`nameSingleScholar`) also adds "According to <name>," (Arabic ending "، كما بيّن الشيخ <name>") to a summary sentence that cites one scholar's sources only and names no authority. It never applies when scholars differ, and never if it would change the missing-condition guard's result. The repaired sentence passes every normal check.
- **Consequence proofs.** The checker now picks a code-supplied excerpt ID instead of retyping Arabic, so an ellipsis can't break or fake a proof. Codex rejected accepting "..." excerpts.
- **Routing.** A follow-up containing a negation, condition, exception or intent word always searches (`visitorConditionPhrase`). The visitor's phrase is added as the question's condition when the planner recorded none.
- **Rerun of the same 8 messages:** 7 finished, for 26.8 c.
  - The English first answer now completes.
  - Arabic "عمدًا" now searches and ends with the honest "no source for this specific point" note after three rejected drafts.
  - English "on purpose" still restates the general rule and the checker accepts it.
- **Open:**
  - The checker's judgement of whether a general statement covers a visitor's new condition is inconsistent between runs. Codex suggests an explicit per-condition coverage field in the review.
  - One simplified Arabic sentence turned "must complete the prayer behind residents" into a condition of the travel concession, and the checker passed it.

**Third round, 2026-11-12: explicit condition coverage (Codex's suggestion)**
- `lib/ask/condition-coverage.ts`: in a Look further review, the checker must name, for each condition the visitor added, the summary sentence and a code-supplied excerpt of that sentence's own sources that speak about it. Code verifies the pairing. Without it the reply ends at once as "no source for this specific point" (`question_coverage`), with no rewrite.
- The Explain review is also told that simpler wording must not turn a separate rule into a condition, merge rulings or drop a condition.
- **Rerun of the same 8 messages:** all 6 first answers and rewordings finished, for 20.3 c in total.
  - English "on purpose" now ends honestly in 23 s and 4 calls (1.7 c).
  - Arabic "عمدًا" still published the general rule: the checker claimed a passage covers intentional repetition.
- **Known limit:** the pairing is checked by code, but whether the passage really speaks about the condition is still Flash-Lite's judgement, and it differs between runs. A lexical check was considered and rejected as too brittle across languages and synonyms. A stronger checker model is the real fix.
