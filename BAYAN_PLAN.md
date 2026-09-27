# Bayan: plan for the real website

## 1. The goal in one paragraph
Bayan is a website where anyone, Muslim or not, can ask a question about Islam and get a calm, clear answer that quotes only trusted sources: the Quran, graded hadith, and recognised scholarship. It works in Arabic, German and English, feels simple on a phone, and always shows where every sentence comes from. When the AI cannot find a trusted source, it says so and offers a human scholar instead of guessing.

## 2. Decisions already made
| Topic | Decision |
|---|---|
| Project home | Separate project at `C:\Users\wiseflow\Bayan` (not inside WiseFlow) |
| Accounts | Optional. Anyone can ask anonymously. Signing in only saves chat history and favourites |
| Scholars | None yet. Launch with source-only AI answers; build the scholar review queue so it is ready when scholars join |
| Videos | Curated YouTube lectures from real scholars, linked with start/end times |
| Languages | Arabic (right-to-left), German, English |
| Look | The lapis blue + gold light design from the mockup |
| Methodology | Sunni only (Ahl al-Sunnah). Evidence from the Quran and authentic hadith only. Explanations and rulings quoted from the approved scholars in section 3b |
| When scholars differ | Show the strongest view (al-rajih) clearly as the answer. Other views only in a small "Other scholarly views" fold, never in a way that confuses the user |

## 3. About "100% trusted" (honest version)
No AI can promise 100%. What we *can* promise, and should say on the site:
1. **Closed library.** The AI may only answer from our approved sources. It never searches the open internet.
2. **Every quote is checked by code, not by the AI.** Before an answer is shown, the server fetches each quoted verse and hadith again from the source and checks the text matches word for word. Anything that fails is removed.
3. **Grades are shown, never invented.** Hadith grades come from the source data (Sunnah.com), not from the AI.
4. **"I don't know" is allowed.** No source found means no answer, plus the offer of a scholar check.
5. **Scholar-approved answers.** The most-asked questions get a written answer reviewed by a scholar. The AI shows those first, marked "Scholar reviewed".
6. **The AI never makes its own ruling.** It may only quote rulings (fatwas) of the approved scholars, word for word, with a link to the original page. Personal situations are always sent to a human.

## 3b. Methodology and answer format

**Evidence rules**
- Quran: always shown in Arabic, with the translation in the user's language and a link to Quran.com.
- Hadith: only graded **sahih** or **hasan**. Weak (da'if) and fabricated narrations are never used as evidence. Grade and grader are always shown.
- Tafsir: from recognised Sunni works (for example Ibn Kathir, al-Tabari, al-Sa'di, al-Qurtubi) and the tafsir lessons of the approved scholars.
- Every quote links to the exact page it came from.

**When there is a difference of opinion**
1. The answer states the strongest view (al-rajih) as held by the approved scholars, with its evidence.
2. If approved scholars clearly differ on a practical matter, a closed "Other scholarly views" fold lists the other view(s) briefly, with who held them.
3. If the rajih view cannot be determined from the sources, Bayan says so and offers the scholar check. It never picks a side on its own.

**Every answer has the same 4 parts**
1. **Short answer** in plain words.
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
| Shaykh Salih al-Fawzan | al-fuzan.com |
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
| Shaykh ash-Shuwayr | shuwaier.com |
| Shaykh Muhammad Ramzan al-Hajiri | mohammed-ramzan.com |

**How these sites are used**
- None of them offers a developer API. Their fatwas and articles would be collected into Bayan's own searchable library, with the original link saved for every item.
- Ask each site (or its office) for written permission before copying content. Until permission is given, Bayan only links to the page and quotes short excerpts.
- The AI answers from this library, never from the live web.
- Most content is in Arabic. German and English versions of each quote are AI-drafted translations, clearly labelled "translation", with the Arabic original always shown.

**Mockup change needed:** the mockup's example speakers and videos must be replaced with scholars from the approved list above.

## 4. Trusted sources
| Source | What it gives us | How we get it | Status |
|---|---|---|---|
| Quran Foundation API (Quran.com) | Quran text, translations (incl. German, English), tafsir | Free developer account, apply for credentials | Use from day one |
| Sunnah.com API | Major hadith collections with grades | Request an API key on their GitHub | Use from day one |
| Our own "Answer Library" | Scholar-written answers to common shubuhat, with sources | We write and review them, stored in our database | Start with the 12 mockup topics |
| Al-Maktaba al-Shamila | ~8,600 classical Arabic books | Later. `shamela.link` is unofficial, fine for testing only. A downloadable copy exists, but many books are modern copyrighted editions, so rights must be checked first | Phase 5, after legal check |
| YouTube | Lecture clips | YouTube Data API key, curated list with timestamps | Day one |
| Approved scholars' websites (section 3b) | Fatwas, articles, tafsir lessons in Arabic | Collected into our library with the original link, after asking permission | Phase 2 onwards |

## 5. What we need (shopping list)
**Accounts to create (you do these, all have free tiers to start):**
- **Supabase** (database, sign-in, file storage, server functions). EU region (Frankfurt) because of German users and privacy law.
- **Vercel** (hosts the website).
- **Anthropic API** (the AI that writes the answers).
- **Quran Foundation** developer credentials.
- **Sunnah.com** API key (GitHub request).
- **Google Cloud** project for a YouTube Data API key.
- **A domain name** (for example bayan-something.com), about 10 to 20 per year.

**People:**
- At least one qualified scholar or student of knowledge as an advisor (needed before public launch, not to start building).
- Native speakers to check the Arabic and German wording of the app (AI drafts it first).

**Rough monthly running cost at small scale:** Vercel free or ~20 USD, Supabase free or ~25 USD, AI usage depends on number of questions (we add daily limits so it cannot run away).

## 6. How it is built (simple picture)
```
Phone / computer
   │
   ▼
Website (Next.js on Vercel)  ── 3 languages, right-to-left for Arabic
   │
   ▼
Supabase
   ├─ Database: topics, answers, sources, videos, chats, scholar queue
   ├─ Sign-in: email link, Google, Apple (optional for users)
   └─ Server function "ask":
        1. search our Answer Library first
        2. search Quran + hadith sources
        3. AI writes the answer ONLY from what was found
        4. code re-checks every quote against the source
        5. return answer + citations + videos, or "I don't know" + scholar offer
```

## 7. New phone-first layout (fixes "too complicated on the phone")
**Phone:** a bottom tab bar with 5 tabs. Each tab is its own clean screen.
| Tab | Screen |
|---|---|
| Home | Short welcome, search box, "I'm exploring Islam" / "I'm a Muslim with questions" choice |
| Ask | **Full-screen AI chat**, like a messaging app. Suggested questions, sources inside each reply, tap a source to read it in full |
| Shubuhat | Topics grouped by category, each opening the misconception → reality → video → sources page |
| Seekers | The step-by-step "New to Islam" path |
| More | Language, sign in, saved answers, scholar check, about/method, feedback |

**Computer:** the same 5 sections as a side menu (left in English/German, right in Arabic), content in the middle.

**AI screen rules:** full height, message box always visible, sources fold open and closed, videos play inline, "Ask a scholar" always one tap away, conversation saved if signed in.

## 8. Languages
- Every word on screen comes from a translation file (no hard-coded text).
- Arabic flips the whole layout right-to-left, with an Arabic font (Reem Kufi for headings, Noto Naskh Arabic for reading).
- Quran and hadith are always shown in Arabic, with the translation underneath in the user's language.
- The AI answers in the language the question was asked in.
- The language switch is in "More" and on the Home screen, and is remembered.

## 9. Privacy and safety
- Religious belief counts as extra-sensitive data under EU law (GDPR). Anonymous use by default, minimal data kept, EU hosting, clear privacy page, delete-my-data button.
- Daily question limits per visitor to control cost and abuse.
- Harmful or hostile messages are answered politely or declined; nothing is shown publicly.
- Clear "not a fatwa" notice on every AI answer.

## 10. Build phases
| Phase | What is delivered | Done when |
|---|---|---|
| 0. Setup | Accounts created, repo, empty site live on a test link | You can open the test link |
| 1. Skeleton | 5-tab phone layout + desktop side menu, 3 languages, Arabic right-to-left | All tabs work on a phone in all 3 languages |
| 2. Content | Database with the 12 mockup topics, sources, curated YouTube clips; Shubuhat and Seekers tabs read from it | Topics open with real videos and working source links |
| 3. Ask (AI) | Full-screen chat, the "ask" pipeline from section 6, quote checking, "I don't know" path | 50 test questions answered with zero wrong quotes |
| 4. Accounts + scholar queue | Optional sign-in, saved chats, scholar check requests stored, simple admin page to answer them | A request can be sent and answered end to end |
| 5. More sources | Shamela (after rights check) and more tafsir | Legal check done, search works in Arabic |
| 6. Launch | Domain, privacy page, scholar sign-off on core answers, limits on | Scholar approves the top answers; soft launch to friends |

## 11. Questions still open (not blocking the start)
- Final name and domain.
- Which scholar(s) to approach as advisors.
- Whether to ask YouTube channel owners for permission before featuring their clips (recommended).
- Donations, subscription, or fully free?
- Which YouTube channels are approved for video clips (must match the approved scholars list).
- Who decides the rajih view when the sources are unclear (the scholar advisor).
- Translation of Arabic fatwas: AI draft plus a human check, or human only for published answers?
