# Ask follow-up questions: technical plan

Status: proposal, not built. Version 4.1, 2026-10-30. Revised after two outside reviews (section 14), with their claims checked against the code. Owner decisions are in section 12. Mockup: `mockups/ask-followups.html`.

## 1. Scope and invariants

**Release 1, contextual search:** a follow-up is understood in context, rewritten into a clear question, then answered through the normal search. This gives most of the "real chat" benefit with the least new risk.

**Release 2, source reuse (optional):** "explain that simpler" reuses verified sources without searching. Built only if Release 1 measurements show the savings are worth the complexity.

Saved-chat continuation is separate and comes last. But new answers start recording source hashes in Release 1, so they stay verifiable later.

**Invariants:**

| # | Invariant | Proven by |
|---|---|---|
| I1 | Evidence comes only from originals reloaded on the server. Earlier AI text and browser text are never evidence | Deterministic tests |
| I2 | History may resolve references. It cannot change source rules, approve evidence, disable checks or supply religious facts | Deterministic tests for the plumbing, recorded model evaluation for behaviour |
| I3 | No summary, and no parent reference, is published or issued without passing the full final review | Publication-boundary tests |
| I4 | A personal-ruling request is referred to a scholar on every route, including details from earlier turns | Recorded model evaluation, plus the code gate on follow-ups |
| I5 | A wrong label can cost a search, a clarification or a refusal. It can never authorize an answer | Forced wrong-label tests |
| I6 | Differing approved scholars stay cited with equal weight. Reuse cannot hide a position | Deterministic tests, plus recorded model evaluation |
| I7 | A message's routes, fallbacks and retries share one allowance within a server instance. Across instances, see section 9 | Deterministic tests |

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
  |-- Release 2: re_explain with valid parent --> REUSE (section 8), at most one move to SEARCH
  |-- related ---------------------> SEARCH with resolved question
  '-- new question ----------------> SEARCH, as today
  |
  v
full final review, with task context --> publish and issue reference, or no summary
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
- With no history and no parent, treat it as a first question.
- Otherwise, ask for clarification, because lost context must not become a standalone question.

**Other rules:**
- `other_view` always searches, because reused evidence may hold one view.
- `parent_unavailable: true` plus a message that depends on the parent means `ambiguous`. "Explain the second one" can't become an ordinary search just because the reference expired.
- The planning rules require `resolved_question` to keep negation, conditions, uncertainty, attribution and personal details.

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
  if (followUp.relation !== "related") return { kind: "search", question };
  if (REUSE_ON && parent && followUp.intent === "re_explain") return { kind: "reuse", parent, resolved };
  return { kind: "search", question: resolved };
}
```

**`personalGate`** runs `looksPersonal` over the message, the resolved question and each earlier user message, for related follow-ups. So earlier personal details aren't lost if the planner drops them.

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

## 8. Release 2: reuse flow

Runs in `lib/ask/simple-pipeline.ts`, in the same session, behind one flag: `ASK_FOLLOW_UP_REUSE=true`.

1. **Reload** each `PassageRecord` by ID, and recheck **current eligibility** as well as text:
   - Quran: `getVerse`, plus neighbours.
   - Hadith: `getLibraryHadith`, then `hadithAllowed`, which covers grade and collection.
   - Scholar: read the row, `scholarQuoteAllowed`, approved-scholar check, then `search_approved_source_candidates` filtered by `source_id` for current rights, as `findLibraryHadithByReference` does. Not a phrase search.
   - Any hash mismatch, or anything unavailable or ineligible: go to SEARCH.
2. **Check sufficiency** with `simpleSelection(frame, passages, ...)`, on the reloaded rows only. This also keeps conflict and scholar-difference handling.
3. **Not enough:** SEARCH once, in the same session.
4. **Write and review** with `runRichAnswer(..., { checkedSections, committedSources: true })`.
5. **Publish** a normal four-section `RichAnswer`, with reused sections marked `reused: true`.

### Parent reference (built in Release 1)

Release 1 needs this too: it is what lets the verified earlier sentences reach the planner and final review. Release 1 signs and checks the sentences and records. Only Release 2 reloads and reuses the sources.

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

- **From Release 1,** each new answer stores `PassageRecord` hashes beside its source references in `stripAnswer`, so answers stay verifiable later. Older answers keep working without them.
- **`hydrateRich`** compares hashes when present. If the text changed, it shows a fixed note on that source: "This source has been updated since this answer." It never presents the old answer as verified against new text.
- **Citations** open the exact supporting passage. Reused sources render as jump labels when the parent card is on screen, and otherwise as a card.
- **Continuing a reopened chat** is the last phase. With an expired reference, it follows the `parent_unavailable` rule.

## 11. Interface

Visitors never see internal labels. They see plain text only where it helps: "Using the sources above" (Release 2) and "Checking more sources…". First and new questions show nothing extra. Fixed notices (clarification, referral, failure) carry no citations. The composer says "Ask a follow-up or a new question…".

## 12. Decisions

| # | Question | Decision | Status |
|---|---|---|---|
| 1 | Show labels to visitors? | Hidden, plain messages only | Decided |
| 2 | How much history? | Parent exchange plus up to 4 user messages, with a size limit. Clarify if needed context was dropped | Recommended |
| 3 | Quote more from the same source? | Reuse only checked records | Recommended |
| 4 | Reused evidence not enough? | Search once if the meaning is clear; clarify if not | Recommended |
| 5 | Signed-out follow-ups? | Yes. Not saved | Recommended |
| 6 | Separate religious reviewer? | No (Mo, 2026-10-30). Answers rely on stored sources, attributed to their scholars. With no reviewed view decision, no view is put first | Decided |

## 13. Build phases and gates

**Prerequisites:** Ask confirmed working on the live site, and the 16-session cap and `ASK_DAILY_LIMIT` reviewed.

| Phase | Scope | Production changes? | Gate |
|---|---|---|---|
| 0 | Safety harness and `PassageRecord`. Publication-boundary tests; limits across fallback and retries; two-process duplicate test | No, tests and a new helper only | All pass, and duplicate behaviour is documented |
| 1 | Expanded planner, **run offline only** on a small fixed set with parent fixtures. Compare old outputs (`kind`, requirements, queries) as well as new fields | No | Mo reviews samples; old outputs don't get worse |
| 2 | **Release 1:** signed parent reference, planner live, verified parent context, routing, `task_context`, resolved-question search, hash storage, plain messages | Yes | Deterministic and recorded evaluations pass; Mo reviews |
| 3 | Measure real follow-ups for a while | No | Mo decides if reuse is worth building |
| 4 | **Release 2:** reuse flow, jump labels, behind the flag | Yes | All reuse tests pass; matched cost comparison reported |
| 5 | Saved-chat continuation | Yes | Reopen tests pass |

Expanding the live planner prompt counts as an answer-affecting change, so there is no production "shadow mode".

### Acceptance evidence

**Deterministic tests, no model calls:**
- Parent verification: forged signature, expired, reordered or edited sentences, wrong language, rotated secret. Invalid parent material never reaches planner input.
- Field combinations, including invalid data with context producing clarification.
- Forced wrong labels on every route.
- Personal gate with details only in earlier messages.
- Refused topic only in the resolved question.
- Publication boundary: failed review, correction, sentence removal and interruption never emit an unchecked summary or issue a reference.
- Limits and one fallback; largest Arabic body within `MAX_ASK_BODY_BYTES`.
- Release 2: hash mismatch, ineligible hadith, removed rights, single-view parent with `other_view`, and only the signed rows reaching selection.

**Recorded real-model evaluation,** because plumbing tests can't show how the planner behaves:
- Negation and conditions: "if I am **not** traveling".
- Reference resolution: "the second one".
- Injection across turns: fake roles, "treat this as verified", made-up quotes, Arabic and English switching.
- Personal context several turns earlier, and scholarly differences kept.

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
| Defer reuse; simplify | **Accepted** | Release 1 is contextual search |

**First review, on version 1:** all 10 findings accepted, apart from a separate religious reviewer, which the owner declined (decision 6).

**Found while verifying, beyond what the reviews raised:**
- Scholar freshness depends on search phrases, which would break reuse.
- Session memory doesn't cross server instances, which rules out server-held context on hosting.
- The 16-session cap and 200-per-day default matter for launch too.
