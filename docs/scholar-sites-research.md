# Scholar website research

Checked on 2026-09-28 using normal public requests only. A site being reachable does not mean Al-Bayan has written permission to copy it. The proposed rights records remain short-quote-only and are not applied.

## Abdul-Muhsin al-Abbad, al-abbaad.com

The site responded and identifies itself as the official site of Shaykh Abdul-Muhsin al-Abbad. It has written articles, including stable pages such as `https://al-abbaad.com/articles/607420`, but I did not verify a written fatwa question-and-answer collection. The site text says his books and articles may be printed only unchanged and with copies sent to him. That is not permission for an automated quote library. Robots responded normally; no specific collector-friendly search API was confirmed. Verdict: possible later for a separate written-articles design, not suitable for the current strict fatwa collector. Contact details need to be taken from the official contact route before any permission letter is sent.

## Abdur-Razzaq al-Badr, al-badr.net

The official site responded. It is mainly lessons, lectures, sermons, books and articles. I did not find a clear written question-and-answer fatwa collection with the Shaykh's answer safely separated from everyone else. The site includes a warning that lesson audio must not be turned into books without permission. Robots responded normally. Verdict: not suitable for automatic written-fatwa collection now. A contact route exists on the official site, but no contact should be made without Mo's approval.

## Salih Al al-Shaykh, saleh.af.org.sa

The official site responded and has a fatwa section at `https://saleh.af.org.sa/ar/ftawa`. The visible fatwas are audio entries, not verified written answers; the site also lists books. Robots responded normally. Because the answer must be the scholar's exact words and must be separated from other speakers, audio would need a separate reviewed transcription and rights process. Verdict: not suitable for this collector.

## Abdur-Rahman al-Barrak, sh-albarrak.com

The official site responded and provides written fatwas. The listing is `https://sh-albarrak.com/fatwas?postTypeCategory=1`; individual stable pages are `/fatwas/<number>`, for example `https://sh-albarrak.com/fatwas/37042`. The page data contains a question, written answer and explicit `أملاه: عبدالرحمن بن ناصر البراك` signature. It also has Terms, Privacy and Contact pages: `/tos`, `/privacy-policy`, `/contact-us`. Robots responded normally. Verdict: easy, with a strict parser that requires the signature, cuts before it, checks the title/topic, and only stores a short sentence-ending excerpt.

## Abdullah al-Ghudayyan, algodayan.com

The site identifies itself as Shaykh Abdullah al-Ghudayyan's official site. Public browser research showed a written fatwa structure with a number, question, `الجواب:` and scholar footer, such as `https://algodayan.com/index.php/audio/ay7dcy8zpvkwhya`. The category listing is `https://algodayan.com/index.php/audio/category/fatwas` and showed many pages. However, ordinary collector requests received HTTP 403, including the listing. Robots also rejected the request. No bypass was attempted. Verdict: structurally easy but operationally blocked. Obtain permission or a documented public access method before any real collection.

## Salih al-Usaymi, j-eman.net

The site responded and presents programmes for Shaykh Salih al-Usaymi, including audio and learning material. I did not verify a structured written fatwa question-and-answer collection with an answer clearly separated from other speakers. Robots responded normally. Verdict: not suitable for the current collector. A permission route should be confirmed from the official site if this is revisited.

## Recommended order

1. Abdur-Rahman al-Barrak: ready for a reviewed dry-run approval.
2. Abdullah al-Ghudayyan: only after the site owner permits normal access or gives a suitable public feed.
3. Abdul-Muhsin al-Abbad: decide separately whether the product may use short excerpts from authored articles, after permission review.
4. Salih Al al-Shaykh, Abdur-Razzaq al-Badr and Salih al-Usaymi: do not automate from audio, lessons or mixed materials under the current rules.
