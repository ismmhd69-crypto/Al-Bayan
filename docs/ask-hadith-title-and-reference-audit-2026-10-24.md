# Hadith search-interface diagnosis and printed-reference repair

## What the source probes establish

The saved parents framing included an Arabic source-name/topic hint about Asma and her mother. The relevant narration exists on the approved service under the short title [نعم، صلي أمك](https://hadeethenc.com/ar/browse/hadith/65989). A bounded Arabic API read confirms its original, accepted grade and Sahihayn references under the unchanged parser rules. This is a relevant example for the kindness concern, not sufficient evidence for every parental-obedience question or a reason to fill a source-group quota.

The actual catalogue provider searches titles. Its list response supplies IDs, titles and available translation languages, without the full original. The saved Arabic point queries failed to find this entry even when the entry was deliberately present in an evaluation catalogue; an exact-title wording control found it. The ID was absent from the saved candidate trace. This proves one search-interface miss mechanism, not that every historical failure has the same cause or that the entire live catalogue was complete.

The official website's own search action was inspected from its public JavaScript, then tested once for each of the same three recorded Arabic point queries. It returned 14, 1 and 2 unique source links respectively, but none included this known narration. One recurring new result was the slander-incident narration. That is not direct evidence for the specific non-Muslim-parent concern. Other returned passages were not all reviewed, so there is no overall search-quality score or claim that the alternative is never useful.

**Decision:** do not activate the remote search alternative, insert this one source ID, loosen relevance/authenticity or keep changing prompts until the example happens to pass. A general discovery repair needs matched evaluation against approved original-passage access and question-purpose wording. No production search route or visitor-query forwarding was added. A future remote integration would change the current local-title query data flow and needs its own privacy review before activation.

Only public test-source hints were sent in these owner-only probes. No visitor question, contact message, model call, source import or approval change was made. Anonymous explanations and hints were not used as answer evidence. Raw probe data stays in the ignored private evaluation directory.

## A separate actual parser defect

The returned [official source record 65784](https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=65784) prints its Bukhari reference with pages **116–120**. The old parser recognised only a single page, so it omitted Bukhari 4141 and retained only Muslim 2770.

`readReference` now accepts a valid ascending printed page range for either approved collection. It returns the first page so a range crossing Muslim's introduction cannot bypass the existing exclusion. Hadith-number ranges, reversed or malformed page ranges, zero/unsafe integers and other books are rejected. Grade, collection, number and exact-original requirements are unchanged.

The actual saved record now parses as Bukhari 4141 plus Muslim 2770, with every original Arabic byte unchanged. This is a general bibliography repair, independent of question/source IDs. It neither fixes the parents search miss nor certifies the retrieved passage's religious meaning or editorial annotations.

## Verification and limits

**Implemented:** generic printed-page-range support in the existing reference reader. No model, query, candidate cap, approved source, privacy, worker or storage setting changed.

**Offline verified:** 32 focused tests in three files and TypeScript passed. Tests cover real recorded metadata, all supported range dashes, malformed/multiple ranges, invalid integers, unchanged Arabic and Muslim-introduction exclusion. The full suite then passed **1,715 tests in 162 files**, zero failures/skips.

**Live verified:** official source format, grade and collection metadata were fetched, and three source-only website searches completed. The fixed parser was replayed against the exact saved official record; no duplicate source fetch or full Ask/model attempt was made after the repair. Website presentation, final checking, answer accuracy and search improvement remain unverified.

**Accepted:** deterministic printed-reference recovery and diagnosis of one title-interface limitation only. No reliable complete-answer, general recall/accuracy, religious certification, release/Mo acceptance or goal completion. No deployment.

**Spending:** no paid model calls. Recorded exposure remains $2.2803763725, including the old unresolved reservation; remainder $0.10206744. Source probes used bounded public reads/searches with no automatic retry. The earlier shell inline-inspection attempt failed locally before any source dispatch; a saved-file utility replaced it. No paid or uncertain request was repeated.
