# Scholar Library Expansion Batch Report

Date: 2026-09-29
Author: Antigravity Assistant
Project: Al-Bayan (`C:\Users\wiseflow\Bayan`)
Scope: Four approved scholars only (Ibn Baz, Ibn Uthaymeen, Al-Albani, Al-Barrak)

---

## 1. Executive Summary

This expansion batch evaluated all 302 core Islamic topics from `data/scholar-queries.ts` across the four approved scholar platforms:
1. Shaykh Ibn Baz (`binbaz.org.sa`)
2. Shaykh Ibn Uthaymeen (`binothaimeen.net`)
3. Shaykh al-Albani (`al-albany.com`)
4. Shaykh al-Barrak (`sh-albarrak.com`)

Prior to collection, all four collectors and parsers were hardened to enforce the strict standards established for Ibn Baz and Ibn Uthaymeen:
- Stripping all opening formulas, greetings, letters, and signoffs
- Completely excluding questioner text from the scholar excerpt
- Enforcing minimum 200 characters and maximum 600 characters
- Requiring content-word overlap with the title (`sharesContentWord`)
- Detecting near-duplicates across existing stem sets (`isNearDuplicate` at 70% threshold)
- Verifying thematic answer relevance via independent AI verifier (`checkQuoteRelevance`)
- Rejecting room talk, conversational banter, lecture series, and tafsir lessons

The collection maintained strict source safety: 1.5-second pacing, official user-agent header, zero third-party mirrors, and no weakening of safety thresholds.

---

## 2. Database Counts: Starting vs Ending

| Scholar | Starting Published | Starting Unpublished | Ending Published | Ending Unpublished | Net Added (Published) | Total Search Docs (Approved) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ibn Baz** (`binbaz.org.sa`) | 547 | 30 | 550 | 30 | +3 | 580 (100%) |
| **Ibn Uthaymeen** (`binothaimeen.net`) | 195 | 26 | 195 | 26 | 0 | 221 (100%) |
| **Al-Albani** (`al-albany.com`) | 22 | 0 | 22 | 0 | 0 | 22 (100%) |
| **Al-Barrak** (`sh-albarrak.com`) | 6 | 0 | 6 | 0 | 0 | 6 (100%) |
| **Total** | **770** | **56** | **773** | **56** | **+3** | **829 (100%)** |

All 56 previously unpublished quotes remain unpublished (`published = false`). No records were deleted. Every single record in `sources` (829/829) has a corresponding approved search document in `source_search_documents`.

---

## 3. Query Execution & Results by Scholar

### A. Shaykh Ibn Baz (`binbaz.org.sa`)
- **Queries attempted:** 302
- **Hits evaluated:** 593
- **Already existing in library:** 485
- **Skipped:** 105
  - *No clean excerpt under 600 chars:* 90 (long answers with no natural period/sentence ending before 600 chars)
  - *Not parsed / rejected by parser:* 12
  - *Title mismatch:* 1
  - *No shared content word with title:* 1
  - *AI rejected (thematic mismatch):* 1 (page on divorce of mentally unstable person returned an excerpt answering astrology)
- **Newly stored:** 3
  1. `37deb433-49b6-4391-8123-8061b87166b2` - نواقض الإسلام وخطرها على الفرد والمجتمع (Ref: fatwa 9598)
  2. `4c20bb9f-626d-4bb0-83b1-8516f57d94a3` - التوسل المشروع والممنوع (Ref: fatwa 17976)
  3. `72e2b769-61fb-438e-9c6e-252897bf4af7` - فضل الذكر والاستغفار (Ref: fatwa 13938)

### B. Shaykh Ibn Uthaymeen (`binothaimeen.net`)
- **Queries attempted:** 302
- **Hits evaluated:** 211
- **Already existing in library:** 88
- **Skipped:** 123
  - *Not fatwa collection:* 46 (lectures from general audio series, fiqh explanation audio)
  - *Tafsir lesson:* 34 (surah tafsir lessons filtered by `isUthaymeenTafsirLesson`)
  - *No clean excerpt under 600 chars:* 22
  - *Not parsed / rejected by parser:* 21
- **Newly stored:** 0 (High existing saturation across primary fatwas; remaining hits did not meet strict short-quote standalone criteria)

### C. Shaykh al-Albani (`al-albany.com`)
- **Queries attempted:** 302
- **Hits evaluated:** 97
- **Already existing in library:** 11
- **Skipped:** 86
  - *Not parsed / rejected by parser:* 86 (Transcripts feature conversational dialogues, student interruptions, introductory comments, or multi-question formats that properly failed the strict single Q&A format)
- **Newly stored:** 0

### D. Shaykh al-Barrak (`sh-albarrak.com`)
- **Queries attempted:** 302
- **Hits evaluated:** 22
- **Already existing in library:** 6
- **Skipped:** 16
  - *Not parsed / rejected by parser:* 10 (Structure did not match clean question-answer or represented personal-case inquiries)
  - *No clean excerpt under 600 chars:* 6
- **Newly stored:** 0

---

## 4. Live Spot-Check Audit (20 Pages)

A spot check was performed against live official endpoints for 20 pages (5 per scholar):

| Scholar | Source ID | Title | Live Fetch | Char Exact Match | Rights ID Match | Search Doc Approved | Notes |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Ibn Baz** | `ff0210b7...` | نصح أقاربه بعدم النياحة | PASS | PASS | PASS | PASS | مجموع فتاوى (9/ 338) |
| **Ibn Baz** | `fed0a9d3...` | حكم زكاة الحبوب ونصابها | PASS | PASS | PASS | PASS | Fatwa 18798 |
| **Ibn Baz** | `fea1a986...` | أهمية الطمأنينة في الصلاة | PASS | PASS | PASS | PASS | Fatwa 1801 |
| **Ibn Baz** | `15be3ccd...` | هل إبليس من الجن أم من الملائكة؟ | PASS | PASS | PASS | PASS | Fatwa 12118 |
| **Ibn Baz** | `00948dd7...` | حكم القول بأن الدنيا خلقت من أجل الرسول | PASS | PASS | PASS | PASS | Fatwa 5882 |
| **Ibn Uthaymeen** | `af20c3d9...` | معنى : " لا إله إلا الله " | PASS | PASS* | PASS | PASS | *Arabic text exact; DB has legacy `&laquo;`/`&raquo;` |
| **Ibn Uthaymeen** | `ab31ce67...` | ما معنى الإلحاد ؟ | PASS | PASS | PASS | PASS | نور على الدرب [313] |
| **Ibn Uthaymeen** | `3f79de82...` | أنواع التوسل | PASS | PASS | PASS | PASS | نور على الدرب [283] |
| **Ibn Uthaymeen** | `31c2f32c...` | حكم الزكاة في الخيل | PASS | PASS* | PASS | PASS | *Arabic text exact; DB has legacy `&laquo;`/`&raquo;` |
| **Ibn Uthaymeen** | `4662bcdc...` | حكم تدريس باب الأسماء والصفات | PASS | PASS | PASS | PASS | نور على الدرب [269] |
| **Al-Albani** | `aedb2312...` | يتَّهم البعض السلفيين بأنهم مهتمُّون فقط | PASS | PASS | PASS | PASS | تسجيلات متفرقة [197] |
| **Al-Albani** | `ccbc899f...` | في هذه الأيام يدور الكلام حول حجية السنة | PASS | PASS | PASS | PASS | فتاوى رابغ [7] |
| **Al-Albani** | `0f9ce124...` | سؤال عن كيفية قسمة العطية بين الأولاد | PASS | PASS | PASS | PASS | تسجيلات متفرقة [228] |
| **Al-Albani** | `9055462f...` | ما حكم أهل الجاهلية قبل الإسلام | PASS | PASS | PASS | PASS | الهدى والنور [566] |
| **Al-Albani** | `6fb9d21a...` | نصيحة الشيخ لهذا الشاب النصراني | PASS | PASS | PASS | PASS | تسجيلات متفرقة [12] |
| **Al-Barrak** | `1c8901eb...` | هل يصح قول المقدسي بأن العامي لا يبحث | PASS | PASS | PASS | PASS | Fatwa 1321 |
| **Al-Barrak** | `fcae338c...` | جمع النيات عند قراءة القرآن للرقية | PASS | PASS | PASS | PASS | Fatwa 1354 |
| **Al-Barrak** | `313437cb...` | حكم استلام المحرم للحجر الأسود | PASS | PASS | PASS | PASS | Fatwa 4443 |
| **Al-Barrak** | `91910efc...` | حكم إخراج الزكاة عن الوالد | PASS | PASS | PASS | PASS | Fatwa 4744 |
| **Al-Barrak** | `7097c276...` | حكم الزكاة في المال المعد للتجارة | PASS | PASS | PASS | PASS | Fatwa 4821 |

---

## 5. Duplicate Patterns Found

1. **URL Duplication:** 485 of 593 Ibn Baz hits and 88 of 211 Ibn Uthaymeen hits were already present in the database from earlier collection runs.
2. **Stem Similarity:** 3 Ibn Baz candidates were skipped because their Arabic content had over 70% stem overlap with an existing quote by the same scholar on the same topic.
3. **HTML Entity Legacy Artifact:** 50 historical rows for Ibn Uthaymeen contain the raw string `&laquo;` and `&raquo;` instead of decoded Arabic guillemets `«` and `»`. The underlying text matches the official source exactly.

---

## 6. Site Access and Network Observations

1. `binbaz.org.sa`: Fast, stable JSON search API. No rate limits or blocks encountered.
2. `binothaimeen.net`: Fast search and detail API. Pacing of 1.5s respected.
3. `al-albany.com`: Occasional timeouts (~5 search queries timed out out of 302). Graceful catch-and-retry enabled clean continuation without blocking.
4. `sh-albarrak.com`: Stable Next.js site. Category 1 written fatwas remain small in number on the site.

---

## 7. Remaining Coverage Gaps

The primary gap is not the breadth of queries (all 302 topics were searched across all four scholars), but the nature of the remaining material on the platforms:
1. **Al-Albani:** Most audio recordings on `al-albany.com` are recorded informal gatherings (majalis) with conversational interruptions, student questions, and banter. Only a small fraction fit the strict single-question, clean-scholar-answer format.
2. **Al-Barrak:** `sh-albarrak.com` has a relatively small catalog of Category 1 written fatwas. Many pages cover personal circumstance questions or exceed 600 characters without a clean break.
3. **Ibn Baz & Ibn Uthaymeen:** Very high coverage of core questions already exists (550 published Ibn Baz, 195 published Ibn Uthaymeen). Further expansion would require searching page 2 and beyond, or exploring additional printed collections.

---

## 8. What Should Happen Next

1. **Do not force weak quotes:** The library has reached saturation on the core 302 queries under the strict rules. This strictness protects answer quality and safety.
2. **HTML Entity Cleanup for Ibn Uthaymeen:** 50 rows in `sources` have `&laquo;` and `&raquo;`. A dedicated script can decode them to `«` and `»` if approved by Mo.
3. **Next Collection Frontier:** If further library expansion is desired, consider:
   - Paginated queries (pages 2-3) on `binbaz.org.sa` for core topics.
   - Adding approved written fatwa collections for Shaykh Ibn Uthaymeen (e.g. Majmoo' Fatawa wa Rasa'il).
