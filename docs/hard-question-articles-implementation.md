# Expanded Hard Questions: local implementation

19 October 2026.

All 21 articles are integrated at the existing `/{lang}/topics/{id}` routes in English, Arabic and German (63 versions). The original 12 remain in order, followed by the nine approved additions. Each addition was researched and written in English, compared with Arabic/German and integrated locally before proceeding to the next article. The topic list uses the manuscript titles and existing five categories.

## Reading experience

- Clear answer, deeper explanation, three expandable answered follow-ups and related links.
- Section navigation, optional previous/next questions and a direct New to Islam link.
- Inline citations open and focus the corresponding source card.
- Quran passages load through the existing Quran Foundation connector, with original Arabic, the configured named translation and attribution. No Quran text or translation was added to the stored article JSON.
- Religious, scholarly, historical/documentary and scientific source groups remain distinct. A separate comparison group identifies the Catholic catechism as that tradition's own account, not Islamic authority. Modern rights documents are identified as documents, not Quran commentary. Hadith/scholar cards link to original context; paraphrases are not quotations.
- Existing fonts, blue/gold colours, logical layout properties and reduced-motion handling are retained.

## Content provenance and boundaries

`data/learning/hard-questions.json` contains 21 authored manuscript articles and 127 reference records. Bodies match the master package apart from turning localhost course links into relative website links. Claim mappings and unresolved notes remain in the data and manuscript review. All nine research briefs retain their original direction and now carry a completed-local-draft status. Two older article passages calling the 4:34 and apostasy questions research briefs now link to their actual articles.

The manuscript helper and document/website checkers support additions without requiring former approved answer files. Original hashes are checked only for the original 12. Reference parity, related-link existence and complete follow-up answers remain required for every new language version.

Mo authorised public visibility on 19 October 2026. `showHardQuestionDrafts()` now enables all 21 authored articles in production as well as development. Both the reader and list retain editorial-draft labels; no scholar-review badge is added. Public visibility is distinct from independent scholarly/native-language acceptance and does not update approval records. Article metadata retains noindex for these drafts.

No existing topic-answer JSON, prepared answer, review record, database row, live Ask sources, or API contract changed. The earlier content package was committed and pushed; the subsequent visibility change is being released at Mo's request. Independent scholarly and native-language acceptance remain open; the manuscript's specific research gaps remain applicable.

## Verification

- `npm run typecheck`: passed.
- `npx vitest run tests/hard-question-articles.test.ts`: three focused tests cover all language sections, follow-ups, source parity, Quran passage resolution, internal links, evidence kinds, rejected link schemes and public visibility in production. The production expectation was updated for Mo's release request.
- HTTP verification: 63 article routes and three topic indexes returned 200. Required sections, 189 rendered follow-ups, every cited source panel, Arabic RTL and absence of the old approval badge were checked.
- Integrated content compared with all 63 manuscript bodies: exact match after relative-link conversion.
- SHA-256 comparison: all 12 original topic-answer files remain unchanged.
- Browser interaction checks on each of the nine additions: the first follow-up opened; the first citation opened and focused its matching source card. Original Quran passages continue through the existing connector.
- Shared layout checked at 1366×900 and 390×844, in English, Arabic and German. No horizontal document overflow; Arabic computed reading direction was RTL. Phone German follow-up expansion and Arabic heading/core-answer screenshots were visually inspected, together with the desktop English article. This is browser viewport testing, not physical-device acceptance. Browser warnings/errors: none during the final checked session.
- Document checks: 21 ordered articles, 63 versions, 189 answered follow-ups, 171 internal/course links, 127 defined references, source-key parity and all nine completed brief statuses. Local course slugs resolve against the actual course data. This is not an exhaustive external-source uptime test.

## Research and acceptance limits

Specific philosophical, historical and interpretive gaps remain recorded per article. The Aisha article tested the Asma chronology against the actual biographical entries and identifies Joshua Little's thesis challenge from its repository abstract only; the full thesis could not be assessed. The justice article does not claim a complete independent proof of infinite desert. The 4:34, apostasy and slavery articles preserve difficult provisions and named interpretations, rather than replacing them with general reassurance; full school surveys and comprehensive moral defences remain open. None of these limits is labelled independent acceptance.

These checks demonstrate implementation and document integrity. They do not constitute independent religious, historical, scientific or native-language review.
