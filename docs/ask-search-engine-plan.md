# Bayan: a search and answer engine built around meaning

Created 20 October 2026. Status: implementation in progress. See the [implementation record](ask-search-engine-implementation.md) for current evidence and open phase gates. No production release is claimed.

## 1. The product goal

A visitor should be able to ask a sincere question in ordinary Arabic, English or German and receive an understandable answer that addresses the actual concern, shows the relevant evidence and explains its limits. Accuracy and useful explanation come before speed. Searching more sources is useful only when it produces better support or a necessary qualification.

We will build one shared engine, not a growing collection of exceptions for individual questions. Meaning-based search proposes relevant material; it does not decide religious truth. Every substantive answer claim still needs support from an eligible original passage.

This plan replaces neither the approved source methodology nor existing editorial approvals. It develops the retrieval, context, checking and execution design. It does not authorize bulk imports, new providers, spending, database writes or deployment by itself.

## 2. What the current evidence establishes

Local request `c9765f61-9d07-4765-a83e-3de4ed8a99aa` completed in 37.39 seconds. It found 16 Quran verses, eight hadith and one scholarly excerpt initially. Candidate ranking kept four hadith; the selector rejected them and the scholarly excerpt as unrelated. Recovery found eight hadith and effectively the same irrelevant fatwa again. Three Quran verses reached the answer. The first checked section arrived at 29.40 seconds. There was no search timeout.

The code and trace establish these repair points:

- HadeethEnc retrieval uses title-word matching in `lib/sources/hadith.ts`. The local attempt used this mode.
- `lib/ask/retrieval.ts` ranks candidates through word overlap before the semantic selector can inspect them. A potentially useful limited example was dropped at this stage.
- `lib/sources/hadith-library.ts` provides a separate stored Bukhari/Muslim route. We must measure its coverage and compare it with HadeethEnc rather than assume that enabling it solves retrieval.
- Stored hadith and scholars currently share a database candidate function whose result limit can be consumed before the source-kind filter. Separate eligible pools are needed.
- `lib/sources/videos.ts` searches titles. The rich answer path deliberately starts with no video candidates, and the rich result currently has no video field. Existing legacy video code does not establish video support in rich answers.
- The checker accepted largely repeated explanations as useful and non-repetitive. A valid citation structure did not establish a good answer.
- A summary clause about provision was accepted under Quran 51:56 even though that wording belongs to the following passage. Context, evidence span and displayed reference need to be aligned explicitly.

Historical import reports describe larger collections than the active request used. Those reports are not a fresh database inventory. No current production configuration, complete source count, permission inbox or account billing state was audited for this plan.

## 3. The two parts of the system

### Prepare the sources before visitors ask

Approved source acquisition → exact originals and metadata → meaningful passages with context → keyword and meaning indexes → quality checks → versioned searchable release.

This work happens in background batches. A visitor should not trigger downloading an entire library, embedding every document or transcribing a lecture.

### Research each visitor's question

Understand the question → parallel source searches → combine results → read and rank by meaning → check context and source eligibility → identify missing support → bounded recovery → write explanations → independently check → stream safe sections → final consistency check → complete or clearly incomplete.

Search order and display order are separate. Source searches run in parallel. Written sections remain Quran, Sunnah, scholars, then Bayan's summary. Videos follow as optional further learning, or as a clearly attributed scholarly source only when an eligible exact transcript segment has passed the same evidence checks.

## 4. Phase 0: establish the collection and the benchmark

**Deliverables:** source inventory, current-engine baseline, representative evaluation set, cost model and dependency list.

Record for each source family: available, actually indexed, searchable in the active route, eligible for Ask, missing context, translation quality, refresh state and known gaps. Include Quran/tafsir, both hadith providers, stored scholarly excerpts, official live scholar sites, approved video metadata and any authorised transcripts. Identify disabled routes separately from missing content.

Read actual rights records and available permission correspondence without changing them. Search indexing, embeddings, full-text storage, translation indexing, AI processing and transcript use are separate capabilities, not one permission flag. Do not assume a published source permits every derivative use.

Build 100 distinct question intents with Arabic, English and German versions, including the existing failures. Group paraphrases and language equivalents together when splitting tuning and held-out sets, so the same concern cannot leak into both. Reuse the existing frozen regression set and add a held-out collection. Include belief, difficult objections, worship, quantities, practical steps, money, family, legitimate differences and unanswerable questions.

For each intent, record relevant source spans, alternative acceptable sources, essential qualifications, forbidden inferences and whether the answer is actually available in the eligible collection. A human source-faithfulness review must establish these labels. Model-generated labels may assist drafting but cannot be the sole answer key.

Use recorded data and offline scripted checks first. The existing unsettled evaluation reservation must be reconciled before any paid embeddings, reranker, new indexing or live comparison. Do not silently reset the ledger or replace a provider to bypass it. Start later paid work with a small representative pilot and a written cap, not all 300 language versions.

**Exit:** a reproducible baseline and an honest coverage report. “Our collection does not contain the needed answer” and “our engine failed to find it” must be measurable separately.

## 5. Phase 1: build a reliable source index

**Deliverables:** a source contract, local index prototype, ingestion checks, versioning and refresh design. Database migrations are proposed separately and applied only within a subsequently authorised implementation step.

Each searchable passage needs:

- Stable source, document and passage IDs; source kind and canonical URL.
- Exact original text and hash; explicit book/verse/hadith/fatwa reference; passage boundaries and parent/context links.
- Named scholar or speaker; approved identity and domain/channel provenance.
- Hadith grade, grader, collection, numbering scheme and edition/provider identity. Equivalent reports can be linked without merging their wording or treating duplicates as independent evidence.
- Original language and translation records matched to the exact excerpt and language, with named translator or AI/human-review provenance.
- Search/AI/storage/embedding permissions, approval state, freshness and revocation status.
- Index generation, normalisation version, embedding model/version and source-content version.

Normalised text and vectors are search aids. They never replace the original displayed or checked text. Generated topic labels and search descriptions are also navigation aids, not evidence. Preserve negation, numbers, exceptions, pronoun referents, question/answer boundaries and quoted opposing views.

Passage preparation is source-specific:

| Source | Search unit and required context |
|---|---|
| Quran | Verse or coherent verse range, linked to surrounding verses and separately attributed eligible tafsir. A translation is not tafsir. If a claim needs 51:56–58, cite and display that range rather than attaching it to 51:56 alone. |
| Hadith | Complete usable report with headings, grade and identity. Preserve the stored full body. Any approved search view of chain versus report must retain offsets and never silently alter the original. Continuation reports must link to their antecedent or remain ineligible. |
| Scholarly answer | The actual question, coherent answer passage, conditions and parent answer. A 600-character quotation is insufficient when its missing continuation changes the meaning; retrieve eligible context or mark the gap. |
| Video | Title, approved channel/speaker metadata and, only when available and authorised, coherent timestamped transcript segments with adjacent context. |

Start with the existing Supabase/Postgres stack for private text/vector indexes. Avoid a separate search cluster until recall, latency, size or operational evidence justifies it. Supabase documents full-text plus vector retrieval and result fusion; it does not make the source judgments for us. [Supabase hybrid search](https://supabase.com/docs/guides/ai/hybrid-search)

Quran Foundation's current terms explicitly address retrieval and derived embeddings, distinguish retrieval from model training, and specify storage/synchronisation conditions. Check the applicable resources and account capabilities before choosing persistent indexes. Use authorised Content Sync where required and supported, or an eligible live/short-lived route. Do not assume keeping embeddings while deleting the original bypasses restrictions. These terms differ from some older project notes. [Quran Foundation terms](https://api-docs.quran.com/legal/developer-terms/)

Retain every currently permitted path while an unclear new use is unresolved. An unavailable embedding permission must not block all ordinary live source searches.

**Exit:** each indexed passage resolves to an eligible exact original and its necessary context. Revoked or changed sources can be removed from indexes and downstream cached answers.

## 6. Phase 2: understand and retrieve by meaning

**Deliverables:** multilingual hybrid retrieval with per-concern provenance and an independently measured ranking stage.

The question contract records the original concern, relevant conversation context, distinct requested points, requested numbers/steps/reasons, actual circumstances, possible ambiguity and the evidence needed. Neutral descriptions must not contain an invented answer. General learning stays general even when the visitor says “I”. More than four concerns must produce an honest clarification or a deliberately extended supported contract, not silent omission.

For each concern, search the applicable source families with:

1. Exact references, named passages and quoted wording.
2. Full-text keyword search across eligible content, not merely titles.
3. Multilingual semantic retrieval, which compares numerical representations of meaning.
4. Optional source-specific Arabic reformulations, keeping those reformulations distinguishable from evidence.

Use original-language passages plus eligible language views. Test direct English/German-to-Arabic retrieval against Arabic query reformulation. Normalise spelling for lookup without changing originals. Do not rely on English stemming for Arabic or German. Benchmark analysers, domain vocabulary, inflection, negation and Quranic/classical wording.

Compare a small shortlist of multilingual embedding candidates such as BGE-M3 and multilingual E5, and an eligible hosted option if useful. These are candidates, not preselected winners. Select on Bayan's Arabic religious vocabulary, cross-language retrieval, licensing, hosting cost and representative negatives. Keep current writing/checking model chains initially. [BGE-M3 paper](https://arxiv.org/abs/2402.03216), [multilingual E5 report](https://arxiv.org/abs/2402.05672)

Fuse lexical and semantic rankings, initially using reciprocal rank fusion. Similarity is relevance, not authenticity or claim support. Treat permissions, publication and source-kind eligibility as filters before bounded result lists; one family must not consume another's candidate pool.

Starting experiment sizes, to tune rather than hardcode as truth: retrieve around 20 lexical and 20 semantic candidates per applicable source family per concern; deduplicate and cap the combined request pool around 120; rerank coherent passages and context to around 30 candidates before evidence selection. Cap query fan-out explicitly for multi-part questions and log every truncation. Reserve candidates per concern and retrieval method so word overlap cannot discard all semantically useful results first.

A cross-encoder or comparable reranker reads the question and passage together. Its job is to prioritise meaning and contribution; source support still requires the later evidence assessment. Reranking a bounded candidate set is an established design, not a guarantee that one model will work for this collection. [Semantic reranking](https://www.elastic.co/docs/solutions/search/ranking/semantic-reranking)

**Exit:** semantic retrieval adds relevant material on held-out paraphrases without unacceptable irrelevant matches, including runs with all topic-specific reference hints disabled. Exact-reference performance remains intact.

## 7. Phase 3: assemble evidence and investigate genuine gaps

**Deliverables:** a source-to-concern evidence map and a bounded research controller.

Assess shortlisted passages against the actual concern and surrounding text. Classify each usable contribution as direct support, supporting explanation, limited example, qualification or attributed conflicting position. Record which precise span supports which potential statement. Context alone cannot silently become proof of a different claim.

Multiple sources may establish complementary parts of an answer. Quran can explain the principle while authentic hadith or scholarship explains its application. Neither “answers everything alone” nor “contains the same words” is the acceptance rule. Do not require three source families for a genuinely complete answer, and do not manufacture material to fill empty headings.

Create a gap report for missing reasoning, conditions, definitions, practical steps or conflicting conclusions. Permit up to two distinct recovery rounds as a starting policy, with a request-wide operation and spending budget. Each round must change a query, retrieval method, relevant context range or eligible source path in response to a named gap. Track visited IDs, URLs and hashes. The same fatwa under two URL forms is one result, not a successful recovery.

Use live searches only through the existing approved official-source connectors. Live discoveries still pass source, text, authenticity, permission and context checks. A better search engine does not authorize searching arbitrary religious websites or automatically approving new material.

Stop when all required concerns have support, no new useful evidence appears, a budget is exhausted, or a dependency fails. Report the correct state: corpus gap, index gap, retrieval miss, eligibility exclusion, unresolved difference, source outage or processing failure. No technical failure should be reported as proof that religious evidence does not exist.

Religious disagreement cannot be settled by retrieval scores, majority counts among retrieved scholars, model confidence or repeated quotations. Preserve the current reviewed-view decision rules.

**Exit:** selected evidence covers the actual question, or a specific honest gap remains. No unbounded “keep thinking” loop and no hardcoded answer for the worship example.

## 8. Phase 4: explanations that answer and survive scrutiny

**Deliverables:** a checked answer contract, improved checker criteria and richer reading experience.

Use the current Quran → Sunnah → scholars → Bayan summary layout, keeping source cards unique and citations immediately usable. Each paragraph must explain a distinct contribution in ordinary language. Explain the difficult part, not just repeat verse translations or prepend “the scholar stated” to several similar sentences.

The writer receives the eligible evidence map and context, never permission to fill gaps from model memory. Keep the original concern available as untrusted question data so the answer does not drift toward an easier nearby topic. Source pages and transcripts are also untrusted data, not instructions.

Check three things separately:

1. **Support:** exact citation span, original wording, translation alignment, attribution, audience, negation, conditions, quantity and causal meaning.
2. **Coverage:** which surviving sentences answer each actual concern and which necessary qualifications remain missing.
3. **Usefulness:** connected explanation, understandable terms, no repeated meaning, direct synthesis and a next step relevant to the question.

Require structured findings with sentence IDs and concrete failure reasons, not only yes/no judgements. An overall “no repetition” result must identify distinct contributions or flag duplication across sections and summary. Check final prose after corrections; repairing a reference ID alone cannot repair unsupported wording. Include faithful and subtly wrong summaries in the checker benchmark.

Allow one evidence-bounded correction. If the evidence map itself is defective, return to the research controller only within its remaining round budget. No recursive writer/checker loop. Retain independently safe sections if later material fails; withhold unsupported conclusions and visibly withdraw any earlier section invalidated by the combined check.

Keep one quiet scope notice. Refer someone for individual scholarly advice only when actual circumstances, missing facts or unresolved interpretations require it. A general educational question must receive an educational answer when the eligible evidence supports one.

AI display translations stay clearly labelled, excerpt-matched and checked; they do not establish evidence or inherit human approval. Do not introduce per-question paid translation generation as a hidden cost.

**Exit:** blind source-faithfulness review and usefulness review both pass. A citation format test alone never marks this phase complete.

## 9. Phase 5: give careful research a reliable production lifetime

**Deliverables:** a durable research job, resumable event delivery, cancellation and controlled costs. Prototype before changing the public execution path.

Accuracy takes priority over first-token speed. More time must correspond to useful work and visible honest status. Remove dependence on a single browser connection for the lifetime of a production answer. A long response still has hosting limits; streaming does not remove them. Verify the actual deployed platform and plan rather than assuming that the current code's 60-second setting is the platform's maximum. [Vercel function limits](https://vercel.com/docs/functions/limitations)

Proposed contract:

- An authorised POST starts or attaches to one research job using a visitor-generated idempotency key. It returns an opaque job ID, not a question in the URL.
- A private worker executes checkpointed stages. Store only the bounded encrypted state needed to resume and check the answer. Candidate research state is not a completed or approved conversation.
- The client subscribes to sequenced events or polls the same job. A dropped connection reconnects to that job without repeating paid work. Stop is an explicit cancellation action propagated to the worker and providers; a transport disconnect is distinct and can have a short reconnect grace period.
- Anonymous jobs require a scoped secret capability tied to the session; logged-in jobs enforce ownership. Never expose other visitors' questions or candidate sources through guessable IDs.
- Worker redelivery must not duplicate model calls. Use per-stage leases and recorded provider request IDs, usage and completion state. Where provider execution or billing is uncertain, pause and reconcile rather than assuming a retry is free or exactly-once execution is guaranteed.
- Preserve a finite request budget, initial candidate/round caps and a configurable long-job watchdog. Choose duration from the measured pilot distribution, not an arbitrary tiny stage cutoff. A stalled provider still needs a bounded transport limit and an honest failure outcome.
- Stream complete independently checked sections. The final terminal event distinguishes complete, incomplete, cancelled and failed. A failed final check can withdraw earlier text. Save to chat only after a valid completed terminal result.

Use durable queues/workers supported by the verified deployment environment. Keep the public website and research worker independently scalable. Increasing the current function duration may be a temporary improvement if the actual account supports it; it is not the long-term resumability design.

Version the job/events contract while preserving rich v4 and saved v3, legacy JSON and approved v2 prepared answers. Add an opt-in async API instead of silently changing old clients. A chat save failure must not regenerate the answer.

**Exit:** slow providers, worker restart, Stop, dropped connections and duplicate submissions do not lose safe progress, leak data, create conflicting finals or automatically repeat uncertain paid work.

## 10. Phase 6: videos that add useful teaching

**Deliverables:** rich-format video support, approved-channel retrieval and, separately, eligible timestamped transcript evidence.

There are two levels:

- **Related learning:** an approved title/description suggests a useful video. Show it as further learning. Do not claim to have checked its detailed statements or an exact answer segment.
- **Transcript-supported explanation:** an authorised transcript, exact speaker identity and coherent timestamp span are available and checked. This can supply a named scholarly explanation with context and an exact link, clearly identified as video/transcript evidence.

An approved channel does not automatically approve every speaker, upload or transcript. Verify the relevant scholar identity and segment. Auto captions may assist discovery; uncertain Arabic names, negation, numbers and rulings require comparison with the recording or a reviewed official transcript before evidential use. A human review state is separate from model screening.

YouTube's official caption-list endpoint does not return transcript text; the download endpoint requires authorisation and permission to edit the video. Do not assume an API key enables downloads for every public lecture. Obtain official supplied transcripts, authorised channel access or another expressly eligible source. Missing transcript access leaves the metadata-only learning route available. [Caption listing](https://developers.google.com/youtube/data/reference/rest/v3/captions/list), [caption downloads](https://developers.google.com/youtube/data/reference/rest/v3/captions/download)

Search eligible transcripts by both meaning and words, expand adjacent segments, and return the relevant start/end timestamps. Keep transcript original, checked translation and any AI summary distinct. Never transcribe an entire catalogue during a visitor request. Refresh removed/unavailable videos and honour click-to-load playback. Written answers do not wait for optional videos; offer at most two meaningfully different clips initially.

Implement a versioned optional video field/event, validation, rendering and saved-conversation hydration together. Video evidence, if supported later, must participate in the evidence contract rather than being smuggled into an unchecked attachment.

**Exit:** useful clips appear in the rich experience, exact timestamps are supported where claimed, and neither video outages nor unavailable transcripts break the written answer.

## 11. Phase 7: prove the improvement and release gradually

**Deliverables:** a comparative report, independent review record, Mo's preview acceptance and reversible deployment.

Evaluate in layers so we know what improved:

| Measure | What it tells us |
|---|---|
| Eligible corpus coverage | Does the searchable collection actually contain sufficient material? |
| Retrieval recall at 30 | Did useful evidence reach the reranker/selector, including semantic-only matches? |
| Ranking quality | Were useful passages prioritised over plausible but irrelevant matches? |
| Qualification retention | Did conditions and exceptions survive passage selection and writing? |
| Claim support and full answer coverage | Did the delivered answer stay faithful and answer every requested concern? |
| Unsupported completion, repetition and unnecessary referral | Did the checker accept a bad answer or withhold a useful one? |
| Latency and reliability | First checked section, total completion, failure stage and cancellation behaviour. |
| Cost | Per-index refresh, search, rerank, answer/check, failed attempt, completed answer and concurrency level. |

Proposed acceptance gates, fixed after the baseline and before tuning:

- 100% passing exact-reference and permission/isolation regressions; no approval leakage, fabricated references or cross-visitor access.
- At least 95% of known required evidence units retrieved within the final 30-candidate pool on corpus-answerable held-out cases, with results broken down by source family and language. Show sample sizes and observed rates; no universal accuracy claim.
- At least 90% fully answered in the first integrated pilot, and 95% before broad rollout on the reviewed corpus-answerable set. An incomplete answer is not a pass simply because it is safe.
- No observed serious unsupported claim, scope reversal, fabricated translation or falsely complete answer in release review. One serious case blocks release pending repair and regression coverage; zero observations are not proof of zero risk.
- Fewer thin/repetitive answers and unnecessary referrals than baseline, without increasing unsafe completion or hiding evidence gaps.
- Success on held-out questions, unfamiliar paraphrases and tests with reference hints disabled. Do not tune only to the worship or repentance examples.
- Equivalent meaning and qualifications across Arabic/English/German; assess Arabic direction, phone layout, long German, keyboard access, source navigation and screen-reader progress.
- Complete cancellation/resume/source-outage scenarios and a load test against simulated providers before spending on live concurrency tests.

Offline checks precede the six-question guarded live comparison already planned, two questions per language. Six answers are a smoke comparison, not proof of the full accuracy target. Expand human-reviewed live evaluation only in separately budgeted batches after reconciliation. Do not repeatedly run paid end-to-end tests when a deterministic offline failure already explains the issue.

Release the new retrieval in shadow mode on authorised test traffic first, then owner preview, then a small controlled production rollout after source-faithfulness review and Mo's acceptance. Shadow comparison must not double paid generation for ordinary visitors without a budget and privacy decision.

Keep independent switches for hybrid retrieval, semantic reranking, expanded recovery, durable execution, rich output and videos. Record index/model/prompt versions in diagnostics. Rollback must restore a coherent previous combination, not mix incompatible vector dimensions or stale approvals.

## 12. Phase 8: grow the platform on the proven foundation

Only after the Ask release gates pass:

- Add more eligible scholarly material in audited batches, measuring which real gaps each batch closes.
- Add languages after language-specific retrieval and native-language review, not merely translating interface labels.
- Let lessons and Hard Questions link to evidence and helpful follow-ups. Their website publication does not automatically approve their prose as Ask evidence.
- Add learning progress without inferring someone's beliefs or storing sensitive question history without consent. Topic suggestions are navigation, not religious diagnosis.
- Support a real scholar-review workflow with exact source/content hashes. Do not relabel automatic screening or Mo's editorial acceptance as scholar review.
- Use privacy-preserving issue categories and owner-approved reports to prioritise gaps. Do not silently publish visitor questions or create an uncontrolled public answer cache.

## 13. Operations, privacy and realistic scale

Keep content ingestion separate from per-question work. Re-embed only changed eligible passages, pin model versions and vector dimensions, and use atomic index generations so a request sees one coherent release. Remove withdrawn sources and invalidate dependent results. Source permission, text and translation changes require revalidation, not just a new timestamp.

For small corpora, compare exact vector search with approximate indexes; choose the simplest option that meets measured concurrency and recall. Test language/source filters before limits, search-pool fairness, duplicate clustering and a single source family's domination. Protect the database with bounded concurrency and batched context loading. Add another search service only when a measured limit warrants the operational cost.

Anonymous access remains possible. Public caches may contain only eligible, non-personal, versioned completed results with an explicit policy; never share personal questions or investigation state between visitors. Approval, source version, language and translation state are part of cache validity. A cache hit still observes revoked-source rules.

Production telemetry records stage durations, source IDs, counts, failure codes, index/model versions and usage. Full question/draft traces remain owner-local by default with the existing retention and size cap. Any production debugging that stores text needs an explicit access, consent and deletion design; indexing questions is not required for semantic source search.

Costs must include embedding ingestion/refresh, hosted or self-hosted reranking, inference, retries, worker compute, database size/backups and video transcript preparation. Self-hosting is not automatically free. Before each paid phase, produce a batch estimate and hard cap; select models on measured quality/cost rather than marketing claims. No credible total cost or schedule can be promised until Phase 0 establishes eligible volume and the pilot shows throughput.

## 14. Build order and concrete checkpoints

| Order | Finish before advancing | Deliverable |
|---|---|---|
| 0 | Inventory, baseline, answer-key sample and spending reconciliation | Coverage report and frozen evaluation protocol |
| 1 | Rights-aware source and context contract | Local versioned source-index prototype |
| 2 | Multilingual hybrid retrieval and semantic ranking | Recall/ranking comparison against current search |
| 3 | Coverage map and meaningful bounded recovery | Evidence-selection regression report |
| 4 | Useful explanations and stronger independent checking | Reviewed answer comparison |
| 5 | Durable execution, events, Stop and cost accounting | Resilience and compatibility report |
| 6 | Rich video attachments; transcript evidence only where eligible | Verified clip experience |
| 7 | Held-out acceptance, preview and controlled rollout | Release decision and rollback record |
| 8 | Audited source, language and learning expansion | Incremental platform roadmap |

Phase 5's job prototype can be designed alongside Phase 1, and transcript permissions can be investigated early. Neither should distract from proving text retrieval first. Do not spend weeks building a worldwide ingestion system before showing improved retrieval on a representative eligible subset.

The initial planning turn made no implementation or production changes. Implementation subsequently began; its authoritative progress and next work are recorded in the [implementation record](ask-search-engine-implementation.md). The phase requirements above remain intact and do not become complete merely because a prototype passes tests.
