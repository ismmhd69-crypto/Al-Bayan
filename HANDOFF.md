# Al-Bayan: full handoff

Written 2026-09-27 at the end of the first working session (started 2026-09-25). That session ran from the WiseFlow folder by accident of where the terminal was opened. From now on, all Al-Bayan work happens in `C:\Users\wiseflow\Bayan` only. WiseFlow is a separate product and must never be mixed in.

Read in this order: `CLAUDE.md` → this file → `Memory Al Bayan.md` → `BAYAN_PLAN.md`.

---

## 1. What Al-Bayan is
A website where anyone, Muslim or not, asks a question about Islam and gets a calm, clear answer that quotes only trusted sources, with links for every quote. Arabic, German, English. Mo wants it to feel "100% trusted"; the plan explains the honest version of that promise (closed library, code-checked quotes, "I don't know" allowed, scholar review).

## 2. Current state
| Item | State |
|---|---|
| Mockup | Done and live (8 versions). Not the real app. See section 3 |
| Plan | `BAYAN_PLAN.md`, approved by Mo, includes methodology + approved scholars |
| Repo | `git init` done in this folder, **nothing committed yet**. Remote: https://github.com/ismmhd69-crypto/Al-Bayan (not yet connected with `git remote add`) |
| Supabase | Project created by Mo. Ref `jnietkyxgnocyizvjiel`, region Frankfurt. Empty. Publishable key is in `.env.example` (safe to share). Not yet inspected by Claude |
| API keys | Mo has been told how to request them; none received yet (section 7) |
| Code | None written yet |

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
- **Differences of opinion:** give **al-rajih** (strongest view, most commonly held by the approved scholars) as the answer. Other views only in a closed "Other scholarly views" fold. Don't confuse the user. If the rajih view is unclear, say so and offer the scholar check.
- **Answer shape:** short answer → evidence (Arabic + translation + link) → what the scholars said (quote + link) → videos. Usually 2 to 4 sources with links.
- **AI never rules on its own.** It only quotes approved scholars' fatwas word for word with a link.
- **Approved scholars** (full table with websites in `BAYAN_PLAN.md` §3b): Ibn Baz, Ibn Uthaymeen, al-Albani, al-Fawzan, Abdul-Muhsin al-Abbad, Abdur-Razzaq al-Badr, Rabee al-Madkhali, Muqbil al-Wadi'i, Ahmad an-Najmi, Sulayman ar-Ruhayli, Salih al-Usaymi, al-Ghudayyan, Abdur-Rahman al-Barrak, Salih Al al-Shaykh, Dagash al-Ajmi, Raslan, Aziz ibn Farhan al-Anizi, ash-Shuwayr, Muhammad Ramzan al-Hajiri.
- **Accounts:** optional (anonymous by default; sign-in only saves history/favourites).
- **Scholars for review:** none yet; build the review queue ready for later.
- **Videos:** curated YouTube clips with timestamps.
- **Languages:** Arabic (RTL), German, English.
- **Stack (from plan):** Next.js on Vercel + Supabase (Frankfurt) + Anthropic API.

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
- **Secrets never in chat.** Supabase secret key, database password, Anthropic key and other API keys go in a local `.env` that Mo fills in; never committed.
- Mo may interrupt tool calls; stop and wait when that happens.

## 7. Waiting on Mo
- Sunnah.com API key: **request sent by Mo on 2026-09-27, waiting for approval.** Build against their mock server until it arrives.
- **First job for the new session:** guide Mo step by step (short, plain English, one step at a time) through getting the Quran Foundation Client ID + Secret and the YouTube Data API key, then have Mo paste them into `.env` themselves (never into chat).
- Quran Foundation Client ID + Secret.
- YouTube Data API key (Google Cloud → enable YouTube Data API v3 → API key).
- Anthropic API key (into `.env`, not chat).
- Later: domain name, scholar advisor(s), permission from scholars' sites, native Arabic/German reviewers.

## 8. Suggested next steps (in order, ask Mo before each)
1. Connect the GitHub remote and make the first commit (plan, memory, handoff, mockup, `.gitignore`, `.env.example`).
2. Inspect the empty Supabase project (read-only first) and confirm region/settings.
3. Phase 1 from the plan: Next.js skeleton with the 5-tab phone layout, desktop side menu, 3 languages with Arabic RTL, lapis + gold design carried over from the mockup.
4. Phase 2: database tables for topics, answers, sources, scholars, videos; rewrite the 12 topics using approved scholars only.
5. Phase 3: the "ask" pipeline (library first, sources second, AI writes only from what was found, code re-checks every quote).

## 9. Open questions (from the plan)
Final name/domain; which scholar advisor; YouTube channel permissions and which channels are approved; who decides rajih when unclear; human vs AI-drafted translations of fatwas; free vs donations vs subscription; whether to adopt the pasted research skill as an internal tool.
