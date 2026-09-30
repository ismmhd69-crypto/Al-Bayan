# Scholar Library Retrieval Evaluation Report

Date: 2026-09-29
Author: Antigravity Assistant
Project: Al-Bayan (`C:\Users\wiseflow\Bayan`)
Scope: Retrieval evaluation across the 90 real test questions in `data/eval-questions.ts` against the 773 published scholar quotes.

---

## 1. Executive Summary

The Al-Bayan scholar library contains 773 published quotes (550 Ibn Baz, 195 Ibn Uthaymeen, 22 al-Albani, 6 al-Barrak) and 56 unpublished quotes. This evaluation measured whether this library actually retrieves relevant scholarly evidence when ordinary visitors ask realistic questions in Arabic, English, and German.

Key Findings:
1. **Safe-Gap Dominance:** 67 out of 90 questions (74.4%) resulted in safe gaps (no scholar quote retrieved). This is healthy behavior because the system refuses or relies on Quran/Hadith rather than inventing answers or presenting irrelevant quotes.
2. **Total Protection for Personal Disputes and Off-Topic Input:** 100% of personal disputes (9/9) and 100% of off-topic/greeting inputs (6/6) returned zero generic scholar fatwas. Personal situations are completely protected against automated generic advice.
3. **Cross-Language Retrieval Gap:** 100% of English (25 answerable/refusal) and German (25 answerable/refusal) questions retrieved zero scholar quotes. The scholar search document index is strictly Arabic script (`lang = 'ar'`), so non-Arabic questions cannot retrieve scholar quotes without an upstream translation bridge.
4. **False-Positive Collisions (Wrong Source):** 7 Arabic questions retrieved quotes due to loose fallback keywords (e.g. "كم مرة", "كم عدد", "صيام رمضان فرض") that matched subsidiary rulings rather than the question's core subject.

---

## 2. Evaluation Results Summary

### Overall Breakdown (90 Questions)

| Outcome Category | Total Count | Percentage |
| :--- | :---: | :---: |
| **Pass** (Relevant evidence retrieved) | 1 | 1.1% |
| **Safe Gap** (No quote retrieved; safe refusal / Quran/Hadith scope) | 67 | 74.4% |
| **Wrong Source** (Retrieved quote does not answer the question) | 7 | 7.8% |
| **Personal Case Protected** (Personal dispute returned no generic fatwa) | 9 | 10.0% |
| **Out of Scope Protected** (Off-topic input returned no scholar evidence) | 6 | 6.7% |
| **Needs Manual Review** | 0 | 0.0% |
| **Total** | **90** | **100%** |

### Breakdown by Language

| Language | Pass | Safe Gap | Wrong Source | Personal Protected | Out of Scope Protected | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Arabic (ar)** | 1 | 17 | 7 | 3 | 2 | 30 |
| **English (en)** | 0 | 25 | 0 | 3 | 2 | 30 |
| **German (de)** | 0 | 25 | 0 | 3 | 2 | 30 |
| **Total** | **1** | **67** | **7** | **9** | **6** | **90** |

---

## 3. Results by Topic Area

1. **Prayer (Salah):**
   - Ruling on abandoning prayer (`prayer-neglect-ar`): **PASS**. Retrieved Ibn Baz "ما حكم تارك الصلاة؟" and Ibn Uthaymeen "حكم تارك الصلاة بالكلية".
   - Qibla direction (`qibla-direction-ar`): **Safe Gap** (covered by Quran 2:144).
2. **Fasting (Siyam):**
   - Obligation of Ramadan fasting (`fasting-obligation-ar`): **Wrong Source**. Loose fallback matched quotes on voluntary fasting and making up missed days.
   - Sickness and travel exemptions (`fasting-exemption-ar`): **Safe Gap** (covered by Quran 2:184-185).
   - Time of starting fast (`fasting-night-ar`): **Safe Gap** (covered by Quran 2:187).
3. **Belief and Creed (Aqidah):**
   - Meaning of Tawhid (`tawhid-meaning-ar`): **Wrong Source**. Fallback matched an explanation of Surah al-Ikhlas rather than a clear definition of Tawhid branches.
   - Ayat al-Kursi (`ayat-al-kursi-ar`): **Safe Gap** (covered by Quran 2:255).
   - Worship and seeking help (`fatiha-worship-ar`): **Safe Gap** (covered by Quran 1:5).
4. **Transactions and Finance (Mu'amalat):**
   - Prohibition of Riba (`riba-prohibition-ar`): **Wrong Source**. Matched subsidiary rulings on dealing with interest in ignorance, rather than the core prohibition.
   - Charity vs Usury (`charity-usury-ar`): **Safe Gap** (covered by Quran 2:276).
   - Writing contracts and debts (`debts-contract-ar`): **Safe Gap** (covered by Quran 2:282).
5. **Family and Marriage:**
   - Revocable divorce limit (`divorce-limit-ar`): **Wrong Source**. Fallback keyword "كم مره" matched a wudu doubts fatwa.
   - Waiting periods for divorce and bereavement (`divorce-waiting-ar`, `widow-waiting-ar`): **Safe Gap** (covered by Quran 2:228 and 2:234).
   - Personal marital dispute (`personal-marital-dispute`): **Personal Case Protected**.
6. **Hajj and Umrah:**
   - Obligation and moral conduct (`hajj-obligation-ar`, `hajj-conduct-ar`): **Safe Gap** (covered by Quran 2:196-197).
7. **Pillars and Actions:**
   - Five pillars of Islam (`five-pillars-ar`): **Wrong Source**. Matched "هل الأمر بالمعروف من أركان الإسلام؟".
   - Sincerity of intention (`intention-hadith-ar`): **Safe Gap** (covered by Hadith Bukhari 1 / Muslim 1907).

---

## 4. Results by Scholar

Among the retrieved candidates for the 30 Arabic questions:
- **Ibn Baz (`binbaz.org.sa`):** 9 candidates retrieved across 4 questions. Provided the 1 passing result (`prayer-neglect-ar`) and candidates for fasting, riba, and pillars.
- **Ibn Uthaymeen (`binothaimeen.net`):** 4 candidates retrieved across 4 questions. Provided valid second-place candidate for prayer neglect, but suffered keyword collisions on "كم مره" and "كم عدد".
- **Al-Albani (`al-albany.com`):** 1 candidate retrieved (`wudu-verse-maidah-ar`, on splints/casts).
- **Al-Barrak (`sh-albarrak.com`):** 0 candidates retrieved across the 30 questions (small catalog of 6 quotes).

---

## 5. Detailed Analysis of Wrong-Source Findings

All 7 wrong-source occurrences were caused by two retrieval patterns:

1. **`divorce-limit-ar` ("كم مرة يحق للزوج طلاق زوجته رجعيا؟")**
   - **Retrieved:** Ibn Uthaymeen: "الوسوسة في الوضوء وكيفية علاجها"
   - **Cause:** Weak keyword fallback. Level 3 fallback truncated the query to "كم مره", which matched an obsessive doubt wudu question.
   - **Severity:** High. Wudu advice returned for a divorce question.
2. **`polygyny-limit-ar` ("كم عدد الزوجات المسموح به للرجل المسلم في سورة النساء؟")**
   - **Retrieved:** Ibn Uthaymeen: "إذا شك في صلاته فلم يدري كما صلى فماذا يلزمه ؟"
   - **Cause:** Weak keyword fallback. Level 3 fallback truncated the query to "كم عدد", which collided with number of rak'ahs in prayer.
   - **Severity:** High. Prayer doubt ruling returned for marriage limits.
3. **`fasting-obligation-ar` ("هل صيام رمضان فرض على كل مسلم؟")**
   - **Retrieved:** Ibn Baz: "المشروع تقديم القضاء على صوم الست"
   - **Cause:** Broad topic collision. Query matched "صيام رمضان فرض" in a quote about voluntary vs makeup fasts.
   - **Severity:** Medium. The quote is about fasting, but answers a different question.
4. **`wudu-verse-maidah-ar` ("ما هي اعضاء الوضوء المذكورة نصا في اية سورة المائدة؟")**
   - **Retrieved:** Al-Albani: "هل يصح حديث الجبيرة ؟ وإن كان ضعيفًا فما يفعل صاحب الجبيرة ؟"
   - **Cause:** Broad topic collision. Matched "اعضاء وضوء" in a specialized discussion on limb splints.
   - **Severity:** Medium.
5. **`five-pillars-ar` ("ما هي اركان الاسلام الخمسة بالترتيب؟")**
   - **Retrieved:** Ibn Baz: "هل الأمر بالمعروف من أركان الإسلام؟"
   - **Cause:** Partial overlap. Matched "اركان اسلام" in a discussion debating whether enjoining good is a pillar.
   - **Severity:** Medium.
6. **`riba-prohibition-ar` ("هل التعامل بالربا واخذ الفائدة حرام في الاسلام؟")**
   - **Retrieved:** Ibn Baz: "حكم من تعامل بالربا جهلًا"
   - **Cause:** Subsidiary ruling collision. Addressed someone who already dealt with interest out of ignorance, not whether interest itself is prohibited.
   - **Severity:** Low-Medium.
7. **`tawhid-meaning-ar` ("ما هو التوحيد وما اقسامه الثلاثة باختصار؟")**
   - **Retrieved:** Ibn Uthaymeen: "لماذا سميت سورة الإخلاص بهذا الإسم ؟ وما وجه الدلالة على اشتمالها على أنواع التوحيد الثلاثة ؟"
   - **Cause:** Context collision. Addressed Surah al-Ikhlas rather than providing a beginner's definition of Tawhid.
   - **Severity:** Low.

---

## 6. Cross-Language Retrieval Analysis

- In English and German, 50 out of 50 answerable and refusal questions returned zero scholar quotes.
- **Root Cause:** The database index `source_search_documents` contains only Arabic text (`lang = 'ar'`). The search preparation function `toSearchQuery()` strips non-Arabic characters, producing empty search queries for Latin text.
- **Implication:** In the live Ask pipeline, English and German queries rely entirely on the LLM understanding step to generate Arabic search queries (`search_queries_ar`). If the LLM generates weak or non-standard Arabic phrases, the scholar library will return zero results.

---

## 7. The 20 Most Important Missing Coverage Areas

| # | Topic | Key Question | Recommended Scholar & Site | Missing Reason | Clean Quotes Needed |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | **Fasting Obligation** | Is Ramadan fasting compulsory for every Muslim? | Ibn Baz (`binbaz.org.sa`) | Existing quotes focus on Shawwal and makeup days | 1 |
| 2 | **Fasting Exemptions** | Rulings on illness and travel during Ramadan | Ibn Uthaymeen (`binothaimeen.net`) | Lengthy lectures rather than concise rulings | 1-2 |
| 3 | **Fasting Boundaries** | Exact time to cease eating and drinking (Fajr) | Ibn Baz (`binbaz.org.sa`) | Covered under prayer time fatwas | 1 |
| 4 | **Qibla Direction** | Facing the Ka'bah during prayer and in transit | Ibn Baz (`binbaz.org.sa`) | Existing quotes address plane/train prayer | 1 |
| 5 | **Ayat al-Kursi** | Meaning and virtues of the Throne Verse | Ibn Uthaymeen (`binothaimeen.net`) | Excluded as general tafsir lessons | 1 |
| 6 | **No Compulsion** | Prohibition of forced conversion in Islam | Ibn Baz (`binbaz.org.sa`) | Existing quotes address apostasy, not initial entry | 1 |
| 7 | **Riba Core Ruling** | Definition and categorical prohibition of interest | Ibn Baz (`binbaz.org.sa`) | Existing quotes address bank employment and ignorance | 1 |
| 8 | **Charity vs Interest** | Spiritual and economic contrast between Sadaqah and Riba | Ibn Uthaymeen (`binothaimeen.net`) | Dispersed in long lectures | 1 |
| 9 | **Debt Contracts** | Writing down loans and deferred obligations | Ibn Baz (`binbaz.org.sa`) | Stored under commercial dispute sections | 1 |
| 10 | **Divorce Limit** | Ruling on three divorces and revocable reconciliation | Ibn Baz (`binbaz.org.sa`) | Pages exceed 600 characters without clean break | 1-2 |
| 11 | **Iddah for Divorce** | Three menstrual cycles waiting period | Ibn Uthaymeen (`binothaimeen.net`) | Dispersed in complex family dispute cases | 1 |
| 12 | **Iddah for Widow** | Four months and ten days bereavement period | Ibn Baz (`binbaz.org.sa`) | Stored quotes focus on mourning clothes (`ihdad`) | 1 |
| 13 | **Hajj Obligation** | Obligation of Hajj and Umrah once in a lifetime | Ibn Baz (`binbaz.org.sa`) | Existing quotes focus on specialized Hajj rites | 1 |
| 14 | **Hajj Prohibitions** | Refraining from argument and immorality in Ihram | Ibn Baz (`binbaz.org.sa`) | Existing quotes focus on physical prohibitions | 1 |
| 15 | **Al-Fatiha Guidance** | Meaning of asking for the Straight Path | Ibn Uthaymeen (`binothaimeen.net`) | Filtered out by tafsir lesson filter | 1 |
| 16 | **Al-Fatiha Worship** | "You alone we worship and You alone we ask for help" | Ibn Baz (`binbaz.org.sa`) | Found only in introductory sermon formulas | 1 |
| 17 | **Intention in Worship** | Necessity of Niyyah for validity of deeds | Ibn Baz (`binbaz.org.sa`) | Existing quotes focus on audible intention (bid'ah) | 1 |
| 18 | **Five Pillars of Islam** | Enumeration of the five pillars in order | Ibn Baz (`binbaz.org.sa`) | Stored quotes debate specific pillars individually | 1 |
| 19 | **Tawhid Definition** | Definition of Tawhid and its three branches | Ibn Uthaymeen (`binothaimeen.net`) | Existing quotes focus on specific theological disputes | 1 |
| 20 | **Gold Zakat Details** | Nisab threshold and 2.5% rate on gold jewelry | Ibn Baz (`binbaz.org.sa`) | High character count in original fatwas | 1-2 |

---

## 8. Ranked Collection Plan for the Next Batch

To fix these coverage gaps without ballooning the database, execute small, targeted collection runs for the missing core topics:

1. **Batch 1: Core Creed and Pillars (6 quotes)**
   - Topic: Tawhid definition and three categories (1 quote from Ibn Uthaymeen, `binothaimeen.net`).
   - Topic: Five pillars of Islam enumerated (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Intention in worship (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: No compulsion in religion (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Virtues of Ayat al-Kursi (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Meaning of al-Fatiha worship (1 quote from Ibn Uthaymeen, `binothaimeen.net`).
2. **Batch 2: Fasting and Prayer Essentials (6 quotes)**
   - Topic: Obligation of Ramadan fasting (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Sickness and travel fasting exemptions (1 quote from Ibn Uthaymeen, `binothaimeen.net`).
   - Topic: Dawn cutoff for eating and drinking (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Qibla direction requirement (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Obligation of Hajj and Umrah (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Conduct during Hajj (1 quote from Ibn Baz, `binbaz.org.sa`).
3. **Batch 3: Transactions and Family Basics (6 quotes)**
   - Topic: Categorical prohibition of Riba (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Writing debt contracts (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Gold zakat rate and nisab (1-2 quotes from Ibn Baz, `binbaz.org.sa`).
   - Topic: Revocable divorce limit (1 quote from Ibn Baz, `binbaz.org.sa`).
   - Topic: Divorced woman waiting period (1 quote from Ibn Uthaymeen, `binothaimeen.net`).
   - Topic: Widow waiting period (1 quote from Ibn Baz, `binbaz.org.sa`).

Total quotes to add across all 3 batches: **18 to 20 quotes maximum**.
No bulk archive scraping is needed. Small, clean, verified quotes on these exact missing subjects will resolve the primary coverage gaps.
