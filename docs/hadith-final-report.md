# Hadith final report

Import accepted by Mo on 2026-10-02.

Dataset: the official Sunnah.com API. License and permission: written permission from Sunnah.com support to use the key to make our own cache or database, with a monthly refresh recommendation. The stored text is the full Sunnah.com Arabic body, including the chain of narration. It is not rewritten or shortened.

Rights record: `fd8cd4f5-5011-40a1-ae14-cb6e8fa165b7`, status granted. Arabic search and AI processing are allowed. Translation indexing is not allowed. Attribution is Sunnah.com.

Totals stored:

- Sahih al-Bukhari: 7,263
- Sahih Muslim: 7,366
- Total: 14,629
- Approved Arabic search documents: 14,629

Skipped and recorded:

- Muslim introduction: 91 records, not part of the main collection.
- Two repeated Arabic bodies in each collection. The first occurrence was kept.
- Missing or non-numbered records and records not returned by the API were not invented.
- Bukhari API gaps: 6940, 7268, 7269, 7270, 7271, 7272, 7278, 7279, 7284, 7285, 7317, 7318.

Verification:

- HadeethEnc collection and number check: 60 of 60 correct.
- HadeethEnc wording check: HadeethEnc edits and condenses Arabic and can combine wording from related narrations, so exact equality is not the correct test. Unique-word overlap with the stored Sunnah.com body averaged 90.3%, with a 95.9% median. Fifty-two of 60 had at least 80% overlap.
- Saved Sunnah.com raw-response check: 58 of 60 matched directly. The two combined-number cases were Sahih Muslim 1731 a, b and Sahih al-Bukhari 5773-5775. They use combined printed numbering and were not failures.
- Twenty database searches completed through `search_approved_source_candidates`. Twelve returned five hadith results and eight returned no result for the exact test term. No search call failed.
- Every stored hadith passed the publication gate, has the granted rights record, and has an HTTPS Sunnah.com link.
- No fatwa rows, translations, Ask code, or the live HadeethEnc path were changed.

Ten stored links:

1. https://sunnah.com/bukhari:5725
2. https://sunnah.com/bukhari:5726
3. https://sunnah.com/bukhari:5727
4. https://sunnah.com/bukhari:5728
5. https://sunnah.com/bukhari:5862
6. https://sunnah.com/bukhari:5881
7. https://sunnah.com/bukhari:5897
8. https://sunnah.com/bukhari:5887
9. https://sunnah.com/bukhari:5863
10. https://sunnah.com/bukhari:5864

Follow-ups for Mo:

1. Add excerpt and continuation-hadith rules for display.
2. Switch Ask to the stored hadith library.
3. Add Gemini English and German translations separately.
4. Refresh the Sunnah.com cache monthly within the permission and API limits.
