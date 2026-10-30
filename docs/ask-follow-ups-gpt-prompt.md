# Prompt for GPT: build phases 0 to 2 of Ask follow-ups

Paste everything below the line into GPT, working in this repo.

---

You are implementing phases 0, 1 and 2 of a written plan in the Al-Bayan repo at C:\Users\wiseflow\Bayan.

Read these first, in this order:
1. CLAUDE.md, then HANDOFF.md, "Memory Al Bayan.md" and BAYAN_PLAN.md (the project rules)
2. docs/ask-follow-ups-plan.md (the plan, version 4.1)
3. mockups/ask-followups.html (visual reference only)
4. The Next.js guide in node_modules/next/dist/docs/ before writing any Next.js code. This version differs from your training data.

SCOPE
Build only:
- Phase 0: safety harness and PassageRecord
- Phase 1: expanded planner, run offline only, with parent fixtures
- Phase 2: Release 1 (signed parent reference, live planner fields, routing, task_context, resolved-question search, hash storage, plain messages)

Do not build phase 3, 4 or 5. No source reuse, no ASK_FOLLOW_UP_REUSE flag, no jump labels, and no saved-chat continuation.

The plan is the source of truth. Section 1 invariants I1 to I7 must hold. If the code disagrees with the plan, or following it would weaken a safety check, stop and report it. Do not work around it, and do not rewrite the plan without saying so.

STOP POINTS
Stop and report to Mo after each phase, and wait for his go-ahead before starting the next.
- After phase 0: test results, plus the documented duplicate behaviour from the two-process test.
- After phase 1: a report comparing old and new planner outputs (kind, requirements, queries) and the new fields. Phase 1 must not change any production prompt or behaviour.
- After phase 2: test results and exactly what Mo should test.

Prerequisites: Mo confirmed on 2026-10-30 that Ask works on the live site. Before phase 2, remind him that the 16-session cap and ASK_DAILY_LIMIT still need his review. Do not change those limits unless he asks.

RULES
- Never weaken existing checks, rules or spending limits. Do not edit an existing test just to make it pass. If an existing test's expected call count legitimately changes, explain why in your report, and keep its safety assertions.
- Do not spend money without asking. Any real model call, including phase 1 runs and evaluations, needs Mo's approval for that specific run, with your estimated cost and question count. Use the website's keys only for this website's testing.
- Never print or paste secrets. Secrets live only in .env and .env.local, and both are git-ignored. Tell Mo when a new secret is needed, such as ASK_FOLLOW_UP_SECRET, and he adds it himself.
- Supabase project is jnietkyxgnocyizvjiel only. Ask Mo before any database change.
- Do not commit or push unless Mo asks. Each push deploys to production.
- This folder is shared with other work. Do not touch or revert changes you didn't make, including French batch files and anything unrelated. Check git status before you start and before you finish. Do not use a node_modules junction in a worktree.
- German work is postponed. Keep existing German code and strings intact, and add German text only where the type system requires a key.
- Match the surrounding code's style, comment density and naming.
- Hosted logs must never contain visitor text. Use fixed diagnostic codes in lib/ask/diagnostics.ts.

CHECKS BEFORE EACH REPORT
- npx tsc --noEmit must be clean.
- npx vitest run. Four failures already exist and are not yours:
  - three in tests/ask-legacy-compatibility.test.ts
  - one in tests/ask-shared-system.test.ts ("attaches a labelled translation only after checking it")
  Anything else failing is yours to fix. Tests that time out only while the dev server is under load should pass when run alone. Say so if that happens.
- npx next build must pass after phase 2.

CURRENT LOCAL SETUP
.env.local uses Gemini 3.1 Flash-Lite on Vertex for both writing and checking:
AI_MODELS=vertex:gemini-3.1-flash-lite
AI_VERIFIER_MODELS=vertex:gemini-3.1-flash-lite
Saved run logs are in work/local-ask-traces/ and are kept for about 24 hours.

HOW TO REPORT TO MO
He is the owner and not an engineer. Use plain English and keep it short. Say what is done, what is left, what failed, and exactly what you need from him. Say clearly what you did not test. Do not claim something works unless you ran it.

Start with phase 0 only. Before writing code, reply with a short list of the files you will touch and any place where the plan and the code disagree.
