# Hadith dataset report

Date: 2026-10-01

## Decision

No candidate passed the required rights and evidence checks. The import must not start.

## Open-Hadith-Data

License: ODbL 1.0 for the database and DbCL for individual contents. This permits database use with the required license conditions and attribution.

Provenance: the project documents that its original CSV files come from the `hadith-islamware` repository. That repository identifies the material as an Islam Ware database, copyright 2006-2014, preserved by Hendy Irawan. This documents the origin, but it does not solve the quality gaps below.

Local checks:

- Bukhari: 7,008 rows. Muslim: 5,362 rows. These do not cover the printed 1 to 7,563 numbering range.
- The Arabic files include a diacritics version.
- Each CSV row has the number, a full Arabic field, and an explanation field. It does not provide separate book or chapter headings or a separate matn field.
- The full Arabic field contains the chain and matn together, so extracting the matn would require a new interpretation step. That would not meet the exact-text rule safely.

Result: rights are potentially usable with attribution, but the dataset is not complete and does not contain the required structure.

## Jaguar16/open-hadith-data

License: the repository says its structured data is CC0 and that the Arabic hadith text is public domain.

Provenance and structure: it explicitly says the data is automatically extracted from Sunnah.com. Its schema includes books, chapters, full Arabic text, a separate `matn_ar`, numbers, and Sunnah.com links. It is the strongest technical match. However, Sunnah.com says that scraping and mass reproduction of entire books or collections are not permitted. The downstream CC0 statement does not remove that upstream restriction.

Result: not safe to store as a complete local copy without written permission from Sunnah.com. It cannot be selected under the project decision rule.

## fawazahmed0/hadith-api

License: the repository software is Unlicense. That does not clearly grant rights to the Arabic data.

Provenance and local checks: its edition metadata lists the Arabic author as Unknown and leaves the source blank. The repository references many different websites, but does not document a clear source and rights chain for these Arabic editions. The downloaded Arabic files contain 7,589 Bukhari rows and 7,563 Muslim rows, with sections and printed numbers, but no grades and no separate matn field. Some records are empty.

Result: the software license does not establish permission to store the data. Provenance is unclear, so it cannot be selected.

## HadeethEnc check

The required 30-record comparison was not run. The decision rule requires a qualifying dataset before that comparison and before any import. Running it would not cure the licensing and provenance failures above.

## Sources checked

- Open-Hadith-Data license and README
- hadith-islamware README and Arabic CSV files
- Jaguar16 DATA_LICENSE, README and schema
- fawazahmed0 license, references, edition metadata and Arabic files
- Sunnah.com About page, including its reproduction and scraping rule

No database rows or rights records were changed.
