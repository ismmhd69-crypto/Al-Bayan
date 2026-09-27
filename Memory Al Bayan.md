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
- AI never makes its own ruling; it quotes approved scholars word for word with links.
- Approved scholars list is in `BAYAN_PLAN.md` section 3b.
- Languages: Arabic (right-to-left), German, English.
- Accounts optional; videos are curated YouTube clips.
- AI model: Google Gemini (Flash) for answers, chosen 2026-09-27 for cost. Code must allow swapping providers.
- Phone: bottom tab bar (Home, Ask, Shubuhat, Seekers, More). Ask = full-screen AI chat.

## Rules for working on this project
- Keep Al-Bayan fully separate from WiseFlow: separate folder, repo, Supabase and notes.
- Secrets (Supabase secret key, database password, Anthropic key, other API keys) go in a local `.env` file, never in chat and never committed.
- The mockup's example speakers must be replaced with scholars from the approved list.

## Waiting on
- Sunnah.com API key: **request sent 2026-09-27, Mo is waiting for their approval**
- Quran Foundation Client ID + Secret: **done 2026-09-27**, in `.env` (pre-production credentials; secret was rotated after a screenshot exposed it). Production access must be requested later in the dev console.
- YouTube Data API key: **done 2026-09-27**, in `.env` (Google Cloud project "Al-Bayan")
- Gemini API key: **done 2026-09-27**, in `.env` (project Al-Bayan). Mo chose Gemini over Anthropic because it is cheaper. Currently on the **free tier** for testing only. **Before any real visitor uses the site:** set up billing (Tier 1) + a monthly budget alert, because the free tier lets Google train on the data.

## Next chat starts with
- Write a ready-to-paste review prompt for GPT Codex (details in `HANDOFF.md` section 8, step 1). Then Phase 1.
