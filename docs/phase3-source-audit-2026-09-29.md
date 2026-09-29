# Phase 3 source retrieval audit, 29 September 2026

This is a development measurement, not religious approval. It used `.env.local` with the production Quran Foundation credential. The real pipeline was run on the first 30 evaluation questions plus five focused questions before Phase 3 and again after the main retrieval changes. Intermediate runs exposed a map wiring bug and extra context-fetch cost; both were fixed before the full after run. A final audit then found two false topic-hint matches, corrected them, and reran the two affected questions. The full counts below are from just before that last narrow correction. Model outputs vary, so paired runs show observations, not a statistically reliable improvement rate. No visitor question or database row was stored.

The earlier owner-provided 30-question result was 26 full, 1 sources-only, 2 refused and 1 ask-scholar. Our fresh paired baseline differed by one sources-only versus refusal. That run-to-run difference is part of the consistency problem.

## What changed

- A list of 30 common question topics provides Quran verse keys, HadeethEnc IDs and official Ibn Baz fatwa URLs as search hints. Each resolved source still goes through the existing source rules and independent evidence selector. These are not rulings.
- Quran search asks for 16 candidates, hadith search for 8, and scholar search for up to 8. The selector still receives at most 8 verses, 3 hadith and 4 scholar quotes after ranking by the requested point.
- Three direct official Ibn Baz pages fill known gaps: gold zakat rate, repentance conditions and entering Islam through the testimony of faith. A wiring error initially dropped mapped URLs in the real adapter; the final focused run includes the correction.
- Local evaluation trace hooks record the question frame, fetched source identifiers, selector candidates, source assessments and outcome. They do not run for ordinary visitors unless a local evaluator supplies callbacks.

## Paired real-pipeline outcomes

| Set | Before Phase 3 | Full after run, before final hint refinement | Separate corrected focused run |
|---|---:|---:|---:|
| First 30: full answers | 26 | 27 | n/a |
| First 30: sources only | 2 | 1 | n/a |
| First 30: refusals (`no_source`) | 1 | 1 | n/a |
| First 30: ask scholar | 1 | 1 | n/a |
| Five focused: full answers | 3 | 3 | 3 |
| Five focused: sources only | 0 | 0 | 0 |
| Five focused: refusals | 2 | 2 | 2 |
| Five focused: required points all present, no traps | **1/5** | **0/5** | **2/5** |

The full 30-question outcome count improved by one full answer, but the focused quality score did not. Gold zakat was rejected at question framing before search in the full run; a separate run answered it with the rate. Conversion cited the direct testimony-of-faith fatwa in both corrected runs, but only one wording contained the required point. Repentance cited the right three-condition fatwa in both runs and omitted two required actions. Five prayers produced a weak off-target answer in the full run. The mercy objection still refused. These are real consistency and completeness failures; retrieval alone has not made the answers excellent.

The last hint refinement removed Quran 2:256 from a “compulsory fasting” query and removed conversion sources from a “forced to become Muslim” query. The [fasting recheck](phase3-hint-recheck-fasting.json) and [forced-conversion recheck](phase3-hint-recheck-compulsion.json) confirm the correct hint IDs and absence of the wrong mapped source. Fasting changed from a full answer to sources-only on its separate rerun, another example of model variance. A further full 35-question run was not made after this two-question map correction to keep production API use moderate.

Elapsed time over the 35 sequential questions was **15.3 seconds mean, 15 seconds median** before and **15.5 seconds mean, 16 seconds median** in the full after run. The optimized version loaded neighboring Quran context only for the eight verses offered to the selector; a pre-optimization run timed out once at 45 seconds. These are wall times from one local run, not a service-level latency guarantee or billed-token measurement.

## Source-specific checks

The [source test results](phase3-source-tests.json) called each source separately using fixed local queries. The Quran test found the expected passage in **4/4** cases within the first two of 16 hits. HadeethEnc title search found the expected hadith in **1/3** cases with a known target: it missed the five-pillars hadith for a pillars query and the same hadith for a conversion query. A fourth exploratory five-prayers query returned two hadith, neither verified as explaining why the count is five. The mapped five-pillars ID did appear in the real conversion run after direct lookup. The stored scholar library produced **0/3** direct hits for gold rate, repentance steps and conversion. Live scholar search produced a direct hit in **2/3** cases; it missed conversion. Direct official-page lookup produced a usable quote in **3/3** cases when called separately. These are small diagnostic samples, not general search accuracy estimates.

In the 30-question paired trace, a Quran candidate was offered in 29/30 both times. The selector labelled at least one verse direct in 28/30 before and 29/30 after. Hadith candidates appeared in 28/30 before and 29/30 after; at least one was labelled direct in 3/30 before and 4/30 after. Scholar candidates appeared in 25/30 before and 24/30 after; at least one was labelled direct in 13/30 before and 15/30 after. These labels are model judgments, so a higher count is not automatically better.

The per-question log still shows irrelevant scholar titles among the candidates, such as a prayer omission fatwa for “why five prayers” and a different religious phrase for charity and riba. Ranking limits what reaches the selector; it does not make the underlying scholar search precise. The selector must continue rejecting such items.

## Thirty topic hints for Mo to review

| Topics 1 to 10 | Topics 11 to 20 | Topics 21 to 30 |
|---|---|---|
| Ramadan fasting obligation | Divorce waiting period | Ablution verse |
| Fasting exemptions | Widow waiting period | Theft verse |
| Fasting from dawn to night | Hajj completion | Zakat recipients |
| Qibla | Hajj conduct | Gold zakat rate |
| Ayat al-Kursi | Fatiha guidance | Repentance steps |
| No compulsion in religion | Fatiha worship | Conversion |
| Riba ruling | Intention hadith | Purpose of fasting |
| Charity and riba | Five pillars | Prayer times |
| Writing debt agreements | Polygyny limit | Justice between wives |
| Divorce count | Children's inheritance | Sincere repentance |

The exact keys, IDs, URLs and matching patterns are in [`data/topic-source-hints.ts`](../data/topic-source-hints.ts). In particular, these hints must not be read as a decision about a disputed ruling or as proof that the passage answers every wording of a question. The map deliberately has no entry for the mercy and eternal-Hell objection or an explanation of why the prayer count is five, because no directly answering approved passage was verified.

## Source misses and answer losses

The full per-question candidate IDs, quote titles, URLs and selector labels are in the read-only [before trace](phase3-before.json) and [full after trace](phase3-final-35.json). The [separate corrected focused trace](phase3-focused-final.json) demonstrates the run-to-run difference. The trace distinguishes a source that was not found from one that was offered and rejected.

An [early after trace](phase3-after.json) records the mapped-URL adapter bug before it was fixed. It is retained as diagnostic evidence, not used as the final outcome count.

| Question | Evidence finding |
|---|---|
| Gold zakat conditions and amount | Baseline found threshold fatwas but missed Ibn Baz's [rate fatwa](https://binbaz.org.sa/fatwas/5743/مقدار-الزكاة-في-خمسة-وثمانين-جرامًا-من-الذهب), which says one fortieth. The full after run failed in framing; the separate corrected focused run offered and cited the rate fatwa. |
| Repentance steps | Baseline found Quran verses and unrelated quotes but missed Ibn Baz's [three-condition fatwa](https://binbaz.org.sa/fatwas/18217/هل-يكفي-الندم-على-الذنب-والإقلاع-عنه-في-التوبة؟). The corrected run found and cited it; the answer still omitted stopping the sin and resolving not to return. The loss is now drafting/checking, not retrieval. |
| Conversion | Baseline missed Ibn Baz's [testimony of faith fatwa](https://binbaz.org.sa/fatwas/1158/وجوب-التصديق-مع-الشهادتين) and the five-pillars hadith. The first after run found the hadith but the adapter dropped the mapped fatwa URL; that bug was fixed. Both corrected runs cited the fatwa. Only one wording included the required testimony of faith. |
| Mercy and eternal Hell | Search found passages about mercy or Hell and quotes about who remains there, but none directly reconciled the visitor's objection. The selector refused. Do not treat a topic mention as a direct answer. |
| Why five prayers | Quran 4:103 and prayer hadith appeared; none verified why the count is five. One intermediate run returned an off-target answer despite a direct selector label. The final focused run refused. |
| Why riba is forbidden, English | Quran 2:275 was present before and after; the frame asked for a *reason*, while that verse states the prohibition. The selector refused for lack of a supported reason. |
| Ayat al-Kursi, Arabic | Quran 2:255 was present and labelled direct in both final and earlier runs. The outcome varies between sources-only and refusal across runs. This is downstream instability, not a search miss. |

For the other 28 entries, the raw traces identify every offered verse, hadith and scholar title. A missing source is only asserted above when a directly relevant source was independently identified; we did not label every low-ranked result a “miss.”

## Hadith and tafsir rights

[Hadith source research](hadith-sources-research.md) covers Dorar's documented search API, Arabic Bukhari/Muslim datasets and the rejected-as-is hadith-api option. Dorar blocked the one direct API request from this host, so the requested 20 live searches and speed measurement were not possible. No 50-record Arabic dataset comparison was done while its digital-edition provenance and reuse obligations remain unresolved. No source was added.

Quran Foundation documents a [tafsir content API](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/tafsir/). Its [developer terms](https://api-docs.quran.com/legal/developer-terms/) and [FAQ](https://api-docs.quran.com/docs/tutorials/faq/) require attention to edition-specific permissions, attribution and caching. AI processing and the particular tafsir edition need rights review before use. A tafsir API endpoint alone does not authorize ingestion.

## Remaining Phase 3 limits

- Fetching up to 16 Quran passages can increase Quran Foundation calls and latency, even though the evidence selector still sees at most eight verses. The test traces measure elapsed time, not billed tokens. No stronger model was introduced.
- The 30 hints cover common wording, not every paraphrase. A map hit is only a candidate, and rights status has not expanded.
- HadeethEnc still searches short titles. Direct IDs help known topics but do not make general hadith search reliable.
- A small stored quote library missed all three focused scholar targets in direct source tests. Live search depends on website speed and parsing.
- The selector and writer remain stochastic. Retrieval alone cannot guarantee complete answers; the repentance and five-prayers cases show this clearly.
- Do not call these answers scholar reviewed. Mo's development review remains the next acceptance layer, and external scholar review comes after Mo stops finding substantive mistakes.

## What Mo should decide after reviewing this phase

Review the 30 search-hint topics and flag any mapping that points to a passage too broad for its question wording. The three focused fatwa URLs are the first priority. A decision to contact Dorar or to examine an Arabic corpus's full terms and 50-record sample can follow this review; neither source is enabled now. There is no need to arrange scholar review while Mo still finds substantive answer mistakes.

## Per-question source log (full after run)

These are the candidates shown to the selector. The JSON trace also lists every fetched source before ranking, each scholar URL, and the selector judgments. `Q/H/S` means Quran verses, hadith and scholar quotes. A dash means no candidate.

| Question | Outcome | Quran verse keys | Hadith IDs | Scholar quote titles |
|---|---|---|---|---|
| fasting-obligation-ar | answer | 2:183, 2:185, 33:35, 2:184, 2:197, 21:92, 15:44, 3:102 | HE4538, HE66525, HE3689 | على من يجب صيام رمضان؟ وفضل صيام التطوع |
| fasting-obligation-en | answer | 2:183, 2:256, 2:185, 2:196, 2:197, 33:35, 4:92, 2:184 | HE4538, HE66525, HE3689 | على من يجب صيام رمضان؟ وفضل صيام التطوع |
| fasting-obligation-de | answer | 2:183, 2:185, 2:196, 33:35, 2:184, 4:92, 24:1, 4:43 | HE3689, HE66525, HE4538 | على من يجب صيام رمضان؟ وفضل صيام التطوع |
| fasting-exemption-ar | ask_scholar | - | - | - |
| fasting-exemption-en | answer | 2:185, 2:184, 2:196, 2:187, 60:10, 58:4, 73:20, 5:89 | HE66525, HE4563, HE4508 | حكم الفطر في رمضان للحامل والمرضع; حكم صوم المسافر والرخصة في الفطر |
| fasting-exemption-de | answer | 2:185, 2:184, 2:196, 2:187, 4:92, 48:17, 73:20, 5:89 | HE4508, HE66525, HE4563 | توالت عليها الولادة في رمضان ولم تستطع الصوم ولا القضاء فماذا يلزمها ؟ |
| fasting-night-ar | answer | 2:187, 17:78, 24:58, 29:38, 8:6, 9:113, 5:91, 23:33 | HE4527, HE4525, HE4457 | معنى {حَتَّى يَتَبَيَّنَ لَكُمُ الْخَيْطُ الأَبْيَضُ...}; بيان وقت صلاة الفجر |
| fasting-night-en | answer | 2:187, 58:4, 2:196, 2:184, 17:78, 26:155, 23:33, 52:19 | HE4457, HE4525, HE65411 | حكم من أكمل سحوره وشرب ماءه وقت الأذان |
| fasting-night-de | answer | 2:187, 24:58, 17:78, 2:185, 52:19, 77:43, 2:60, 3:17 | HE58122, HE4563, HE4525 | حكم أكل السحور عند بدء أذان الفجر |
| qibla-direction-ar | answer | 2:144, 2:149, 2:150, 2:145, 2:142, 2:143, 5:6, 2:125 | HE65090, HE3078, HE65312 | حكم الصلاة داخل الحِجْر لغير اتجاه الكعبة |
| qibla-direction-en | answer | 2:144, 2:149, 2:150, 2:143, 2:142, 2:145, 10:87, 2:148 | HE3078, HE65090, HE65312 | تسمية الكعبة ببيت الله الحرام; الصلاة في الساحات المحيطة بالمسجد الحرام والمسجد النبوي; حكم الصلاة في مسجد أسس من حرام |
| qibla-direction-de | answer | 2:144, 2:143, 2:145, 2:150, 2:149, 4:102, 2:148, 5:97 | HE3078, HE4520, HE10883 | حكم من كان يصلي وأرشد إلى اتجاه القبلة الصحيح; حكم الصلاة داخل الحِجْر لغير اتجاه الكعبة |
| ayat-al-kursi-ar | source_only | 2:255, 3:2, 20:8, 59:24, 17:110, 29:10, 7:180, 23:91 | HE65059, HE65281, HE65291 | هل يصح قول المقدسي بأن العامي لا يبحث عن معاني الصفات |
| ayat-al-kursi-en | answer | 2:255, 21:22, 24:20, 27:26, 3:4, 23:91, 23:116, 2:261 | HE65059, HE4457, HE65312 | - |
| ayat-al-kursi-de | answer | 2:255, 7:54, 57:4, 24:58, 21:22, 19:58, 27:26, 48:10 | HE65038, HE65004, HE65114 | تفسير قوله تعالى: {الله نور السماوات والأرض}; تفسير قوله تعالى: ﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ..﴾ |
| no-compulsion-ar | answer | 6:125, 61:7, 2:256, 60:10, 3:24, 18:79, 49:14, 3:73 | HE5347, HE10011, HE66203 | حكم إكراه الوالد ابنته بالزواج من شخص ترفضه; لا إكراه في قبول الإسلام |
| no-compulsion-en | answer | 2:256, 5:3, 22:78, 10:99, 9:53, 3:85, 60:10, 3:19 | HE66512, HE66518, HE65329 | وجوب التصديق مع الشهادتين |
| no-compulsion-de | answer | 2:256, 5:3, 5:5, 45:18, 52:36, 58:8, 3:85, 10:99 | HE66121, HE6272, HE65329 | الجمع بين: {لَا إِكْرَاهَ فِي الدِّينِ} و«الطاعة في المنشط والمكره» |
| riba-prohibition-ar | answer | 2:275, 4:161, 3:130, 2:276, 5:3, 2:85, 6:146, 6:125 | HE5889, HE3228 | حكم أخذ الفوائد الربوية لصرفها في وجوه البر; حكم من تعامل بالربا جهلًا |
| riba-prohibition-en | no_source | 2:275, 4:161, 3:130, 58:8, 2:276, 4:113, 2:245, 4:135 | HE4810, HE5889, HE3228 | - |
| riba-prohibition-de | answer | 2:275, 4:161, 3:130, 2:269, 2:276, 4:135, 7:159, 16:90 | HE5889, HE3228 | حقيقة الربا وحكمه |
| charity-usury-ar | answer | 2:276, 2:275, 30:39, 9:104, 3:130, 4:161, 2:278, 57:18 | HE5512, HE5889, HE4193 | متى يقال: رضيت بالله رباً وبالإسلام ديناً وبمحمدٍ رسولاً؟ |
| charity-usury-en | answer | 2:276, 4:114, 58:12, 3:130, 58:13, 30:39, 2:272, 2:275 | HE5512, HE66527, HE3096 | المسر بالقرآن كالمسر بالصدقة |
| charity-usury-de | answer | 2:275, 3:130, 4:161, 9:60, 9:104, 30:39, 2:245, 57:18 | HE5512, HE65021, HE4556 | - |
| debts-contract-ar | answer | 2:282, 39:2, 9:60, 56:66, 35:45, 22:33, 10:105, 40:48 | HE3753, HE4322, HE66223 | - |
| debts-contract-en | answer | 2:282, 4:12, 16:54, 57:11, 68:47, 57:18, 52:41, 64:17 | HE3753, HE4322, HE3390 | الفرق بين القرض والدين |
| debts-contract-de | answer | 2:282, 4:12, 4:92, 42:13, 36:12, 64:17, 57:11, 5:12 | HE3753, HE6460, HE4322 | - |
| divorce-limit-ar | answer | 2:229, 2:230, 33:49, 2:227, 65:1, 23:112, 2:231, 24:8 | HE66049 | ما عدد الطلقات التي تحسب لمن رجعت بعد طلاق بائن؟ |
| divorce-limit-en | answer | 2:229, 2:230, 65:1, 2:227, 74:31, 65:2, 4:130, 2:236 | HE65021, HE5348, HE65479 | الطلاق والرجعة بيد الزوج; ما عدد الطلقات التي تحسب لمن رجعت بعد طلاق بائن؟ |
| divorce-limit-de | answer | 2:229, 65:1, 2:227, 2:230, 2:236, 2:237, 65:2, 33:49 | HE65019, HE5348 | بيان الطلاق الرجعي والطلاق البائن; الطلاق والرجعة بيد الزوج |
| gold-zakat-conditions-amount-ar | no_source | - | - | - |
| mercy-eternal-punishment-en | no_source | 18:58, 24:14, 58:8, 17:39, 49:10, 46:20, 11:119, 43:74 | HE3103, HE5502, HE66204 | أنواع الخلود في النار; معنى الخلود في النار |
| five-prayers-why-en | answer | 24:58, 11:114, 4:103, 3:125, 4:77, 54:5, 4:101, 17:78 | HE11286, HE3591, HE6259 | حكم من سها في صلاة واحدة عدة مرات |
| repentance-steps-en | answer | 42:25, 11:90, 5:39, 40:3, 25:71, 66:8, 110:3, 25:70 | HE4817, HE3313, HE6272 | هل يكفي الندم على الذنب والإقلاع عنه في التوبة؟ |
| conversion-guidance-de | answer | 2:208, 13:23, 72:14, 3:85, 70:33, 22:78, 49:17, 49:14 | HE66512, HE6468 | وجوب التصديق مع الشهادتين |
