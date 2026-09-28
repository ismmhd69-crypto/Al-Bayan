# Memory: Al-Bayan

Project notes for Al-Bayan only. Nothing here relates to WiseFlow.

## Where things live
- Full history and handoff: `HANDOFF.md` (this folder)
- Plan: `BAYAN_PLAN.md` (this folder)
- Mockup source files: `mockup/` (artifact source + standalone copy for tiiny.host)
- Settings template: `.env.example` (copy to `.env`, fill secrets yourself)
- Project folder: `C:\Users\wiseflow\Bayan` (own git repo)
- GitHub: https://github.com/ismmhd69-crypto/Al-Bayan (connected; first commit pushed 2026-09-27). Remote URL includes `ismmhd69-crypto@` so this folder pushes as that account, not WiseFlow-dev. Claude's auto mode blocks git push, so Mo runs pushes in PowerShell.
- Supabase project ref: `jnietkyxgnocyizvjiel`, region Frankfurt (EU). Checked 2026-09-27 with the public key: healthy, email login only, anonymous off, email confirm required. Supabase MCP set up in `.mcp.json` (read-only, this project only). Browser login failed ("Resource must be a valid MCP endpoint"), so it now uses a personal access token from the Windows user setting `SUPABASE_ACCESS_TOKEN` (set by Mo with setx; never in files or chat). Checked 2026-09-27 read-only: region eu-central-1 (Frankfurt), healthy, no tables yet, security and performance advisors show zero warnings.
- Mockup: https://claude.ai/artifact/J6MS8YX14VXQASqQQxCtWs (lapis blue + gold, always light)

## Decisions
- Sunni only. Quran + hadith graded sahih or hasan only.
- Strongest view (al-rajih) is the answer; other views only in a closed "Other scholarly views" fold.
- AI never makes its own ruling; it only reports what approved scholars said, with links.
- Approved scholars list is in `BAYAN_PLAN.md` section 3b.
- Languages: Arabic (right-to-left), German, English.
- Accounts optional; videos are curated YouTube clips.
- Plan version 3 (2026-09-27): **AI first, fully automatic.** Mo rejected Codex's "scholar library, AI only finds answers" idea. AI answers anything, only from approved sources, every sentence sourced, quotes code-checked. Rajih = view of most approved scholars found. "Ask a scholar" planned, not built now. Codex's privacy, security, rights, labels, accessibility and test fixes kept. Build order in plan section 12.
- AI provider: undecided for the public site (Gemini terms problem, plan section 5). Code must allow swapping providers.
- 2026-09-28: Mo switched to a **paid Gemini key** and wants **budget models only**: writer `gemini-3.5-flash-lite`, checker `gemini-3.1-flash-lite` (now the code defaults in `lib/ai/index.ts`). Don't use the bigger Flash models. Remind Mo to set a monthly budget alert in Google Cloud if not done.
- Phone: bottom tab bar (Home, Ask, Hard questions, New to Islam, More; Arabic keeps شبهات). Ask = full-screen chat, the heart of the site, answers anything automatically.

## Rules for working on this project
- Keep Al-Bayan fully separate from WiseFlow: separate folder, repo, Supabase and notes.
- Secrets (Supabase secret key, database password, AI and other API keys) go in a local `.env` file, never in chat and never committed.
- The mockup's example speakers must be replaced with scholars from the approved list.

## Waiting on
- Hadith backup research (2026-09-28): Mo wants Sahih al-Bukhari / Sahihayn. Best backup = **HadeethEnc.com** (public API `hadeethenc.com/api/v1/...`, Arabic + English + German, fields `attribution_ar` e.g. رواه البخاري and `grade_ar` e.g. صحيح; selected frequently-cited hadith only, no hadith numbers, no license stated, unnamed explanations: use text + grade only, needs written permission). Rejected: fawazahmed0/hadith-api (copied from many sites, unclear rights, no German), hadithapi.com (one person, no terms, no grades). For Bukhari/Muslim skip mu'allaq chapter-heading reports and Muslim's muqaddimah; always store the numbering system.
- Sunnah.com API key: first request (2026-09-27) could not be found on GitHub. **New request filed 2026-09-28: https://github.com/sunnah-com/api/issues/3946** (as ismmhd69-crypto). Key arrives by email; Mo puts it in `.env` as `SUNNAH_API_KEY`. Approvals take 0 to 2 days for some, weeks for others.
- Quran Foundation Client ID + Secret: **done 2026-09-27**, in `.env` (pre-production credentials; secret was rotated after a screenshot exposed it). Production access must be requested later in the dev console.
- YouTube Data API key: **done 2026-09-27**, in `.env` (Google Cloud project "Al-Bayan")
- Gemini API key: **done 2026-09-27**, in `.env` (project Al-Bayan). Mo chose Gemini over Anthropic because it is cheaper. Free tier, Mo's private testing only. **Codex review found (and Claude confirmed on Google's terms page) that Gemini forbids sites likely used by under-18s and needs the paid service for EU users. AI provider is now undecided (plan section 5).** Whatever is chosen: paid tier + budget alert before any visitor.

## Next chat starts with
- Phase 1 (Interface) built and committed 2026-09-27: all 5 tabs, 3 languages, Arabic right-to-left, Ask screen designed but answers switched off until the source library exists. Phase 2 database applied 2026-09-27 (Mo ran `supabase/apply-migrations.ps1`; Claude's auto mode blocks live database writes, so future migrations: Claude writes the SQL file, Mo runs the script). 19 scholars + 12 topics seeded, RLS on, 0 security warnings. Website reads topics from Supabase. Phase 3 Ask pipeline working locally in test mode (2026-09-27): answers from Surahs 1 and 2 only, every sentence sourced, verses shown straight from the Quran API, Arabic copy-check, refusals work. Model pinned: gemini-3.5-flash-lite (free key has no 3.8 Flash quota). Next: hadith (Sunnah.com key pending), scholar fatwa library (needs sources chosen + permissions), production Quran keys (Mo to request), topic answers, test set (plan 12b).
- Codex code review (15 findings) fixed 2026-09-27, see HANDOFF section 2. Mo must run `supabase/apply-migrations.ps1` for the new publication-gates migration. Mo chose to finish the website before asking Quran Foundation for AI permission (Sunday, no reply expected); still needed before any public use.
- Codex second review fixed 2026-09-28 (see HANDOFF section 2). `20260928090000_gate_gaps` applied 2026-09-28 by Claude at Mo's request (verified: short_answer hidden from visitors; advisor shows only expected info notes for the 3 private tables). Mo said Claude should run `supabase/apply-migrations.ps1` itself when Mo asks, instead of handing it over. Personal questions now go to "ask a scholar" (never answered automatically). Known issue: Arabic answers often refused; tune when more AI quota.
- Quran Foundation **Search permission granted** (prelive, 2026-09-28). Ask now uses their search (`/search/api/v1/search`, token scope `content search`) and fetches only the found verses by key; the whole-Quran download and our own keyword search were removed. Prelive search covers all 114 surahs, but prelive verse text only Surahs 1 and 2 (others 404), so results are filtered to 1 and 2 until production keys.
- Evidence-retrieval Ask finished and committed 2026-09-28: question frame, Quran Foundation advanced search, direct/mention-only evidence gate, sealed package, one-fact claims, two-model screening, strict source-only fallback (exact verses only, needs an independent audit; never after insufficient evidence). Arabic copy check now catches Uthmani-spelling retyping. Deadline 50 s. 82 tests, typecheck and build pass. Live "Who is Allah?" answered in en/de/ar from 2:163/2:255/2:257, no mention-only verses. Source-only mode proven by tests only, not seen live yet. Next: connect HadeethEnc hadith (commits 65fd6e0, 8e1054f) as a second source through the same evidence gate.
- Quran Foundation pre-production keys only include Surahs 1 and 2; its search endpoint returned an error. Ask Mo to request production access when we reach phase 3.
