# Recovery response parsing failure, 21 October 2026

Request `27fb2e15-3b7b-4fb9-b75b-6f8b7bf276fa` stopped after 38.270 seconds, before answer writing.

Initial searches returned 16 Quran verses, eight hadith and no scholarly excerpts. Selection recognised HE5438 as direct support for both requested concerns and retained relevant Quran background. Recovery searched the missing scholar group, encountered one timeout and found additional excerpts from other searches.

Reranker call A7 returned a nominally finished response containing malformed JSON: an unterminated string/object fragment between ranking entries. The shared extractJsonObject helper then advanced into the malformed envelope and returned the first syntactically valid child, a single ranking object. The provider wrapper incorrectly recorded a valid parsed response, and modelMeaningReranker subsequently raised unreadable_reranker_result. Evidence recovery failed before the new material could be selected. The current code invalidates the earlier package when novel evidence arrives, so no complete checked answer survived. A ruling-facet requirement also needs named scholarly support under the existing pipeline rule.

## Local repair

The parser now reads the first outer object or returns null. It never salvages a nested member from a malformed, truncated or array response, nor advances to a later object after a broken outer object. Valid fenced JSON, surrounding prose and removed think blocks remain supported. No JSON repair, invented scores, model change, added paid retry or religious support rule change.

76 focused tests passed across provider parsing, reranker validation and the rich pipeline; TypeScript checks passed. New regression cases reproduce the broken ranking-envelope shape, truncated question frames containing valid child objects and top-level arrays. No automatic paid evaluation ran.

## Still open

This parser correction establishes honest rejection, not successful recovery from malformed model output. Recovery availability, scholar retrieval reliability and whether independently safe partial material can survive a failed recovery without ignoring potentially conflicting new evidence remain open. Removing the scholar requirement merely to force this example through was not part of this repair. Source-faithfulness and complete-answer quality remain unaccepted. Production unchanged.
