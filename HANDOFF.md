# Al-Bayan: full handoff

Written 2026-09-27 at the end of the first working session (started 2026-09-25). That session ran from the WiseFlow folder by accident of where the terminal was opened. From now on, all Al-Bayan work happens in `C:\Users\wiseflow\Bayan` only. WiseFlow is a separate product and must never be mixed in. Sections 2 and 7 updated later on 2026-09-27 in the second session.

Read in this order: `CLAUDE.md` → this file → `Memory Al Bayan.md` → `BAYAN_PLAN.md`.

---

## 1. What Al-Bayan is
A website where anyone, Muslim or not, asks a question about Islam and gets a calm, clear answer that quotes only trusted sources, with links for every quote. Arabic, German, English. Mo wants it to feel "100% trusted"; the plan explains the honest version of that promise (closed library, code-checked quotes, "I don't know" allowed, scholar review).

## 2. Current state
| Item | State |
|---|---|
| Mockup | Done and live (8 versions). Not the real app. See section 3 |
| Plan | `BAYAN_PLAN.md`, approved by Mo, includes methodology + approved scholars |
| Repo | https://github.com/ismmhd69-crypto/Al-Bayan, branch `main`. First commit pushed 2026-09-27. Remote URL includes `ismmhd69-crypto@` so this folder pushes as that account, not WiseFlow-dev. Claude's auto mode blocks `git push`, so Claude gives Mo the PowerShell commands and Mo runs them |
| Supabase | Ref `jnietkyxgnocyizvjiel`. Checked 2026-09-27 (read-only): region eu-central-1 (Frankfurt), healthy, **no tables yet**, security and performance advisors show **zero warnings**. Auth: email login only, anonymous off, email confirmation required. MCP in `.mcp.json` is read-only and limited to this project. The browser login failed ("Resource must be a valid MCP endpoint"), so it now reads a personal access token from the Windows user setting `SUPABASE_ACCESS_TOKEN` (Mo set it with `setx`; it is never in a file or chat). If the MCP tools don't load, the same checks work via the Management API with that setting |
| API keys | In `.env` (Mo pasted them): Quran Foundation Client ID + Secret (pre-production; secret rotated after a screenshot leaked it), YouTube Data API key (Google Cloud project "Al-Bayan", restricted to YouTube Data API v3), Gemini API key (free tier, testing only). Sunnah.com key still pending (section 7) |
| AI provider | Gemini (Flash) was chosen 2026-09-27 for cost, but the Codex review found Gemini's terms forbid sites likely used by under-18s and require the paid service for EU users (confirmed on ai.google.dev/gemini-api/terms). **Now undecided** (plan section 5). Gemini is for Mo's private testing only. The AI layer must be swappable |
| Plan | **Version 3** (2026-09-27). Codex review suggested a scholar-reviewed library where the AI only finds answers (version 2). **Mo rejected that: the site stays AI first and fully automatic**, people ask anything and get an answer from the approved sources. Codex's other fixes (privacy, security, source rights, labels, accessibility, tests) are kept. Plan section 13 shows what was kept |
| Code | **Phase 1 (Interface) built 2026-09-27.** Next.js 16 app in the repo root: `app/[lang]/` pages (Home, Ask, Hard questions + topic pages, New to Islam, More, How Bayan works, Privacy), `dictionaries/` (en, de, ar; German and Arabic are AI-drafted, need native check), `data/` (12 topic titles/questions, 6 New to Islam steps; no answers yet), `components/`, `proxy.ts` (sends `/` to the visitor's language). Ask screen is fully designed but `/api/ask` returns "not ready" until the source library exists. Questions pass from Home to Ask on the device only (never in the web address). Run locally: `npm install` then `npm run dev`, open http://localhost:3000. Checked on phone and computer width in all 3 languages, no sideways scrolling |
| Database (phase 2) | **Applied 2026-09-27** by Mo running `supabase/apply-migrations.ps1` (Claude's auto mode blocks live database writes, so Mo runs them). Migrations in `supabase/migrations/`: tables scholars, sources (hadith must have grade + grader, only sahih/hasan allowed), source_translations (ai/human/published, separate from originals), topics + topic_texts (3 languages, answer_status preparing/automatic/scholar_reviewed), topic_related, topic_sources, videos (YouTube IDs only), topic_videos; private schema `editorial.source_rights` (rights register, not reachable from the website). RLS on every public table, visitors read published rows only, no visitor writes. Seeded: 19 approved scholars, 12 topics. Security advisor: 0 warnings. Performance advisor: only info notes (5 unindexed foreign keys, fine while tables are empty). The website now reads topics from the database (`lib/content.ts`, refreshed hourly). The Supabase MCP stays read-only |
| Ask pipeline (phase 3, test mode) | **Working locally 2026-09-27.** `lib/ask/pipeline.ts`: (1) AI reads the question only to get language, kind (question/personal/greeting/off_topic/harmful) and search words; (2) `lib/ask/search.ts` keyword search over the Quran verses (Arabic normalised for search only); (3) AI writes max 4 sentences ONLY from the found verses, each tagged with verse ids; (4) code drops sentences without a valid source, drops Arabic sentences that re-type 4+ consecutive words of a verse, and shows the verses itself from the Quran API (so quotes can't be altered); (5) otherwise "no trusted source found". Swappable AI layer `lib/ai/` (Gemini now, pinned model `gemini-3.5-flash-lite`: the free key has no quota for 3.8 Flash and 3.5 Flash took 12 to 48 s). Quran connector `lib/sources/quran.ts` caches 1 day, never stores verses in our DB. Off unless `ASK_ENABLED=true` (set only in the git-ignored `.env.local`). Limits: 8 questions per visitor per 10 minutes, 200 per day, in memory only; question text never logged. Tested: fasting (en/de/ar) correct; "Is music haram?", personal divorce question and "Prophet's wives" correctly refused (not in Surahs 1 and 2); off-topic and prompt-injection declined. No hadith or scholar quotes yet (Sunnah key pending, no fatwa library) |
| Codex code review fixes (2026-09-27) | Codex reviewed commit e577b40 (15 findings). Fixed: (1) whole answer refused on any failure, one sentence per claim, separate AI **support check** per claim (must be "supported", else refuse); (2) search needs 2+ distinct matching words, direct refs like 2:255 read by code, neighbouring verses given as context only; (3) raw question never reaches the answer-writing call (only a validated neutral summary), all AI output validated at runtime, unknown = refuse, JSON not fake tags; (4) copy check in Arabic (4 words, whole short verse, one-word change) and English/German (7 words), quotation marks and "says:" refused; (5) Quran/translation shown exactly as served (no trim, markup = not shown), `translate="no"`, footer says what is checked, "Quran data: Quran.com / Quran Foundation" credit; (6) shared token/verse loading, 3 chapters at a time, 10 s timeouts, response validation; (8 partly) hashed visitor IDs, sweeps, number validation, concurrency cap (still in memory: shared limiter needed before launch); (9, 10) migration `20260927150000_publication_gates.sql` **(Mo must run apply-migrations.ps1)**: private-by-default, publication needs granted rights + right domain + approved scholar, scholar_reviewed needs reviewer+date, append-only history, sources/translations/topic_sources no longer public; (11) topic pages never show an unsourced answer; (12 partly) same-origin, JSON-only, 4 KB body cap, 25 s deadline, `vercel.json` Frankfurt; (13 partly) privacy text corrected (cookie, AI provider), secure cookie; (14) `npm test`: 28 safety tests with made-up text; (15 partly) contrast, reduced motion, dir on translations, translated labels, focus moves to cited verse. One redo of the draft when it breaks a writing rule. `ASK_DEBUG=true` in `.env.local` logs refusal reason codes only. **Still open:** (7) Quran Foundation written OK for AI use + Terms page (Mo decided to finish the site first, 2026-09-27); (8) shared rate limiter; CSP; per-answer report button; emergency cache purge; real phone/screen-reader test |
| Quran API limits | Pre-production keys only contain **Surahs 1 and 2**, and the Quran API search returned an error (checked 2026-09-27). Real answers need production keys and our own searchable source library in Supabase |

## 3. The mockup
- Live link (shared as "Anyone with the link"): https://claude.ai/artifact/J6MS8YX14VXQASqQQxCtWs
- Source files in `mockup/`:
  - `bayan_artifact_source.html`: the exact file published to the link above (no `<html>/<head>` wrapper; the artifact host adds it).
  - `bayan_standalone.html`: same page wrapped as a full HTML document with the phone viewport tag. This is the copy Mo uploads to tiiny.host to share with friends.
- To update the live link from a new session: `Artifact` tool `read` the URL first, then publish with `url` set to that link. Publishing without `url` creates a separate artifact.
- Single vanilla-JS file: Tailwind play CDN, Lucide icons (jsdelivr, pinned 0.460.0), Google Fonts (Newsreader, Hanken Grotesk, Reem Kufi, JetBrains Mono).
- Features that work: search + category filters over 12 topic cards, audience switch (Exploring Islam / Strengthening Conviction), card popup with a **simulated** video player (no real audio, by design) and a 3-tier answer, Foundations path, scripted "Bayan AI" chat that opens full screen, anonymous scholar-check and feedback popups (send nothing).

### Design history (what Mo liked and rejected)
1. First version: dark slate + bright emerald green per the original brief. **Mo rejected it**: "cyber looking", "vibe coded", "overwhelming green", hard to read.
2. Redesigned to **lapis blue + illumination gold** (colours of illuminated Quran manuscripts) with a proper type and spacing scale, glows and outlines removed.
3. It followed the device's dark mode; **Mo didn't want a dark page**, so it is now **always light**.
4. Fixes Mo asked for: publishing-steps row turning into dark boxes (class clash with the video player, fixed), Arabic emblem caption overlapping the circle (fixed), **page cut off on phones** (fixed with narrow-screen rules), scholar-check popup cut on phones (fixed), **AI chat too small** ("sloppy") → now full screen when used.
5. Mo's later feedback for the real site: the mockup is **too complicated on the phone**; wants **separate tab screens** (bottom tab bar: Home, Ask, Shubuhat, Seekers, More) and a **proper full AI interface**. Desktop version was "cool".

### Mockup content that is now wrong
The mockup's example speakers (Omar Suleiman, Yasir Qadhi, Hamza Tzortzis, Nouman Ali Khan, Abdal Hakim Murad, Shabir Ally, Sherman Jackson, Nidhal Guessoum, Akram Nadwi, Haifaa Younis, Jonathan Brown, Mohammed Hijab) **do not fit Mo's chosen methodology** and must be replaced with scholars from the approved list before anything is built on it. The Quran and hadith references in the mockup were chosen carefully but have **not** been checked by a qualified person.

## 4. Decisions Mo has made (binding)
- **Methodology:** Sunni only. Evidence: Quran + hadith graded **sahih or hasan only**. Tafsir from recognised Sunni works and the approved scholars.
- **Differences of opinion:** give **al-rajih** (strongest view, the one held by most approved scholars found; a scholar-reviewed answer overrides it) as the answer. Other views only in a closed "Other scholarly views" fold. Don't confuse the user. If the sources are split or unclear, show the views side by side and suggest asking a scholar.
- **Answer shape:** short answer → evidence (Arabic + translation + link) → what the scholars said (quote + link) → videos. Usually 2 to 4 sources with links.
- **AI first (Mo, 2026-09-27):** the AI answers any question automatically, but only from the approved sources. Every sentence must carry a source, code removes unsourced sentences and checks every quote. It never gives its own ruling. AI translations are labelled, Arabic always shown.
- **Approved scholars** (full table with websites in `BAYAN_PLAN.md` §3b): Ibn Baz, Ibn Uthaymeen, al-Albani, al-Fawzan, Abdul-Muhsin al-Abbad, Abdur-Razzaq al-Badr, Rabee al-Madkhali, Muqbil al-Wadi'i, Ahmad an-Najmi, Sulayman ar-Ruhayli, Salih al-Usaymi, al-Ghudayyan, Abdur-Rahman al-Barrak, Salih Al al-Shaykh, Dagash al-Ajmi, Raslan, Aziz ibn Farhan al-Anizi, ash-Shuwayr, Muhammad Ramzan al-Hajiri.
- **Accounts:** optional (anonymous by default; sign-in only saves history/favourites).
- **Scholars for review:** none yet and not needed to build or launch. Later they review most-asked answers ("Scholar reviewed" badge). The "Ask a scholar" request is planned but **not built now**.
- **Videos:** curated YouTube clips with timestamps.
- **Languages:** Arabic (RTL), German, English.
- **Stack (from plan):** Next.js on Vercel (functions pinned to Frankfurt) + Supabase (Frankfurt) + a swappable AI provider (undecided, see section 2).

## 5. Research done (with sources)
**Shamela / Islamic libraries**
- `shamela.link`: free, **unofficial** MCP connector to ~8,600 Shamela books; not affiliated with shamela.ws; doesn't grade hadith. Fine for testing, too fragile to build on. https://shamela.link
- Full Shamela v4 extraction exists on Hugging Face (~8,589 books, ~19 GB). Many books are modern copyrighted editions, so **rights must be checked** before using it. https://huggingface.co/datasets/AuthenticIlm/Shamela4_Full_DB
- Shamela has no public documented API; a Node library exists but needs a Shamela API key. https://github.com/ragaeeb/shamela
- **Sunnah.com API**: hadith with grades, key requested via GitHub issue (slow, many pending). Base URL `https://api.sunnah.com/v1/`, header `X-API-Key`, mock server available for building before the key arrives. https://sunnah.com/developers
- **Quran Foundation API** (Quran.com): text, translations, tafsir; client ID + secret. https://api-docs.quran.foundation/

**Review of Mo's first source list** (German/English websites, Telegram, Instagram, Facebook, YouTube channels): almost all from one network that openly calls itself Salafi. Telegram/Instagram/Facebook can't feed an AI reliably; blogs aren't primary sources; YouTube channels usable as a video pool (ask permission). Told Mo that German authorities watch the Salafi movement generally (status of these specific channels unknown) and to check before featuring German channels. Mo then chose the approved-scholars list above.

**Review of the "trusted-fatwa-research" skill Mo pasted** (research rules over al-fatawa.com, fatawapedia.com, dorar.net):
- Good ideas to keep: strict allowlist, quote-don't-rule, link per claim, self-verification step, "under-claim when unsure", dorar.net for hadith grades.
- Problems: Arabic-only replies (Bayan needs 3 languages); live web search instead of a checked library; al-fatawa.com and fatawapedia.com don't say who runs them and showed no links back to original books or official scholar sites; dorar.net blocks automated reading (returned 403), so quotes can't be verified; Mo's paste was **cut off** at the dorar row, rest not reviewed.
- Recommendation given: use it as a **research tool for writing reviewed library answers**, not as the live website AI. Mo hasn't decided yet.

## 6. How to work with Mo (important)
- **Plain English, short replies** (~120 words), short bullets, no jargon. Mo is not a programmer.
- **Never use em dashes** (—) anywhere: chat, copy, docs.
- **Answer the question first, then stop.** Don't chain extra actions Mo didn't ask for.
- Once Mo states concrete rules, **build them**; don't keep offering option menus.
- Mo wants **honest, no-sugarcoat** reviews.
- Say plainly what was checked and what wasn't.
- **Secrets never in chat.** Supabase secret key, database password, Gemini key and other API keys go in a local `.env` that Mo fills in; never committed.
- Mo may interrupt tool calls; stop and wait when that happens.

## 7. Waiting on Mo
- Sunnah.com API key: **request sent by Mo on 2026-09-27, waiting for approval.** Build against their mock server until it arrives.
- Quran Foundation Client ID + Secret: **done 2026-09-27**, in `.env`. Pre-production only; production access must be requested later in their dev console.
- YouTube Data API key: **done 2026-09-27**, in `.env`.
- Gemini API key: **done 2026-09-27**, in `.env`, free tier. Private testing only. Google's terms require the paid service once EU visitors use it, and forbid sites likely used by under-18s, so the provider decision comes first (plan section 5). Whatever provider is chosen: paid tier + monthly budget alert before any visitor uses it.
- Later: domain name, scholar advisor(s), permission from scholars' sites, native Arabic/German reviewers.

## 8. Next steps (in order, ask Mo before each)
Done 2026-09-27: GitHub remote + first commit, Supabase read-only check, Codex review, plan version 3 (AI first).

1. ~~Phase 1 (Interface)~~ **done 2026-09-27**: Next.js skeleton, 5-tab phone layout (Home, Ask, Hard questions, New to Islam, More; Arabic keeps شبهات), desktop side menu, 3 languages with Arabic right-to-left, lapis + gold design, always light, accessibility from the first component (plan section 8).
2. Then phase 2 (content and sources) and phase 3 (the automatic Ask). Before public launch (phase 5), Mo needs: AI provider decided (plan section 5), a privacy and copyright lawyer, who legally owns the site, and a written OK from Quran Foundation about AI use.
3. Fix the mockup's trust claims (plan section 13, last paragraph).
4. Later phases follow plan section 12.

## 9. Open questions (see plan section 14)
Final name/domain; which scholar advisor; YouTube channel permissions and which channels are approved; who decides rajih when unclear; human vs AI-drafted translations of fatwas; free vs donations vs subscription; whether to adopt the pasted research skill as an internal tool.
