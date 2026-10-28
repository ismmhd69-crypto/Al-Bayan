# Simpler Ask pipeline: implementation and manual acceptance

Status: implemented, offline accepted, local preview available for Mo's manual testing. Live quality acceptance is OPEN. Mo chose “I’ll test it myself” instead of authorizing the proposed $0.15 fixed live set. No paid requests were made by this implementation run. No production deployment or durable worker activation occurred.

## Behaviour

A fresh ordinary question has four model tasks: question plan with English/Arabic backup queries, combined evidence selection, one summary writer, one combined final review. Sources are retrieved concurrently without AI reranking or three separate source selections. Up to thirty candidates are balanced across available families and visitor concerns. Named source units reserve space first. Empty optional families do not automatically spend another recovery round.

One recovery batch targets the first uncovered concern in the original question order, using up to six backup searches from the existing plan. It permits one more combined selection. No new planning call is made. Unknown IDs, unsafe context, conflicts and malformed selection envelopes are not evidence gaps that justify repeated opinions.

Selection includes supported contributions, original restrictions and missing concern IDs. It is research guidance, never final summary approval. All recovery completes before source publication. The immutable reading order is Quran, Sunnah, scholars, then the approved summary. Exact originals, available translations, source links, attribution and existing source accents remain. No generated explanation has been restored above source groups.

The final review includes the previous primary review's citation, meaning, attribution, audience, scope, consistency and complete-coverage checks, plus the previous narrow review's explicit condition comparisons. Source excerpts are selected through code-owned anchors instead of asking the model to retype Arabic. Mechanical identity, source eligibility, citation, copy, shape, conjunction and publication checks remain active. Available scholar translations join evidence selection, without a separate alignment call or generating a translation.

One targeted summary correction and one repeat final review are allowed. A saved pending correction resumes the same request and sentence patch after an eligible interruption. It does not gain another correction allowance. Final negative or exhausted correction results do not offer Continue. Source cards remain when a summary fails.

## Private records and accounting

The versioned ResearchRecord comprises the server continuation session, its versioned simple checkpoint, approved answer fingerprint, and original cumulative dispatch/receipt ledger. It contains the frame, source snapshots and context, attempted queries, unresolved concerns, summary drafts, pending patches, approvals and exception use. It distinguishes unfinished, rejected and approved summaries.

A signed HttpOnly SameSite browser-session cookie owns reuse. IP addresses remain only in the existing rate limiter, never the research reuse key. Reuse matches the same visitor, NFC/whitespace-normalized question, language, normalized history and source/model/review configuration. Case and meaningful words remain significant. Separate visitors and different histories cannot share an approval.

Storage remains process memory, with twenty-minute idle retention, at most sixteen sessions and the existing eight-MB record/journal bound. Running work is not stopped by retention. Restart or incompatible configuration invalidates recovery honestly. No database migration or persistence was introduced.

Reusing an approved answer requires re-fetching originals, context and displayed scholar translations. Fresh Quran and HadeethEnc reads bypass the day-long content cache. Current library publication/rights gates remain in force. Unavailable originals pause delivery of the summary without discarding its old approval. Changed evidence invalidates dependent approval and issues targeted integrity notices while retaining containers. Changed wording, context or policy never inherits old approval. An unchanged compatible completed answer returns with zero AI calls.

Duplicate active submissions return the existing token/status and do not create a second model run. Explicit Stop marks the owned session cancelled and aborts its research. A dropped connection remains a truthful interrupted attempt, not accepted background execution. Continue reuses the original cumulative allowances and receipt reservations. A completed negative review cannot be reset by simply submitting the identical question again within its retention period.

The actual HTTP model-dispatch ceiling is nine for the entire answer, including provider fallback and Continue. The previous spending, requested-output-token and privacy limits remain. Unknown charges remain reserved. Cached responses cost no dispatch. The private trace adds simple_research_accounting with actual dispatch count, receipt status, cost and elapsed time; it does not add visitor wording to ordinary logs. A fresh four-call path is proven offline. One manual live attempt also used exactly four actual dispatches, but its summary was blocked by an excerpt-reference collision described below.

## Switch and rollback

ASK_SIMPLE_PIPELINE is local-development-only and ignored in production/Vercel. The checked-in example defaults to false. The local .env.local preview is enabled for Mo's manual acceptance; this is not a claim that live quality has passed. It also requires the existing v3 stable reader and English/Arabic. German stays postponed.

Set ASK_SIMPLE_PIPELINE=false to return to the retained old stable implementation. Old saved-answer readers remain. Do not remove that rollback path until live acceptance passes. The local response header X-Ask-Pipeline: simple-v1 identifies the preview without exposing internal records. An empty validation-only POST to the running localhost:3000 route returned this header and HTTP 400, proving activation without submitting a model question.

## Offline evidence

- Final focused suite after the manual-reference repair: 265 tests across 27 files passed. This is not a claim that every repository test was repeated.
- TypeScript and production build passed. Existing metadataBase and broad private-index tracing warnings remain.
- Actual question-planning entry point follows exactly four scripted AI tasks. Tests cover all seven nonempty source-family combinations, empty results, source identity errors, contradictions, missing context, condition loss, targeted correction, recovery order, unchanged reuse, changed/unavailable evidence, translation alignment, unknown charges, nine actual sends, isolation, expiry, duplicate submissions and explicit Stop.
- Captured source-ID, missing-coverage, copy/correction, interrupted-connection and approved-summary-envelope failures were replayed from private saved provider responses with zero paid calls. These preserve recorded decisions; they are not newly invented semantic approvals or proof of live quality.
- Actual AskChat and StableAnswerView browser checks used a clearly labelled offline harness and invented evidence. English/Arabic, canonical downward reveal, keyboard Show full text, reduced motion, 390x844 phone width and 1440x900 desktop width passed. No horizontal overflow or extra document scrolling was observed. Scrolling up held position and exposed Jump to latest, which returned to the bottom.
- Harness: scripts/preview-simple-ask.ts. Private browser report: work/private-ask-evaluation/simple-ui/browser-report.json. It does not load .env or call models, source services or a real account.

## Fixed manual live acceptance

Use a new chat for each question, once per language, without retrying until a favourable result appears:

1. English: What do the Quran and authentic Sunnah teach about keeping promises?
2. Arabic: ما حدود طاعة الوالدين مع وجوب الإحسان إليهما؟

After these, record complete/incomplete result, exact actual dispatches, cost receipts, time to first committed source group and total research time. Read every displayed summary assertion against its cited originals, preserving audience and conditions. Check that source sections stay visible and the summary appears last. Repeating a compatible completed question with identical conversation history should revalidate sources and reuse approval without AI calls; changed history is deliberately a different key.

## First manual result and review-reference repair

Mo's manual trust/planning test published its first checked source section at 44.674 seconds and stopped after 60.700 seconds total research, with four actual model dispatches costing $0.00769895 and no pending receipts. The summary was incomplete, not a success. Its primary review returned positive decisions, but the condition comparison for its second scholar source selected C1E2, which belonged to the first source in that field's 400-character excerpt list. The primary citation list used 600-character excerpts, so that same E2 label named the second source there. Reusing labels across differently sized lists created an avoidable ambiguity; the server correctly rejected the wrong-source reference.

The combined-review v2 contract now gives citation, condition and negative-finding choices distinct namespaces. Condition references include the exact claim, source position and excerpt number, such as C1S2K1. Code validates the source/reference pair and only resolves known identities to unchanged originals. Unknown, old, cross-source and mixed references remain rejected. No previous failed response is relabelled into an approval. The policy fingerprint was bumped so old review/checkpoint approvals cannot be reused under changed rules.

New controls reproduce the multiple-excerpt collision, require disjoint namespaces, preserve grounded negative findings and reject cross-source condition references. The private saved-response replay preserves the original refusal. Script: scripts/replay-simple-review-collision.ts. No paid repeat was performed after this repair. A new live quality check remains Mo's responsibility by his choice.

No live completion rate, general cost reduction, response-time improvement or broad answer reliability has been established yet. Useful complete live answers and stable reuse remain the acceptance gate. Hosted execution limits and durable background workers remain separate work.


## Arabic parents test: empty recovery plan

The manual Arabic parents question ended incomplete after 59.505 seconds and four actual dispatches costing $0.00601047, with no uncertain receipt. Quran and Sunnah source sections remained available. The combined selector identified missing coverage. The question planner returned no backup phrases, so the recovery allowance was marked used without running a new search. The writer then refused twice because the selected evidence did not cover the full question.

Recovery now uses up to six novel English/Arabic phrases already present in the validated question plan when there are no usable backup phrases. It still targets the first uncovered concern, stays within one recovery batch and performs no additional planning call. A clear missing-evidence refusal now stops without repeating the same summary request. Source selection, final meaning, citation and conditions checks remain unchanged.

The saved frame replay identified six unused planned searches across the three source families with zero paid calls. This proves the empty-backup path is repaired; it does not prove those searches will find sufficient sources or that the final answer will pass. A separate issue remains visible in the trace: some relevant specific examples were excluded from direct general coverage, and the returned scholar candidates did not address the question. The new recovery may improve discovery, but its real results and summary need another user-run test before claiming completion.


## Arabic question on the English interface

Manual request `0f55f7e8-e0c4-4ecd-9a6c-2c808189ce90` completed in 94.589 seconds, using four actual dispatches at $0.00964124 with no uncertain receipt. The server produced a structurally valid Arabic answer with Quran, Sunnah, scholars and a checked summary. The request used the English interface, so the frontend incorrectly rejected the answer solely because its language did not equal the interface language. This caused the client to report an interruption despite successful research.

The non-durable reader now accepts an otherwise valid answer in its own checked language, and summary paragraphs use automatic text direction. Durable patient transport retains its existing language contract. No source, claim, evidence or review checks were relaxed.

The exact saved terminal answer was replayed through the real AskChat and stable reader on the English interface with no provider calls. Its Arabic summary, source sections and disclaimer appeared without the interruption message. Focused tests and TypeScript passed. This demonstrates delivery of the recorded answer, not independent scholarly certification or a new live run.
