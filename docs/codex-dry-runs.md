# Codex collector dry runs

## 2026-09-28: Permanent Committee, alifta.gov.sa

Command: `npx tsx scripts/collect-alifta.ts --dry-run --limit=8`

Result: 0 samples. The official sitemap offered 0 individual Permanent Committee fatwa URLs. The collector uses only stable individual fatwa URLs in that sitemap or explicit `--url=` values. It does not call the site API when that API rejects external collectors.

## 2026-09-28: Abdur-Rahman al-Barrak, sh-albarrak.com

Command: `npx tsx scripts/collect-barrak.ts --dry-run --limit=8`

Result: 6 acceptable samples, 2 skipped because a safe sentence-ending excerpt could not be made. No database rows were written. Five samples follow.

1. Title: هل يجوز الشراء للأصدقاء بالنقاط ثم يدفعون مبلغا أقل من قيمة السلعة
   Source: sh-albarrak.com, fatwa 37042
   First 150 characters: الحمد لله وحده، وصلى الله وسلم على من لا نبي بعده؛ أما بعد: فمعلوم أن شركة الزيت تعطي هذا العامل الذي استعمل سلعتهم (الزيت) نقاطًا؛ تشجيعا له على استخدام زيتهم، فهذا لا يظهر فيه مانع
   Link: https://sh-albarrak.com/fatwas/37042

2. Title: متى يبدأ التكبير عند إكمال رمضان
   Source: sh-albarrak.com, fatwa 37041
   First 150 characters: الحمد لله وحده، وصلى الله وسلم على نبينا محمد، وعلى آله وصحبه؛ أما بعد: فالتكبير الذي أُمِر به المسلم عند إكمال رمضان يبدأ من غروب شمس آخر يوم من رمضان
   Link: https://sh-albarrak.com/fatwas/37041

3. Title: اختلاف المنظمات في الدول الغربية في تحديد عيد الفطر
   Source: sh-albarrak.com, fatwa 37040
   First 150 characters: الحمد لله وحده، وصلى الله وسلم على نبينا محمد، وعلى آله وصحبه؛ أما بعد: فالأظهر عندي هو العمل بما تقوله المنظمة الكبرى؛ لأن القول الراجح أن لكل أهل بلد رؤيتهم
   Link: https://sh-albarrak.com/fatwas/37040

4. Title: الجمع بين قوله تعالى: ولا تمسكوا بعصم الكوافر، وقوله: ضرب الله مثلا للذين كفروا امرأة نوح
   Source: sh-albarrak.com, fatwa 37039
   First 150 characters: الحمد لله وحده، وصلى الله وسلم على نبينا محمد، وعلى آله وصحبه؛ أما بعد: فإن الله حرَّم في هذه الشريعة نكاح المشركات، وحرَّم إمساك الكوافر بعصمة النكاح
   Link: https://sh-albarrak.com/fatwas/37039

5. Title: هل القنوت عبادة فلا تصرف لغير الله
   Source: sh-albarrak.com, fatwa 37030
   First 150 characters: الحمد لله وحده، وصلى الله وسلم على نبينا محمد، وعلى آله وصحبه؛ أما بعد: فإن معنى القنوت: دوام الطاعة، ودوام الطاعة لله دليل على صدق الإيمان، لا كفر فيه ولا شرك
   Link: https://sh-albarrak.com/fatwas/37030

## 2026-09-28: Abdullah al-Ghudayyan, algodayan.com

Command: `npx tsx scripts/collect-ghudayyan.ts --dry-run --limit=5`

Result: 0 samples. The normal request to the official category page returned HTTP 403. The collector did not retry with browser headers, cookies, a login, or any bypass. No database rows were written.

## 2026-09-28: Permanent Committee, second public-route attempt

Result: still 0 samples. Normal request to `https://alifta.gov.sa/ar/Fatawa-chapters` returned the public application shell but no individual fatwa data. Its public JavaScript declares `https://alifta.gov.sa/EGate/` and `https://alifta.gov.sa/EGate/API/`; earlier normal requests to the external API were rejected with HTTP 401. This attempt did not add browser cookies, an authentication token, an Origin header, or any other bypass.

Official public search did find journal PDFs under `https://alifta.gov.sa/EGate/upload/journal/pdf/` whose tables of contents mention an appendix of Permanent Committee fatwas. They are issue-level PDFs, not stable individual fatwa pages with a reliably machine-readable question, answer, printed reference and signatory block. The collector remains unchanged and does not collect them.

## 2026-09-29: Expansion Batch Dry Runs (Ibn Baz, Ibn Uthaymeen, al-Albani, al-Barrak)

Command: `npx tsx --conditions=react-server scripts/dry-run-expansion.ts` (tested on 25 priority core topics: creed, prayer, purification, fasting, zakat, Hajj, Quran, dua, repentance, family, money, funerals, Hereafter).

All collectors enforce the verified rules: strip opening formulas and letter headings, remove question text, select matching multi-question parts, reject tafsir lessons and dialogue transcripts, minimum 200 characters, content-word stem overlap (`sharesContentWord`), near-duplicate detection (`isNearDuplicate`), and AI relevance check (`checkQuoteRelevance`).

### 1. Ibn Baz (binbaz.org.sa)
- Queries attempted: 25
- Hits found: 50
- Already existing: 27
- Skipped: 8 (6 no clean sentence-end excerpt within 600 chars, 1 not parsed/question, 1 near-duplicate)
- Acceptable candidates: 15

Representative samples:
1. Title: صفة الغسل من الجنابة
   Source: binbaz.org.sa, fatwa 13710
   Length: 377 characters
   First 150 characters: السنة أن يبدأ بالاستنجاء، يغسل ذكره وما حوله، ثم يتوضأ وضوء الصلاة، هذه السنة، كما كان النبي يفعل ﷺ، كان يتوضأ وضوء الصلاة ثم يفيض الماء على رأسه ثلاث مرات
   Link: https://binbaz.org.sa/fatwas/13710/%D8%B5%D9%81%D8%A9-%D8%A7%D9%84%D8%BA%D8%B3%D9%84-%D9%85%D9%86-%D8%A7%D9%84%D8%AC%D9%86%D8%A7%D8%A8%D8%A9

2. Title: ما صفة الغسل من الجنابة والحيض والنفاس؟
   Source: binbaz.org.sa, fatwa 30962
   Length: 440 characters
   First 150 characters: الجنب والحائض والنفساء كلهم غسلهم متقارب، تعم بدنها بالماء وتفيض على رأسها الماء، لكن السُّنة أن يبدأ بالوضوء، يستنجي أولًا، ثم يتوضأ وضوء الصلاة، ثم يفيض الماء على رأسه
   Link: https://binbaz.org.sa/fatwas/30962/%D9%85%D8%A7-%D8%B5%D9%81%D8%A9-%D8%A7%D9%84%D8%BA%D8%B3%D9%84-%D9%85%D9%86-%D8%A7%D9%84%D8%AC%D9%86%D8%A7%D8%A8%D8%A9-%D9%88%D8%A7%D9%84%D8%AD%D9%8A%D8%B6-%D9%88%D8%A7%D9%84%D9%86%D9%81%D8%A7%D8%B3%D8%9F

3. Title: حكم تبييت النية في صيام الفرض والنفل
   Source: binbaz.org.sa, fatwa 11739
   Length: 586 characters
   First 150 characters: من لم يعلم بدخول شهر رمضان إلا بعد طلوع الفجر فعليه أن يمسك عن المفطرات بقية يومه؛ لكونه يومًا من رمضان لا يجوز للمقيم الصحيح أن يتناول فيه شيئًا من المفطرات
   Link: https://binbaz.org.sa/fatwas/11739/%D8%AD%D9%83%D9%85-%D8%AA%D8%A8%D9%8A%D9%8A%D8%AA-%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%81%D9%8A-%D8%B5%D9%8A%D8%A7%D9%85-%D8%A7%D9%84%D9%81%D8%B1%D8%B6-%D9%88%D8%A7%D9%84%D9%86%D9%81%D8%A4%D9%84

### 2. Ibn Uthaymeen (binothaimeen.net)
- Queries attempted: 25
- Hits found: 40
- Already existing: 9
- Skipped: 28 (12 lesson tapes not fatwa collections, 6 not parsed/question, 4 no clean excerpt, 3 tafsir lessons, 2 no shared content word, 1 starts like room talk)
- Acceptable candidates: 3

Representative samples:
1. Title: كان يخرج زكاة الفطر نقداً فهل يلزمه إخراجها مرة أخرى؟
   Source: لقاءات الباب المفتوح (لقاء الباب المفتوح [191])
   Length: 276 characters
   First 150 characters: لا يلزمه. كل من فعل شيئاً بفتوى عالم، أو باتباع علماء بلده فلا شيء عليه، مثال ذلك: لو أن امرأة لا تؤدي زكاة الحلي فبقيت سنوات لم تؤد زكاة الحلي ثم سألت
   Link: https://binothaimeen.net/ar/voice_library/lessonDetails/%D9%84%D9%82%D8%A7%D8%A1-%D8%A7%D9%84%D8%A8%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%81%D8%AA%D9%88%D8%AD-%5B191%5D/%D9%83%D8%A7%D9%86-%D9%8A%D8%AE%D8%B1%D8%AC-%D8%B2%D9%83%D8%A7%D8%A9-%D8%A7%D9%84%D9%81%D8%B7%D8%B1-%D9%86%D9%82%D8%AF%D8%A7%D9%8B-%D9%81%D9%87%D9%84-%D9%8A%D9%84%D8%B2%D9%85%D9%87-%D8%A5%D8%AE%D8%B1%D8%A7%D8%AC%D9%87%D8%A7-%D9%85%D8%B1%D8%A9-%D8%A3%D8%AE%D8%B1%D9%89%D8%9F/02512aba-0b7f-409a-9059-1dcd7a71239b

2. Title: أيهما أفضل قراءة القرآن نظراً أو ترديد سور منه للحفظ؟
   Source: فتاوى نور على الدرب (الشريط رقم [24])
   Length: 552 characters
   First 150 characters: الأولى أن يقرأ القرآن كله نظراً، وأن يحافظ على ما كان حفظه عن ظهر قلب لئلا ينساه، وذلك لأن قراءة القرآن كله مفيدة للإنسان جداً، فإن له بكل حرف عشر حسنات
   Link: https://binothaimeen.net/ar/voice_library/lessonDetails/%D8%A7%D9%84%D8%B4%D8%B1%D9%8A%D8%B7-%D8%B1%D9%82%D9%85-%5B24%5D/%D8%A3%D9%8A%D9%87%D9%85%D8%A7-%D8%A3%D9%81%D8%B6%D9%84-%D9%82%D8%B1%D8%A7%D8%A1%D8%A9-%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86-%D9%86%D8%B8%D8%B1%D8%A7%D9%8B-%D8%A3%D9%88-%D8%AA%D8%B1%D8%AF%D9%8A%D8%AF-%D8%B3%D9%88%D8%B1-%D9%85%D9%86%D9%87-%D9%84%D9%84%D8%AD%D9%81%D8%B8%D8%9F/a7720700-be25-4d4a-bc44-a430ca0d33f7

3. Title: من فاتته صلاة الجنازة هل يصليها منفردا أو جماعة في المسجد؟
   Source: فتاوى نور على الدرب (الشريط رقم [362])
   Length: 291 characters
   First 150 characters: الصلاة على الميت فرض كفاية وليست فرض عين، وإذا فاتت الإنسان الصلاة على الميت صلى على قبره؛ لأن النبي صلى الله عليه وعلى آله وسلم صلى على القبر حين فاتته الصلاة
   Link: https://binothaimeen.net/ar/voice_library/lessonDetails/%D8%A7%D9%84%D8%B4%D8%B1%D9%8A%D8%B7-%D8%B1%D9%82%D9%85-%5B362%5D/%D9%85%D9%86-%D9%81%D8%A7%D8%AA%D8%AA%D9%87-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D8%AC%D9%86%D8%A7%D8%A8%D8%A9-%D9%87%D9%84-%D9%8A%D8%B5%D9%84%D9%8A%D9%87%D8%A7-%D9%85%D9%86%D9%81%D8%B1%D8%AF%D8%A7-%D8%A3%D9%88-%D8%AC%D9%85%D8%A7%D8%B9%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF%D8%9F/015517e0-c23d-4a1f-beee-3eee36c3aca3

### 3. Al-Albani (al-albany.com)
- Queries attempted: 25
- Hits found: 21
- Already existing: 1
- Skipped: 20 (all rejected by strict single-questioner and immediate-answer parser rule to prevent capturing conversational dialogue or intermediate speaker interruptions)
- Acceptable candidates: 0 on these specific 25 queries (earlier approved run gathered 22 quotes across other topics)

### 4. Al-Barrak (sh-albarrak.com)
- Queries attempted: 25
- Hits found: 13
- Already existing: 3
- Skipped: 10 (7 not category 1 signed written fatwas, 2 under 200 chars, 1 no clean excerpt)
- Acceptable candidates: 0 on these specific 25 queries (site has a smaller archive of category 1 dictated fatwas, matching items were already stored)
