# Al-Bayan

Islamic Q&A website (Sunni only, authentic sources). Launch languages: Arabic and English. German is postponed until after launch. This folder is its own project. It has nothing to do with WiseFlow; never read from, write to or mention the WiseFlow repo or its Supabase project here.

## Launch language workflow (Mo, 2026-10-25)
- Focus current development, content review and testing on English and Arabic.
- German work is stopped until after launch. Do not start German translation jobs, paid API tests or dedicated German QA campaigns.
- German completion, native-language review and three-language parity are not launch requirements. Older three-language instructions describe the longer-term plan and do not override this decision.
- Preserve the existing German code and content for later.
- Update (Mo, 2026-10-29): the website launches with Arabic and English only. German is removed from the language switcher, German pages and API requests are not served (`activeLocales` in `lib/i18n.ts`), and old `/de/...` links redirect to English. English AI translations of fatwas are published (labelled as AI translations); German translations stay unpublished.
- Keep shared source-integrity and safety checks intact; failures affecting English or Arabic still need fixing.

## Ask research and reading flow (Mo, 2026-10-25)
- Do not abandon religious research because an answer, search, source connection, model call or correction reached an application time target. Local testing uses `ASK_LOCAL_UNHURRIED=true` for all those stages.
- Keep visitor cancellation, source/meaning checks and spending protections. No fabricated answer or unlimited paid retry is authorized by removing time cutoffs.
- Show real progress while research is running. Do not start with an incomplete-answer notice, an unavailable summary, or a premature conclusion.
- Reading order: Quran, Sunnah, approved scholars, then Bayan's conclusion. Keep unfinished later groups and the conclusion from appearing ahead of earlier research. Put genuine interruption details below the available answer after research stops.
- A first search leaving evidence gaps should lead to a bounded new-query recovery round inside the same answer when spending and integrity gates allow it.
- Hosted platform limits still require accepted background execution. Local unhurried behavior is not proof that a hosted request can run indefinitely.

## Read first, every session
1. `HANDOFF.md`: full history, decisions, research, how to work with Mo.
2. `Memory Al Bayan.md`: short running memory. Update it when something new is decided.
3. `BAYAN_PLAN.md`: the approved plan and methodology.

## Non-negotiables
- Replies to Mo: plain English, short, no jargon, **no em dashes**. Answer first, then stop.
- Secrets only in `.env` (git-ignored). Never ask Mo to paste a secret key into chat.
- **Our API keys are for the website only.** Never use any key in `.env` (Gemini, YouTube, Quran Foundation, Sunnah.com, Supabase, OpenRouter, NVIDIA or any other) for anything except running the Al-Bayan website, unless Mo explicitly asks for that exact use. That includes videos, voiceovers, transcriptions, covers, tests of other tools and any other creation. (Mo, 2026-10-04.) Exception approved by Mo: the Gemini key may be used for video voiceovers only.
- Supabase project for this app: ref `jnietkyxgnocyizvjiel` (Frankfurt). Never use any other project.
- Content rules: Quran + hadith graded sahih/hasan only; the AI quotes approved scholars, never issues its own ruling; only a documented, scholar-reviewed view decision may put one view first as al-rajih, with other views in a closed fold; without one, supported views are shown with equal weight and attributed to their scholars, never ranked by counting quotes (BAYAN_PLAN.md, aligned by Mo 2026-10-29); every quote has a link.
- Ask Mo before commits, pushes, database changes or anything outward-facing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
