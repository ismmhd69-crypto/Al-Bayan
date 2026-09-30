# Sunnah.com API research

Checked on 2026-09-28 from the official Sunnah.com API repository, its OpenAPI file and the Sunnah.com developer/about pages. No live API request was made because Al-Bayan does not yet have a key.

## What the official API documents

The API base is `https://api.sunnah.com/v1/`. It requires an `X-API-Key` header. The official OpenAPI file documents collections, books, chapters, a hadith by collection and printed number, filtered hadith lists, a hadith by URN, batches by URN, batches by collection:number reference, and random hadith. It does **not** document a free-text search endpoint. List endpoints are paginated and accept at most 100 items per request.

Each hadith record includes collection, book number, chapter ID, printed hadith number, and language-specific entries. A language entry includes its language, chapter number/title, body, URN, and grade records with `graded_by` and `grade`. Numbering needs care: Sunnah.com says Arabic and English may have different historical numbering, and only verified references are shown in bold on the website.

## Rate limits

The official documentation did not publish a fixed rate limit. API-key request forms ask the applicant to state proposed requests per second and per day. Al-Bayan should begin at one request per second, cache successful individual records for one day, and keep a hard daily limit until Sunnah.com confirms the allowed rate.

## Storage, copying and AI use

The official developer page says the API exposes only a portion of its data and that an offline dump is not available yet. The official About page says: "We do not permit the scraping of our data, nor mass reproduction of entire books or collections on other websites." It permits reproducing "individual hadith or selections of hadith for a teaching/didactic/presentation purpose." It does not state permission for local search indexing, long-term caching, translations, or sending text to an AI provider.

Therefore: do not bulk-download, build a local full-text index, or send Sunnah.com text to an AI until Sunnah.com gives written permission for those specific uses. The connector only makes individual API calls and retains no database copy. Before enabling it for visitors, ask Sunnah.com to confirm short local caching, display with attribution/link, search use and AI processing.

## Chosen search design

Because the documented API has no text search, `searchSunnahMulti` uses the existing HadeethEnc title catalogue to find an already confirmed Sahih al-Bukhari or Sahih Muslim printed number. It then asks Sunnah.com only for that individual `collection:number` record. Visitor words are never sent to Sunnah.com, no local Sunnah.com index is created, and an absent key returns no results. This is a bridge design, not permission to use Sunnah.com text in the public Ask pipeline. Claude must decide whether to connect it after written rights confirmation.
