# Lesson Extras Review (Gemini)

Review of `data/learning/lesson-extras.json` across all 32 "New to Islam" lessons against `data/learning/new-to-islam.json` and Bayan content rules.

## Overview Table

| Number | ID | Verdict | One-line Reason |
|---|---|---|---|
| 1 | what-is-islam | OK | All takeaways and quiz strictly match the lesson text and sources. |
| 2 | who-is-allah | OK | Faithfully reflects core answer and Quranic verses with accurate options. |
| 3 | purpose-and-worship | OK | Worship purpose and mundane act reward properly grounded in cited texts. |
| 4 | prophet-muhammad | OK | Accurate biographical facts and clear distinction between worship and following. |
| 5 | the-quran | OK | Cleanly distinguishes original Arabic text from translation and commentary. |
| 6 | sunnah-and-hadith | Fix | Missing honorific ﷺ after 'الرسول' in Arabic takeaway 3. |
| 7 | muslim-beliefs | OK | Six pillars of iman and divine decree effort accurately presented. |
| 8 | becoming-muslim | Fix | Missing honorific ﷺ after 'رسول الله' in Arabic takeaway 2. |
| 9 | your-past | OK | Cleanly states wiping past wrongdoing and balance of hope and repentance. |
| 10 | your-first-days | OK | Correctly attributes naming ruling to Shaykh Ibn Baz with clear options. |
| 11 | five-pillars | OK | Foundations and Quranic condition of ability for Hajj clearly presented. |
| 12 | understanding-prayer | OK | Remembrance and restraining from wrongdoing directly sourced from Quran. |
| 13 | daily-prayer-times | OK | Prayer names and resident unit counts strictly match lesson and fatwa. |
| 14 | wudu | OK | Direct test of Quran 5:6 regarding wiping the head. |
| 15 | how-to-pray | OK | Settled movement and tranquility accurately tested without dispute. |
| 16 | learning-arabic | OK | Attributed to Ibn Baz for genuine inability without relaxing for capable. |
| 17 | reading-the-quran | OK | Reward for struggling reader directly matches Sahih Muslim report. |
| 18 | making-dua | OK | Supplication outside salah in personal language correctly attributed to Ibn Baz. |
| 19 | repentance | OK | Three conditions and restoration of interpersonal rights directly sourced. |
| 20 | non-muslim-family | OK | Respect and kind relations with non-Muslim parents properly supported. |
| 21 | finding-community | OK | Ibn Baz's boundary between sharing knowledge and speaking without it. |
| 22 | food-and-drink | OK | Distinction of lawful food and general prohibition of all intoxicants. |
| 23 | modesty | OK | Order of address in Quran 24:30–31 (men first) accurately captured. |
| 24 | work-and-money | OK | Trade by mutual consent and distinction from riba clearly presented. |
| 25 | ramadan | OK | Timing of fast from dawn to sunset properly verified by Quran and hadith. |
| 26 | zakah-and-charity | OK | Sourced non-monetary charity (kind words, removing harm) tested. |
| 27 | hajj | OK | Sourced once-in-a-lifetime obligation for those able attributed to Ibn Baz. |
| 28 | good-character | OK | Sourced definition of a Muslim from whose tongue and hand others are safe. |
| 29 | questions-and-thoughts | OK | Sourced guidance on stopping whisperings without rejecting sincere questions. |
| 30 | scholarly-differences | OK | Sourced causes of differences and conduct of scholars attributed to Ibn Baz. |
| 31 | reliable-answers | OK | Warning against speaking without knowledge and signs of qualified scholars. |
| 32 | what-to-learn-next | OK | Sourced principle of steady, small, continuous good deeds. |

---

## Detailed Findings for Fixes

### 1. Lesson 6: `sunnah-and-hadith`

* **Field:** `takeaways.ar[2]`
* **Verdict:** Fix
* **Problem Text:**
  ```text
  يربط القرآن طاعة الرسول بطاعة الله.
  ```
* **Why it breaks a rule:**
  Bayan rules require that whenever the Prophet is mentioned in Arabic, the proper honorific `ﷺ` must be included. Here, `الرسول` is written without `ﷺ`.
* **Corrected Wording:**
  * **Arabic:**
    ```text
    يربط القرآن طاعة الرسول ﷺ بطاعة الله.
    ```
  * **English:**
    ```text
    The Quran connects obeying the Messenger with obeying Allah.
    ```
  * **German:**
    ```text
    Der Quran verbindet den Gehorsam gegenüber dem Gesandten mit dem Gehorsam gegenüber Allah.
    ```

---

### 2. Lesson 8: `becoming-muslim`

* **Field:** `takeaways.ar[1]`
* **Verdict:** Fix
* **Problem Text:**
  ```text
  الشهادة الأولى تتعلق بمن تعبد، والثانية بالإقرار برسول الله واتباعه.
  ```
* **Why it breaks a rule:**
  The phrase `برسول الله` refers specifically to the Prophet Muhammad and is missing the mandatory honorific `ﷺ`.
* **Corrected Wording:**
  * **Arabic:**
    ```text
    الشهادة الأولى تتعلق بمن تعبد، والثانية بالإقرار برسول الله ﷺ واتباعه.
    ```
  * **English:**
    ```text
    The first testimony concerns whom you worship; the second concerns recognising and following Allah's Messenger.
    ```
  * **German:**
    ```text
    Das erste Glaubensbekenntnis betrifft, wen du anbetest; das zweite betrifft die Anerkennung und das Befolgen des Gesandten Allahs.
    ```

---

## Summary

* **Total lessons reviewed:** 32
* **Lessons OK:** 30
* **Lessons needing fixes:** 2 (both are minor Arabic honorific additions: adding `ﷺ`)
* **Lessons unsure:** 0
* **Scholar check notes:**
  1. The content integrity of all 32 lessons is high: every single takeaway and quiz question draws directly from the approved lesson body and its cited primary references (`quran.com`, `sunnah.com`, and official Ibn Baz fatwas).
  2. No unsourced rulings were introduced. Rulings regarding practical learning steps, prayer units, and inability to read Arabic are properly attributed to Shaykh Ibn Baz rather than presented as anonymous dogma.
  3. No disputed scholarly positions are tested as consensus. Questions focus on established facts, verbatim Quranic commands, explicit hadith texts, or explicitly attributed scholarly explanations.
  4. German texts consistently adhere to informal "du" and standard project spelling (`Quran`, `Sunna`, `Zakat`, `Hajj`).

