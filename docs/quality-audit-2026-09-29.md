# Al-Bayan answer quality audit, 29 September 2026

## Honest verdict

Al-Bayan has useful approved material and several good safety gates. It does not yet deliver consistently strong answers. The main failure is that the system treats a cited, individually supportable sentence as a complete answer. It sometimes changes the question during planning, searches for the wrong fact, and then passes the resulting answer. At other times it has usable material but rejects the explanation or shows sources without helping the reader understand them.

This is a read-only investigation and a plan. I changed no application code and made no database writes. The 20-question diagnostic script and its raw step logs are outside this repository. This report is the only repository file from this audit. I read the six requested project and handoff files, the Ask pipeline, source connectors, chat component, API route, evaluation runner, question set and baseline before drawing these conclusions.

The working tree contains application changes from other ongoing work. The live results describe the code loaded by the diagnostic process on this date, and should be rerun after those changes settle. I did not edit or stage those files.

### What the numbers actually say

| Measure | Result | Meaning |
|---|---:|---|
| Quran | All 114 chapters available through the production Content and Search APIs in this local setup | Availability does not mean a relevant verse is retrieved or explains a legal question. |
| Hadith | About 2,800 eligible Bukhari/Muslim records reported by the owner | Search is over HadeethEnc titles, then a few full records are fetched. This audit did not recount the whole external catalogue. |
| Scholar quotes | 829 stored, 773 published in a read-only database count | Published: Ibn Baz 550, Ibn Uthaymeen 195, al-Albani 22, al-Barrak 6. Four scholars have usable quotes in this library, with a strong Ibn Baz skew. |
| Videos | 21,482 approved rows in a read-only database count | They are optional suggestions after an answer, not answer evidence. |
| Published answer packages | 0 in a read-only database count | The table exists, but the Ask path has no package lookup. |
| Existing 90-question baseline | 40 explanations, 12 source-only, 21 no-source, 11 ask-scholar, 6 out-of-scope | Among the 73 general questions, 40 got an explanation and 21 got no source. These are outcome counts, not correctness scores. |
| This 20-question live trace | 13 explanations, 5 no-source, 1 ask-scholar, 1 timeout | Several of the 13 explanations were still incomplete, repetitive or hard to understand. No qualified scholar graded these answers. |
| Time | Baseline median 13 seconds, 90th percentile 18 seconds; live trace median 16.8 seconds, 90th percentile 21.4 seconds | One live question reached the 50-second pipeline deadline. The 20-question run was cold and instrumented, so it is not a production benchmark. |

The baseline file is [docs/eval-2026-09-29-baseline.txt](eval-2026-09-29-baseline.txt). The live trace used the real writer, verifier and source connectors with `.env.local` loaded, including `QURAN_API_ENV=production`. It asked 20 varied Arabic, English and German questions sequentially. I then ran three more identical English gold-zakat questions to check consistency. One diagnostic wrapper omitted the normal seven-second cap around live scholar search; it used the same search and merge logic. The run made no database writes. These 23 questions are a small diagnostic sample, not an accuracy estimate for all Islamic subjects.

## Where quality is lost

| Step | What the code does | What the trace showed |
|---|---|---|
| Understand | The writer turns the visitor's words into up to four requested points and search phrases in [core.ts](../lib/ask/core.ts), then [retrieval.ts](../lib/ask/retrieval.ts) validates them. | Arabic gold zakat changed “how much is due” into “amount or nisab threshold.” German five pillars added a demand for definitions that the visitor did not ask for. The German conversion question was classified as personal by a broad phrase rule. |
| Search | Six Quran queries return at most eight verses. Hadith title search and Arabic scholar search run beside it. | Arabic gold zakat got many verses mentioning gold, not the rate. The five-prayers question got a hadith on forgiveness between prayers, not why there are exactly five. German five pillars got no hadith candidate despite a known hadith appearing in the baseline in other languages. |
| Candidate choice | At most eight Quran verses, three hadith and four scholar quotes reach the selector in [core.ts](../lib/ask/core.ts). | The scholar path normally puts at most two stored quotes before live quotes. Search can fill these slots with near-topic material while a better passage stays below the cut. |
| Evidence selection | The Lite verifier marks each passage direct or not; code requires every requested point to be covered. | It marked the five-prayers reward hadith direct for a reason question, but the writer later refused. It marked gold-threshold quotes direct for the malformed “amount or nisab” point. This is both a false positive and a missed answer. |
| Drafting | The writer gets the selected passages and must make at most four short one-fact sentences in [core.ts](../lib/ask/core.ts) and [checks.ts](../lib/ask/checks.ts). | Fasting produced three sentences, two repeating the same purpose. Repentance produced only one step, regret, despite asking how to repent. The gold answer said “one-quarter of one-tenth” without the plain 2.5% expression. |
| Copy checks | Code rejects a drafted sentence that shares short spans with Quran or hadith text, then retries. | The baseline has 12 source-only results, including six after a copied-source draft. Protecting exact scripture is correct, but the current drafting task often cannot produce a useful paraphrase that passes the rigid check. |
| Final screening | The Lite verifier checks support, coverage and fairness, then may trigger a redraft or source-only fallback. | It passed the repetitive fasting answer and the one-step repentance answer. It passed the earlier owner-observed gold threshold answer. One live gold run timed out while screening after the wrong question frame had already been accepted. |
| Fallback and display | A source-only result prints selected passages; a refusal says no trusted source found. [AskChat.tsx](../components/AskChat.tsx) has sections for short answer, sources, scholar quotes and videos. | Sources alone are often a poor response to a serious question. The final UI has no working “other scholarly views” fold for real answers. German and English readers see scholar quotes in Arabic only. |

### The 20 live questions, with the point of loss

| Question | Result | Most important observation |
|---|---|---|
| Gold zakat: conditions and amount, Arabic | Timeout at 50 s | Frame replaced amount due with threshold. A live quote described one part in forty, but the selector kept threshold quotes. Screening then timed out. |
| Mercy and eternal Hell, English | No source | Fifteen candidates, none selected as directly reconciling mercy and eternity. Refusal is safer than a two-sentence non-answer, but the knowledge gap remains. |
| Why five daily prayers, English | No source | Selector wrongly marked a hadith on expiation between prayers as a direct reason; writer refused it. |
| Why five daily prayers, Arabic | No source | Thirteen candidates, none direct. The system does not separate “why pray” from “why exactly five.” |
| Gold zakat: conditions and amount, English | Answer | Correct rate was present but phrased “one-quarter of one-tenth,” not 2.5%; no clear distinction between threshold and payment. |
| Mercy and eternal Hell, German | No source | Fourteen candidates, none directly answered the challenge. |
| Why fast Ramadan, English | Answer | Three claims passed, with two near-duplicates about God-consciousness. |
| Why face Mecca, German | Answer | Four sourced reasons centered on the change of qibla; the answer could lead with the direct reason more clearly. |
| Bank-loan interest, English | Answer | Quran and Ibn Baz were cited; it gave a direct two-sentence answer. |
| Obligatory acts of wudu, Arabic | Answer | Quran 5:6 and a scholar quote were used; it gave the core acts in two sentences. |
| What Ayat al-Kursi teaches, English | Answer | Four claims from the named verse, broadly responsive. |
| Why intention matters, English | Answer | Two sentences repeated the reward/intention point. |
| Five pillars, German | No source | Frame demanded “definitions” as well as the list. Hadith title search returned nothing; Quran results were incidental. |
| Sick person's missed fasts, English | Answer | Direct two-part answer, with permission and later make-up days. |
| Number and conditions of wives, English | Answer | Direct Quran and scholar evidence, but four sentences repeated the four-wife limit. No real other-views structure. |
| Daughter's inheritance share, English | Answer | Gave three common arrangements from Quran 4:11; useful but should explain that the share depends on who else inherits. |
| Conditions for Hajj, Arabic | Answer | Quran and Ibn Uthaymeen quote gave the core conditions. |
| How to repent from a serious sin, English | Answer | Only mentioned regret. The checker called the requested “steps and conditions” covered. This is a clear incomplete-answer pass. |
| Ruling on music, Arabic | Answer | One scholar sentence and no explanation of evidence or scope. It feels thin for a contested practical topic. |
| How to become Muslim, German | Ask a scholar | The rule matching “muss ich” stopped a general new-Muslim question before search. |

The exact same English gold-zakat question was then run three times. All three runs answered from the same Ibn Baz page and gave the rate as “a quarter of a tenth.” One included twenty mithqals and ninety-two grams, another singled out jewelry, and the third omitted both. All three took 15 to 21 seconds. This demonstrates changing detail and wording even when the source stays the same. It does not prove doctrinal disagreement between these three outputs.

The compact step log below records what each run produced. Search counts are Quran verse keys / hadith records / scholar snippets returned by search before the candidate caps. “Direct” is the Lite selector's label, not a human finding. A draft count of two means a redraft. The preceding table explains where the useful answer was lost or why a passing answer was weak.

| Run | Framed points | Search Q/H/S | Direct candidates | Drafts | Final screen | Outcome |
|---|---|---:|---:|---:|---|---|
| zakat-ar | conditions, quantity | 8/4/4 | 2 | 1 | timed out | error |
| hell-en | response | 8/4/4 | 0 | 0 | not reached | no source |
| five-prayers-en | reason | 8/4/3 | 1 | 1 | not reached | no source |
| five-prayers-ar | reason | 8/4/2 | 0 | 0 | not reached | no source |
| zakat-en | conditions, quantity | 8/2/3 | 3 | 1 | passed | answer, 2 claims |
| hell-de | response | 8/4/3 | 0 | 0 | not reached | no source |
| fasting-why-en | reason | 8/4/2 | 3 | 2 | passed | answer, 3 claims |
| qibla-why-de | reason | 8/4/2 | 4 | 1 | passed | answer, 4 claims |
| interest-en | ruling | 8/2/2 | 4 | 1 | passed | answer, 2 claims |
| wudu-ar | ruling | 8/1/3 | 2 | 1 | passed | answer, 2 claims |
| kursi-en | identity | 8/4/2 | 1 | 1 | passed | answer, 4 claims |
| intention-en | reason | 8/2/2 | 2 | 1 | passed | answer, 2 claims |
| five-pillars-de | definition | 8/0/0 | 0 | 0 | not reached | no source |
| sick-fasting-en | two ruling points | 8/4/3 | 4 | 1 | passed | answer, 2 claims |
| wives-en | quantity, conditions | 8/2/3 | 4 | 1 | passed | answer, 4 claims |
| inheritance-en | quantity | 8/3/3 | 1 | 1 | passed | answer, 3 claims |
| hajj-ar | conditions | 8/0/3 | 2 | 1 | passed | answer, 2 claims |
| repentance-en | steps | 8/3/1 | 5 | 2 | passed | answer, 1 claim |
| music-ar | ruling | 8/1/1 | 1 | 1 | passed | answer, 1 claim |
| conversion-de | steps | 0/0/0 | 0 | 0 | not reached | ask scholar |

## Top 10 problems, ranked by effect on the answer

| Rank | Problem and evidence | Why it matters |
|---:|---|---|
| 1 | The question frame can change the requested fact. Gold amount became nisab; five pillars gained definitions. See [core.ts](../lib/ask/core.ts) question-frame prompt and [retrieval.ts](../lib/ask/retrieval.ts) frame validation. | Every later check can approve the wrong target. |
| 2 | Search is mainly word matching rather than Islamic question matching. Quran search returned gold mentions for a zakat rate; hadith search scored short titles rather than full hadith; scholar search uses a simple text index and stops at the first nonempty search level. See [quran.ts](../lib/sources/quran.ts), [hadith.ts](../lib/sources/hadith.ts), [scholars.ts](../lib/sources/scholars.ts). | The right evidence may never reach the model. |
| 3 | Scholar material is short and uneven. Only 773 published snippets from four scholars, with 550 from Ibn Baz. Live search covers Ibn Baz and Ibn Uthaymeen only, at most two hits per site; 600 characters can omit the surrounding conditions. See [scholars-live.ts](../lib/sources/scholars-live.ts) and [scholar-rules.ts](../lib/sources/scholar-rules.ts). | Complex “why,” conditions and differences often need full context and broader approved coverage. |
| 4 | The selector is fallible and its labels become the source of truth. It called the prayer-reward hadith a direct answer to “why five.” It accepted gold threshold passages under a malformed amount point. See [retrieval.ts](../lib/ask/retrieval.ts) `parseEvidencePackage`. | A bad selection can cause a confident but off-target answer, or a needless refusal. |
| 5 | The answer format is too small for serious questions. The current maximum is four atomic sentences, with no required answer/evidence/ruling/conditions structure. See [checks.ts](../lib/ask/checks.ts) `maxClaims: 4` and [core.ts](../lib/ask/core.ts) drafting rules. | A source-linked fact is not the same as an explanation. Repentance and music showed this. |
| 6 | Final checks are too loose about usefulness. They passed repetition and the one-step repentance answer. “Every requested point has one claim” does not prove that a broad point is completely addressed. See [checks.ts](../lib/ask/checks.ts) `parseDraft`, `wholeAnswerOk`, `requirementsCovered`. | Weak answers can be labelled checked. |
| 7 | Draft and copy checks can be too strict about harmless wording. Baseline: 12 source-only answers, six directly after a copied-source draft; 21 no-source answers overall. See [checks.ts](../lib/ask/checks.ts) `copiesSource` and [core.ts](../lib/ask/core.ts) fallback. | Good evidence often reaches the user without a useful explanation, or not at all. Never relax exact scripture handling without proving the new check still catches retyping. |
| 8 | The promised view handling is not implemented. The code has no scholar-view grouping, vote count, conflict display or live other-views fold. The current selector rejects a reported conflict. See [retrieval.ts](../lib/ask/retrieval.ts), [core.ts](../lib/ask/core.ts), [AskChat.tsx](../components/AskChat.tsx). | “Al-rajih first” cannot be reliably delivered, and the source sample is too skewed to infer a scholarly majority. |
| 9 | There is no stable reviewed-answer path. `answer_packages` exists and has zero published rows, but Ask never reads it. Its facet list also omits `quantity`, `time` and `place`, which the current question frame supports. See [migration](../supabase/migrations/20260928090720_evidence_retrieval.sql), [pipeline.ts](../lib/ask/pipeline.ts). | Common questions are regenerated on every visit, with changing detail, cost and latency. |
| 10 | Language and product presentation lag behind the data. The German conversion false positive comes from [checks.ts](../lib/ask/checks.ts) `looksPersonal`; scholar quotes are shown in Arabic only in [AskChat.tsx](../components/AskChat.tsx); video titles are mostly Arabic; [eval-ask.ts](../scripts/eval-ask.ts) counts outcomes rather than answer quality. The chat displays earlier messages but sends only the latest question to Ask. | English and German readers cannot inspect the scholar's reasoning easily. A follow-up such as “Why?” has no previous-question context, and the team cannot see whether changes make answers better. |

## What a strong answer should look like

“A few one-fact sentences” is a useful internal safety unit, not a complete reader-facing format. Keep the citation rule on each claim, but assemble the claims into a short, predictable answer:

1. **Direct answer first.** State the requested number, ruling or reason in plain language. For a rate, give the percentage and the source's original form if the source permits that exact conversion. For an unanswered “why,” say which part the approved sources do explain and clearly mark the remaining gap.
2. **Why the answer follows.** Give the directly relevant Quran verse or authentic hadith from source data, with the translation and source details. Do not let the AI retype either text.
3. **What an approved scholar said.** Attribute any legal interpretation or explanation to the scholar and link the exact page. The automatic answer must not quietly turn one scholar's view into its own ruling.
4. **Conditions and exceptions.** Show these when they change the answer, each as a separate sourced claim. Do not add cases the user did not ask about unless omitting them would mislead.
5. **Other views in a closed fold.** Only when approved, directly relevant sources establish a real difference. The main answer names that a difference exists; it does not invent consensus or select a winner from a biased search sample.
6. **Optional video.** Clearly supplementary, with source/channel and language, never a substitute for written evidence.

Each section should be a data structure of small claims, each carrying the exact source IDs that support it. A section can have more than one sentence, but no sentence is uncited. The Quran and hadith blocks remain copied only from their APIs, with existing code checks. A claim's role, such as direct answer, condition or scholar view, can be checked against the question's required points. A simple subject such as a named verse may stay short. A serious objection or legal question needs a fuller explanation when sources support one; otherwise the site should refuse honestly.

## Source improvements that are likely to matter

| Source path | Current limit | Best next move |
|---|---|---|
| Quran | Quran Foundation search matches verse and translation wording. It is useful for direct verses, poor at retrieving a gold-zakat rate from words such as “how much due.” At most eight verses enter selection. | Keep the official API for exact text. Add reviewed topic-to-verse links for frequent questions, and ask for the relevant verse by key when the topic map identifies one. Add approved tafsir only after checking resource rights and AI-use permission. Quran Foundation documents [tafsir content](https://api-docs.quran.foundation/docs/api-reference/) and [verse-by-key retrieval](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/verses-by-verse-key/). |
| Hadith | The local catalogue scores titles by overlapping words, then fetches a few full records. A short title can miss a useful hadith or favor a near-topic one. | Add curated hadith IDs for common topics first. Evaluate a licensed Arabic and English full-text index only if rights allow it. The prepared Sunnah.com connector still depends on a key and on HadeethEnc title bridging; do not assume the public Sunnah.com API offers usable text search or blanket storage rights. The official API project is [here](https://github.com/sunnah-com/api). |
| Stored scholar quotes | 773 published short Arabic extracts; simple word matching and a two-stored-quote gate. | Improve the approved Arabic search document with normalized forms, common inflections, title and ruling terms weighted separately, then rerank more candidates using the full question points. Preserve the unmodified original. Review the title, context and excerpt boundary. |
| Live scholar sites | Only two sites, changing availability, short excerpts, and a seven-second overall wait in the real pipeline. | Use live search to discover a source, not as the only route to a known answer. Keep exact official links, cache only within the allowed terms, and review important pages into topic maps or answer packages. |
| Videos | 21,482 approved rows but Arabic title matching and another Lite call decide suggestions. | Tag common topics offline, keep them optional, and show language/subtitle availability. They should never decide the written answer. |

I would build curated topic-to-evidence maps before embeddings. The first 100 to 200 frequent questions can have reviewed Arabic/English/German intent aliases, exact source IDs, required points and known traps. This gives a large quality and consistency gain with little per-question AI cost. An embeddings layer can later broaden recall within rights-approved source text; it still needs source gates and human evaluation. It does not solve bad excerpts or a wrong question frame by itself.

## Checks to change, without weakening the safety rules

**Stronger where it matters:** Check the original user request against the structured points before search. Treat amount due, threshold, rate, time and cause as distinct. For numbers and legal conditions, require the exact requested value or a clearly equivalent expression in the final direct answer. Require each multi-step point to be broken into testable subpoints. Check that the answer is not redundant and that it states the direct answer before background material. For a scholar ruling, require the named scholar and exact supporting page. For disagreements, require a source per view and no inferred majority.

**More precise where it blocks good prose:** Keep Quran and hadith originals outside the writer and display them from API data only. Replace broad overlap rejection with a targeted retyping test that distinguishes short technical terms, named items and accidental copied clauses. Test it against deliberately altered Arabic and English scripture, plus legitimate brief paraphrases. Keep malformed citations, invented sources and unsupported claims as hard failures. If the explanation still fails, give a clearly labelled source-only result only when those sources directly address the actual question.

The present final checker is another Lite model that reads the same sealed package. That is useful but not independent ground truth. For a high-risk answer, have a reviewer or a stronger checker inspect the original intent, final prose and full source context, not only the writer's reduced frame. Use a stronger model only if a blinded benchmark shows a material gain after the cheap fixes below.

## Build order, effort, cost and proof

Effort below is rough engineering time for one person, excluding approval and translation delays. No implementation is authorised by this audit.

| Order | Build | Effort | Added running cost | Proof before moving on |
|---:|---|---|---|---|
| 1 | Upgrade the test set: gold threshold versus rate, “why five,” mercy and Hell, conversion, broad repentance steps, and 90 existing questions in three languages. Write reviewed must-contain and must-not-confuse points. | 2 to 4 days plus scholar and language review | Review time, little API cost | Fixed rubric and a locked baseline, with at least 3 runs per variable case. |
| 2 | Repair question framing and personal-question routing. Split compound questions into exact points; reject added points. | 3 to 5 days | Same budget writer, perhaps one extra Lite check only on uncertain frames | Gold amount stays distinct from nisab; German conversion reaches evidence search; no personal-case regressions. |
| 3 | Add reviewed evidence maps for the most asked topics. Improve Arabic search and candidate reranking; test Quran, hadith and scholar recall separately. | 1 to 2 weeks to start, ongoing editorial work | Storage/search modest; human source review is the main cost | Correct approved source appears in top candidates on at least 95% of the reviewed answerable set. |
| 4 | Build structured answers from cited claims: direct answer, evidence, scholar explanation, conditions, exceptions and the closed other-views fold. Expand the four-claim cap only where the question requires it. | 1 to 2 weeks | More output tokens for complex answers | Human reviewers find the answer direct, clear and complete; no uncited sentence. |
| 5 | Tighten completeness checks and tune copy checks with adversarial examples. Add numeric and requested-point gates. | 4 to 7 days | Same Lite models at first; retry rate should fall | Gold 2.5% cannot pass as nisab alone; repentance cannot pass with only one of several required steps; exact Quran/hadith retyping still fails. |
| 6 | Use answer packages for frequent general questions, with editorial workflow, versioning, source rechecks and a safe intent match. Fix the schema facet mismatch before using it. Do not cache personal questions. | 1 to 2 weeks | Less AI per repeated question; review and maintenance cost | Repeated common question gives the same reviewed package and citations; stale or withdrawn sources invalidate it. |
| 7 | Add approved tafsir and broader scholar/hadith coverage only after source and AI-use rights are confirmed. Review Arabic excerpts and translations. | Several weeks, parallel editorial work | Permission, translation and scholar review are the main costs | Each new source passes attribution, context and relevance checks, then improves measured recall. |
| 8 | Improve German/English scholar presentation, source-only wording, video language labels and report triage. Make the chat either handle safe follow-up context or clearly present each question as independent. | 4 to 8 days plus native review | Mostly translation/review time | People in all three languages understand the ruling, its source and its limits, and know whether a follow-up can refer to an earlier answer. |

### Scoring and launch gates

Add to each question in [data/eval-questions.ts](../data/eval-questions.ts): expected response type, exact must-contain points, must-not-say traps, acceptable approved source IDs or source class, and whether a difference of opinion must be noted. The test runner should keep the final answer and each stage's reason codes in a private local test artifact, never in public logs. A qualified scholar must review the doctrinal gold answers and the answer keys.

Score every answer on 100 points: direct answer 25, requested-point coverage 25, source support and citation accuracy 25, conditions and fair scope 15, language and clarity 10. A wrong core number, invented or altered Quran/hadith, unsupported ruling, wrong scholar attribution, or unsafe personal ruling is an automatic fail regardless of score. A refusal is correct only when the reviewed source set cannot support the requested answer. Source-only is a separate outcome, not a full explanation pass. For each language, report answerable recall, false refusal, incomplete pass, source-only rate, repetition stability and p50/p90 time.

Initial targets for a controlled review set: zero critical source or ruling errors, at least 95% of required points present when a full answer is shown, at least 90% of answerable questions receiving a useful explanation, fewer than 5% needless refusals, and at least 85/100 median human quality score. Three repeated runs of a common question should preserve the same substantive answer and required points. These are proposed gates, not current performance claims. A scholar should set the final religious-accuracy bar.

## Speed and price

The pipeline makes two to several serial AI calls: question frame, evidence selection, draft, final check, sometimes redraft, screening retry, source audit and an optional video-title check. Search is parallel, but a live scholar site and title catalogue can still add wait. A 50-second deadline sits inside a 60-second API limit. The live 20-question trace included one 50-second failure. [gemini.ts](../lib/ai/gemini.ts) discards the provider's token-usage metadata, so **actual cost per question is not measurable from current logs**. The present reason-code logging also cannot reveal which requested point failed.

Google's [regional Vertex AI price list](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) currently lists Gemini 3.5 Flash-Lite at about **$0.33 input and $2.75 output per million tokens**, and Gemini 3.1 Flash-Lite at about **$0.275 input and $1.65 output per million tokens** for non-global use. This is not a bill estimate. For illustration only, if one question uses 10,000 writer input tokens and 2,000 writer output tokens, plus 15,000 checker input tokens and 2,000 checker output tokens across all calls, the model charge is about **$0.016 per question, or $16 per 1,000** before retries, source calls and hosting. The real token mix may differ considerably, especially with long source context and hidden thinking tokens. Record usage by stage, model and retry before setting a budget.

No stronger model is justified as the first fix. Better framing, search, reviewed maps and completeness checks should be measured with the current Lite models first. If difficult objection and multi-source questions still fail, test a stronger verifier on that small subset only. Google's current regional [pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) puts Gemini 3.5 Flash at about $1.65 input and $9.90 output per million tokens, roughly six times the Lite verifier rate. With the example 15,000 input and 2,000 output tokens, that verifier stage would rise from about $0.0074 to $0.0446 per question. Use it only if a blind test shows enough added correct answers to justify that increase.

## Decisions Mo needs to make before implementation

1. **Who reviews the answer keys and the first common-question packages?** Human religious review is needed before calling an answer excellent or marking it scholar reviewed.
2. **How to handle a partially answerable “why.”** I recommend a sourced partial explanation plus a clear statement of what the approved sources do not establish, instead of a total refusal or a guessed reason. The current rules may require that missing-point notice be treated as interface text rather than an uncited religious claim.
3. **How to choose al-rajih when approved scholars differ.** Counting whichever short quotes search happens to find is not reliable with this library. I recommend a reviewed view decision for common disputed topics and an honest side-by-side display when there is no reviewed decision.
4. **Which content rights and permissions are settled for tafsir, longer scholar context, hadith indexing and AI processing?** Do not expand the corpus until the specific use is allowed.
5. **How much human review and translation time to fund each month.** This is likely the main ongoing quality cost. Keep the present budget models until measured evidence supports a change.

The strongest near-term move is to make the system understand the exact question, retrieve a known good source for common topics, and require a clear answer to every requested point. More raw data alone will not solve the observed failures.
