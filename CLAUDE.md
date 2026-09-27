# Al-Bayan

Islamic Q&A website (Sunni only, authentic sources, Arabic/German/English). This folder is its own project. It has nothing to do with WiseFlow; never read from, write to or mention the WiseFlow repo or its Supabase project here.

## Read first, every session
1. `HANDOFF.md`: full history, decisions, research, how to work with Mo.
2. `Memory Al Bayan.md`: short running memory. Update it when something new is decided.
3. `BAYAN_PLAN.md`: the approved plan and methodology.

## Non-negotiables
- Replies to Mo: plain English, short, no jargon, **no em dashes**. Answer first, then stop.
- Secrets only in `.env` (git-ignored). Never ask Mo to paste a secret key into chat.
- Supabase project for this app: ref `jnietkyxgnocyizvjiel` (Frankfurt). Never use any other project.
- Content rules: Quran + hadith graded sahih/hasan only; the AI quotes approved scholars, never issues its own ruling; al-rajih first, other views only in a closed fold; every quote has a link.
- Ask Mo before commits, pushes, database changes or anything outward-facing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
