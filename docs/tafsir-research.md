# Quran Foundation tafsir research

29 September 2026. Research only. No tafsir was added to Ask or stored in the database.

## What the API offers

The [tafsir resource endpoint](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/tafsirs/) lists editions. The `language` parameter changes a resource's **display name**, not which editions are returned. I called the production endpoint once each with `language=ar`, `en`, and `de` using our existing developer access. All three returned the same 23 resources. The [ayah endpoint](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/list-ayah-tafsirs/) returns HTML tafsir text for one verse; the [paginated endpoint](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/tafsir/) allows verse and chapter filters.

| Language of the tafsir text | Relevant available editions and resource IDs | Editorial assessment |
|---|---|---|
| Arabic | Ibn Kathir `14`, al-Sa'di `91`, al-Tabari `15`, al-Baghawi `94`, al-Qurtubi `90`, al-Muyassar `16`, al-Jalalayn `926`, Ibn Ashur `925`, al-Wasit `93` | Ibn Kathir and al-Sa'di are the clearest first candidates for Bayan's Sunni scope. Any excerpt still needs review for context and edition accuracy. |
| English | Ibn Kathir **abridged** `169`, Ma'arif al-Qur'an `168`, Tazkirul Quran `817` | Ibn Kathir is the closest fit, but the English abridgment is a distinct editorial work. Its translator and publisher permissions need checking. |
| German | None in the production resource list | An Arabic or English tafsir cannot silently be presented as a German edition. Translation would require rights and language review. |

These are availability and suitability leads, not approvals. Resource titles alone do not prove that a particular passage is complete, accurate, or licensed for our use.

## Terms and permission status

The [Quran Foundation developer terms](https://api-docs.quran.com/legal/developer-terms/) were last updated 14 September 2026. The relevant short clauses include “Developer may display QF Content to end users within the Application” and “Cache or store QF Content longer than 1 week” in its list of prohibited actions. The terms also require source context, prohibit redistribution of raw content, refer to source-specific license requirements, and bar using QF Content to build machine-learning models without written consent. They do not expressly settle whether sending tafsir text to a third-party inference model to draft an answer is permitted. The tafsir resource response provides name, author, language, ID and slug but no edition-specific license or publisher permission field.

| Proposed use | Current status | Why |
|---|---|---|
| Display tafsir inside Bayan with attribution and context | **Unclear for each edition** | QF allows in-app display generally, subject to source-specific licenses. We have not found edition-specific permissions for Ibn Kathir, al-Sa'di or the English abridgment. |
| Short-lived API cache, at most seven days | **Conditionally allowed under QF terms** | The general QF limit is one week. Edition-specific terms still need review. |
| Permanent local index or database copy | **Blocked** | The general QF terms restrict long storage and indexing outside API responses; no tafsir-specific exception was established. |
| Send tafsir text to Gemini for answer generation or checking | **Unclear, blocked for now** | Model inference is not the same as model training, but the terms do not explicitly grant this processing use. Publisher rights may add limits. Ask QF and each rights holder. |

## Next decision

Ask Quran Foundation for written confirmation naming resources `14`, `91` and `169` and explaining our intended display, seven-day cache, excerpting, and third-party AI inference. Ask for the rights holder or license for each edition, especially the English abridgment. If confirmed, Mo can approve a separately tested tafsir integration in a later phase. No tafsir content enters the current source package before that approval.
