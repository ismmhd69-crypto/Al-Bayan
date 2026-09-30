# Bayan: plan for the real website

Version 3, 2026-09-27. Version 2 followed an outside review by GPT Codex. Mo then decided the site stays **AI first**: people ask anything and get an automatic answer. Codex's other fixes (privacy, security, source rights, honest labels, accessibility, testing) are kept. Section 13 lists what changed. Older versions are in git history.

**Answer structure checkpoint, 2026-09-30:** Live and prepared answers now target one checked `AnswerV2` shape: simple cited answer, optional cited list, Quran, hadith, scholar quotes, optional folded detail, and videos that are never evidence. Empty sections stay hidden. Bare sources are never shown as an answer; failed summaries return the honest no-summary result. Unresolved scholar differences refuse safely instead of choosing a view by quote count. Prepared approvals are tied to the exact reviewed content hash. The final full evaluation and Mo's content acceptance are still required before launch.

## 1. The goal in one paragraph
Bayan is a website, built for the Ummah and for anyone curious about Islam, where people type any question and get a calm, clear answer straight away. The answer is written automatically, but only from trusted sources: the Quran, authentic hadith and the approved scholars. It works in Arabic, German and English, feels simple on a phone, and always shows where every sentence comes from. When no trusted source is found, it says so honestly instead of guessing.

**The core rule: automatic answers, closed sources.** The AI answers every question itself, but it may only use what it found in our approved sources, every sentence must point to a source, and code checks every quote before the answer is shown. It never searches the open internet and never gives its own opinion.

## 2. Decisions already made
| Topic | Decision |
|---|---|
| Project home | Separate project at `C:\Users\wiseflow\Bayan` (not inside WiseFlow) |
| Accounts | Optional. No account needed to ask. Signing in only saves chat history and favourites, with separate consent |
| Scholars | None yet. Not needed to start. When scholars join later, they review the most-asked answers, which then show a "Scholar reviewed" badge and are used first |
| Answers | **AI first and fully automatic.** Anyone asks any question, the site answers straight away from the approved sources |
| Scholar request | An "Ask a scholar" option is planned for later. **Not built now** |
| Videos | Curated YouTube lectures from the approved scholars, linked with start/end times, click-to-load |
| Languages | Arabic (right-to-left), German, English |
| Look | The lapis blue + gold light design from the mockup, always light |
| Methodology | Sunni only (Ahl al-Sunnah). Evidence from the Quran and hadith graded sahih or hasan only. Explanations and rulings quoted from the approved scholars in section 3b |
| When scholars differ | Automatic search never decides al-rajih by counting retrieved quotes or scholars. A documented reviewed view decision may put one view first, with other views in a closed fold. Without one, supported views are shown with equal weight or the answer refuses. Only a real scholar review may label a view "strongest" or "al-rajih" |
| AI provider | **Undecided, see section 5.** Gemini's terms forbid sites likely used by under-18s. The code talks to the AI through one swappable layer |

## 3. About trust (honest version)
No website can promise 100%. What we promise, and say on the site:
1. **Closed library.** The AI only answers from our approved sources. It never searches the open internet.
2. **Every sentence has a source.** The AI must attach a source to each sentence it writes. Sentences without a source are removed by code before the answer is shown.
3. **Every quote is checked by code, not by the AI.** Each quoted verse, hadith and scholar quote is fetched again and matched word for word against the exact source and language shown. Anything that fails is removed.
4. **Grades are shown, never invented.** Hadith grades, grader and numbering system come from the source data, not from the AI.
5. **"I don't know" is allowed.** No source found means no answer: "We couldn't find a trusted source for this. Please ask a qualified scholar you trust."
6. **The AI never makes its own ruling.** It only reports what the approved scholars said. For personal situations it gives the general ruling with sources and says a scholar should be asked about the specific case.
7. **Open about the AI.** We never hide it. The Ask screen says clearly: "This AI answers only from trusted sources (Quran, authentic hadith and approved scholars), not from its own knowledge. Every answer shows its sources." This also meets the EU rule to tell users they are talking to an AI.
8. **Mistakes can be reported.** Every answer has a "report a problem" link.

**Status labels shown on answers (use these exact wordings, never stronger ones):**
- "Automatic answer from the sources listed" (normal AI answer)
- "Prepared answer, reviewed by Bayan" (only while the stored approval hash exactly matches the current prepared content; this is not scholar review)
- "Scholar reviewed" (only after a real scholar approved it)
- "Quotes checked against the source" (never "verified" or "100%")
- "No account required" (never "anonymous")
- "Not a fatwa" on every automatic answer

## 3b. Methodology and answer format

**Evidence rules**
- Quran: always shown in Arabic, unchanged, with the translation in the user's language, the translation's name, and a link to Quran.com.
- Hadith: only graded **sahih** or **hasan**. Weak and fabricated narrations are never used as evidence. Grade, grader, collection and numbering system are always shown.
- Tafsir: from recognised Sunni works (for example Ibn Kathir, al-Tabari, al-Sa'di, al-Qurtubi) and the tafsir lessons of the approved scholars.
- Every quote links to the exact page it came from.

**When there is a difference of opinion**
1. Retrieval results cannot establish the strongest view. The library is incomplete and uneven, so Bayan never picks a winner by counting quotes or retrieved scholars.
2. A documented reviewed view decision may put one view first, with its evidence and who held it. Other supported views appear in a closed "Other scholarly views" fold. The main answer says in fixed site text that a difference exists.
3. Without a matching reviewed decision, Bayan shows checked views side by side with equal presentation, or refuses when it cannot present them fairly. It does not call either view al-rajih.
4. Only a real scholar review may label a view "strongest", "al-rajih" or "Scholar reviewed". A Bayan or Mo content approval is not a religious ruling.

**Every answer has the same 4 parts**
1. **Short answer** in plain words, written by the AI only from the sources below.
2. **Evidence**: Quran verse(s) and authentic hadith, with references and links.
3. **What the scholars said**: quote from an approved scholar's fatwa, book or lesson, with a link.
4. **Watch more**: one or two video clips, when available.
Most answers carry 2 to 4 sources.

**Approved scholars (official websites)**
| Scholar | Website |
|---|---|
| Shaykh Abdul-Aziz ibn Baz | binbaz.org.sa |
| Shaykh Muhammad ibn Salih al-Uthaymeen | binothaimeen.net |
| Shaykh Muhammad Nasir al-Din al-Albani | al-albany.com |
| Shaykh Salih al-Fawzan | alfawzan.af.org.sa (corrected 2026-09-28: al-fuzan.com is Shaykh Abdullah ibn Salih al-Fawzan) |
| Shaykh Abdul-Muhsin al-Abbad | al-abbaad.com |
| Shaykh Abdur-Razzaq al-Badr | al-badr.net |
| Shaykh Rabee al-Madkhali | rabee.net |
| Shaykh Muqbil ibn Hadi al-Wadi'i | muqbel.net |
| Shaykh Ahmad an-Najmi | alnajmi.net |
| Shaykh Sulayman ar-Ruhayli | sualruhaily.com |
| Shaykh Salih al-Usaymi | j-eman.net |
| Shaykh Abdullah al-Ghudayyan | algodayan.com |
| Shaykh Abdur-Rahman al-Barrak | sh-albarrak.com |
| Shaykh Salih Al al-Shaykh | saleh.af.org.sa |
| Shaykh Dagash al-Ajmi | kalelm.com (scholar page) |
| Shaykh Muhammad Sa'id Raslan | rslan.com |
| Shaykh Aziz ibn Farhan al-Anizi | azizfarhan.com |
| Shaykh Muhammad ibn Sa'd al-Shuwai'ir (compiler of Majmu' Fatawa Ibn Baz) | no verified official site yet (shuwaier.com is Shaykh Abdul-Salam al-Shuwai'ir) |
| Shaykh Othman al-Khamis (added by Mo 2026-09-28, videos and quotes) | othmanalkhamees.com |
| Shaykh Muhammad Ramzan al-Hajiri | mohammed-ramzan.com |

**Permanent Committee fatwas** (al-Lajnah ad-Da'imah, alifta.gov.sa) are used when an approved scholar on this list signed them (for example Ibn Baz, al-Fawzan, al-Ghudayyan). Decided by Mo 2026-09-28.

**Scholar quote library (Mo's decisions, 2026-09-28):** start with Ibn Baz, Ibn Uthaymeen, al-Albani and al-Fawzan (plus Permanent Committee fatwas they signed). Short quotes only, at most 600 characters of the Arabic original, unchanged, with the scholar, the printed source and a link; rights records say "no written permission yet" and permission letters are sent.

**Approved YouTube channels (Mo's decision, 2026-09-28, list in `lib/sources/youtube-channels.ts`):** Level 1, confirmed by the scholar's own website: Ibn Baz official site channel (@al.shikh.ibnbaz), al-Albani legacy portal (@alalbanyportal), Othman al-Khamis (@othmanalkamees). Level 2, official institutions by their own description: Ibn Uthaymeen foundation channel (@ibnothaimeentv), Ibn Baz Charitable Foundation (@binbaz1425). No confirmed official channel for al-Fawzan yet. Fan and compilation channels are not used. Every video still needs approval before it shows.

**How these sites are used**
- None of them offers a developer API, and several block automated reading.
- The AI needs a searchable library of their fatwas. We build it step by step: short quotes with the original link first; full fatwas only where the site gives written permission.
- Every item keeps its original link. Short quotes for explanation are generally allowed under German law (UrhG section 51); anything larger needs written permission.
- Ask each site (or its office) for written permission. The answer is recorded in the source-rights register (section 4b).

**Translations**
- A translated fatwa is not a word-for-word quote, so it is handled carefully:
  - The Arabic original is always shown next to the translation.
  - AI translations are clearly labelled "AI translation".
  - Once a human-checked translation exists (translator, reviewer, date, version), it replaces the AI one.
  - Most-asked quotes get a human-checked translation first.
  - Paraphrases are labelled as paraphrases, never as quotes.
- For search only, Arabic text may be normalised (diacritics, spelling variants). The stored original is never changed.

## 3c. Scholar review (later, does not block building)
The site works fully without scholars. When a scholar advisor or small board joins:
- They review the most-asked answers. Approved answers are saved as "answer packages" (the answer, its evidence, who approved it and when, any other views, a version number) and shown first with a "Scholar reviewed" badge.
- They decide the strongest view and create or approve documented view decisions. Automatic retrieval never decides it.
- Every change to a reviewed answer is kept in a history and can be rolled back.

## 4. Trusted sources
| Source | What it gives us | Limits we must respect | Status |
|---|---|---|---|
| Quran Foundation API (Quran.com) | Quran text, translations, tafsir | Normal caching max one week unless we get permission or use their Content Sync API. Attribution and translation credits required. Quran text never modified. Using their content with an AI needs their written OK | Pre-production credentials in `.env`. Ask them in writing about AI use and storage |
| Sunnah.com API | Hadith with grades | API covers only part of the site. Keep their numbering and grading details. No blanket permission to copy everything into our own database | Key requested again 2026-09-28 (github.com/sunnah-com/api/issues/3946) |
| HadeethEnc.com (backup until Sunnah.com) | Selected hadith with Arabic, English, German, grade and printed reference | Mo's rule: only Sahih al-Bukhari / Sahih Muslim, graded sahih or hasan, with a confirmed Bukhari/Muslim number; Muslim's introduction skipped; text shown unchanged; their unnamed explanations not used; no license stated, written permission requested | Connected to Ask 2026-09-28 (local testing, `HADITH_SOURCE=hadeethenc`) |
| Our own Answer Library | Written answers for the 12 mockup topics and, later, scholar-reviewed answer packages (section 3c) | Marked "Scholar reviewed" only after real review | Start with the 12 mockup topics |
| Approved scholars' websites | Fatwas, articles, tafsir lessons in Arabic | Short quotes only until written permission | Ask each site |
| YouTube | Lecture clips | Official embed only, never download or rehost. Store only approved video IDs; re-check regularly that they still exist. API data must be refreshed or removed under YouTube's rules. No live YouTube search per visitor | Key in `.env` |
| Al-Maktaba al-Shamila | ~8,600 classical books | A downloadable copy does not give rights to each edition, translation or notes | Later, after a legal check |

### 4b. Source-rights register (new in version 2)
Before anything is imported, each source gets a record: owner, exact edition, what use is allowed, how long we may keep a copy, translation rights, exact attribution wording, proof of permission, expiry date and how to remove it. **No rights record means no publication.**

## 5. AI provider (new in version 2, decision needed from Mo)
**Problem found:** Google's Gemini API terms (checked 2026-09-27 at ai.google.dev/gemini-api/terms) say it must not be used in a site "directed towards or likely to be accessed by individuals under the age of 18". They also say only the paid service may be used when the site is available to users in the EU, UK or Switzerland. Bayan is for everyone, which includes teenagers.

**Options:**
1. Ask Google in writing whether Bayan is allowed.
2. Compare other providers whose terms allow a general audience.
3. Or limit the Ask feature to adults (conflicts with the mission).

**Until decided:** we build and test with Gemini (free quota), used only by Mo for private testing, never by visitors. Being AI first makes this decision more important, since the AI answers every question. The AI layer is swappable, and the swap covers age rules, data retention and privacy settings, not just the technical connection. Whichever provider is chosen: paid service, zero-data-retention settings where offered, and an exact pinned model version (never "latest"). The model and answer-package version used are recorded for every reply.

Note: the old worry that Google trains on free-tier data does not apply to users in the EU; Google applies its paid-service data terms there. But public use in the EU needs the paid service anyway, and paid does not automatically mean nothing is stored.

## 6. What we need (shopping list)
**Accounts:**
- **Supabase** (database, sign-in, storage, server functions). Frankfurt.
- **Vercel** (hosts the website). Server functions pinned to Frankfurt.
- **AI provider** (section 5).
- **Quran Foundation** credentials (have pre-production; production later).
- **Sunnah.com** API key (requested).
- **Google Cloud** project for YouTube Data API (have).
- **A domain name** and a contact email.

**People (the real cost of this project):**
- **A scholar advisor or small board.** Not needed to build or launch the automatic answers. Needed later for the "Scholar reviewed" badge and the "Ask a scholar" option.
- **Native Arabic and German reviewers** for translations and site wording.
- **A lawyer who knows EU/German privacy and copyright law**, before launch.

**Rough monthly running cost:**
- Vercel Pro about 20 USD, Supabase Pro about 25 USD, plus domain and email.
- AI: as a rough guide from Codex, a cheap model costs about 5 to 11 USD per 1,000 questions (so about 50 to 110 USD per 10,000). Saving answers to common questions lowers this.
- Human review, translation and legal advice will cost more than the hosting.
- Hard spending limits and alerts on every paid service.

## 7. How it is built (simple picture)
```
Phone / computer
   │
   ▼
Website (Next.js on Vercel, server functions in Frankfurt)
   │  3 languages, right-to-left for Arabic
   ▼
Supabase (Frankfurt)
   ├─ Public content: answer library, sources, videos
   ├─ Private (not exposed): editorial tables, logs, rights register
   ├─ Sign-in: optional
   └─ Server function "ask":
        1. scholar-reviewed answer exists? → show it
        2. otherwise turn the question into a validated frame:
           question type, subject, required answer parts and conditions
        3. search broadly for candidates in the approved sources:
           Quran, sahih/hasan hadith, approved scholars' fatwas
        4. a separate AI classifies every candidate with its surrounding context;
           code keeps only direct, context-safe evidence and requires every answer part
        5. seal that evidence package; rejected passages and the visitor's raw words
           never reach the answer writer
        6. AI writes the answer ONLY from the sealed package,
           one atomic claim at a time, with a source and answer part on every claim
        7. code checks citations, copied text, language and answer-part coverage;
           a different AI checks support, relevance, context and fairness
        8. show answer + exact source text + videos,
           or "no trusted source found"
        9. if direct evidence exists but no AI wording passes the bounded checks,
           show an honest no-summary message; never show bare passages as an answer
```
The AI never has web access and never writes to the database. The model version used is saved with every answer so mistakes can be traced.

## 8. Phone-first layout
**Phone:** a bottom tab bar with 5 tabs.
| Tab (English / German / Arabic label) | Screen |
|---|---|
| Home / Start / الرئيسية | Short welcome, browse and search the topic list, entry to Ask |
| Ask / Fragen / اسأل | **Full-screen chat, the heart of the site.** Ask anything, get an automatic answer with sources inside each reply, tap a source to read it in full. A short line at the top says: "This AI answers only from trusted sources, not from its own knowledge" |
| Hard questions / Schwierige Fragen / شبهات | Topics grouped by category, each opening the misconception → reality → video → sources page |
| New to Islam / Neu im Islam / جديد في الإسلام | The step-by-step path for people new to Islam |
| More / Mehr / المزيد | Language, sign in, saved answers, about/method, privacy, report a problem ("Ask a scholar" added later) |

Changes from version 1 (Codex review): "Shubuhat" and "Seekers" renamed for English and German visitors (Arabic keeps شبهات); Home search browses topics while Ask is the conversation, so they don't feel like duplicates. Final wording to be checked by native speakers.

**Audience choice** ("I'm exploring Islam" / "I'm a Muslim with questions"): reveals belief, so it stays on the device only. Never saved to the database and never sent to analytics.

**Computer:** the same 5 sections as a side menu (left in English/German, right in Arabic), content in the middle.

**Ask screen rules:** full height, message box always visible, sources fold open and closed, videos play inline after a click, conversation saved only if signed in and the user agreed.

**Accessibility (from the first component, target WCAG 2.2 AA):**
- Real buttons, links and headings (no clickable boxes pretending to be buttons).
- Visible keyboard focus, skip link, screen-reader announcements for new chat replies.
- Reduced-motion support; captions or transcripts for videos.
- Tested at 200% and 400% text size, including long German words.

**Right-to-left:** `dir="rtl"` on the whole page for Arabic, layout built with direction-neutral CSS (start/end, not left/right). Links, reference numbers, timestamps and video controls keep their correct direction.

## 9. Languages
- Every word on screen comes from a translation file (no hard-coded text).
- Arabic flips the whole layout right-to-left, with an Arabic font (Reem Kufi for headings, Noto Naskh Arabic for reading).
- Quran and hadith are always shown in Arabic, with the translation underneath in the user's language.
- The AI answers in the language the question was asked in. Quotes stay in Arabic with a labelled translation.
- The language switch is in "More" and on the Home screen, and is remembered on the device.

## 10. Privacy (rewritten in version 2)
Questions about religion are extra-sensitive data under EU law (GDPR Article 9). A question can also reveal conversion, family problems, health, sexuality or abuse. "No account" is not the same as anonymous, because servers, logs and providers can link a question to an IP address or device.

**Before the database is designed:**
- Name the legal controller (who is responsible) and a contact address.
- Choose the legal basis (Article 6) and the Article 9 exception, with a lawyer.
- Do a Data Protection Impact Assessment (DPIA).
- Decide in writing how long each kind of data is kept.

**How the site behaves:**
- Questions from visitors without an account are **not saved in the database** by default.
- Question text never goes into links, analytics, error logs or monitoring tools.
- Abuse logs are short-lived, with a written retention period.
- Separate consent for saved chat history.
- Delete-my-data and export-my-data cover every connected system, not just our database.
- YouTube and any analytics load only after the user agrees.
- Personal answers are never stored in a public cache.

**Paperwork:** processor agreements (Supabase, Vercel, AI provider, email), list of subprocessors and where each stores data (including logs and backups), handling of transfers outside the EU, record of processing, breach-response plan, check whether a data protection officer is needed.

**Honesty:** Frankfurt covers the main database only. We do not claim "all data stays in Germany" unless every part is checked.

## 11. Safety and security (rewritten in version 2)
- All secret keys (AI, Quran Foundation, Sunnah.com, Supabase secret) stay on the server only.
- User messages, imported pages and YouTube data are treated as possibly hostile.
- The AI has no web access and cannot write to the database. Its output must be a strict format where every sentence carries a source ID from our library; the server rejects anything else.
- All shown content is cleaned before display; links only to an allowlist of domains.
- Limits per session, per account and per minute, plus a global emergency off switch.
- Caps on message length, answer length, retries and parallel requests.
- Hard spending limits and alerts on every paid service.
- Two-step login (MFA) and minimal rights for admins.
- Editorial and sensitive tables in a private part of the database; row-level security switched on and tested for every table the website can reach.
- Tested backups and restore.
- Safe fixed replies for self-harm, abuse, coercion, medical emergencies and legal matters, pointing to real help.
- Clear "not a fatwa, not personal advice" notice.

## 12. Build phases
| Phase | What is delivered | Done when |
|---|---|---|
| 0. Setup | Accounts, repo, keys in `.env`, Supabase checked | Done 2026-09-27 |
| 1. Interface | 5-tab phone layout + desktop side menu, 3 languages, Arabic right-to-left, accessibility | All tabs work on a phone in all 3 languages, keyboard and screen reader tested |
| 2. Content and sources | Database for topics, sources, scholars, videos (privacy and row-level security built in from the start); the 12 topics rewritten with approved scholars; Quran and hadith connected; source-rights register | Topics open with real videos and working source links |
| 3. Ask (AI) | Full-screen chat, the automatic "ask" pipeline from section 7, sentence-to-source check, quote checking, "no trusted source" path, swappable AI layer | Passes the test set (section 12b) |
| 4. Accounts | Optional sign-in, saved chats with consent, delete and export my data | Consent, deletion and export all work |
| 5. Launch checks | AI provider decided and on paid tier, lawyer has checked privacy and copyright, DPIA done, spending limits on, backups tested | All checks done; soft launch to friends |
| 6. Later | "Ask a scholar" request, scholar-reviewed answers, Shamela and more tafsir | When scholars join and rights are checked |

Privacy and security rules (sections 10 and 11) apply from phase 2 onwards, because they are cheap to build in and expensive to add later. Nothing is shown to the public until phase 5 is done.

### 12b. Test set (replaces "50 questions, zero wrong quotes")
A list of test questions (checked by a scholar once one joins) covering: all 3 languages, mixed languages and spelling mistakes, every topic category, personal situations and requests for rulings, recognised differences of opinion, questions with no reviewed answer, misleading or hostile questions, Arabic without diacritics, broken links and removed videos, and attempts to push the AI outside the library.

We measure: is each claim supported, are citations correct, does it refuse when it should, are translations faithful, did it follow a matching reviewed view decision or present undecided views equally, and how often it wrongly says "no answer". The same test runs before every change to the model, instructions, search or content.

### 12c. "Ask a scholar" (later, not built now)
Planned, not built now. Before building it we define: who the reviewers are and how they are checked, which subjects they answer, response times we can actually meet, confidentiality and retention, escalation for abuse, self-harm and emergencies, secure communication, and what happens if nobody picks up a request. Until then the site says: "Please ask a qualified scholar you trust." No promises of 48-hour replies, calls or anonymity.

## 13. What changed after the Codex review (2026-09-27)
| # | Codex finding | What we did |
|---|---|---|
| 1 | Gemini terms forbid sites likely used by under-18s; EU needs paid service | Kept. Section 5: provider undecided, Gemini for private testing only |
| 2 | Nobody has authority to decide the strongest view | Fixed. Automatic retrieval never decides it. A documented reviewed decision may put one view first; only a real scholar review may call it strongest or al-rajih. Otherwise checked views are equal or the answer refuses |
| 3 | AI can mislead even with real quotes | **Mo chose to stay AI first.** Mitigations: every sentence needs a source, code removes unsourced sentences, quote checking, "not a fatwa" label, report link, test set |
| 4 | Privacy plan too small for religious data | Kept. Section 10 rewritten |
| 5 | Source terms may block the library | Kept. Section 4 limits + source-rights register (4b) |
| 6 | "Word for word" fails after translation | Partly. AI translations allowed but labelled, Arabic always shown, human-checked ones replace them over time |
| 7 | "Ask a human" promised but not real | Kept. Planned for later, not promised until real (12c) |
| 8 | Build phases in the wrong order | Partly. Privacy and security built in from phase 2; legal checks before public launch, not before building |
| 9 | Security needs a threat model | Kept. Section 11 rewritten |
| 10 | 50-question test not enough | Kept. Section 12b |
| 11 | Frankfurt does not make everything EU-only | Kept. Vercel pinned to Frankfurt, subprocessor map, honest claims (sections 6, 10) |
| 12 | Tab labels and accessibility | Kept. Section 8 |
| 13 | Human review costs more than hosting | Noted. Less relevant now scholars come later |
| 14 | Trust claims ahead of reality | Kept. Section 3 exact labels; mockup wording must be fixed |

**Known risk Mo accepted:** an automatic answer can still combine real quotes into a misleading answer. The mitigations above reduce this, they don't remove it. Scholar review of the most-asked answers is the long-term fix.

**Mockup fixes still to do** (not the real app, but it is shared with friends): remove "100%", "verified" and "anonymous" claims, remove the 48-hour mentor promise, make every shown reference clickable, and replace the example speakers with approved scholars.

## 14. Questions still open
- **AI provider** given the under-18 rule (section 5). Must be decided before the public launch.
- Who to approach as scholar advisor (for later).
- **Who is the legal controller** (a person, association or company) and which lawyer checks privacy and copyright.
- Age policy for the site as a whole.
- Final name and domain.
- Which YouTube channels are approved, and asking channel owners for permission.
- Donations, subscription, or fully free?
- Whether to use the pasted "trusted-fatwa-research" skill as an internal research tool for reviewers.
