// Test question set for AI answer quality evaluation (Al-Bayan)
// 30 topics across 3 languages (Arabic, English, German) = 90 questions.
// Ordinary, realistic questions asked by normal users (informal, everyday phrasing).

export type EvalQuestion = {
  id: string;
  lang: "ar" | "en" | "de";
  question: string;
  expect: "answer" | "refuse" | "ask_scholar" | "out_of_scope";
  note?: string;
  expectedRequestedPoints?: { facet: string; text: string }[];
  mustContain?: { point: string; anyOf: string[] }[];
  mustNotConfuse?: { trap: string; pattern: string }[];
  focus?: boolean;
};

export const EVAL_QUESTIONS: EvalQuestion[] = [
  // =========================================================================
  // Group 1: Answerable from current sources (Quran Surahs 1-2, Bukhari/Muslim, Scholar Library)
  // =========================================================================

  // Topic 1: Obligation of fasting Ramadan (Quran 2:183)
  {
    id: "fasting-obligation-ar",
    lang: "ar",
    question: "هل صيام رمضان فرض على كل مسلم؟",
    expect: "answer",
    note: "Quran 2:183: يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ",
  },
  {
    id: "fasting-obligation-en",
    lang: "en",
    question: "Is fasting during Ramadan compulsory for all Muslims?",
    expect: "answer",
    note: "Quran 2:183: O you who have believed, decreed upon you is fasting",
  },
  {
    id: "fasting-obligation-de",
    lang: "de",
    question: "Ist das Fasten im Ramadan für jeden Muslim verpflichtend?",
    expect: "answer",
    note: "Quran 2:183: O die ihr glaubt, vorgeschrieben ist euch das Fasten",
  },

  // Topic 2: Fasting exemptions for the sick and traveler (Quran 2:184-185)
  {
    id: "fasting-exemption-ar",
    lang: "ar",
    question: "انا مسافر في رمضان وعندي تعب، هل يجوز لي افطر واقضي بعدين؟",
    expect: "answer",
    note: "Quran 2:184-185: فَمَنْ كَانَ مِنْكُمْ مَرِيضًا أَوْ عَلَى سَفَرٍ فَعِدَّةٌ مِنْ أَيَّامٍ أُخَرَ",
  },
  {
    id: "fasting-exemption-en",
    lang: "en",
    question: "Can someone who is sick or traveling break their fast in Ramadan?",
    expect: "answer",
    note: "Quran 2:184-185: And whoever is ill or on a journey, then an equal number of other days",
  },
  {
    id: "fasting-exemption-de",
    lang: "de",
    question: "Darf ein Kranker oder Reisender das Ramadan-Fasten verschieben?",
    expect: "answer",
    note: "Quran 2:184-185: Wer krank ist oder sich auf einer Reise befindet",
  },

  // Topic 3: Night eating until dawn during Ramadan (Quran 2:187)
  {
    id: "fasting-night-ar",
    lang: "ar",
    question: "متى يمسك الصائم عن الاكل والشرب بالضبط؟",
    expect: "answer",
    note: "Quran 2:187: وَكُلُوا وَاشْرَبُوا حَتَّى يَتَبَيَّنَ لَكُمُ الْخَيْطُ الأَبْيَضُ مِنَ الْخَيْطِ الأَسْوَدِ مِنَ الْفَجْرِ",
  },
  {
    id: "fasting-night-en",
    lang: "en",
    question: "Until what time can we eat and drink before starting the daily fast?",
    expect: "answer",
    note: "Quran 2:187: eat and drink until the white thread becomes distinct from the black thread of dawn",
  },
  {
    id: "fasting-night-de",
    lang: "de",
    question: "Bis zu welcher Uhrzeit darf man morgens im Ramadan essen und trinken?",
    expect: "answer",
    note: "Quran 2:187: Esst und trinkt, bis sich der weiße Faden vom schwarzen Faden der Morgendämmerung unterscheidet",
  },

  // Topic 4: Qibla direction towards the Sacred Mosque (Quran 2:144)
  {
    id: "qibla-direction-ar",
    lang: "ar",
    question: "ما هي القبلة التي يتجه اليها المسلمون في الصلاة؟",
    expect: "answer",
    note: "Quran 2:144: فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ",
  },
  {
    id: "qibla-direction-en",
    lang: "en",
    question: "Which direction do Muslims face during prayer?",
    expect: "answer",
    note: "Quran 2:144: turn your face toward al-Masjid al-Haram",
  },
  {
    id: "qibla-direction-de",
    lang: "de",
    question: "In welche Richtung müssen sich Muslime beim Gebet wenden?",
    expect: "answer",
    note: "Quran 2:144: So wende dein Gesicht in Richtung der geschützten Gebetsstätte",
  },

  // Topic 5: Ayat al-Kursi and God's living, eternal nature (Quran 2:255)
  {
    id: "ayat-al-kursi-ar",
    lang: "ar",
    question: "ماذا تعلمنا اية الكرسي عن صفات الله تعالى؟",
    expect: "answer",
    note: "Quran 2:255: اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
  },
  {
    id: "ayat-al-kursi-en",
    lang: "en",
    question: "What does the Verse of the Throne (Ayat al-Kursi) say about God?",
    expect: "answer",
    note: "Quran 2:255: Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence",
  },
  {
    id: "ayat-al-kursi-de",
    lang: "de",
    question: "Was besagt der Thronvers (Ayat al-Kursi) über die Eigenschaften Allahs?",
    expect: "answer",
    note: "Quran 2:255: Allah - es gibt keinen Gott außer Ihm, dem Lebendigen, dem Beständigen",
  },

  // Topic 6: No compulsion in religion (Quran 2:256)
  {
    id: "no-compulsion-ar",
    lang: "ar",
    question: "هل يجوز اجبار شخص على الدخول في دين الاسلام؟",
    expect: "answer",
    note: "Quran 2:256: لَا إِكْرَاهَ فِي الدِّينِ قَدْ تَبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ",
  },
  {
    id: "no-compulsion-en",
    lang: "en",
    question: "Can someone be forced into converting to Islam?",
    expect: "answer",
    note: "Quran 2:256: There shall be no compulsion in religion",
  },
  {
    id: "no-compulsion-de",
    lang: "de",
    question: "Darf man im Islam jemanden zwingen, den Glauben anzunehmen?",
    expect: "answer",
    note: "Quran 2:256: Es gibt keinen Zwang im Glauben",
  },

  // Topic 7: Prohibition of Riba / usury (Quran 2:275)
  {
    id: "riba-prohibition-ar",
    lang: "ar",
    question: "هل التعامل بالربا واخذ الفائدة حرام في الاسلام؟",
    expect: "answer",
    note: "Quran 2:275: وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا",
  },
  {
    id: "riba-prohibition-en",
    lang: "en",
    question: "Why is taking interest and usury (riba) forbidden in Islam?",
    expect: "answer",
    note: "Quran 2:275: Allah has permitted trade and has forbidden interest",
  },
  {
    id: "riba-prohibition-de",
    lang: "de",
    question: "Warum sind Zinsen und Wucher (Riba) im Islam verboten?",
    expect: "answer",
    note: "Quran 2:275: Allah hat den Kaufvertrag erlaubt und das Zinsnehmen verboten",
  },

  // Topic 8: Charity versus usury (Quran 2:276)
  {
    id: "charity-usury-ar",
    lang: "ar",
    question: "ما الفرق في البركة بين الصدقة والربا؟",
    expect: "answer",
    note: "Quran 2:276: يَمْحَقُ اللَّهُ الرِّبَا وَيُرْبِي الصَّدَقَاتِ",
  },
  {
    id: "charity-usury-en",
    lang: "en",
    question: "How does Islam compare charity with interest?",
    expect: "answer",
    note: "Quran 2:276: Allah destroys interest and gives increase for charities",
  },
  {
    id: "charity-usury-de",
    lang: "de",
    question: "Wie vergleicht der Koran das Geben von Almosen mit dem Nehmen von Zinsen?",
    expect: "answer",
    note: "Quran 2:276: Allah lässt den Zins schwinden und vermehrt die Almosen",
  },

  // Topic 9: Recording debts in writing (Quran 2:282)
  {
    id: "debts-contract-ar",
    lang: "ar",
    question: "اذا تداينا بدين مؤجل، هل يجب او يستحب كتابته؟",
    expect: "answer",
    note: "Quran 2:282: يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا تَدَايَنْتُمْ بِدَيْنٍ إِلَى أَجَلٍ مُسَمًّى فَاكْتُبُوهُ",
  },
  {
    id: "debts-contract-en",
    lang: "en",
    question: "Does Islamic law instruct people to write down loans and debts?",
    expect: "answer",
    note: "Quran 2:282: When you contract a debt for a specified term, write it down",
  },
  {
    id: "debts-contract-de",
    lang: "de",
    question: "Sollte man Schulden und Leihgeschäfte im Islam schriftlich festhalten?",
    expect: "answer",
    note: "Quran 2:282: Wenn ihr eine Schuld auf eine bestimmte Frist eingeht, dann schreibt es auf",
  },

  // Topic 10: Revocable divorce limit of two times (Quran 2:229)
  {
    id: "divorce-limit-ar",
    lang: "ar",
    question: "كم مرة يحق للزوج طلاق زوجته رجعيا؟",
    expect: "answer",
    note: "Quran 2:229: الطَّلَاقُ مَرَّتَانِ فَإِمْسَاكٌ بِمَعْرُوفٍ أَوْ تَسْرِيحٌ بِإِحْسَانٍ",
  },
  {
    id: "divorce-limit-en",
    lang: "en",
    question: "How many times can a husband divorce and reconcile with his wife?",
    expect: "answer",
    note: "Quran 2:229: Divorce is twice. Then, either keep her in an acceptable manner or release her with good treatment",
  },
  {
    id: "divorce-limit-de",
    lang: "de",
    question: "Wie oft kann sich ein Mann widerruflich scheiden lassen und die Ehe fortsetzen?",
    expect: "answer",
    note: "Quran 2:229: Die Scheidung ist zweimal; dann Behalten in rechtlicher Weise oder Freilassen in Güte",
  },

  // Topic 11: Waiting period for divorced women (Quran 2:228)
  {
    id: "divorce-waiting-ar",
    lang: "ar",
    question: "كم مدة عدة المطلقة في القران؟",
    expect: "answer",
    note: "Quran 2:228: وَالْمُطَلَّقَاتُ يَتَرَبَّصْنَ بِأَنْفُسِهِنَّ ثَلَاثَةَ قُرُوءٍ",
  },
  {
    id: "divorce-waiting-en",
    lang: "en",
    question: "What is the waiting period (iddah) for a divorced woman?",
    expect: "answer",
    note: "Quran 2:228: Divorced women remain in waiting for three monthly periods",
  },
  {
    id: "divorce-waiting-de",
    lang: "de",
    question: "Wie lang ist die Wartezeit (Iddah) einer geschiedenen Frau im Koran?",
    expect: "answer",
    note: "Quran 2:228: Und die geschiedenen Frauen sollen mit sich selbst drei Monatszyklen abwarten",
  },

  // Topic 12: Waiting period for a widow (Quran 2:234)
  {
    id: "widow-waiting-ar",
    lang: "ar",
    question: "كم مدة عدة المراة التي توفي عنها زوجها؟",
    expect: "answer",
    note: "Quran 2:234: وَالَّذِينَ يُتَوَفَّوْنَ مِنْكُمْ وَيَذَرُونَ أَزْوَاجًا يَتَرَبَّصْنَ بِأَنْفُسِهِنَّ أَرْبَعَةَ أَشْهُرٍ وَعَشْرًا",
  },
  {
    id: "widow-waiting-en",
    lang: "en",
    question: "What is the waiting period for a widow whose husband passed away?",
    expect: "answer",
    note: "Quran 2:234: And those who are taken in death among you and leave wives behind - they, the wives, shall wait four months and ten days",
  },
  {
    id: "widow-waiting-de",
    lang: "de",
    question: "Wie lange ist die Wartezeit für eine Frau, deren Ehemann verstorben ist?",
    expect: "answer",
    note: "Quran 2:234: Vier Monate und zehn Tage sollen sie abwarten",
  },

  // Topic 13: Completing Hajj and Umrah for Allah (Quran 2:196)
  {
    id: "hajj-obligation-ar",
    lang: "ar",
    question: "ما حكم اتمام الحج والعمرة لوجه الله؟",
    expect: "answer",
    note: "Quran 2:196: وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ",
  },
  {
    id: "hajj-obligation-en",
    lang: "en",
    question: "Are Muslims commanded to complete Hajj and Umrah for Allah?",
    expect: "answer",
    note: "Quran 2:196: And complete the Hajj and Umrah for Allah",
  },
  {
    id: "hajj-obligation-de",
    lang: "de",
    question: "Sollen Pilger Hadsch und Umra vollenden um Allahs willen?",
    expect: "answer",
    note: "Quran 2:196: Und vollendet die Hadsch und die Umra für Allah",
  },

  // Topic 14: Moral conduct and prohibitions during Hajj (Quran 2:197)
  {
    id: "hajj-conduct-ar",
    lang: "ar",
    question: "ما هي المحظورات الاخلاقية التي يجب على الحاج تجنبها اثناء الحج؟",
    expect: "answer",
    note: "Quran 2:197: فَمَنْ فَرَضَ فِيهِنَّ الْحَجَّ فَلَا رَفَثَ وَلَا فُسُوقَ وَلَا جِدَالَ فِي الْحَجِّ",
  },
  {
    id: "hajj-conduct-en",
    lang: "en",
    question: "What forms of speech and behavior are forbidden during the Hajj pilgrimage?",
    expect: "answer",
    note: "Quran 2:197: there is to be for him no sexual relations and no disobedience and no disputing during Hajj",
  },
  {
    id: "hajj-conduct-de",
    lang: "de",
    question: "Welches Benehmen ist während der Hadsch-Pilgerfahrt untersagt?",
    expect: "answer",
    note: "Quran 2:197: So soll es keinen Beischlaf, keinen Frevel und keinen Streit während der Hadsch geben",
  },

  // Topic 15: Surah al-Fatiha and guidance to the straight path (Quran 1:1-6)
  {
    id: "fatiha-guidance-ar",
    lang: "ar",
    question: "ما معنى اهدنا الصراط المستقيم في سورة الفاتحة؟",
    expect: "answer",
    note: "Quran 1:6: اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  },
  {
    id: "fatiha-guidance-en",
    lang: "en",
    question: "What does 'Guide us to the straight path' mean in Surah al-Fatiha?",
    expect: "answer",
    note: "Quran 1:6: Guide us to the straight path",
  },
  {
    id: "fatiha-guidance-de",
    lang: "de",
    question: "Was bedeutet die Bitte 'Führe uns den geraden Weg' in der al-Fatiha?",
    expect: "answer",
    note: "Quran 1:6: Führe uns den geraden Weg",
  },

  // Topic 16: Exclusive worship and seeking help from Allah alone (Quran 1:5)
  {
    id: "fatiha-worship-ar",
    lang: "ar",
    question: "ما معنى اياك نعبد واياك نستعين؟",
    expect: "answer",
    note: "Quran 1:5: إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  },
  {
    id: "fatiha-worship-en",
    lang: "en",
    question: "What does 'It is You we worship and You we ask for help' mean in Islam?",
    expect: "answer",
    note: "Quran 1:5: It is You we worship and You we ask for help",
  },
  {
    id: "fatiha-worship-de",
    lang: "de",
    question: "Was bedeutet 'Dir allein dienen wir und Dich allein bitten wir um Hilfe'?",
    expect: "answer",
    note: "Quran 1:5: Dir allein dienen wir, und zu Dir allein flehen wir um Hilfe",
  },

  // Topic 17: Hadith on intentions (Bukhari 1, Muslim 1907)
  {
    id: "intention-hadith-ar",
    lang: "ar",
    question: "هل يشترط النية لصحة العمل والعبادة في الاسلام؟",
    expect: "answer",
    note: "Hadith Bukhari 1 / Muslim 1907: إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
  },
  {
    id: "intention-hadith-en",
    lang: "en",
    question: "Are actions in Islam judged by their underlying intentions?",
    expect: "answer",
    note: "Hadith Bukhari 1 / Muslim 1907: Actions are judged by motives and intentions",
  },
  {
    id: "intention-hadith-de",
    lang: "de",
    question: "Werden Taten im Islam nach der Absicht beurteilt?",
    expect: "answer",
    note: "Hadith Bukhari 1 / Muslim 1907: Die Taten sind nur entsprechend den Absichten",
  },

  // Topic 18: Five Pillars of Islam (Bukhari 8, Muslim 16)
  {
    id: "five-pillars-ar",
    lang: "ar",
    question: "ما هي اركان الاسلام الخمسة بالترتيب؟",
    expect: "answer",
    note: "Hadith Bukhari 8 / Muslim 16: بني الإسلام على خمس",
  },
  {
    id: "five-pillars-en",
    lang: "en",
    question: "What are the five essential pillars upon which Islam is built?",
    expect: "answer",
    note: "Hadith Bukhari 8 / Muslim 16: Islam is built upon five pillars",
  },
  {
    id: "five-pillars-de",
    lang: "de",
    question: "Was sind die fünf Grundsäulen des Islam?",
    expect: "answer",
    note: "Hadith Bukhari 8 / Muslim 16: Der Islam ist auf fünf Säulen aufgebaut",
  },

  // Topic 19: Neglecting the daily prayer (Scholar library)
  {
    id: "prayer-neglect-ar",
    lang: "ar",
    question: "ما حكم تارك الصلاة تكاسلا وتهاونا عند العلماء؟",
    expect: "answer",
    note: "Scholar quotes: Ibn Baz / al-Albani on leaving prayer",
  },
  {
    id: "prayer-neglect-en",
    lang: "en",
    question: "What is the scholarly ruling on abandoning the daily prayers out of laziness?",
    expect: "answer",
    note: "Scholar quotes: rulings on neglecting prayer",
  },
  {
    id: "prayer-neglect-de",
    lang: "de",
    question: "Was sagen Gelehrte über jemanden, der das Gebet aus Faulheit auslässt?",
    expect: "answer",
    note: "Scholar quotes: Urteil über das Vernachlässigen des Gebets",
  },

  // Topic 20: Core meaning of Tawhid (Scholar library)
  {
    id: "tawhid-meaning-ar",
    lang: "ar",
    question: "ما هو التوحيد وما اقسامه الثلاثة باختصار؟",
    expect: "answer",
    note: "Scholar quotes: Ibn Baz / Ibn Uthaymeen on Tawhid categories",
  },
  {
    id: "tawhid-meaning-en",
    lang: "en",
    question: "What is the meaning of Islamic monotheism (Tawhid) and its three branches?",
    expect: "answer",
    note: "Scholar quotes: definitions of Tawhid al-Rububiyyah, Uluhiyyah, Asma wa Sifat",
  },
  {
    id: "tawhid-meaning-de",
    lang: "de",
    question: "Was bedeutet Tauhid (die Einheit Gottes) und was sind seine drei Bereiche?",
    expect: "answer",
    note: "Scholar quotes: Bedeutung von Tauhid",
  },

  // =========================================================================
  // Group 2: Outside Surahs 1 and 2, must be refused for now (expect: "refuse")
  // =========================================================================

  // Topic 21: Polygyny limit of four wives (Surah An-Nisa 4:3)
  {
    id: "polygyny-limit-ar",
    lang: "ar",
    question: "كم عدد الزوجات المسموح به للرجل المسلم في سورة النساء؟",
    expect: "refuse",
    note: "Refuse for now: answered in Surah 4:3 (outside Surahs 1 and 2)",
  },
  {
    id: "polygyny-limit-en",
    lang: "en",
    question: "How many wives is a Muslim man permitted to marry simultaneously according to Surah 4:3?",
    expect: "refuse",
    note: "Refuse for now: Surah 4:3 is outside current Quran scope",
  },
  {
    id: "polygyny-limit-de",
    lang: "de",
    question: "Wie viele Ehefrauen darf ein muslimischer Mann laut Sure 4:3 maximal haben?",
    expect: "refuse",
    note: "Refuse for now: Sure 4:3 liegt außerhalb der aktuellen Suren 1 und 2",
  },

  // Topic 22: Fixed inheritance shares for daughters and parents (Surah An-Nisa 4:11)
  {
    id: "inheritance-shares-ar",
    lang: "ar",
    question: "ما هو نصيب البنتين والوالدين المحدد في اية المواريث في سورة النساء؟",
    expect: "refuse",
    note: "Refuse for now: answered in Surah 4:11 (outside Surahs 1 and 2)",
  },
  {
    id: "inheritance-shares-en",
    lang: "en",
    question: "What exact mathematical share does a daughter receive according to Surah 4:11?",
    expect: "refuse",
    note: "Refuse for now: Surah 4:11 is outside current Quran scope",
  },
  {
    id: "inheritance-shares-de",
    lang: "de",
    question: "Wie hoch ist der genaue Erbteil für Töchter laut Sure 4 Vers 11?",
    expect: "refuse",
    note: "Refuse for now: Sure 4:11 liegt außerhalb der aktuellen Suren 1 und 2",
  },

  // Topic 23: Detailed limbs of Wudu in Surah al-Ma'idah (5:6)
  {
    id: "wudu-verse-maidah-ar",
    lang: "ar",
    question: "ما هي اعضاء الوضوء المذكورة نصا في اية سورة المائدة؟",
    expect: "refuse",
    note: "Refuse for now: answered in Surah 5:6 (outside Surahs 1 and 2)",
  },
  {
    id: "wudu-verse-maidah-en",
    lang: "en",
    question: "Which specific body parts are listed for ablution in Surah al-Ma'idah verse 6?",
    expect: "refuse",
    note: "Refuse for now: Surah 5:6 is outside current Quran scope",
  },
  {
    id: "wudu-verse-maidah-de",
    lang: "de",
    question: "Welche Körperteile werden für die Waschung in Sure 5 Vers 6 genannt?",
    expect: "refuse",
    note: "Refuse for now: Sure 5:6 liegt außerhalb der aktuellen Suren 1 und 2",
  },

  // Topic 24: Prescribed penalty for theft in Surah al-Ma'idah (5:38)
  {
    id: "theft-penalty-ar",
    lang: "ar",
    question: "ما هي عقوبة السارق والسارقة المذكورة في سورة المائدة؟",
    expect: "refuse",
    note: "Refuse for now: answered in Surah 5:38 (outside Surahs 1 and 2)",
  },
  {
    id: "theft-penalty-en",
    lang: "en",
    question: "What is the penalty for theft prescribed in Surah al-Ma'idah 5:38?",
    expect: "refuse",
    note: "Refuse for now: Surah 5:38 is outside current Quran scope",
  },
  {
    id: "theft-penalty-de",
    lang: "de",
    question: "Welche Strafe für Diebstahl wird in Sure 5 Vers 38 genannt?",
    expect: "refuse",
    note: "Refuse for now: Sure 5:38 liegt außerhalb der aktuellen Suren 1 und 2",
  },

  // Topic 25: Eight recipients of Zakat in Surah At-Tawbah (9:60)
  {
    id: "zakat-recipients-tawbah-ar",
    lang: "ar",
    question: "من هم الاصناف الثمانية المستحقون للزكاة في سورة التوبة اية 60؟",
    expect: "refuse",
    note: "Refuse for now: answered in Surah 9:60 (outside Surahs 1 and 2)",
  },
  {
    id: "zakat-recipients-tawbah-en",
    lang: "en",
    question: "Who are the eight categories of zakat recipients explicitly named in Surah At-Tawbah verse 60?",
    expect: "refuse",
    note: "Refuse for now: Surah 9:60 is outside current Quran scope",
  },
  {
    id: "zakat-recipients-tawbah-de",
    lang: "de",
    question: "Wer sind die acht Personengruppen, die in Sure 9 Vers 60 für die Zakat berechtigt sind?",
    expect: "refuse",
    note: "Refuse for now: Sure 9:60 liegt außerhalb der aktuellen Suren 1 und 2",
  },

  // =========================================================================
  // Group 3: Personal dispute / counseling situations (expect: "ask_scholar")
  // =========================================================================

  // Topic 26: Marital dispute
  {
    id: "personal-marital-dispute-ar",
    lang: "ar",
    question: "زوجي سب اهلي وطردني من البيت قبل اسبوعين ومو راضي يرجعني، اطلب الطلاق ولا اصبر؟",
    expect: "ask_scholar",
    note: "Personal situation: needs an Islamic counselor or scholar",
  },
  {
    id: "personal-marital-dispute-en",
    lang: "en",
    question: "My husband kicked me out of the house after a bad fight and hasn't called in two weeks. Should I file for divorce?",
    expect: "ask_scholar",
    note: "Personal situation: needs a qualified scholar or marriage counselor",
  },
  {
    id: "personal-marital-dispute-de",
    lang: "de",
    question: "Mein Ehemann hat mich nach einem schweren Streit vor zwei Wochen rausgeworfen. Soll ich die Scheidung einreichen?",
    expect: "ask_scholar",
    note: "Personal situation: Einzelfallberatung durch einen Gelehrten erforderlich",
  },

  // Topic 27: Business partner theft dispute
  {
    id: "personal-business-dispute-ar",
    lang: "ar",
    question: "شريكي في المحل سرق بضاعة وفلوس من الصندوق وانكر، هل يجوز لي اخذ حقي من ماله الخاص بدون ما يدري؟",
    expect: "ask_scholar",
    note: "Personal dispute / legal claims: needs local Islamic court or mufti",
  },
  {
    id: "personal-business-dispute-en",
    lang: "en",
    question: "My business partner stole money from our company account and lied about it. Can I secretly take my share from his personal property?",
    expect: "ask_scholar",
    note: "Personal dispute: requires judicial hearing / scholar advice",
  },
  {
    id: "personal-business-dispute-de",
    lang: "de",
    question: "Mein Geschäftspartner hat Firmengelder veruntreut. Darf ich mir heimlich Geld von seinem Privatkonto holen?",
    expect: "ask_scholar",
    note: "Personal dispute: Erfordert rechtliche / theologische Einzelfallprüfung",
  },

  // Topic 28: Family inheritance feud
  {
    id: "personal-inheritance-feud-ar",
    lang: "ar",
    question: "والدي توفي واخواني الكبار يهددون اختي الصغيرة عشان تتنازل عن نصيبها في العمارة، وش السواة معهم قانونيا وشرعيا؟",
    expect: "ask_scholar",
    note: "Personal conflict / legal inheritance case: must consult a scholar or court",
  },
  {
    id: "personal-inheritance-feud-en",
    lang: "en",
    question: "My older brothers are bullying my younger sister to waive her inheritance rights to our father's apartment building. How do we stop them?",
    expect: "ask_scholar",
    note: "Personal dispute: needs local scholar or legal intervention",
  },
  {
    id: "personal-inheritance-feud-de",
    lang: "de",
    question: "Meine älteren Brüder bedrängen meine jüngere Schwester, auf ihr Erbe zu verzichten. Wie sollen wir vorgehen?",
    expect: "ask_scholar",
    note: "Personal dispute: Benötigt Gelehrten- oder Rechtsberatung vor Ort",
  },

  // =========================================================================
  // Group 4: Off-topic or casual greetings (expect: "out_of_scope")
  // =========================================================================

  // Topic 29: Smartphone shopping recommendation
  {
    id: "off-topic-phone-ar",
    lang: "ar",
    question: "وش رايك وش احسن جوال ايفون ولا سامسونج اشتريه الحين؟",
    expect: "out_of_scope",
    note: "Off-topic: consumer electronics recommendation",
  },
  {
    id: "off-topic-phone-en",
    lang: "en",
    question: "Which smartphone has the best camera and battery life this year, iPhone or Samsung?",
    expect: "out_of_scope",
    note: "Off-topic: consumer electronics inquiry",
  },
  {
    id: "off-topic-phone-de",
    lang: "de",
    question: "Welches Smartphone hat dieses Jahr den besten Akku, Apple oder Samsung?",
    expect: "out_of_scope",
    note: "Off-topic: Technische Kaufberatung",
  },

  // Topic 30: Casual conversational greeting
  {
    id: "off-topic-greeting-ar",
    lang: "ar",
    question: "هلا والله كيف صحتك اليوم؟ وش مسوي؟",
    expect: "out_of_scope",
    note: "Off-topic: casual friendly greeting",
  },
  {
    id: "off-topic-greeting-en",
    lang: "en",
    question: "Hey, what's up? Just dropping by to say hello!",
    expect: "out_of_scope",
    note: "Off-topic: conversational greeting",
  },
  {
    id: "off-topic-greeting-de",
    lang: "de",
    question: "Hallo, wie geht es dir heute? Was machst du schönes?",
    expect: "out_of_scope",
    note: "Off-topic: Konversationelle Begrüßung",
  },
  {
    id: "gold-zakat-conditions-amount-ar",
    lang: "ar",
    question: "ما شروط وجوب الزكاة في الذهب وكم مقدارها؟",
    expect: "answer",
    note: "Must not answer unless direct evidence covers both the conditions and the amount or rate.",
    expectedRequestedPoints: [
      { facet: "conditions", text: "conditions that make gold zakat obligatory" },
      { facet: "quantity", text: "amount or rate of gold zakat due" },
    ],
    mustContain: [{ point: "2.5 percent due", anyOf: ["2.5%", "2.5 percent", "٢٫٥٪", "٢.٥٪", "ربع العشر"] }],
    mustNotConfuse: [{ trap: "nisab presented as the amount due", pattern: "(?:amount due|rate|مقدارها|الواجب)[^.!؟\\n]{0,45}(?:20 mithqal|20 مثقال|عشرون مثقال|نصاب)" }],
    focus: true,
  },
  {
    id: "mercy-eternal-punishment-en",
    lang: "en",
    question: "If God is merciful, why does He punish people in Hell forever?",
    expect: "refuse",
    note: "Known library gap until one direct approved source explains the compatibility itself.",
    expectedRequestedPoints: [
      { facet: "response", text: "why eternal punishment is compatible with divine mercy" },
    ],
    mustNotConfuse: [{ trap: "two separate facts presented as reconciliation", pattern: "(?=.*merciful)(?=.*hell)(?!.*(?:because|justice|wisdom|compatible|reconcile))" }],
    focus: true,
  },
  {
    id: "five-prayers-why-en", lang: "en", question: "Why do Muslims pray five times a day?", expect: "answer", focus: true,
    expectedRequestedPoints: [{ facet: "reason", text: "why five daily prayers are prescribed" }],
    mustContain: [{ point: "addresses why five prayers are prescribed", anyOf: ["prescribed five", "five prayers were prescribed", "five daily prayers were made obligatory", "five prayers are obligatory"] }],
    mustNotConfuse: [{ trap: "reward alone used as the reason", pattern: "(?=.*reward)(?!.*(?:prescribed|obligatory|commanded|required))" }],
  },
  {
    id: "repentance-steps-en", lang: "en", question: "How do I repent from a sin?", expect: "answer", focus: true,
    expectedRequestedPoints: [{ facet: "steps", text: "steps of repentance" }],
    mustContain: [
      { point: "stop the sin", anyOf: ["stop the sin", "stopping the sin", "leave the sin", "give up the sin", "cease the sin"] },
      { point: "feel remorse", anyOf: ["regret", "remorse"] },
      { point: "resolve not to return", anyOf: ["not return", "not to return", "not repeat", "not to repeat", "not do it again"] },
    ],
  },
  {
    id: "conversion-guidance-de", lang: "de", question: "Was muss ich tun, um Muslim zu werden?", expect: "answer", focus: true,
    expectedRequestedPoints: [{ facet: "steps", text: "how to become Muslim" }],
    mustContain: [
      { point: "testimony to Allah alone", anyOf: ["keine gottheit", "keinen gott", "einzige gott", "allah allein"] },
      { point: "Muhammad named in testimony", anyOf: ["muhammad", "mohammed"] },
      { point: "Muhammad as messenger", anyOf: ["gesandte", "prophet"] },
    ],
  },
];
