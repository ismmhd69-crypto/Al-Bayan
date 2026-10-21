# Quran context lookup failure, 21 October 2026

Local request `146c94c0-5e51-4a72-bf9b-71a4998dd9d6` failed at 24.387 seconds.
Its provider request for neighbouring Quran verses threw TimeoutError. The request itself was not cancelled. The error escaped the context-enrichment Promise.all before meaning ranking and selection, terminating the complete answer. This was separate from the earlier summary rejection.

Local repair: cache context lookup results for each verse within a request, exclude candidates whose context lookup fails, and continue processing the other candidates. Never substitute an empty successful context for a failed lookup. Emit context_lookup_failed with the candidate ID and excluded outcome. Preserve request cancellation and existing final evidence/completeness checks. No additional retries, new sources, production changes or paid tests.

Verification: 89 focused tests passed, plus TypeScript checking. Regression cases cover both semantic and lexical paths, preservation of the other source groups, no repeated lookup for the failed verse and cancellation. These establish failure isolation, not live answer quality. The earlier summary repair still awaits a successful live attempt; translation issues remain open.
