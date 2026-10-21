# Temporary research: account deletion and export

21 October 2026. Prepared locally; the research migration remains unapplied remotely. This document describes the implementation and its verified limits, not production acceptance or legal approval.

## Account ownership at creation

Authenticated research jobs now carry a private `account_id` foreign key to the primary key of `auth.users`, alongside their existing HMAC owner scope. The account ID comes from the server's verified session lookup, never the visitor's request body or `user_metadata`. Anonymous jobs have no account ID and remain scoped to their signed session cookie.

Before sending a signed-in question to storage, the repository requires the storage RPC's explicit account-lifecycle capability. A server running this code against an older storage contract refuses the request before sending its encrypted question to an unsupported enqueue operation. The database foreign key also prevents a stale, previously verified request from creating work after the account has been deleted. Idempotent submissions must preserve their account binding.

This adds a private account association for deletion/export. It is not exposed to other visitors, added to model prompts or used to approve evidence. The existing RLS and service-only RPC boundary remain intact.

## Deletion in the Auth transaction

The prepared migration adds a narrowly scoped `before delete` trigger on `auth.users`. It uses a fixed empty search path and trigger-only definer rights, with direct execution revoked from public, anonymous, authenticated and server roles. Its purpose is to let Auth's deletion transaction erase the matching private research without granting Auth's deletion role broad access to editorial tables.

For the deleted account it:

1. Invalidates active leases and expires research so workers cannot continue writing sections.
2. Removes request ciphertext, every stored event and model-response ciphertext.
3. Deletes jobs whose attempts have known/settled costs, including queued jobs with no provider attempt.
4. Retains only outstanding billing records for reserved/unsettled attempts, with no question, answer, draft, source text or account association. Owner/rate/request/deduplication identifiers are scrubbed or replaced with job-derived opaque identifiers.
5. Allows an original late billing receipt to settle its original reservation while refusing to store its response body or resume work. Once no uncertain attempt remains, the prune operation removes the detached erased record.

If account deletion rolls back, its research erasure rolls back too. There is no separate "account deleted but private text cleanup failed" HTTP step. Provider cancellation still depends on the worker observing lease loss; this is not a claim of immediate provider termination or refund. No account was deleted from the live service during this work.

## Export through the account button

`POST /api/account/research/export` accepts only a same-origin authenticated request. The server derives the account ID, rejects visitor account overrides and reads at most ten retained requests per page. Pages share a creation cutoff and ordered cursor. This fixes the selected request set, not every changing job status at one transaction instant.

The server decrypts only that account's request inputs. The exported fields are question, earlier visitor messages, language, job status and timestamps. Intermediate model drafts, evidence candidates, provider responses, credentials, owner hashes and internal engine fingerprints are excluded. Checked saved answers continue through the existing chat export rather than being replaced by an intermediate draft.

The browser uses the same original bearer for chat and research reads and verifies the same account before releasing the download. Pagination rejects changed cutoffs, duplicate/out-of-order IDs, malformed rows, failed reads and runaway cursors rather than silently returning a partial export as complete. If research storage is not configured, the file records `not_enabled`; that state is not evidence that an operator has erased inaccessible older data. Partial configuration/lookup/decryption failures fail the export.

The account page includes English, Arabic and German copy explaining temporary research erasure and possible retention of text-free records of Bayan's AI costs. This notice is shown when research storage is configured. Arabic/German copy remains subject to native-language acceptance.

## Local evidence

The actual pending SQL migration runs in a local PGlite PostgreSQL instance against an invented Auth table and deletion role. Nineteen scenario groups pass, including:

- Account deletion by a role without editorial table access.
- Erasure of queued/completed work, reserved attempts and an unsettled response body.
- Rejection of stale submissions and late worker events; acceptance of a text-free late billing receipt.
- Other accounts' records remaining unchanged.
- Rollback preserving both account and private research when deletion fails.
- Account-scoped pagination excluding anonymous and newer requests.
- The actual encrypted repository's lifecycle preflight and request-only export.

The current report is `work/private-ask-evaluation/job-storage-verification.json`, bound to migration SHA-256 `75266cdea6c5ea529424d3cac1b3d3b5ae932f29a0f6005b8ec72463de395103`. Focused unit tests also cover route ownership/size/cancellation failures, browser pagination, account switches and credential exclusion. Tests use invented identities and no real model, account or source approvals.

## Still required before release

- Apply and verify the migration and trigger privileges through an authorised deployment, including actual Supabase Auth deletion and FK behaviour.
- Exercise the rendered account button/download on the full website and review all language copy. Helper/route tests are not browser acceptance.
- Deploy and monitor scheduled pruning; command availability is not proof that retention cleanup runs without visitors.
- Resolve provider/accounting reconciliation and the retention policy for detached unresolved billing identifiers.
- Verify deletion across backups, restores, access logs and any separately retained debugging artifacts. The primary database trigger does not establish deletion from those systems or from providers.
- Keep anonymous research's independent cookie scope, expiry and deletion/retention policy clear. An account export does not claim anonymous activity as account-owned.

Production and the spending ledger remain unchanged. This is progress toward the full Ask engine, not completion of the release or privacy review.
