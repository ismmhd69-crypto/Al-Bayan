# Ask search, conclusion and interruption repair

Status: local implementation and offline gates passed. Live answer acceptance is pending Mo's manual tests. Background activation is gated, not complete.

## Implemented

- Kept GPT-6 Luna, approved sources, strict evidence checks, privacy routing and the existing aggregate allowance. German remains postponed.
- Added dedicated English/Arabic hadith search concepts to the frame contract. Concept queries are interleaved with question/source wording within a three-query limit per language; German queries are excluded from the launch path. Search hints are excluded from requirement meaning and never establish evidence.
- Stable lanes can complete two bounded recovery rounds per source family. Round numbers, prior queries and visited IDs survive Continue. This means two recovery waves, potentially including several unfinished families, not two fresh rounds on every Continue. Background recovery also retains its round ceiling across attempts.
- A committed answer's conclusion has at most three writer attempts: initial, one meaning correction and one editorial correction. The allowances and latest raw draft persist across Continue. Targeted text patches preserve source IDs, requirement IDs and unaffected sentences. Changed wording still receives all applicable checks; copy thresholds are unchanged.
- Background checkpoints now include the conclusion allowance in their existing hashed private research-progress record. The worker saves it before dispatch and after a draft settles. Existing model journals retain unknown-charge protection.
- Added fixed failure codes and English/Arabic reader notices for interrupted connections, cancellation, wording failures, spending limits, uncertain billing and incompatible research. Continue refusing an expired/incompatible request now terminates its local loader instead of leaving an unfinished reader running.
- Search/check loaders reflect group status; conclusion corrections have a dedicated progress message. Prior checked groups stay mounted.
- Bumped continuation and worker contract fingerprints so incompatible earlier checkpoints refuse explicitly rather than silently restarting.

## Offline evidence

- The two failed Islam-truth traces and successful promises trace were copied into `work/private-ask-evaluation/reliability-20261026/frozen-failures/`, outside ordinary logs and tracked content. Their SHA-256 values and decisive failure replays are in `replay-report.json`.
- `scripts/replay-ask-search-and-conclusion.ts` reproduces the six-word Quran-translation overlap, distinguishes the saved ResponseAborted error from a checker rejection, and recognizes the successful control. It sends no model requests.
- Frozen snapshots of the existing source adapter's title catalogues contain 2,328 English and 3,574 Arabic titles. `scripts/replay-ask-title-discovery.ts` confirms that the original broad phrases miss HE65231 and reviewed narration concepts retrieve it, with an unrelated-query control. The phrases were explicitly supplied for evaluation; this is not proof of the real model's query-planning quality.
- Scripted integration controls cover meaning correction followed by editorial correction, unchanged sibling retention, wrong patch rejection, no fresh allowance on Continue, two recovery rounds before publication, and persisted worker allowance hashes.
- Focused client/worker, continuation, reader, diagnostic, publication, citation, condition and source-boundary checks passed. The final focused run passed 142 tests across 13 files; an earlier complementary run passed 121 across 13 files. These sets overlap and must not be added together.
- TypeScript and the production build passed. Existing metadataBase and broad private-index file-tracing warnings remain.

## Background execution gate

Read-only inspection found the background flags disabled, worker build identity/encryption/owner settings absent, and `ask_research_job` absent from the service-role REST OpenAPI catalogue. This does not prove that no SQL object exists, but the required application storage API is not verified available. Nothing was enqueued or changed remotely.

Do not enable background execution yet. Activation needs separately approved storage/API setup if absent, stable private encryption and ownership keys, matching API/worker revisions, an accepted long-lived worker, an explicitly configured per-job allowance no greater than the current USD 0.50 answer ceiling, and Stop/reconnect/lease-recovery acceptance against that real setup. No migration, deployment, detached browser promise or automatic key generation was performed.

Until activation, a browser disconnect still interrupts the request. The implemented improvement is truthful interruption handling and preservation of checked material, not a claim that the active stream survives disconnection.

## Live acceptance still open

Mo approved up to USD 0.15 for two live tests, then chose to test manually before any live model request was sent. No paid generation was made for this repair. Previous unresolved receipts and ledgers were not cleared or repurposed.

Manual set: English and Arabic versions of the Islam-truth question, with the promises answer as a regression control when desired. Review actual generated search phrases, selected originals, useful explanations, conclusion checks, source retention and stopping messages. Record failures without repeating requests until favorable output appears. Real wording quality, automatic query generation and browser acceptance remain unverified for this repair.
