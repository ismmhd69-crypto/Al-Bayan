# French support progress log

Scope: private local preparation only. French remains absent from public locale allowlists, routes, and APIs. No source text, existing translations, publication state, or database schema may be changed. Translation drafts must not be marked human-reviewed.

## 2026-10-29: Phase 0 inventory

- Git status was inspected first. The shared checkout already contains unrelated active Quran and hadith reader edits, tests, and German translation exports. Those files are protected and are not part of this work.
- Existing French files or records: none found in the repository; the live source translation inventory returned 0 French rows.
- Live source totals, including unpublished sources: 14,629 hadiths and 7,388 fatwas. The current inventory is saved in `data/french-batches/source-inventory.json`, grouped by kind, collection, scholar, and source publication status.
- Live French coverage: 0 saved drafts, 0 structurally validated, 0 human-reviewed, 0 published, 22,017 missing.
- Website source inventory: 32 New to Islam lessons, 21 Hard Questions articles, and 44 prepared answers (32 common plus 12 topic answers). No French website translation assets exist.
- Visitor-facing location inventory is not yet complete. The website's dictionaries are `dictionaries/ar.ts`, `dictionaries/en.ts`, and `dictionaries/de.ts`; text also appears in learning-content JSON, prepared-answer JSON, route metadata, reader and Ask components, accessibility attributes, and API responses. Phase 1 must finish a code-level sweep before declaring parity.
- Current launch locale check: `activeLocales` remains `ar` and `en`. German files and existing German batch artifacts are preserved.
- Existing German exporters are not reused: they hard-code `de`, export into `data/german-batches`, and the hadith exporter omits source publication state and source hashes. Existing insert tooling writes English and German rows, so it is not safe for a French batch.
- Database blocker: the live `public.source_translations.lang` constraint only accepts `ar`, `en`, and `de`. The task forbids schema changes. Therefore French drafts cannot currently be inserted into Supabase. No database write was attempted. Local website work may continue; library database drafting remains blocked unless the schema constraint is separately changed later.
- French batch manifest: `data/french-batches/manifest.json`.
- The 324 leaf strings in the current English interface dictionary have now been translated into 13 private French batches and assembled into `dictionaries/fr.ts`. Each batch passed exact key/source, nonempty-text, and placeholder checks. This dictionary is used only by the guarded local preview; it is not connected to locale routing, public navigation, or APIs.
- The code-level scan found additional visible hard-coded copy in pages, reader controls, and Ask/error/reconnect flows. Those locations are not included in the 324 dictionary strings and are still being inventoried.
- A local preview route now exists at `/dev/french-preview`. Proxy and page guards allow it only in development on a loopback host, and the Ask submission is disabled. It is a copy preview, not a connected French Ask experience. The route has not been opened in a browser.
- A project-wide TypeScript check was attempted after adding the preview route. It stopped on four TS7053 errors in the pre-existing uncommitted German helper `scripts/check-local-german.ts`; it reported no errors in the new French files. The German helper remains untouched.
- Additional Ask status, reconnect, cancellation, evidence, unavailable-translation, and incomplete-answer copy: all 93 strings in `lib/ask/rich-text.ts` are translated in four local batches and assembled to `lib/ask/rich-text-fr.ts`. Key/source parity, placeholder parity, nonempty text, no duplicate/missing keys, and the 25-entry batch limit passed. This French copy appears only in the loopback-only development preview; the live Ask flow and API locale guard are unchanged. Human review: 0; published: 0.

### Batch ledger

| Batch | IDs / scope | Translated | Inserted | Preserved | Validation | Remaining | Status |
|---|---|---:|---:|---:|---|---:|---|
| FR-P0-INVENTORY | All source kinds, collections, scholars, and publication states | 0 | 0 | 0 | Live read-only counts recorded; French rows 0 | 22,017 source translations | Complete |
| FR-UI-001 | Interface dictionary keys `meta.title` through `home.how1t` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-002 | Interface dictionary keys `home.how1` through `ask.notFatwa` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 274 interface strings; 97 learning items | Local draft saved |
| FR-UI-003 | Interface dictionary keys `ask.error` through `ask.v2.views.position_a` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; valid French loanwords retained | 249 interface strings; 97 learning items | Local draft saved |
| FR-UI-004 | Interface dictionary keys `ask.v2.views.position_b` through `ask.scholarShort.permanent-committee` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; established scholar names retained | 224 interface strings; 97 learning items | Local draft saved |
| FR-UI-005 | Interface dictionary keys `ask.scholarShort.al-barrak` through `ask.video.channels.UCwMocSKEbLav6SZvwzTvDbQ` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; names and the French abbreviation `min` retained | 199 interface strings; 97 learning items | Local draft saved |
| FR-UI-006 | Interface dictionary keys `ask.video.channels.UCWjCSGhmSGu0VLf2mPFS0Kg` through `ask.testMode` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed; names and collection titles retained | 174 interface strings; 97 learning items | Local draft saved |
| FR-UI-007 | Interface dictionary keys `ask.source` through `more.theme` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed | 149 interface strings; 97 learning items | Local draft saved |
| FR-UI-008 | Interface dictionary keys `more.themeLight` through `about.points.4.0` | 24 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 125 interface strings; 97 learning items | Local draft saved |
| FR-UI-009 | Interface dictionary keys `about.points.4.1` through `reportPage.title` | 25 | 0 | 0 | Key/source parity, nonempty French, and placeholder parity passed | 100 interface strings; 97 learning items | Local draft saved |
| FR-UI-010 | Interface dictionary keys `reportPage.subtitle` through `quran.allSurahs` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed | 75 interface strings; 97 learning items | Local draft saved |
| FR-UI-011 | Interface dictionary keys `quran.surahNumber` through `quran.playVerse` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; Arabic recitation formula unchanged | 50 interface strings; 97 learning items | Local draft saved |
| FR-UI-012 | Interface dictionary keys `quran.pauseVerse` through `hadith.noMatches` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; reciter attribution and hadith collection names retained | 25 interface strings; 97 learning items | Local draft saved |
| FR-UI-013 | Interface dictionary keys `hadith.clearSearch` through `hadith.filterBooksPlaceholder` | 25 | 0 | 0 | Key/source parity, nonempty French, and exact placeholder parity passed; unavailable French translation stated clearly | 0 dictionary strings; 97 learning items | Local draft saved |

### Needs Mo

- `DB-FR-LANG-CHECK`: database French drafts are blocked by the existing language check constraint. No schema change is authorized.
- Ask/reconnect/cancellation/evidence and incomplete-answer status copy: all 93 leaf strings in `lib/ask/rich-text.ts` are translated in four local batches and assembled to `lib/ask/rich-text-fr.ts`. Key/source parity, placeholder parity, nonempty text, no duplicate/missing keys, and the 25-entry batch limit passed. The French Ask copy appears only in the loopback-only development preview; the live Ask flow and API locale guard are unchanged. Human review: 0; published: 0.

### Phase 2: New to Islam lessons (in progress)

- Translated lessons 1–14 into local French draft batches `new-to-islam-001.json` through `new-to-islam-005.json`. Original English/Arabic/German source records were not modified.
- Each batch was checked against the source lesson IDs, all link destinations and citation reference IDs, source citation labels, section heading counts, and paragraph structure. Batch size is at most five lessons; these batches contain 3, 3, 3, 3, and 2 lessons.
- French drafts remain unpublished and are not connected to public locale routing. New to Islam lessons remaining: 18 of 32. No human review is claimed.
- Continued with lessons 15–18 in local batches `new-to-islam-006.json` and `new-to-islam-007.json`. The detailed prayer walkthrough preserves its Arabic text, transliterations, sequence, qualifications, and source links. All seven lesson batches were revalidated after tightening the citation check to track source IDs while allowing French display labels.
- New to Islam progress: 18 of 32 lessons drafted and structurally checked; 14 remain. Human review: 0; published: 0.
- Lessons 19–21 (repentance, non-Muslim family, and community support) are drafted in `new-to-islam-008.json` and passed the same structural and citation checks. Current progress: 21 of 32 lessons; 11 remain.
- Lessons 22–24 (food and drink, modesty, and work and money) are drafted in `new-to-islam-009.json` and passed citation and structure checks. Current New to Islam progress: 24 of 32 lessons; 8 remain.
- Lessons 25–32 (Ramadan, zakat, Hajj, good character, difficult thoughts, scholarly differences, reliable answers, and next steps) are drafted in `new-to-islam-010.json` through `new-to-islam-012.json`. All 32 New to Islam lessons now have French local drafts and pass structural and reference checks. Human review: 0; published: 0.

### Phase 3: Hard Questions articles (in progress)

- Translated articles 1–9 in `hard-questions-001.json` through `hard-questions-003.json`. French drafts preserve the source link destinations, citation labels, headings, and paragraph structure; all three batches passed the focused validator. No source English or existing AR/DE text was changed.
- Hard Questions progress: 9 of 21 articles drafted; 12 remain. Human review: 0; published: 0.
- Hard Questions articles 10–12 (inheritance, people unreached by the message, and historical/legal claims about conquest) are drafted in `hard-questions-004.json` and passed reference and structure checks. Current progress: 12 of 21 articles; 9 remain.
- Hard Questions articles 13–15 (why Islam, evidence for prophethood, and decree and choice) are drafted in `hard-questions-005.json` and passed reference and structure checks. Current progress: 15 of 21 articles; 6 remain.
- Hard Questions articles 16–21 (unanswered prayer, eternal punishment, Quran 4:34, Aisha's age, apostasy, and slavery) are drafted in `hard-questions-006.json` and `hard-questions-007.json`. All 21 articles now have local French drafts and passed structural and reference checks. Human review: 0; published: 0.

### Phase 4: prepared answers (in progress)

- The first 15 prepared answers are drafted in French across five local batches. Search questions and visitor-facing answer text are translated; source IDs, requirement IDs and answer section counts are preserved. Each batch passed the focused validator. Originals remain unchanged.
- Prepared answers progress: 15 of 44 drafted; 29 remain. Human review: 0; published: 0.
- Prepared-answer files in batches `prepared-answers-006.json` and `prepared-answers-007.json`: six additional complete French drafts covering interest, music, smoking, interfaith marriage, missed prayers, and the pillars of faith. Source IDs, requirement IDs, question counts, answer sections, and metadata passed focused structural validation. Prepared answers: 21 of 44 drafted; 23 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-008.json` adds complete French drafts for traveller prayers, the Prophet Muhammad, and parents’ rights. Question counts, source IDs, requirement IDs, answer sections, and metadata passed focused structural validation. Prepared answers: 24 of 44 drafted; 20 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-009.json` adds complete French drafts for Hajj steps, visiting graves and invoking the dead, and matters that break the fast. Structural checks passed for source IDs, questions, answer sections, counts, and preserved metadata. Prepared answers: 27 of 44 drafted; 17 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-010.json` adds complete French drafts covering ablution nullifiers, shirk, and zakat al-fitr. Structural checks passed for source IDs, question and answer counts, section structure, and metadata. Prepared answers: 30 of 44 drafted; 14 remain. Human review: 0; published: 0.
- Prepared-answer batch `prepared-answers-011.json` completes the 32 prepared-answer source files with gold zakat and savings zakat drafts. Structural checks passed for source IDs, question and answer counts, section structure, and metadata. The remaining 12 of the 44 total prepared-answer drafts are topic-answer files. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-012.json` adds French drafts for doubt, evolution, and faith and reason. The copy translates the existing answer text summaries and does not create French Quran quotations. Topic IDs, answer sections, source IDs, requirements, and metadata passed focused validation. Total prepared-answer drafts: 35 of 44; 9 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-013.json` adds French drafts about writing hadith, inheritance, and people unreached by the message. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. Total prepared-answer drafts: 38 of 44; 6 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-014.json` adds French drafts on life's purpose, Quran preservation, and suffering. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. Total prepared-answer drafts: 41 of 44; 3 topic-answer files remain. Human review: 0; published: 0.
- Topic-answer batch `prepared-answers-015.json` completes the 12 topic-answer files with drafts about the sword, the Creator, and women's spiritual standing. Structural checks passed for topic IDs, answer sections, source IDs, requirements, and metadata. All 44 prepared-answer drafts now exist locally; none are human-reviewed or published.

### Private preview integration checkpoint

- The loopback-only `/dev/french-preview` now loads the complete saved learning drafts: 32 New to Islam lessons, 21 Hard Questions articles, and 44 prepared answers. It formats headings and lists, links citations to their original reference URLs where the source map exists, and shows preserved source IDs and requirement IDs for prepared answers.
- The local development route returned HTTP 200 with `<html lang="fr">` and all three content groups. The Ask form remains disabled. The public locale list, APIs, and routes remain unchanged.
- Reader cards say that approved Quran French and saved French library translations are unavailable. No Quran translation was generated. French records remain unavailable from Supabase because the current language constraint still blocks `fr` and schema changes are forbidden.
- The hard-coded visitor-copy audit is still incomplete. In particular, audio controls, reader accessibility labels, and Ask progress copy outside the prepared French status strings need a full sweep before website coverage can be called complete.
- Hard-coded visitor-copy batch `hardcoded-copy-001.json` adds French versions of 24 strings in the home gateways, audio controls, reader navigation/accessibility labels, and Quran unavailable/error states. Source-file presence, unique IDs, nonempty copy, and `{rate}` placeholder parity passed. The private preview shows these drafts; the full hard-coded copy audit remains in progress, with additional Ask and reader text still to inventory.

### Phase 4: Hadith library, local drafts

| Batch | Source IDs | Translated | Inserted | Preserved | Validation | Remaining local drafts | Status |
|---|---|---:|---:|---:|---|---:|---|
| FR-LIB-HAD-BUKHARI-001 | `09c17088-3041-4121-af6a-3858bbfe2d4d` (Bukhari 1), `8d51995a-4d75-4e55-8ef0-00ba56262b9a` (Bukhari 2) | 2 | 0 | 0 | Source IDs and SHA-256 hashes, original text, references, publication state, permissions, and nonempty French passed; each narration reread against Arabic | 14,627 | Private local AI drafts; unpublished; no human review |

- The live source rows were read from project `jnietkyxgnocyizvjiel`; both had no French translation row at export time and are published sources. Their `sunnah.com` rights record has `status=granted` and `ai_processing_allowed=true`, while `translation_index_allowed=false`. The drafts therefore remain private local files and are not submitted to the database.
- The live `source_translations.lang` check still permits only `ar`, `en`, and `de`. French database insertions remain at zero; all 14,629 hadith translations are still missing in the database even when a local draft exists.
- Hadiths containing embedded Quran quotations are held for an approved attributed French Quran source. The current application Quran source list contains English and German only; no French Quran text was generated or saved.

| FR-LIB-HAD-BUKHARI-002 | `aac6a21a-f8f8-4ebc-8ab4-7342f1a50da3` (Bukhari 3) | 0 | 0 | 0 | Arabic source hash, ID, URL, reference, publication state, rights, private status, and Needs Mo reason passed; Quran 96:1–3 remains untranslated | 14,627 | Needs Mo: approved French Quran translation required |
| FR-LIB-HAD-BUKHARI-003 | `e6fab8de-a043-4b83-9da4-4983974526ac` (Bukhari 4), `7c07c22f-ce1f-4963-81cd-c70eac490f90` (Bukhari 5), `834f2c23-8696-4b30-8c99-724b513aba40` (Bukhari 6) | 1 | 0 | 0 | Arabic hashes, IDs, references, rights, and privacy passed; Bukhari 6 reread against Arabic; Bukhari 4–5 held for Quran 74:1–5 and 75:16–19 | 14,626 | One private draft; two Needs Mo |
| FR-LIB-HAD-BUKHARI-004 | `67ed0b56-fc0c-49b8-985b-eb22527c73b7` (Bukhari 7) | 0 | 0 | 0 | Arabic source hash, ID, URL, reference, publication state, rights, private status, and Needs Mo reason passed; Quran 3:64 remains untranslated | 14,626 | Needs Mo: approved French Quran translation required |
| FR-LIB-HAD-BUKHARI-005 | `bc20046e-0669-490c-b5d7-722b5a7a8ea5` (Bukhari 8), `de6ca447-faaf-4524-a83a-a64cd3e738da` (Bukhari 9), `83978758-bcb8-4f85-a1e6-6257a083bf6c` (Bukhari 10), `bfc6b6a5-067d-459c-ab93-a6ff1c4cf11d` (Bukhari 11), `d1cd3ced-e29b-43f5-9b9a-d7d5d0d259db` (Bukhari 12), `bd0d879b-d6d2-4711-aec8-1744a57864e3` (Bukhari 13) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, privacy, and unpublished state passed; all six translations reread against Arabic | 14,620 | Private local AI drafts; unpublished; no human review |
| FR-LIB-HAD-BUKHARI-006 | `1cab0fca-8c72-4912-8bea-dc69d5df3c86` (Bukhari 14), `9ac67fc6-0811-4bae-a599-76ccbe29a0a7` (Bukhari 15), `36aee9ae-886a-457f-ab2f-4b7a45b3336d` (Bukhari 16), `78207201-3fed-4e57-ad63-1435023f3f77` (Bukhari 17), `c87bcf81-a39e-4c1c-b37b-f2a6881bd200` (Bukhari 18), `659a3d16-0046-4882-9422-4392fdc83b3e` (Bukhari 19) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six translations reread against Arabic | 14,614 | Private local AI drafts; unpublished; no human review |

- After these six batches, 15 of 14,629 hadiths have private French drafts, 4 are held in Needs Mo for Quran quotations, 14,614 still have no French draft, database insertions remain 0, and all 14,629 remain missing from the live French translation table. The exporter and validator now enforce private, unpublished, and unreviewed status.

| FR-LIB-HAD-BUKHARI-007 | `34f7e790-e1ff-4c88-9851-ee624d06ed81` (Bukhari 20), `c308d7d5-9cae-44c4-a512-3f4befe9a117` (Bukhari 21), `f0cf92e5-2b0c-41f6-84f9-f546b6533d4d` (Bukhari 22), `677d8d62-fde8-444b-bf4d-1ad0226022e6` (Bukhari 23), `31bbe045-d996-4766-93c8-93acbf285b9b` (Bukhari 24), `a6628caf-22a5-49d4-a884-f9fc6a2a7f6d` (Bukhari 25) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six translations reread against Arabic, including two chains and wording variants | 14,608 | Private local AI drafts; unpublished; no human review |

- Updated hadith progress: 21 private local French drafts of 14,629; 4 items remain on hold for approved French Quran quotations; 14,608 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-008 | `18767eb6-6ca8-4a65-864c-777da9671b1b` (Bukhari 26), `3f09167d-3c49-4d26-84ac-b683dd91dd7d` (Bukhari 27), `e5fe364a-f87f-43a4-96b3-e4588139ee85` (Bukhari 28), `420f1cfc-5522-4910-9f39-8cba327ec281` (Bukhari 29), `d205927b-335e-4d20-86a9-995e02924463` (Bukhari 30), `a3f045ea-0447-4c9e-b961-61da2da7ad8a` (Bukhari 31) | 6 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and unpublished state passed; all six complete translations reread against Arabic | 14,602 | Private local AI drafts; unpublished; no human review. Bukhari 32 is longer than 2,000 characters and was deferred for a one-item batch. |

- Updated hadith progress: 27 private local French drafts of 14,629; 4 items remain on hold for approved French Quran quotations; 14,602 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-009 | `0044c4c2-16fb-4bc7-aacd-d83406c04bca` (Bukhari 32), `51b999bd-1ad4-4ed3-bb12-389d37c5ac13` (Bukhari 33), `77bf8c96-1617-4aed-ada8-571b494f9d6f` (Bukhari 34), `0e3cd999-771e-4a90-bb9e-baf6ef77faa5` (Bukhari 35), `7194381f-0358-469e-a163-370afd0c1077` (Bukhari 36), `ff51df51-b9f1-4e3b-8965-beb6dcf3bb2a` (Bukhari 37) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 32 is held because it quotes Quran 6:82 and 31:13 | 14,597 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 32 private local French drafts of 14,629; 5 items remain on hold for approved French Quran quotations; 14,597 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-010 | `8ef9f798-f359-4fb6-9c4c-09bf31dea478` (Bukhari 38), `408b0655-bc48-47f0-8e88-9faea41d7744` (Bukhari 39), `1fe7229f-a14f-4836-9e2f-fa6cb0496235` (Bukhari 40), `de09e74a-d0c1-4394-ac15-1c347e2e62b2` (Bukhari 41), `66eeea33-f44c-4fc8-9294-9c89e658b0ac` (Bukhari 42), `6184c6b9-2357-422c-a817-36392e0d5e35` (Bukhari 43) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 40 is held because it quotes Quran 2:143 | 14,592 | Five private local AI drafts; one Needs Mo |

- Correction: batch 009 did not contain a long Bukhari 38 report. The exporter deferred a different later long record; Bukhari 38 was included normally in batch 010.
- Updated hadith progress: 37 private local French drafts of 14,629; 6 items remain on hold for approved French Quran quotations; 14,592 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-011 | `bb8539fb-88a9-40eb-a6b2-57e1be658f67` (Bukhari 44), `cf458329-1c3b-4d58-88ce-fb4c4cf2455f` (Bukhari 45), `1f5a0221-da4a-4396-bb70-3c3c0ffd8b3b` (Bukhari 46), `fc3261cb-22d1-428b-9621-2a3eb9c0863b` (Bukhari 47), `b7e7951d-5ae1-4256-8445-b5a7c7682fe9` (Bukhari 48), `0bce5aa8-52d6-4562-93af-86bc6ff8351d` (Bukhari 49) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 45 held because it quotes Quran 5:3 | 14,587 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 42 private local French drafts of 14,629; 7 items remain on hold for approved French Quran quotations; 14,587 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.

| FR-LIB-HAD-BUKHARI-012 | `7ef80db3-a3a9-4681-841a-9956eb40602a` (Bukhari 50), `489c6233-d805-4250-ac44-5166c7d6d17b` (Bukhari 51), `22cacfdf-9bb0-4c06-a09c-87935beabacc` (Bukhari 52), `b1727822-c2e6-4558-a859-29a0e0c73a60` (Bukhari 53), `051686d8-c75b-4ff7-af3d-7a335ca7db66` (Bukhari 54), `1efdd73a-14f1-4044-a09f-639237897849` (Bukhari 55) | 5 | 0 | 0 | Arabic hashes, IDs, URLs, references, rights, private status, and five complete translations passed; Bukhari 50 is held because it quotes Quran 31:34 | 14,582 | Five private local AI drafts; one Needs Mo |

- Updated hadith progress: 47 private local French drafts of 14,629; 8 items remain on hold for approved French Quran quotations; 14,582 have no local French draft; database insertions remain 0 and all 14,629 remain absent from the live French table.
