# Plan: fix the problems from the 4 live test chats, add daily/weekly question limits, Codex review

## Context

On 2026-11-12 I ran 4 live chats (2 English, 2 Arabic, 16 messages, 36 c) on the new Ask follow-ups. Natural "explain" replies, thanks, referrals and first answers worked. Problems found:

1. Google refused requests (HTTP 429) when busy. Our backup door is refused by the spending guard, so the visitor gets a wrong "spending allowance" message (en "Summarize that").
2. The checker sometimes overthinks (~15,000 tokens on "low"), hits its 16,000 output cap after ~43 s, and is retried.
3. Arabic "عمدًا" follow-up hit the 9-call cap: a second search, then drafts rejected for copying source wording.
4. "Look further" replies still repeat the earlier answer (2 of 3 sentences in "on purpose").
5. Look-further replies check translations of sources the screen hides (13–18 s wasted).
6. "Thank you" uses a 10-minute limit slot and one of the 4 history slots.
7. The 8-per-10-minutes limit is too low for a chat with follow-ups.

Mo's decisions (2026-11-12):
- New per-visitor limits: **25 questions/day, 100/week**, with a clear message when reached.
- Signed-out visitors counted **per browser, plus a network cap of about 75/day**. Signed-in users counted by account.
- **Every question counts, except thanks.**
- **A sentence may say a scholar attributes something to the Prophet ﷺ** when that scholar's cited text says so. In Bayan's own voice it still needs a hadith citation.
- **10-minute limit raised to 15.**

Workflow Mo asked for: finish this plan, ask Codex (open on this machine) to review it in the Bayan folder, decide with its feedback, then fix everything. No commits or pushes.

## Step 1: Codex review (before any code)

- Codex CLI is at `C:\Users\wiseflow\.antigravity-ide\extensions\openai.chatgpt-26.1106.51428-win32-x64\bin\windows-x86_64\codex.exe`, and the Codex app is open.
- Run it non-interactively, read-only, in the Bayan folder: `codex exec --sandbox read-only -C C:\Users\wiseflow\Bayan "<prompt>"`.
- The prompt gives context and points it at this plan (copied to `docs/ask-follow-ups-fix-plan-2026-11-12.md`) and plan section 15. It asks for a critical review: safety, privacy, spending, races, missed problems. Codex must not edit files or make paid calls.
- I report to Mo what I accept, what I reject and why, then update the plan file and implement.
- If Codex is out of usage or the command fails, I say so and continue with this plan.

## Step 2: Fixes

**A. Google busy (problem 1)**
- In `lib/ai/gemini.ts` `withRetry`, retry 429/503 on the same Vertex door with spaced waits (about 2 s, then 5 s), within the request's abort signal.
- In a guarded research session, skip the Gemini-API backup door, which the guard always refuses (`lib/ai/index.ts` `withBackup`).
- Map "still busy" to `transport_failure`, so the visitor sees "a service was temporarily busy, please try again", not "spending allowance".
- Check in `lib/ask/continuation-session.ts` that a refused 429 is settled at zero cost and doesn't hold billing. Retries must stay bounded and counted, so no spending limit is loosened.

**B. Checker overthinking (problem 2)**
- Add an optional hard output cap on `JsonRequest`. `geminiOutputLimit` must not raise it.
- Set the final-review request in `lib/ask/rich-review-request.ts` to a hard cap of about 9,000 tokens. Normal reviews use under 4,000.
- The existing retry with `thinkingLevel: "minimal"` (`checkerRetry` in `lib/ask/rich-engine.ts`) stays.

**C. One search per follow-up (problem 3)**
- In `lib/ask/simple-pipeline.ts`, a `look_further` message (including an explain that fell back to search) starts with `recoveryUsed = true`. No second recovery search.

**D. Arabic copying (problem 3)**
- Make sure the summary rewrite gets the exact copied phrase from `sourceCopyMatch` (`lib/ask/checks.ts`) and is told to replace that phrase. The copy rule itself stays unchanged.

**E. Repeated sentences in "look further" (problem 4)**
- Add a deterministic near-repeat check in `lib/ask/follow-up.ts`. Normalized content-word overlap compares each reply sentence with `task_context.parent_sentences`, with Arabic diacritics and prefixes handled.
- In `rich-engine.ts`, near-repeats are dropped from a `look_further` draft before review.
- If nothing new remains, the reply ends as "not found" (`question_coverage`) and the visitor sees the existing `followUpNotFound` text.
- Set the threshold on the real 2026-11-12 sentences: drop sentences 2 and 3 of "on purpose", keep the new Quran sentence and both Fajr/Maghrib sentences.

**F. Translation check only for new cards (problem 5)**
- In `simple-pipeline.ts`, `checkSelectedTranslations` skips sources whose IDs are in `followUpContext.parentRecords`. Their cards are hidden as repeats.

**G. Thanks (problem 6)**
- In `app/api/ask/stream/route.ts`, answer `socialMessage` inside a chat before `takeSlot` and before the new quota, so it uses no slot.
- In `components/AskChat.tsx`, leave thanks messages out of `previous_user_messages`.

**H. Prophet ﷺ wording (Mo's decision)**
- Add one line each to the writer rules and the checker rules.
- A sentence may report that the named scholar attributes a teaching to the Prophet ﷺ only if the cited scholar original itself says so, phrased as the scholar's statement.
- Bayan's own voice still needs a cited hadith.

**I. 10-minute limit (problem 7)**
- Default `PER_VISITOR` changes from 8 to 15 in `lib/ask/limits.ts`. It's still overridable by `ASK_LIMIT_PER_10_MIN`.

## Step 3: Daily and weekly limits (new feature)

**Storage.** The current limits are in memory per server and reset on restart, so these need Supabase (project `jnietkyxgnocyizvjiel` only).
- New migration `supabase/migrations/2026111212xxxx_ask_quota.sql`:
  - Table `ask_quota_usage(key_hash text, day date, count int, primary key (key_hash, day))`, with RLS on and no public policies.
  - Function `take_ask_quota(keys jsonb, today date)`, `security definer`, executable only by `service_role`.
  - In one atomic call it checks each key's today count and rolling-7-day sum against that key's limits, increments all keys only if every key is under its limits, and deletes rows older than 8 days. It returns `ok` or `daily`/`weekly` plus when the visitor can ask again.
- **This is a database change. Approving this plan approves it.** I apply it with `scripts/apply-migrations.ps1` and verify, as usual.

**Keys.** Hashes only. No raw IP, cookie or user ID is stored.
- **Signed in:** HMAC of the Supabase user ID, limits 25/day and 100/week.
  - `AskChat` sends the access token it already has (`components/AskChat.tsx` ~line 170) as `Authorization: Bearer`.
  - The route verifies it with `auth.getUser`, the same pattern as `app/api/account/research/export/route.ts`.
  - Signed-in users are exempt from the network cap.
- **Signed out:**
  - The browser key is the existing `bayan_ask_session_v1` owner cookie (`privateResearchOwner` in `lib/ask/private-research.ts`), now set on every Ask response, at 25/day and 100/week.
  - The network key is an HMAC of the IP with a stable server secret, at 75/day.
- New module `lib/ask/quota.ts`, with limits from settings that default to 25/100/75: `ASK_USER_DAILY_LIMIT`, `ASK_USER_WEEKLY_LIMIT`, `ASK_NETWORK_DAILY_LIMIT`.

**What counts.** It's checked in `route.ts` after validation, for new questions only:
- **Not counted:** stop, status, continue tokens, `reuse_only` replays of an approved answer, and thanks.
- **Counted:** everything else, including follow-ups and personal-question referrals.

**If the store is unreachable:** allow the question and log a fixed diagnostic code, so a database outage doesn't lock out every visitor. The in-memory 15/10-minute and 200/day site limits still apply.

**Message.** The route returns `{status: "quota_daily" | "quota_weekly", retry_after}`. `AskChat` shows plain text from `dictionaries/en.ts`, `ar.ts` and `de.ts`:
- EN: "You've reached today's limit of 25 questions. You can ask again tomorrow."
- EN: "You've reached this week's limit of 100 questions. You can ask again on {date}."
- AR: "وصلت إلى حد اليوم وهو 25 سؤالًا. يمكنك السؤال مجددًا غدًا."
- AR: "وصلت إلى حد هذا الأسبوع وهو 100 سؤال. يمكنك السؤال مجددًا يوم {date}."

The message isn't saved as an answer.

**Privacy page.** Add one line in each language saying question counts are kept for up to 8 days, against an unreadable code for the browser, network or account, to enforce fair-use limits. Mo reviews that wording.

## Step 4: Plan document

Update `docs/ask-follow-ups-plan.md` section 15 with every change and the Codex outcomes. Add a line to `Memory Al Bayan.md` for the limits decision.

## Verification

**Offline, no cost:**
- Unit tests:
  - Retry and backoff, and the busy message mapping.
  - The hard output cap isn't raised.
  - No recovery search in `look_further`.
  - Near-repeat dropping on the real 2026-11-12 sentences, English and Arabic.
  - The translation check skips parent sources.
  - Thanks uses no slot and isn't in the history.
  - Quota keys, counting rules and messages, with the store mocked.
- A route-to-reducer replay test for the quota responses.
- `npx tsc --noEmit`, `npx vitest run` (only the 4 known failures allowed) and `npx next build`.

**Database:**
- After the migration, call `take_ask_quota` with test keys through the service role, check the counts and the refusal at 26, then delete the test rows.
- `get_advisors` shows no new security warning.

**Live (Mo asked me to run it):** rerun the same 4 chats with 20 s gaps between messages, about 40–60 c.
- Report time, calls and cost per message, and whether "on purpose" and "عمدًا" now answer the new point or say "not found" honestly.
- Then one quick quota check: temporarily lower the daily limit locally to 2 and confirm the message shows in English and Arabic.

**Not done:** commits, pushes, Vercel settings. Before the live push, Mo adds to Vercel: `ASK_FOLLOW_UP_SECRET`, the simple-pipeline settings, and optionally the new limit settings.
