# Targeted Scholar Library Gap Dry-Run Report

Date: 2026-09-29
Scope: Dry run across 20 targeted evidence gaps (14 Ibn Baz, 6 Ibn Uthaymeen).
Database Operations: Read-only check. Zero rows written to database.

## Summary

- Targets evaluated: 20
- Targets with clean candidate found: 6
- Targets remaining as safe gaps: 14
- Total clean candidates identified: 13

## Detailed Target Results

### 1. [GAP] Ramadan fasting is obligatory (`fasting-obligation`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Ramadan fasting is one of the pillars of Islam and an obligatory duty on every mature, sane Muslim.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "المشروع تقديم القضاء على صوم الست": Already published in library
  - "ما الأفضل في الصوم قبل عاشوراء وبعده؟": Title failed strict title relevance gate
  - "حكم الإفطار في صوم القضاء": Title failed strict title relevance gate
  - "هل يشرع صيام الست من شوال لمن عليه قضاء؟": No clean excerpt under 600 chars
  - "الأحاديث الصحيحة تدل على وجوب اعتماد الرؤية وعدم اعتبار الحساب": Title failed strict title relevance gate
  - *...and 14 more rejected attempts.*

---

### 2. [FOUND] Exact Fajr cutoff for food and drink while fasting (`fasting-fajr-cutoff`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Eating and drinking must cease upon the appearance of the true dawn (Fajr), based on Quran 2:187.
- **Clean Candidates Found (2):**
  - **Title:** إذا أكل بعد طلوع الفجر بطل صومه
    - **Reference:** مجموع فتاوى ومقالات الشيخ ابن باز (15/ 283)
    - **URL:** https://binbaz.org.sa/fatwas/12004/%D8%A5%D8%B0%D8%A7-%D8%A3%D9%83%D9%84-%D8%A8%D8%B9%D8%AF-%D8%B7%D9%84%D9%88%D8%B9-%D8%A7%D9%84%D9%81%D8%AC%D8%B1-%D8%A8%D8%B7%D9%84-%D8%B5%D9%88%D9%85%D9%87
    - **Length:** 313 chars
    - **First 150 chars:** "الواجب على المسلم الذي يصوم صوم فرض، أن يمسك عن الأكل إذا طلع الفجر، فإن أكل بعد طلوع الفجر أو شرب بطل صومه، ووجب عليه القضاء؛ لقول الله سبحانه: وَكُل..."
    - **Why it answers target:** The quote explicitly states the obligation to cease eating and drinking upon the appearance of dawn and cites Quran 2:187 as the basis for this ruling.
  - **Title:** حكم صيام من سمع أذان الفجر واستمر في الأكل
    - **Reference:** binbaz.org.sa, fatwa 12006
    - **URL:** https://binbaz.org.sa/fatwas/12006/%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D9%85%D9%86-%D8%B3%D9%85%D8%B9-%D8%A3%D8%B0%D8%A7%D9%86-%D8%A7%D9%84%D9%81%D8%AC%D8%B1-%D9%88%D8%A7%D8%B3%D8%AA%D9%85%D8%B1-%D9%81%D9%8A-%D8%A7%D9%84%D8%A3%D9%83%D9%84
    - **Length:** 598 chars
    - **First 150 chars:** "الواجب على المؤمن أن يمسك عن المفطرات من الأكل والشرب وغيرهما، إذا تبين له طلوع الفجر، وكان الصوم فريضة، كرمضان وكصوم النذر والكفارات؛ لقول الله : وَ..."
    - **Why it answers target:** The quote explicitly states that it is an obligation (Wajib) for the believer to abstain from eating and drinking upon the appearance of the true dawn, citing Quran 2:187 as the basis for this ruling.
- **Rejected Candidates Explanations:**
  - "حكم صوم من أكل أو شرب شاكًا في طلوع الفجر": Target point not established: The provided quote addresses the ruling on a person who eats or drinks while in a state of doubt regarding the dawn, rather than explicitly stating the general obligation that eating and drinking must cease upon the appearance of the true dawn as derived from Quran 2:187.
  - "حكم من تسحر والمؤذن يؤذن للفجر": Title failed strict title relevance gate
  - "حكم استمرار الصائم في الأكل أثناء أذان الفجر": Target point not established: While the quote addresses the obligation to stop eating at the time of the Adhan, it does not explicitly cite or reference Quran 2:187 as the basis for the requirement to cease eating and drinking upon the appearance of the true dawn.

---

### 3. [FOUND] Facing the Ka'bah in prayer (`qibla-facing-kabah`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Facing the Ka'bah (the Qibla) is an obligatory condition for the validity of prayer when able.
- **Clean Candidates Found (2):**
  - **Title:** حكم استقبال القبلة في الصلاة في السفر
    - **Reference:** binbaz.org.sa, fatwa 23115
    - **URL:** https://binbaz.org.sa/fatwas/23115/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%A8%D8%A7%D9%84-%D8%A7%D9%84%D9%82%D8%A8%D9%84%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D9%81%D8%B1
    - **Length:** 256 chars
    - **First 150 chars:** "إذا كان في سفر له أن يصلي على الدابة في النافلة، والفريضة إذا دعت الحاجة، أما في النافلة فيصلي في السفر والحضر.....، أما الفريضة لا، لا بدّ يقف ويستقب..."
    - **Why it answers target:** The quote explicitly states that for the obligatory prayer (الفريضة), one must stand and face the Qibla (لا بدّ يقف ويستقبل القبلة), establishing it as a necessary condition for validity, while noting exceptions only for necessity.
  - **Title:** حكم استقبال بئر زمزم في الصلاة دون القبلة
    - **Reference:** مجموع فتاوى ومقالات الشيخ ابن باز (29/ 216)
    - **URL:** https://binbaz.org.sa/fatwas/20477/%D8%AD%D9%83%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%A8%D8%A7%D9%84-%D8%A8%D8%A6%D8%B1-%D8%B2%D9%85%D8%B2%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D8%AF%D9%88%D9%86-%D8%A7%D9%84%D9%82%D8%A8%D9%84%D8%A9
    - **Length:** 423 chars
    - **First 150 chars:** "هذا باطل يجب التنبيه عليه؛ لأنه لا يجوز لأحد أن يستقبل زمزم ولا غيرها، الواجب استقبال الكعبة في كل مكان، فإذا كان يرى الكعبة فعليه أن يستقبل عينها في ..."
    - **Why it answers target:** The scholar explicitly states 'الواجب استقبال الكعبة في كل مكان' (It is obligatory to face the Ka'bah in every place) and cites the Quranic command to do so, directly establishing the obligation of facing the Qibla for the validity of prayer.
- **Rejected Candidates Explanations:**
  - "هل استقبال القبلة شرط عند زيارة القبر؟": Target point not established: The provided quote discusses the etiquette of visiting a grave and whether one should face the Qibla or the deceased's face during that specific act. It does not address the general obligation of facing the Qibla for the validity of the daily prayer.
  - "هل الصلاة مع الجماعة شرط لصحة الصلاة؟": Target point not established: The provided quote discusses the ruling on congregational prayer (Salat al-Jama'ah) and does not mention the Qibla or the requirement of facing it for the validity of prayer.
  - "الطهارة شرط لصحة الطواف": Title failed strict title relevance gate
  - "حكم استقبال القبلة في سجود التلاوة": Target point not established: The quote discusses the ruling of Sujud al-Tilawah (prostration of recitation) and explicitly states that it is not considered a prayer (Salah), thereby arguing that facing the Qibla is not obligatory for it. It does not establish the obligation of facing the Qibla for the prayer itself, but rather uses the prayer as a point of comparison to argue against the necessity of facing the Qibla for the prostration of recitation.
  - "معنى الناسخ والمنسوخ في نصوص الشرع": Title failed strict title relevance gate

---

### 4. [GAP] No forced conversion in Islam (`no-forced-conversion`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Non-Muslims are not compelled or coerced by force into accepting Islam, based on Quran 2:256.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "تفسير قوله تعالى: {لا إِكْرَاهَ فِي الدِّينِ...} الآية": No clean excerpt under 600 chars
  - "الجمع بين: {لَا إِكْرَاهَ فِي الدِّينِ} و«الطاعة في المنشط والمكره»": Already published in library
  - "معنى قوله تعالى: (إِنَّ الَّذِينَ تَوَفَّاهُمُ الْمَلائِكَةُ)": Title failed strict title relevance gate
  - "الجمع بين: {لَا إِكْرَاهَ فِي الدِّينِ} و«الطاعة في المنشط والمكره»": Already published in library
  - "لا إكراه في قبول الإسلام": Quote too short (173 chars < 200)
  - *...and 1 more rejected attempts.*

---

### 5. [FOUND] Clear categorical prohibition of riba (`riba-categorical-prohibition`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Riba is categorically forbidden in the Quran and Sunnah, and is one of the major destructive sins.
- **Clean Candidates Found (1):**
  - **Title:** حكم التعامل مع البنوك بالربا وزكاتها
    - **Reference:** مجموع فتاوى ومقالات الشيخ ابن باز (14/ 153)
    - **URL:** https://binbaz.org.sa/fatwas/5796/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B9%D8%A7%D9%85%D9%84-%D9%85%D8%B9-%D8%A7%D9%84%D8%A8%D9%86%D9%88%D9%83-%D8%A8%D8%A7%D9%84%D8%B1%D8%A8%D8%A7-%D9%88%D8%B2%D9%83%D8%A7%D8%AA%D9%87%D8%A7
    - **Length:** 505 chars
    - **First 150 chars:** "يحرم التعامل بالربا مع البنوك وغيرها، وجميع الفوائد الناتجة عن الربا كلها محرمة، وليست مالًا لصاحبها، بل يجب صرفها في وجوه الخير، إذا كان قبضها وهو يع..."
    - **Why it answers target:** The quote explicitly states that dealing with Riba is forbidden (يحرم) and cites the Quranic verses from Surah Al-Baqarah which declare war from Allah and His Messenger against those who engage in it, thereby establishing its status as a major destructive sin.
- **Rejected Candidates Explanations:**
  - "حقيقة الربا وحكمه ": Already published in library
  - "تحديد نواقض الإسلام ": Already published in library
  - "ما جواب القول بعدم تكفير تارك الصلاة؟": Title failed strict title relevance gate
  - "حكم الإقامة في بلد يظهر فيه الشرك والكفر": No clean excerpt under 600 chars
  - "ذكر السحر بعد الشرك هل هو دليل على عظم خطره؟": Title failed strict title relevance gate
  - *...and 10 more rejected attempts.*

---

### 6. [GAP] Writing/documenting debts (`writing-documenting-debts`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Documenting deferred debts in writing and with witnesses is prescribed by Quran 2:282 to preserve rights.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "ما حكم كتابة الدَّيْن؟": Quote too short (84 chars < 200)
  - "هل تجوز ذبيحة تارك الصلاة؟": Title failed strict title relevance gate
  - "ما حكم من يسب الدين؟": Quote too short (169 chars < 200)
  - "هل ما علم من الدين بالضرورة محل اجتهاد؟": Title failed strict title relevance gate
  - "هل يجوز للولد أن يطالب والده بإنفاذ عطائه له؟": No shared content word between title and quote
  - *...and 10 more rejected attempts.*

---

### 7. [FOUND] Two revocable divorces, then final third divorce (`divorce-limit-three`)

- **Scholar:** ibn-baz
- **Exact Point Required:** A husband has two revocable divorces; after the third, the wife is not lawful until she marries another husband.
- **Clean Candidates Found (2):**
  - **Title:** ما عدد الطلقات التي تحسب لمن رجعت بعد طلاق بائن؟
    - **Reference:** binbaz.org.sa, fatwa 6735
    - **URL:** https://binbaz.org.sa/fatwas/6735/%D9%85%D8%A7-%D8%B9%D8%AF%D8%AF-%D8%A7%D9%84%D8%B7%D9%84%D9%82%D8%A7%D8%AA-%D8%A7%D9%84%D8%AA%D9%8A-%D8%AA%D8%AD%D8%B3%D8%A8-%D9%84%D9%85%D9%86-%D8%B1%D8%AC%D8%B9%D8%AA-%D8%A8%D8%B9%D8%AF-%D8%B7%D9%84%D8%A7%D9%82-%D8%A8%D8%A7%D8%A6%D9%86%D8%9F
    - **Length:** 277 chars
    - **First 150 chars:** "فإن المطلقة إذا كانت رجعية وهي التي طلقت طلقة واحدة أو طلقتين على غير مال وقد دخل بها فإنها تعود إليه على بقية الطلاق، لا يبقى له إلا ما بقي من الثلاث..."
    - **Why it answers target:** The quote explicitly confirms that a husband has a total of three divorces, that one or two revocable divorces leave the remaining count, and implies the finality of the third by stating the husband only has what remains of the three.
  - **Title:** حكم من طلق زوجته وتزوجت بغيره، ثم طلقها وعادت للأول
    - **Reference:** binbaz.org.sa, fatwa 9888
    - **URL:** https://binbaz.org.sa/fatwas/9888/%D8%AD%D9%83%D9%85-%D9%85%D9%86-%D8%B7%D9%84%D9%82-%D8%B2%D9%88%D8%AC%D8%AA%D9%87-%D9%88%D8%AA%D8%B2%D9%88%D8%AC%D8%AA-%D8%A8%D8%BA%D9%8A%D8%B1%D9%87%D8%8C-%D8%AB%D9%85-%D8%B7%D9%84%D9%82%D9%87%D8%A7-%D9%88%D8%B9%D8%A7%D8%AF%D8%AA-%D9%84%D9%84%D8%A3%D9%88%D9%84
    - **Length:** 218 chars
    - **First 150 chars:** "فإن الرجل إذا طلق زوجته طلقة، أو طلقتين، ثم عقد عليها بعد ذلك بعد خروجها من العدة، أو بعد زوج آخر؛ فإنها ترجع بما بقي فقط، ترجع إليه بما بقي، إن كان ط..."
    - **Why it answers target:** The quote explicitly confirms that if a man divorces his wife once or twice, he retains the remaining count of divorces, and it implies the necessity of a new marriage contract after the third divorce by referencing the condition of marrying another husband for her to become lawful again.
- **Rejected Candidates Explanations:**
  - "حكم من طلق زوجته ثلاث طلقات": Target point not established: The quote confirms the ruling regarding the third divorce and the requirement of marrying another husband, but it does not explicitly state or establish the premise that a husband has exactly two revocable divorces prior to the third.
  - "حكم من طلق زوجته ثلاث طلقات وكان لا يصلي": No shared content word between title and quote
  - "حكم من طلق زوجته ثلاث طلقات وهو غضبان": Quote too short (77 chars < 200)
  - "حكم من طلق زوجته طلقتين ثم راجعها ثم طلقها بالثلاث": Failed to parse fatwa content
  - "حكم من شك في عدد الطلقات": No shared content word between title and quote
  - *...and 5 more rejected attempts.*

---

### 8. [FOUND] Waiting period after widowhood: four months and ten days (`widow-waiting-period`)

- **Scholar:** ibn-baz
- **Exact Point Required:** The waiting period ('iddah) for a woman whose husband passes away is four months and ten days unless pregnant.
- **Clean Candidates Found (2):**
  - **Title:** عدة الحامل المتوفى عنها زوجها وأهم أحكام الإحداد
    - **Reference:** binbaz.org.sa, fatwa 16076
    - **URL:** https://binbaz.org.sa/fatwas/16076/%D8%B9%D8%AF%D8%A9-%D8%A7%D9%84%D8%AD%D8%A7%D9%85%D9%84-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D9%81%D9%89-%D8%B9%D9%86%D9%87%D8%A7-%D8%B2%D9%88%D8%AC%D9%87%D8%A7-%D9%88%D8%A3%D9%87%D9%85-%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D8%A5%D8%AD%D8%AF%D8%A7%D8%AF
    - **Length:** 372 chars
    - **First 150 chars:** "عدة المتوفى عنها: أربعة أشهر وعشرًا، مائة وثلاثون يومًا، إذا كانت غير حامل، أما الحامل؛ عدتها وضع الحمل، الله يقول سبحانه: وَأُوْلاتُ الأَحْمَالِ أَجَ..."
    - **Why it answers target:** The quote explicitly states that the waiting period for a woman whose husband has passed away is four months and ten days if she is not pregnant, and specifies that for a pregnant woman, the waiting period ends upon delivery, citing the Quranic verse.
  - **Title:** أحكام المعتدة عدة وفاة
    - **Reference:** binbaz.org.sa, fatwa 15720
    - **URL:** https://binbaz.org.sa/fatwas/15720/%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D9%85%D8%B9%D8%AA%D8%AF%D8%A9-%D8%B9%D8%AF%D8%A9-%D9%88%D9%81%D8%A7%D8%A9
    - **Length:** 375 chars
    - **First 150 chars:** "الواجب على المرأة إذا توفي عنها زوجها أن تعتد أربعة أشهر وعشًرا؛ إذا كانت غير حامل، أربعة أشهر وعشرًا، وأن تجتنب الطيب، والملابس الجميلة، والكحل، ولبس..."
    - **Why it answers target:** The quote explicitly states the obligation for a woman whose husband has passed away to observe an 'iddah of four months and ten days, while also explicitly noting the exception for those who are pregnant by stating 'if she is not pregnant' (إذا كانت غير حامل).
- **Rejected Candidates Explanations:**
  - "عدة المتوفى عنها زوجها هل تحسب بالأيام أم بالأشهر؟": Already published in library
  - "عدة المتوفى عنها زوجها، وما يجب عليها": No clean excerpt under 600 chars

---

### 9. [GAP] Hajj and Umrah obligation (`hajj-umrah-obligation`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Hajj is a pillar of Islam obligatory once in a lifetime upon the able, and Umrah is likewise obligatory.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "تكرار العمرة في رمضان": Title failed strict title relevance gate
  - "حكم من نوى الحج كل عام ولم يستطع": Title failed strict title relevance gate
  - "ما هو القول الصحيح في طواف الوداع بالنسبة للعمرة؟": Title failed strict title relevance gate
  - "حكم مَنْ حج وترك السعي جهلاً منه منذ زمن": Failed to parse fatwa content
  - "حكم حج من لم يقم بزيارة المسجد النبوي": No clean excerpt under 600 chars
  - *...and 8 more rejected attempts.*

---

### 10. [GAP] Conduct during Hajj: no sin, argument, or immorality (`hajj-conduct-prohibitions`)

- **Scholar:** ibn-baz
- **Exact Point Required:** The pilgrim in Ihram is commanded to refrain from obscenity, sin, and useless dispute (Quran 2:197).
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "معنى الرفث والفسوق والجدال في الحج": Target point not established: The provided quote defines the terms 'Rafath', 'Fusuq', and 'Jidal' but does not explicitly state the command or obligation for the pilgrim to refrain from them as referenced in Quran 2:197.
  - "ما معنى قوله: {فَلا رَفَثَ وَلا فُسُوقَ وَلا جِدَالَ فِي الْحَجِّ}؟": Already published in library
  - "تفسير قوله تعالى: ﴿الْحَجُّ أَشْهُرٌ مَّعْلُومَاتٌ﴾": Title failed strict title relevance gate
  - "مواقيت الحج الزمانية والمكانية": Title failed strict title relevance gate
  - "ما معنى قوله: {فَلا رَفَثَ وَلا فُسُوقَ وَلا جِدَالَ فِي الْحَجِّ}؟": Already published in library
  - *...and 6 more rejected attempts.*

---

### 11. [GAP] Meaning of 'You alone we worship and You alone we ask for help' (`fatiha-iyyaka-na'bud`)

- **Scholar:** ibn-baz
- **Exact Point Required:** We worship Allah alone without associating partners and seek assistance exclusively from Him.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "ما معنى: {اتَّقُوا اللَّهَ وَابْتَغُوا إِلَيْهِ الْوَسِيلَةَ}؟": No shared content word between title and quote
  - "بيان أهمية التوحيد": No clean excerpt under 600 chars
  - "بيان أوراد شركية وبدعية": No shared content word between title and quote
  - "حكم دعاء الأقطاب والأوتاد والاستغاثة بهم": No shared content word between title and quote
  - "حكم الصلاة خلف من يلحن في الفاتحة": Title failed strict title relevance gate
  - *...and 8 more rejected attempts.*

---

### 12. [FOUND] Sincerity and intention in worship (`intention-in-worship`)

- **Scholar:** ibn-baz
- **Exact Point Required:** Intention (niyyah) in the heart is a required condition for the validity and acceptance of every act of worship.
- **Clean Candidates Found (4):**
  - **Title:** حكم التلفظ بالنية قبل الوضوء
    - **Reference:** binbaz.org.sa, fatwa 2536
    - **URL:** https://binbaz.org.sa/fatwas/2536/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D9%88%D8%B6%D9%88%D8%A1
    - **Length:** 514 chars
    - **First 150 chars:** "ما يحتاج يا ولدي التكلم بالنية، قلبك يكفي، ما دمت قمت للوضوء، فالنية كافية، أما قول: نويت أن أتوضأ لصلاة الظهر هذه بدعة ما لها أصل، النية في القلب يكف..."
    - **Why it answers target:** The scholar explicitly states that the intention in the heart is sufficient and necessary for acts of worship such as wudu, prayer, fasting, and Hajj, confirming that the heart's intention is the required condition for validity.
  - **Title:** ما حكم التلفظ بالنية في الأعمال؟
    - **Reference:** binbaz.org.sa, fatwa 13102
    - **URL:** https://binbaz.org.sa/fatwas/13102/%D9%85%D8%A7-%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%A3%D8%B9%D9%85%D8%A7%D9%84%D8%9F
    - **Length:** 260 chars
    - **First 150 chars:** "هذا بدعة، ما يجوز. التلفظ بالنية بدعة، ينوي في قلبه، والحمد لله، إذا قام بنية الصلاة كبر فقط، ما يقول: نويت أن أصلي كذا وكذا، ولا نويت أن أطوف، يأتي ب..."
    - **Why it answers target:** The scholar explicitly states that the intention is in the heart ('ينوي في قلبه') and provides examples of obligatory prayers (Dhuhr, Asr, Maghrib) where the intention must be in the heart, thereby establishing it as the required condition for the validity of these acts of worship.
  - **Title:** محل النية وحكم التلفظ بها
    - **Reference:** binbaz.org.sa, fatwa 8343
    - **URL:** https://binbaz.org.sa/fatwas/8343/%D9%85%D8%AD%D9%84-%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%88%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D9%87%D8%A7
    - **Length:** 528 chars
    - **First 150 chars:** "النية لابد منها في العبادات كلها لقول النبي ﷺ: إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فالنية بالقلب في الصلاة في الحج في الصيام في جميع العبادات..."
    - **Why it answers target:** The quote explicitly states that intention is necessary (la budda minha) for all acts of worship (al-ibadat kulliha) and specifies that the location of this intention is the heart (al-niyyah bil-qalb).
  - **Title:** حكم التلفظ بالنية قبل الصلاة
    - **Reference:** binbaz.org.sa, fatwa 10989
    - **URL:** https://binbaz.org.sa/fatwas/10989/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D9%84%D9%81%D8%B8-%D8%A8%D8%A7%D9%84%D9%86%D9%8A%D8%A9-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9
    - **Length:** 329 chars
    - **First 150 chars:** "التلفظ بالنية ليس له أصل في الشرع، بل هو بدعة؛ لقول النبي ﷺ: من عمل عملًا ليس عليه أمرنا؛ فهو رد ولم يكن النبي ﷺ يتلفظ بالنية، ولا أصحابه، النية محلها..."
    - **Why it answers target:** The quote explicitly states that the place of intention is the heart for acts of worship such as prayer, fasting, and ablution, and that it is sufficient, thereby establishing that the intention in the heart is the required condition for these acts.
- **Rejected Candidates Explanations:**
  - "هل النيّة شرطٌ لصحة العمل أم لكمال الإيمان؟": Quote too short (75 chars < 200)
  - "اشتراط النية في اليمين": No shared content word between title and quote
  - "حكم اشتراط النية في الإمامة": Target point not established: The provided quote discusses the specific ruling of intending to lead a prayer (Imamah) and whether it is required for the validity of congregational prayer. It does not state the general principle that intention in the heart is a required condition for the validity and acceptance of every act of worship.
  - "حكم اشتراط نية الصبي": Quote contains question text

---

### 13. [GAP] The five pillars of Islam in order (`five-pillars-in-order`)

- **Scholar:** ibn-baz
- **Exact Point Required:** The five pillars of Islam are the two testimonies, prayer, zakah, fasting Ramadan, and Hajj to the House.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "حكم تأخير الحج بدون عذر": No clean excerpt under 600 chars
  - "على من يجب صيام رمضان؟ وفضل صيام التطوع": Already published in library
  - "حكم إخراج زكاة الفطر نقودًا": Title failed strict title relevance gate
  - "كيفية إمساك وإفطار من يطول نهارهم": Already published in library
  - "حكم من ترك الصيام جهلاً بحكمه": Title failed strict title relevance gate
  - *...and 6 more rejected attempts.*

---

### 14. [GAP] Gold zakah: nisab and 2.5 percent (`zakah-gold-nisab`)

- **Scholar:** ibn-baz
- **Exact Point Required:** The nisab for gold is 20 mithqals (85 grams) and the required zakah is one quarter of a tenth (2.5 percent).
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "نصاب الذهب والفضة": Target point not established: The quote specifies the nisab as 92 grams rather than the 85 grams mentioned in the required point, and it fails to mention the zakah rate of 2.5 percent.
  - "نصاب الذهب والفضة": Target point not established: While the quote confirms the nisab for gold is 20 mithqals, it explicitly states the weight as 92 grams rather than the 85 grams specified in the required point, and it does not mention the 2.5 percent zakah rate.
  - "نصاب زكاة الذهب والفضة": Already published in library
  - "مقدار نصاب الذهب والفضة بالغرامات": Target point not established: The quote explicitly states the nisab for gold is 92 grams, which contradicts the required point of 85 grams, and it does not mention the 2.5 percent rate.
  - "حكم زكاة الحلي من الذهب والفضة": Target point not established: While the quote confirms the nisab for gold is 20 mithqals, it specifies the weight as 92 grams rather than the 85 grams requested, and it fails to explicitly state the zakah rate of 2.5 percent.
  - *...and 10 more rejected attempts.*

---

### 15. [GAP] Fasting exemption for illness and travel (`fasting-exemption-illness-travel`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** The ill person and the traveler are permitted to break their fast in Ramadan and make up the missed days later.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "المسافر مخير بين الصيام والفطر..": No clean excerpt under 600 chars
  - "تفسير سورة البقرة - 43": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب الصيام - 6": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب الصيام - 3": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب الصيام - 2": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 5 more rejected attempts.*

---

### 16. [GAP] Explanation of Ayat al-Kursi and Allah's living, eternal attributes (`ayat-al-kursi-meaning`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** Ayat al-Kursi is the greatest verse, affirming Allah's exclusive divinity and His attributes of Life and Self-Subsistence.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "كتاب التوحيد - 21": Not from Noor ala al-Darb or recognized fatwa collection
  - "تفسير سورة البقرة - 68": Not from Noor ala al-Darb or recognized fatwa collection
  - "هل في الجن صالحون وغير صالحين وهل يظهرون للإنس ..؟": Failed to parse audio fatwa
  - "تفسير سورة البقرة - 67": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب التوحيد - 21": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 8 more rejected attempts.*

---

### 17. [GAP] Charity versus riba (`charity-versus-riba`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** Allah destroys interest and deprives it of blessing, while He grows, blesses, and multiplies charity.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "حكم تأخير قبض ثمن الذهب ليوم أو يومين": Title failed strict title relevance gate
  - "الطريقة الصحيحة في تحويل العملة من بلد إلى بلد": No clean excerpt under 600 chars
  - "كتاب الحج (الشرح الأول) - 21": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب البيع (الشرح الثاني) - 17": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب البيع (الشرح الأول) - 32": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 3 more rejected attempts.*

---

### 18. [GAP] Divorce waiting period of three menstrual cycles (`divorce-waiting-period-quru`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** The waiting period ('iddah) for a divorced woman who menstruates is three menstrual cycles (quru').
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "أين تمكث المطلقة؟ وكم عدتها؟": Target point not established: The provided quote discusses the residence of a divorced woman during her 'iddah but does not mention or define the duration of the 'iddah as being three menstrual cycles.
  - "كتاب النكاح (الشرح الأول) - 18": Not from Noor ala al-Darb or recognized fatwa collection
  - "تفسير سورة البقرة - 1": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب الطلاق (الشرح الثاني) - 6": Not from Noor ala al-Darb or recognized fatwa collection
  - "الطلاق (الشرح الأول) - 16": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 6 more rejected attempts.*

---

### 19. [GAP] Meaning of asking Allah for the Straight Path in al-Fatiha (`fatiha-sirat-al-mustaqim`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** Seeking guidance to the Straight Path means requesting knowledge of the truth and divine aid to adhere to it.
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "ما هي نواقض الإسلام ؟": Already published in library
  - "حكم قراءة البسملة في الصلاة قبل الفاتحة": No clean excerpt under 600 chars
  - "ما هو دعاء العبادة وما هو دعاء المسألة ؟": Title failed strict title relevance gate
  - "التأمين بعد قراءة الفاتحة في الصلاة": Title failed strict title relevance gate
  - "التعليق على القواعد الحسان المتعلقة بتفسير القرآن - 8": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 11 more rejected attempts.*

---

### 20. [GAP] Clear concise definition of tawhid and its three categories (`tawhid-three-categories`)

- **Scholar:** ibn-uthaymeen
- **Exact Point Required:** Tawhid is singling out Allah in His Lordship (Rububiyyah), Worship (Uluhiyyah), and Names and Attributes (Asma wa Sifat).
- **Status:** Safe Gap. No candidate met all safety criteria.
- **Rejected Candidates Explanations:**
  - "تفسير سورة غافر - 2": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب التوحيد - 48": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب التوحيد - 1": Not from Noor ala al-Darb or recognized fatwa collection
  - "كتاب الطلاق (الشرح الثاني) - 1": Not from Noor ala al-Darb or recognized fatwa collection
  - "تفسير سورة البقرة - 1": Not from Noor ala al-Darb or recognized fatwa collection
  - *...and 7 more rejected attempts.*

---
