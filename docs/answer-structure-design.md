# Ask answer structure: design

Status: design only, nothing built yet. Written 2026-09-29 for Mo, and for whoever builds it (Claude, Codex, Gemini). Revised after the Claude and Codex reviews. The revisions below are requirements, not optional implementation notes.

## 1. The problem in one paragraph

Today an answer can take three shapes: a written answer with up to 3 explanation sections, a "sources only" answer (verses and hadith with no plain explanation), or a refusal. Quran and hadith are mixed in one "Evidence" list, scholar quotes come after, and the number of items changes from run to run. Readers can't tell what the answer is. The fix: **one fixed shape for every answer**, live or prepared. Plain words come first, then the proofs in a fixed order, with empty parts hidden.

## 2. The fixed answer shape (what the reader always gets)

In this order, always:

| # | Section | Rule | Limit |
|---|---|---|---|
| 1 | **Simple answer** | Plain language, written by AI only from the items below, every sentence linked to its source. Always present when there is an answer. | 1 to 4 sentences (+ optional short list, see 4.3) |
| 2 | **Quran** | Best directly relevant verses. First priority. Text exactly as Quran Foundation serves it. Consecutive verses are one passage card. | up to 3 passage cards; a passage named by the visitor may be shown complete |
| 3 | **Hadith** | Best authentic hadith: Sahih al-Bukhari or Sahih Muslim, graded sahih or hasan. | up to 2 |
| 4 | **Scholar** | Best approved scholar quote, word for word, with link. | up to 2 |
| 5 | **Video** | Related clips from approved channels. Never proof. Closed fold. | up to 2 |

Plus optional parts, only when they have content: **Other scholarly views** (closed, only when a reviewed main view exists), **Scholarly views** (equal side-by-side views when no reviewed main view exists), **More explanation** (closed), and a one-line **Limit** note ("the sources found do not establish X").

A section is shown only if a real source fills it. Nothing is invented to fill a slot. If no simple answer can be written safely, the reader gets an honest message, **never a bare list of verses**.

## 3. Input step: from question to structured request

This is today's "question frame" (`UNDERSTAND_SYSTEM` in `lib/ask/core.ts`, parsed by `parseQuestionFrame` in `lib/ask/retrieval.ts`), kept almost as is, with one new field (`answer_form`) and clearer naming of the search words per source.

```ts
type AskRequest = {
  language: "ar" | "en" | "de";            // the visitor's language
  kind: "question" | "personal" | "greeting" | "off_topic" | "harmful";
  question_type: QuestionType;             // identity, ruling, reason, practice, ... (unchanged)
  subjects: string[];                      // 1..5 short English topic names
  points: { id: "R1" | "R2" | "R3" | "R4"; text: string; facet: AnswerFacet }[];  // the checklist: 1..4
  qualifiers: string[];                    // limits like "for a traveller"
  answer_form: "short" | "list";           // NEW: code permits "list" for steps, conditions or exceptions
  search: {
    quran_en: string[];   quran_de: string[];   // 2..6 phrases, translation wording (Quran Foundation search)
    hadith_en: string[];  hadith_ar: string[];  // HadeethEnc title lists
    scholar_ar: string[];                       // up to 3 Arabic phrases: fatwa title, fiqh term, direct ruling
    video_ar: string[];                         // reuses scholar_ar today; kept separate so it can differ
  };
};
```

What stays the same: personal questions go to "ask a scholar", greetings and off-topic get the short reply, and the frame is checked against the original wording (`questionFrameMismatch`, `repairExplicitFrame`). What's new: code permits `answer_form: "list"` when at least one point has facet `steps`, `conditions` or `exceptions`. Quantity alone does not trigger a list. The model may request the permitted form, but code makes the final decision. The `search` object replaces today's locale-only `searchQueries`; this is a contract migration across the prompt, schema, parser, query builder, traces and tests, not only a rename. No extra AI call.

## 4. Result shape: `AnswerV2`

One rendered JSON shape for live and prepared answers. The website only ever renders this. Stored prepared files use a separate reference-only shape described in section 5.

```ts
type AnswerV2 = {
  version: 2;
  language: "ar" | "en" | "de";
  origin: "live" | "prepared";
  review: "automatic" | "bayan_reviewed" | "scholar_reviewed";   // trusted server assignment, never model/file input

  simple_answer: {
    sentences: Cited[];          // 1..4
    list?: Cited[];              // only when answer_form = "list": 2..8 short items, each cited
  };

  quran:    QuranItem[];         // 0..3 passage cards; named passage exception in 4.1
  hadith:   HadithItem[];        // 0..2
  scholars: ScholarItem[];       // 0..2
  videos:   VideoSuggestion[];   // 0..2, existing type with channelId and minutes; never evidence

  view_handling?:
    | { mode: "reviewed_main"; decision_id: string; other_views: ScholarView[] }
    | { mode: "side_by_side"; views: ScholarView[] };
  more_explanation?: { heading: string; sentences: Cited[] }[];   // closed fold, 0..2 sections
  limit_note?: string;           // "The sources found do not state ...", no source, no religious claim

  attribution: { quran?: Link; hadith?: Link }; // only for source kinds actually shown
  provenance:
    | { model: string; verifier: string }
    | { prepared_version: string; approval_hash: string }; // runtime validator matches this to origin
};

type Cited = {
  text: string;
  source_ids: string[];          // 1..3 ids, all present in this answer
  requirement_id: "R1" | "R2" | "R3" | "R4";
};

type ScholarView = {
  id: string;                    // stable code-assigned id
  label_key: string;             // fixed localized site text, never free AI text
  sentences: Cited[];            // 1..2; cite only this view's quotes
  scholars: ScholarItem[];       // unique scholars, never quote count
};

type ItemBase = {
  id: string;                    // "HE4196" or "S<uuid>"; Quran cards carry source_ids below
  points: string[];              // which checklist points it directly answers ("R1")
  cited: boolean;                // cited anywhere in the rendered answer
};
type QuranItem = {               // one passage card; citations still use individual Q ids
  id: string;                    // stable card id assigned by code
  source_ids: string[];          // one or more consecutive ids, e.g. ["Q1:1", ..., "Q1:7"]
  points: string[];
  cited: boolean;
  verses: { id: string; key: string; arabic: string; translation: string | null; translation_name: string | null; url: string }[];
};
type HadithItem  = ItemBase & { collection: "bukhari" | "muslim" | "agreed"; numbers: { bukhari: number | null; muslim: number | null };
                                 grade_ar: string; attribution_ar: string; arabic: string; translation: string | null;
                                 translation_language: "en" | "de" | null; url: string };
type ScholarItem = ItemBase & { scholar_id: string; scholar_name: string; title: string | null; reference: string; arabic: string; url: string };
```

The existing `Evidence` type (`lib/ask/core.ts`) already holds most display fields. `AnswerV2` splits it into fixed arrays and adds `points`, `cited` and preserved `requirement_id` values. Quran ids remain `Q2:255` internally and are formatted as `2:255` only by the view. Refusals stay separate results, as today: `no_source`, `ask_scholar`, `out_of_scope`, plus one new status, `no_summary` (see 7).

`AnswerV2` must pass a runtime validator before rendering. TypeScript types alone are not a safety check. The validator rejects unknown fields, invalid ids, raw model-supplied review labels, missing displayed citations, invalid source URLs and any count above the limits.

### 4.1 How the best items are chosen (code, not AI)

After retrieval, the independent selector model labels every candidate, as it does today (`EVIDENCE_SYSTEM`: direct / partial / mention_only, which points it answers, whether its context is safe). Only **direct + context-safe** items can enter an answer, as today. Code then builds the capped sealed package **before drafting**, covering every checklist point first. Within each source kind it uses this repeatable ranking:

1. It is needed for the smallest set that covers every checklist point.
2. It covers more checklist points.
3. It came from a checked topic map (`data/topic-source-hints.ts`) or was named by the visitor ("Ayat al-Kursi").
4. Its retrieval rank (`rankCandidatesForQuestion`).
5. Tie-break: numeric Quran order for verses, otherwise the id.

The caps apply while the sealed package is built (3 Quran passage cards / 2 hadith / 2 scholar quotes). Consecutive verses are grouped into one passage card. When the visitor names a passage such as al-Fatiha, code may include the complete named passage as one card instead of cutting it at three verses.

After drafting, the rendered answer shows only sources cited by a checked sentence or view. Uncited items from the sealed package are hidden. Code may deduplicate exact source ids and repeated fatwa URLs. It must not claim that a hadith and verse mean the same thing without a checked semantic decision.

### 4.2 Why the simple answer is written after choosing

The writer model sees only the capped sealed package, never rejected candidates and never the raw question. The assembler then keeps every cited item and hides unused items. If a citation is not present in the rendered source arrays, the whole answer fails. Caps are never enforced by dropping a cited source after drafting.

### 4.3 The simple answer: how it is written

- 1 to 4 sentences that answer the checklist directly: the ruling, number, reason or steps in the first sentence. One complete fact must not be padded to reach a minimum.
- For `answer_form: "list"` (steps, conditions or exceptions), a short list of 2 to 8 items follows, each item cited and tied to a checklist point.
- Anything longer goes into **More explanation** (closed, 0 to 2 sections). This replaces today's always-open explanation sections.
- It names the source type honestly: "The Quran says...", "The Prophet taught...", "Shaykh Ibn Baz explained...". It never retypes Quran or hadith and gives no ruling of its own (same `DRAFT_SYSTEM` rules 1 to 10, with the new limits).
- The total budget is 12 AI-written cited sentences or list items across the simple answer, list, more explanation and scholarly views. Fixed site labels and a valid limit note do not count. If the question cannot be answered fairly within that budget, return `no_summary` or `no_source`; never compress many unsupported claims into one sentence.
- A steps or conditions answer may use a limit note only when it is clearly labelled partial and the shown items are themselves useful and directly supported. It must not present a partial procedure as complete. Prepared answers such as "how to pray" that promise a complete guide but omit middle steps are flagged for rewriting, not passed by the converter.

### 4.4 How it is checked (existing safety rules stay)

Today's safety checks remain, but their parsers and prompts must be updated for the new fields: citation ids must exist (`parseStructuredDraft`), no copied source wording or quotation (`copiesSource`, `hasQuotation`), right language, no repetition, requested list items present (`missingListedItems`), then the independent screening model (`SUPPORT_SYSTEM`) on every sentence and on the whole answer. The list is part of the direct answer for completeness screening. Added code checks:

- `simple_answer.sentences` has 1 to 4 items, each with 1 to 3 source ids and one valid `requirement_id`.
- Every list item, explanation sentence and view sentence has the same citation, language, copying, attribution and requirement checks as a simple-answer sentence.
- Every checklist point is covered by at least one simple-answer sentence or list item.
- Every cited id is inside a Quran card's `source_ids`, `hadith`, top-level `scholars` or the relevant `ScholarView.scholars` of the same answer (never a video).
- The section order and caps are enforced by the assembler, not the model.
- `limit_note`, headings and view labels are validated separately. Headings and labels come from localized site text where possible. A limit note is one sentence, in the answer language, contains no citation, quotation or religious ruling, and is allowed only for reason, objection, steps or conditions.
- At most 12 AI-written cited items exist in the whole rendered answer.

The retry budget is explicit: one initial draft, at most one format/wording correction, at most one missing-items correction and at most one screening correction, for a maximum of four draft calls as today. Stop as soon as a correction succeeds. If the bounded attempts fail, the result is `no_summary` (section 7). A future implementation may reduce this budget after measurement, but may not silently add retries beyond the 50-second deadline.

## 5. Prepared answers use the same shape

Prepared files (`data/prepared-answers/*.json`, `data/topic-answers/*.json`, loaded by `lib/prepared.ts`) already have `direct_answer`, `explanation`, `sources`. They remain a reference-only stored format named `PreparedAnswerV2`; they do not store rendered Quran text or translations. A server converter resolves and validates them into `AnswerV2`, so they render with the exact same component:

| Prepared file today | AnswerV2 |
|---|---|
| `direct_answer` (1..n sentences) | `simple_answer.sentences` (must be 1..4, longer files need review) |
| steps inside `explanation` | `simple_answer.list` (optional new field `list` in the file) |
| `explanation` sections | `more_explanation` (closed fold) |
| `not_established` | `limit_note` |
| `sources` by kind | reference-only source records; resolved into capped rendered arrays without dropping any cited source |
| new optional reviewed decision or grouped views | `view_handling` |
| new optional `videos` (YouTube ids from approved channels) | `videos` |

The loading rules stay: Quran text fetched live by key (never stored, Quran Foundation's caching rule), hadith fetched fresh and checked with `hadithAllowed`, quotes checked with `scholarQuoteAllowed`, and **fail closed** if any cited source fails. `scholarQuoteAllowed` checks identity, size and approved domain; it does not prove a stored excerpt is word for word, so the existing quote-verification script/editorial record remains required. Trusted server code assigns `origin: "prepared"` and `review: "bayan_reviewed"` only after approval-version validation.

Converting the files:

1. Inventory all current files. There are 44 now (32 common prepared answers and 12 topic answers). The dry run must enumerate the registries instead of hard-coding this count because new prepared files may be added.
2. Dry-run the converter first. It reports sentence failures, missing checklist ids, source counts, citations that cannot fit the caps, incomplete promised procedures and files needing wording changes. It does not silently drop or rewrite content.
3. Run the ordinary sentence checks on prepared prose and report failures. Prepared prose is not sent through the live support model automatically; Mo's content review remains the authority until scholar review exists.
4. Store a deterministic content hash/version with every review decision. The hash covers all three languages, source records, citations, view data and relevant metadata. If the current hash differs, the answer is draft even when the item id was previously approved. This needs a database migration and therefore separate approval from Mo before implementation.
5. Byte-for-byte unchanged content keeps its approval. Any wording, citation, source, grouping or meaning change returns to the Review tab. The one currently approved topic must not inherit approval after conversion unless its approved hash still matches.
6. Fix the existing common-answer loading bug as part of this step: Ask must pass the database review status into `loadPrepared`, as topic pages already do. The file's old `status` field must not silently contradict the database decision.
7. Topic pages already render their own videos below the answer. The shared `AnswerV2` view must receive either answer videos or topic-page videos there, never both.

## 6. When scholars differ

The rule is: a reviewed main view may come first; automatic retrieval never declares al-rajih. Other views are closed only when a reviewed main-view decision exists. Without one, supported views have equal presentation or the answer refuses.

- **Only scholar quotes can create "other views".** If Quran or hadith items seem to conflict, the answer is refused (fail closed, as today).
- Conflict handling is split: `revelation_conflict` means Quran or hadith conflict and always refuses; `scholar_difference` means approved scholar quotes express different positions and may enter the view path. Today's single conflict field must be migrated explicitly.
- The selector proposes a `position` for every scholar quote, meaning which answer to one checklist point it gives. Code validates ids and membership, and the independent checker must confirm that every quote and sentence is assigned to the position it actually states. Unclear grouping refuses.
- A reviewed view decision in `data/view-decisions.ts` may select the main view only when it records the exact question point, main position, supporting approved scholar statement, who reviewed it, date and version. Mo's product approval alone must not be presented as a religious ruling or as "the strongest view". That label is reserved for a real scholar review.
- Without a matching reviewed decision, never count quotes or retrieved scholars to pick a winner. Show the checked views side by side with equal weight and a fixed localized notice that scholars differ, or refuse if a fair presentation does not fit the source or size limits.
- Count unique scholars for display metadata. Multiple excerpts by one scholar remain one scholar. Permanent Committee material is one institutional position unless a reviewed decision says how a signed statement should be represented.
- With a reviewed main decision, the simple answer may cite only sources assigned to the main view. Each other-view sentence may cite only its own view's quotes. The checker verifies both directions.
- The difference notice is fixed localized site text written by code, with no citation. It is not an AI claim.

## 7. Empty sections, failed checks, no answer

| Situation | What the reader sees |
|---|---|
| A section has no real source | The section is hidden. No placeholder. |
| No Quran, but hadith or scholar support every point | Answer shown without the Quran section. |
| Only a scholar quote supports a point | Allowed; the simple answer names the scholar ("Shaykh Ibn Baz explained..."). |
| Direct sources exist, but no simple answer passes the bounded checks | **New `no_summary` message:** "We found sources on this, but could not write a short answer that we can check. Please ask a qualified scholar you trust or try a narrower question." With links to Hard questions and the report button. **No sources list.** (This replaces today's "sources only" answer.) |
| No direct source for a checklist point | Refusal as today ("no trusted source found"), or a clearly labelled partial answer with a valid `limit_note` only for reason, objection, steps or conditions under section 4.3. |
| Quran or hadith items conflict | Refusal (fail closed). |
| Scholar quotes differ and a reviewed main-view decision exists | Main view in the answer; checked other views in the closed fold. |
| Scholar quotes differ and no reviewed decision exists | Checked views side by side with equal presentation, or refusal. Never an automatic winner. |
| Personal situation | "Ask a scholar", as today. Never cached. |
| Videos search fails | Answer shown without videos. Videos never block an answer. |

## 8. On screen (phone first)

```
[star] Automatic answer from the sources listed (or "Reviewed by Bayan" / "Scholar reviewed")
┌ Simple answer ────────────────────────────┐
│ 1 to 4 plain sentences, each with a small │
│ source chip [2:183] [Bukhari 1903] [Ibn Baz]
│ 1. step one [..]  2. step two [..]        │  (list, only for steps/conditions)
│ Scholars differ on this; see below.       │  (only if they do)
└───────────────────────────────────────────┘
Quran            verse cards: Arabic, translation, link
Hadith           collection + number + grade, Arabic, translation, link
Scholar          name, fatwa title, Arabic quote, "Read on binbaz.org.sa"
▸ Other scholarly views          (closed only with a reviewed main view)
Scholarly views                  (equal presentation when there is no reviewed main view)
▸ More explanation               (closed)
Limit note (if any)
▸ Watch more (videos, not evidence)   (closed)
Footer: attributions · not a fatwa · Report a problem
```

- Tapping a chip jumps to its card and moves keyboard focus there, as today. If the target is inside a closed `<details>`, code opens the fold before scrolling and focusing.
- Headings use the correct level for their page context rather than always forcing `h3`. Folds are native `<details>`. Arabic cards use `dir="rtl"` inside English and German answers, as today.
- Source chips and verse or hadith numbers use `dir="ltr"` plus Unicode isolation inside Arabic prose.
- The whole long answer is not announced through one `aria-live` region. Screen readers receive a short "answer ready" announcement, then navigate the answer normally.
- English and German readers see scholar quotes in Arabic with a label "Original Arabic". The simple answer already says in their language what the scholar said. Translations come later, only where rights allow (quality plan phase 7).

**What changes from today:** Quran and hadith get separate sections (today they are one "Evidence" list). Explanation sections move into a closed fold. The "sources only" answer is removed. Caps and ranking are fixed. Other views and view decisions are new. The same layout is used for prepared answers, topic pages and live answers.

## 9. Build plan (small steps, each measured)

Each step ends with focused tests and the proportionate checks named below. Stability comparisons use three runs. Full live evals are reserved for the source-only decision and final milestones because they cost money. Step 1 defines and adds these numbers to eval output: **structure_ok**, **useful explanation rate**, **no_summary rate**, **correct refusal rate**, **source-only rate**, **must-contain pass**, **wrong-source count**, **p50/p90 seconds**, and **stable required points across three runs**. "Wrong source" requires reviewed acceptable source ids or source classes in `data/eval-questions.ts`; merely having a citation does not pass.

| Step | What | Done when |
|---|---|---|
| 1 | Runtime `AnswerV2` validator, internal/display id rules, evaluation definitions and reviewed acceptable-source expectations. No visible change. | Malformed shapes, missing displayed citations, fake review labels, video citations and over-cap answers fail closed; a locked baseline is recorded. |
| 2 | Capped sealed-package chooser before drafting, with fixed-input unit tests, numeric Quran sorting, named-passage grouping and exact-url deduplication. | Fixed candidates always produce the same package; every requirement is covered; no cited item can later be cut by a cap. |
| 3 | Prompt and parser migration: preserve `requirement_id`, 1 to 4 simple sentences, optional list, total cap 12, updated screening of lists and all new text fields. Refine copy detection with adversarial Quran/hadith retyping and safe-paraphrase tests. | Exact or lightly altered scripture still fails; reviewed safe paraphrases pass; required steps and numbers cannot disappear. |
| 4 | New answer view (`components/AskChat.tsx` to `AnswerV2View`), separate Quran/Hadith sections, folds, focus-opening behavior and localized labels/status messages in ar/en/de. | Keyboard, screen reader, 200%/400% zoom, long German and Arabic RTL checks pass; structure_ok is 100% on shown answers. |
| 5 | Add `no_summary` to the API/UI and remove the source-only fallback. Run the same full controlled set before and after. | source-only is 0; safety metrics do not regress. The saved baseline predicts about a 16-point drop among general questions, so any large drop triggers drafting/copy-check investigation, never weaker source checks. |
| 6 | Prepared dry-run inventory and `PreparedAnswerV2` converter. Add content-hash approval design, then obtain Mo's separate approval before any database migration. Fix Ask's database-status handoff. | All current files are accounted for (44 as of 2026-09-30); no cited source is dropped; changed files are draft; unchanged matching hashes retain approval; quote verification passes. |
| 7 | Prepared and Review views use `AnswerV2`; topic pages choose one video source to prevent duplicates. | Draft review works in all languages; fail-closed source loading and Quran non-storage tests pass. |
| 8 | Scholar differences: split revelation conflict from scholar difference, checked position grouping, reviewed decisions and equal side-by-side fallback. | Music, tawassul and congregational-prayer cases show a reviewed main plus fold, equal checked views, or refusal; never a mixed or count-selected ruling. |
| 9 | Separate live and prepared eval modes. Run the focused set in all languages with three repetitions and inspect no-summary reasons. | Wrong source remains 0; required-point stability and p50/p90 are reported separately by origin and language. |
| 10 | Mo reviews the focused set in 3 languages; fix substantive findings; run the full eval. Update `BAYAN_PLAN.md` and the quality plan to match the shipped behavior. | Mo is satisfied; wrong source 0; must-contain at least 95%; no altered scripture, unsupported ruling or stale approval. |

## 10. Risks

- **Fewer answers at first.** Removing "sources only" turns those cases into `no_summary`. The saved baseline suggests about a 16-point drop among general questions before copy/drafting improvements. This is measured openly; safety checks are not weakened to meet an answer-rate target.
- **Hard questions don't fit the budget.** Lists and More explanation help, but the total stays at 12 checked items. Questions that still do not fit return `no_summary` or a clearly labelled partial result under the narrow rules above.
- **Automatic majority is misleading.** It is removed. Only a reviewed decision can select a main view; otherwise views are equal or the answer refuses.
- **Arabic-only scholar quotes for en/de readers.** The simple answer explains them in the reader's language; real translations wait for rights.
- **Prepared answers need re-approval** where any approved content hash changes. The converter keeps wording wherever possible and never silently drops cited sources.
- **Time and cost.** Position grouping uses the existing selector response, while the existing independent checker also validates grouping. The 12-item total and explicit maximum of four draft calls protect the 50-second deadline.
- **AI quota during evals** (Gemini was busy in phase 4). Run the focused set per step and the full set only at milestones.
