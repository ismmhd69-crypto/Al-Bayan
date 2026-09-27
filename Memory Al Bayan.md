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
- AI provider: undecided (Gemini terms problem, plan section 5). Code must allow swapping providers.
- Phone: bottom tab bar (Home, Ask, Hard questions, New to Islam, More; Arabic keeps شبهات). Ask = full-screen chat, the heart of the site, answers anything automatically.

## Rules for working on this project
- Keep Al-Bayan fully separate from WiseFlow: separate folder, repo, Supabase and notes.
- Secrets (Supabase secret key, database password, AI and other API keys) go in a local `.env` file, never in chat and never committed.
- The mockup's example speakers must be replaced with scholars from the approved list.

## Waiting on
- Sunnah.com API key: **request sent 2026-09-27, Mo is waiting for their approval**
- Quran Foundation Client ID + Secret: **done 2026-09-27**, in `.env` (pre-production credentials; secret was rotated after a screenshot exposed it). Production access must be requested later in the dev console.
- YouTube Data API key: **done 2026-09-27**, in `.env` (Google Cloud project "Al-Bayan")
- Gemini API key: **done 2026-09-27**, in `.env` (project Al-Bayan). Mo chose Gemini over Anthropic because it is cheaper. Free tier, Mo's private testing only. **Codex review found (and Claude confirmed on Google's terms page) that Gemini forbids sites likely used by under-18s and needs the paid service for EU users. AI provider is now undecided (plan section 5).** Whatever is chosen: paid tier + budget alert before any visitor.

## Next chat starts with
- Phase 1 (Interface) built and committed 2026-09-27: all 5 tabs, 3 languages, Arabic right-to-left, Ask screen designed but answers switched off until the source library exists. Phase 2 database applied 2026-09-27 (Mo ran `supabase/apply-migrations.ps1`; Claude's auto mode blocks live database writes, so future migrations: Claude writes the SQL file, Mo runs the script). 19 scholars + 12 topics seeded, RLS on, 0 security warnings. Website reads topics from Supabase. Next: fill the source library (Quran verses, hadith, scholar quotes) and connect the Ask pipeline (phase 3).
- Quran Foundation pre-production keys only include Surahs 1 and 2; its search endpoint returned an error. Ask Mo to request production access when we reach phase 3.
