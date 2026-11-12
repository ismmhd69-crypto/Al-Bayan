# Ask follow-ups: phase 0

2026-10-30. Local work only. Production behavior and prompts are unchanged.

## Changes

- Added `lib/ask/passage-record.ts`. It fingerprints exact original and optional checked translation text. Quran context is an ordered JSON array of `[verse key, Arabic text]`, so text, order and verse identity changes invalidate its hash. Text is not trimmed or normalized before hashing.
- The helper accepts Quran verse IDs and stored hadith/scholar ID formats. It returns null for live excerpt IDs, non-stored hadith IDs and invalid or empty inputs. It does not establish source eligibility, database existence or translation approval. Callers must supply the whole checked row and only a translation that passed its check.
- Added publication-boundary tests over the existing rich engine and the simple pipeline. They cover approval, rejection, malformed checking, interruption, correction and removal of a rejected sentence. Reduced summaries still require a fresh full review before publication.
- Added spending tests using injected fake transport responses. Retry and fallback transports retain the simple session's nine-call ceiling and cumulative cost reservations. No production limits were changed.
- Added a two-process duplicate test using the actual private-research index, owner handling, continuation sessions and transport journal. No HTTP server or real provider is involved.

## Two-process result

Both child processes run the same server-state modules in separate Node processes. They receive no website credentials, and ordinary fetch is disabled. The injected provider returns synthetic responses with a fake $0.001 receipt; no money is spent.

1. Process A receives the synthetic question: a new session makes one fake send.
2. The same cookie, token and question return to A: the session resumes and replays its journaled response. Total sends remain one.
3. The same cookie, token and question reach B: A's token is expired/unknown there, and B creates its own session. B makes another fake send.

Result: two independent fake sends across two processes, versus one with same-process replay. Cross-instance deduplication is absent, as section 9 of the plan states. This controlled scenario demonstrates the behavior; it does not measure how common duplicates are on Vercel or under real traffic.

## Verification

- `npx tsc --noEmit`: passed.
- All 13 new tests passed in the final full run.
- Full `npx vitest run`: 2,318 passed, 16 skipped, four failed. Only the four owner-listed failures remain, three in `ask-legacy-compatibility.test.ts` and the labelled-translation test in `ask-shared-system.test.ts`. No load-related timeout occurred. Final totals are in `work/ask-follow-ups-phase-0-vitest.log`.
- Existing tests and their expected call counts were not edited.

## Boundaries and next step

No model calls, paid evaluation, database changes, secrets, limit changes, deployment, commits or pushes. No source reuse, flags, UI changes, saved-chat continuation or production planner changes. No browser, hosted-server or production-quality acceptance was performed. The two-process check uses server modules, not two running Next.js HTTP servers. Parent signing does not exist yet; issuance and verification tests must be added with phase 2.

Phase 1 remains blocked on Mo's go-ahead. Its offline fixture/planner tooling can be written without model calls. Any actual old-versus-new model comparison requires separate approval for its specific question count and estimated cost.
