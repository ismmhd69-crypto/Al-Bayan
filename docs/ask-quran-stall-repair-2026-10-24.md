# Quran connection stalls now settle instead of blocking Ask forever

The local anger request `1c18de50-436c-4b25-92d0-3d37f19a98ba` reached search in 2.255 seconds. Its two Quran connection timeout signals fired at 12.258 seconds, but neither query settled. At the inspection after 242 seconds, the trace still had no terminal result and only one completed model call. A preceding request also remained in Quran search. The logs establish the stalled promise and ineffective cancellation boundary; they do not establish which remote/auth/body operation caused the transport to ignore cancellation.

## Implemented

`lib/sources/quran.ts` now uses the existing `runSourceRequest` boundary around the complete authentication, per-query search and verse-read operations. It bounds waiting even when fetch or body consumption ignores AbortSignal. Original Quran text, translations, eligibility checks, cache duration, source boundaries and model settings remain unchanged.

- Authentication includes reading the JSON response. An expired operation cannot later populate the shared token cache, and the shared token promise clears after failure.
- Each search includes the authentication wait, HTTP response and JSON body. Successful sibling queries are retained in the existing partial-results path, while failures remain reported as failures.
- Authenticated dispatch checks cancellation before and after obtaining headers, including the single existing 401 renewal. An expired search cannot dispatch a late query after authentication eventually finishes.
- Verse reads include headers and body. Failed reads clear shared in-flight entries and release logical content slots, allowing queued requests and later retries to settle.

No overall 55-second cutoff was imposed on patient local research. Each source operation retains its existing ten-second limit. This is a transport recovery repair, not relaxed evidence checking or an answer-quality fix. It cannot force a misbehaving underlying network operation to physically terminate; late data cannot become evidence for its failed operation.

## Verification

**Offline verified:** 21 focused tests in three files, followed by 1,756 tests in 166 files with zero failures/skips, and TypeScript passed. Tests exercise auth/search/content header and body hangs that ignore cancellation, partial-query preservation, late token rejection, cancellation during auth, shared-verse identity and recovery of a queue exceeding six requests. A recovery fixture initially supplied malformed verse JSON; it was corrected to the documented 404 path without changing production validation.

**Live source verified:** `scripts/inspect-quran-connection.ts --live-source-only`, run with `tsx --conditions=react-server`, performed two fixed public searches and one verse read using the configured Quran source. It settled in **1,407 ms**, returned sixteen candidate keys including 3:134, and obtained the original verse plus an available English translation. No source failures were recorded. This is a source connection check, not a generated answer or religious-accuracy review.

**Local site verified:** the old server handle was absent and no port-3000 listener remained at restart. The site was started at `http://127.0.0.1:3000`; `/en/ask` returned HTTP 200. The old stuck browser request cannot be resumed across that server restart; the visitor must retry it. No additional paid question was submitted.

**Spending and acceptance:** zero new model calls. The evaluation journals and their unresolved reservation were not changed by this repair. Current writer/checker/privacy and all semantic checks remain in place. No deployment, storage activation, complete-answer certification or claim that all Ask reliability issues are solved.

The independent semantic failures recorded in the earlier parents retest remain open. This repair establishes bounded source failure and restored source availability, not full accuracy or Mo's acceptance of an answer.
