import type { Locale } from "@/lib/i18n";

export interface DailyHadith {
  id: number;
  source: string;
  text: Record<Locale, string>;
}

export const DAILY_HADITHS: readonly DailyHadith[] = [
  {
    id: 1,
    source: "At-Tirmidhi",
    text: {
      en: "Your smile for your brother is charity.",
      ar: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ.",
      de: "Dein Lächeln für deinen Bruder ist eine Wohltat (Sadaqa).",
    },
  },
  {
    id: 2,
    source: "Sahih al-Bukhari",
    text: {
      en: "The best among you are those who have the best manners and character.",
      ar: "إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلَاقًا.",
      de: "Die Besten unter euch sind jene mit dem besten Charakter.",
    },
  },
  {
    id: 3,
    source: "Sahih Muslim",
    text: {
      en: "Allah does not look at your appearance or wealth, but He looks at your hearts and your deeds.",
      ar: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ، وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ.",
      de: "Allah schaut nicht auf euer Äußeres oder euren Besitz, sondern auf eure Herzen und Taten.",
    },
  },
  {
    id: 4,
    source: "Sahih al-Bukhari",
    text: {
      en: "Make things easy and do not make them difficult; give glad tidings and do not drive people away.",
      ar: "يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا.",
      de: "Macht es leicht und nicht schwer; überbringt frohe Botschaft und schreckt nicht ab.",
    },
  },
  {
    id: 5,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "A good word is charity.",
      ar: "وَالْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ.",
      de: "Ein gutes Wort ist eine Wohltat.",
    },
  },
  {
    id: 6,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Whoever is not merciful to others will not be shown mercy.",
      ar: "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ.",
      de: "Wer keine Barmherzigkeit zeigt, dem wird keine Barmherzigkeit zuteil.",
    },
  },
  {
    id: 7,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "The most beloved deeds to Allah are those done consistently, even if they are small.",
      ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ.",
      de: "Die bei Allah beliebtesten Taten sind die beständigen, auch wenn sie klein sind.",
    },
  },
  {
    id: 8,
    source: "At-Tirmidhi",
    text: {
      en: "He who does not thank people does not thank Allah.",
      ar: "مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ.",
      de: "Wer den Menschen nicht dankt, dankt Allah nicht.",
    },
  },
  {
    id: 9,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "True richness is not having many possessions, but contentment of the soul.",
      ar: "لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ، وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ.",
      de: "Wahrer Reichtum liegt nicht in vielem Besitz, sondern in der Zufriedenheit der Seele.",
    },
  },
  {
    id: 10,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "The strong person is not the one who wins by force, but the one who controls himself when angry.",
      ar: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ.",
      de: "Stark ist nicht, wer andere bezwingt, sondern wer sich im Zorn beherrscht.",
    },
  },
  {
    id: 11,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "None of you truly believes until he loves for his brother what he loves for himself.",
      ar: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.",
      de: "Keiner von euch glaubt wahrhaftig, bis er seinem Bruder wünscht, was er sich selbst wünscht.",
    },
  },
  {
    id: 12,
    source: "Sahih Muslim",
    text: {
      en: "Whoever relieves a believer's hardship in this world, Allah will relieve his hardship on the Day of Resurrection.",
      ar: "مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا، نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ.",
      de: "Wer einem Gläubigen eine Sorge im Diesseits nimmt, dem nimmt Allah eine Sorge am Tag der Auferstehung.",
    },
  },
  {
    id: 13,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Every act of kindness is charity.",
      ar: "كُلُّ مَعْرُوفٍ صَدَقَةٌ.",
      de: "Jede gute Tat ist eine Wohltat.",
    },
  },
  {
    id: 14,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Allah is Gentle and loves gentleness in all matters.",
      ar: "إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ.",
      de: "Allah ist sanftmütig und liebt die Sanftmut in allen Dingen.",
    },
  },
  {
    id: 15,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
      ar: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ.",
      de: "Wer an Allah und den Jüngsten Tag glaubt, soll Gutes sprechen oder schweigen.",
    },
  },
  {
    id: 16,
    source: "Sahih Muslim",
    text: {
      en: "Do not belittle any good deed, even meeting your brother with a cheerful face.",
      ar: "لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا، وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ.",
      de: "Unterschätze keine gute Tat, sei es auch nur, deinem Bruder mit einem freundlichen Gesicht zu begegnen.",
    },
  },
  {
    id: 17,
    source: "Sahih Muslim",
    text: {
      en: "Cleanliness is half of faith.",
      ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ.",
      de: "Reinheit ist die Hälfte des Glaubens.",
    },
  },
  {
    id: 18,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Modesty brings nothing but good.",
      ar: "الْحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْرٍ.",
      de: "Schamhaftigkeit bringt nichts als Gutes.",
    },
  },
  {
    id: 19,
    source: "Sahih Muslim",
    text: {
      en: "Whoever guides someone to goodness will have a reward like the one who did it.",
      ar: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ.",
      de: "Wer jemanden zum Guten führt, erhält denselben Lohn wie derjenige, der es tut.",
    },
  },
  {
    id: 20,
    source: "Sahih Muslim",
    text: {
      en: "The closest a servant is to his Lord is while he is in prostration, so increase your supplication.",
      ar: "أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ، فَأَكْثِرُوا الدُّعَاءَ.",
      de: "Am nächsten ist der Diener seinem Herrn in der Niederwerfung; so vermehrt dort das Bittgebet.",
    },
  },
  {
    id: 21,
    source: "Sahih Muslim",
    text: {
      en: "Charity never decreases wealth.",
      ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ.",
      de: "Almosen mindert niemals den Besitz.",
    },
  },
  {
    id: 22,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "When Allah loves a servant, He calls Gabriel and says: 'I love so-and-so, so love him.'",
      ar: "إِذَا أَحَبَّ اللَّهُ عَبْدًا نَادَى جِبْرِيلَ: إِنِّي أُحِبُّ فُلَانًا فَأَحِبَّهُ.",
      de: "Wenn Allah einen Diener liebt, ruft Er Gabriel und sagt: ‚Ich liebe diesen Menschen, so liebe ihn auch.‘",
    },
  },
  {
    id: 23,
    source: "Sahih Muslim",
    text: {
      en: "Look at those who have less than you, and not at those who have more—so you appreciate Allah's blessings.",
      ar: "انْظُرُوا إِلَى مَنْ هُوَ أَسْفَلَ مِنْكُمْ، وَلَا تَنْظُرُوا إِلَى مَنْ هُوَ فَوْقَكُمْ، فَهُوَ أَجْدَرُ أَنْ لَا تَزْدَرُوا نِعْمَةَ اللَّهِ.",
      de: "Schaut auf jene, die weniger haben als ihr, und nicht auf jene über euch, damit ihr Allahs Gaben nicht geringschätzt.",
    },
  },
  {
    id: 24,
    source: "Sahih Muslim",
    text: {
      en: "Whoever treads a path seeking knowledge, Allah makes easy for him a path to Paradise.",
      ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ.",
      de: "Wer einen Weg beschreitet, um Wissen zu suchen, dem erleichtert Allah einen Weg ins Paradies.",
    },
  },
  {
    id: 25,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "Allah says: 'My mercy prevails over My wrath.'",
      ar: "إِنَّ رَحْمَتِي تَغْلِبُ غَضَبِي.",
      de: "Allah sagt: ‚Meine Barmherzigkeit überwiegt Meinen Zorn.‘",
    },
  },
  {
    id: 26,
    source: "Al-Mu'jam al-Awsat",
    text: {
      en: "The best of people are those who are most beneficial to people.",
      ar: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ.",
      de: "Die besten Menschen sind jene, die den Menschen am nützlichsten sind.",
    },
  },
  {
    id: 27,
    source: "Sahih Muslim",
    text: {
      en: "How wonderful is the believer's affair! In good times he is grateful, and in hardship he is patient—both are good for him.",
      ar: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ: إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ.",
      de: "Wunderbar ist die Lage des Gläubigen! Alles ist gut für ihn: Im Glück ist er dankbar, und in der Prüfung ist er geduldig.",
    },
  },
  {
    id: 28,
    source: "Sahih al-Bukhari",
    text: {
      en: "Feed the hungry, visit the sick, and help those in distress.",
      ar: "أَطْعِمُوا الطَّعَامَ، وَعُودُوا الْمَرِيضَ، وَفُكُّوا الْعَانِيَ.",
      de: "Speist die Hungrigen, besucht die Kranken und helft den Bedrängten.",
    },
  },
  {
    id: 29,
    source: "At-Tirmidhi",
    text: {
      en: "The best remembrance is 'La ilaha illallah', and the best supplication is 'Alhamdulillah'.",
      ar: "أَفْضَلُ الذِّكْرِ لَا إِلَهَ إِلَّا اللَّهُ، وَأَفْضَلُ الدُّعَاءِ الْحَمْدُ لِلَّهِ.",
      de: "Das beste Gedenken ist ‚La ilaha illallah‘, und das beste Bittgebet ist ‚Alhamdulillah‘.",
    },
  },
  {
    id: 30,
    source: "Al-Adab al-Mufrad",
    text: {
      en: "Exchange gifts, and you will love one another.",
      ar: "تَهَادَوْا تَحَابُّوا.",
      de: "Macht einander Geschenke, so werdet ihr einander lieben.",
    },
  },
  {
    id: 31,
    source: "Sahih al-Bukhari & Muslim",
    text: {
      en: "A true Muslim is the one from whose tongue and hand people are safe.",
      ar: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ.",
      de: "Ein wahrer Muslim ist der, vor dessen Zunge und Hand die Menschen sicher sind.",
    },
  },
  {
    id: 32,
    source: "Sahih Muslim",
    text: {
      en: "Sincere repentance wipes away what came before it.",
      ar: "التَّوْبَةُ تَهْدِمُ مَا كَانَ قَبْلَهَا.",
      de: "Aufrichtige Reue löscht das aus, was ihr vorausging.",
    },
  },
  {
    id: 33,
    source: "At-Tirmidhi",
    text: {
      en: "Supplication (Du'a) is the very essence of worship.",
      ar: "الدُّعَاءُ هُوَ الْعِبَادَةُ.",
      de: "Das Bittgebet (Du'a) ist das Wesen des Gottesdienstes.",
    },
  },
  {
    id: 34,
    source: "Abu Dawud",
    text: {
      en: "A believer is a mirror to his fellow believer.",
      ar: "الْمُؤْمِنُ مِرْآةُ الْمُؤْمِنِ.",
      de: "Der Gläubige ist der Spiegel des Gläubigen.",
    },
  },
  {
    id: 35,
    source: "Al-Hakim",
    text: {
      en: "Make the most of five before five: your youth before old age, your health before sickness, your wealth before poverty, your free time before being busy, and your life before death.",
      ar: "اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ: شَبَابَكَ قَبْلَ هَرَمِكَ، وَصِحَّتَكَ قَبْلَ سَقَمِكَ، وَغِنَاكَ قَبْلَ فَقْرِكَ، وَفَرَاغَكَ قَبْلَ شُغْلِكَ، وَحَيَاتَكَ قَبْلَ مَوْتِكَ.",
      de: "Nutze fünf Dinge vor fünf anderen: deine Jugend vor dem Alter, deine Gesundheit vor Krankheit, deinen Reichtum vor Armut, deine freie Zeit vor Beschäftigung und dein Leben vor dem Tod.",
    },
  },
];

/**
 * Returns a deterministic Hadith of the Day for the given UTC calendar day,
 * rotating through all 35 curated hadiths.
 */
export function getDailyHadith(date: Date = new Date()): DailyHadith {
  const daysSinceEpoch = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  const index = ((daysSinceEpoch % DAILY_HADITHS.length) + DAILY_HADITHS.length) % DAILY_HADITHS.length;
  return DAILY_HADITHS[index];
}
