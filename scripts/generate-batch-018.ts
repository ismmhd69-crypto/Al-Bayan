import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-018.json', 'utf8'));

// Define marks for batch 18 (Bukhari 1668 to 1740)
const marksData: Record<string, { start: string | null; kind: string; tail_start?: string }> = {
  // 0: bukhari:1668
  "https://sunnah.com/bukhari:1668": {
    start: "كَانَ عَبْدُ اللَّهِ بْنُ عُمَرَ ـ رضى الله عنهما ـ يَجْمَعُ",
    kind: "companion_words"
  },
  // 1: bukhari:1673
  "https://sunnah.com/bukhari:1673": {
    start: "جَمَعَ النَّبِيُّ صلى الله عليه وسلم بَيْنَ الْمَغْرِبِ وَالْعِشَاءِ",
    kind: "companion_words"
  },
  // 2: bukhari:1674
  "https://sunnah.com/bukhari:1674": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم جَمَعَ فِي حَجَّةِ الْوَدَاعِ",
    kind: "companion_words"
  },
  // 3: bukhari:1675
  "https://sunnah.com/bukhari:1675": {
    start: "حَجَّ عَبْدُ اللَّهِ ـ رضى الله عنه ـ فَأَتَيْنَا الْمُزْدَلِفَةَ",
    kind: "companion_words"
  },
  // 4: bukhari:1676
  "https://sunnah.com/bukhari:1676": {
    start: "وَكَانَ عَبْدُ اللَّهِ بْنُ عُمَرَ ـ رضى الله عنهما ـ يُقَدِّمُ ضَعَفَةَ أَهْلِهِ،",
    kind: "companion_words"
  },
  // 5: bukhari:1677
  "https://sunnah.com/bukhari:1677": {
    start: "بَعَثَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم مِنْ جَمْعٍ بِلَيْلٍ‏.‏",
    kind: "companion_words"
  },
  // 6: bukhari:1678
  "https://sunnah.com/bukhari:1678": {
    start: "أَنَا مِمَّنْ، قَدَّمَ النَّبِيُّ صلى الله عليه وسلم لَيْلَةَ الْمُزْدَلِفَةِ",
    kind: "companion_words"
  },
  // 7: bukhari:1679
  "https://sunnah.com/bukhari:1679": {
    start: "أَنَّهَا نَزَلَتْ لَيْلَةَ جَمْعٍ عِنْدَ الْمُزْدَلِفَةِ،",
    kind: "dialogue"
  },
  // 8: bukhari:1680
  "https://sunnah.com/bukhari:1680": {
    start: "اسْتَأْذَنَتْ سَوْدَةُ النَّبِيَّ صلى الله عليه وسلم لَيْلَةَ جَمْعٍ",
    kind: "companion_words"
  },
  // 9: bukhari:1681
  "https://sunnah.com/bukhari:1681": {
    start: "نَزَلْنَا الْمُزْدَلِفَةَ فَاسْتَأْذَنَتِ النَّبِيَّ صلى الله عليه وسلم سَوْدَةُ",
    kind: "companion_words"
  },
  // 10: bukhari:1682
  "https://sunnah.com/bukhari:1682": {
    start: "مَا رَأَيْتُ النَّبِيَّ صلى الله عليه وسلم صَلَّى صَلاَةً بِغَيْرِ مِيقَاتِهَا",
    kind: "companion_words"
  },
  // 11: bukhari:1684
  "https://sunnah.com/bukhari:1684": {
    start: "شَهِدْتُ عُمَرَ ـ رضى الله عنه ـ صَلَّى بِجَمْعٍ الصُّبْحَ،",
    kind: "companion_words"
  },
  // 12: bukhari:1685
  "https://sunnah.com/bukhari:1685": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَرْدَفَ الْفَضْلَ،",
    kind: "companion_words"
  },
  // 13: bukhari:1686
  "https://sunnah.com/bukhari:1686": {
    start: "أَنَّ أُسَامَةَ بْنَ زَيْدٍ ـ رضى الله عنهما ـ كَانَ رِدْفَ النَّبِيِّ",
    kind: "companion_words"
  },
  // 14: bukhari:1688
  "https://sunnah.com/bukhari:1688": {
    start: "سَأَلْتُ ابْنَ عَبَّاسٍ ـ رضى الله عنهما ـ عَنِ الْمُتْعَةِ،",
    kind: "dialogue",
    tail_start: "قَالَ وَقَالَ آدَمُ وَوَهْبُ بْنُ جَرِيرٍ"
  },
  // 15: bukhari:1689
  "https://sunnah.com/bukhari:1689": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم رَأَى رَجُلاً يَسُوقُ بَدَنَةً فَقَالَ",
    kind: "dialogue"
  },
  // 16: bukhari:1690
  "https://sunnah.com/bukhari:1690": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم رَأَى رَجُلاً يَسُوقُ بَدَنَةً، فَقَالَ",
    kind: "dialogue"
  },
  // 17: bukhari:1692
  "https://sunnah.com/bukhari:1692": {
    start: null,
    kind: "reference_only"
  },
  // 18: bukhari:1693
  "https://sunnah.com/bukhari:1693": {
    start: "قَالَ عَبْدُ اللَّهِ بْنُ عَبْدِ اللَّهِ بْنِ عُمَرَ ـ رضى الله عنهم ـ لأَبِيهِ",
    kind: "dialogue"
  },
  // 19: bukhari:1694
  "https://sunnah.com/bukhari:1694": {
    start: "خَرَجَ النَّبِيُّ صلى الله عليه وسلم مِنَ الْمَدِينَةِ زَمَنَ الْحُدَيْبِيَةِ",
    kind: "narration"
  },
  // 20: bukhari:1696
  "https://sunnah.com/bukhari:1696": {
    start: "فَتَلْتُ قَلاَئِدَ بُدْنِ النَّبِيِّ صلى الله عليه وسلم بِيَدَىَّ،",
    kind: "companion_words"
  },
  // 21: bukhari:1698
  "https://sunnah.com/bukhari:1698": {
    start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يُهْدِي مِنَ الْمَدِينَةِ،",
    kind: "companion_words"
  },
  // 22: bukhari:1699
  "https://sunnah.com/bukhari:1699": {
    start: "فَتَلْتُ قَلاَئِدَ هَدْىِ النَّبِيِّ صلى الله عليه وسلم ثُمَّ أَشْعَرَهَا",
    kind: "companion_words"
  },
  // 23: bukhari:1700
  "https://sunnah.com/bukhari:1700": {
    start: "إِنَّ عَبْدَ اللَّهِ بْنَ عَبَّاسٍ ـ رضى الله عنهما ـ قَالَ مَنْ أَهْدَى هَدْيًا",
    kind: "dialogue"
  },
  // 24: bukhari:1701
  "https://sunnah.com/bukhari:1701": {
    start: "أَهْدَى النَّبِيُّ صلى الله عليه وسلم مَرَّةً غَنَمًا‏.‏",
    kind: "companion_words"
  },
  // 25: bukhari:1702
  "https://sunnah.com/bukhari:1702": {
    start: "كُنْتُ أَفْتِلُ الْقَلاَئِدَ لِلنَّبِيِّ صلى الله عليه وسلم",
    kind: "companion_words"
  },
  // 26: bukhari:1703
  "https://sunnah.com/bukhari:1703": {
    start: "كُنْتُ أَفْتِلُ قَلاَئِدَ الْغَنَمِ لِلنَّبِيِّ صلى الله عليه وسلم",
    kind: "companion_words"
  },
  // 27: bukhari:1704
  "https://sunnah.com/bukhari:1704": {
    start: "فَتَلْتُ لِهَدْىِ النَّبِيِّ صلى الله عليه وسلم",
    kind: "companion_words"
  },
  // 28: bukhari:1705
  "https://sunnah.com/bukhari:1705": {
    start: "فَتَلْتُ قَلاَئِدَهَا مِنْ عِهْنٍ كَانَ عِنْدِي‏.‏",
    kind: "companion_words"
  },
  // 29: bukhari:1706
  "https://sunnah.com/bukhari:1706": {
    start: "أَنَّ نَبِيَّ اللَّهِ صلى الله عليه وسلم رَأَى رَجُلاً يَسُوقُ بَدَنَةً،",
    kind: "dialogue",
    tail_start: "تَابَعَهُ مُحَمَّدُ بْنُ بَشَّارٍ"
  },
  // 30: bukhari:1707
  "https://sunnah.com/bukhari:1707": {
    start: "أَمَرَنِي رَسُولُ اللَّهِ صلى الله عليه وسلم أَنْ أَتَصَدَّقَ بِجِلاَلِ الْبُدْنِ",
    kind: "companion_words"
  },
  // 31: bukhari:1708
  "https://sunnah.com/bukhari:1708": {
    start: "أَرَادَ ابْنُ عُمَرَ ـ رضى الله عنهما ـ الْحَجَّ عَامَ حَجَّةِ الْحَرُورِيَّةِ",
    kind: "dialogue"
  },
  // 32: bukhari:1709
  "https://sunnah.com/bukhari:1709": {
    start: "خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم لِخَمْسٍ بَقِينَ مِنْ ذِي الْقَعْدَةِ،",
    kind: "dialogue",
    tail_start: "قَالَ يَحْيَى فَذَكَرْتُهُ لِلْقَاسِمِ،"
  },
  // 33: bukhari:1710
  "https://sunnah.com/bukhari:1710": {
    start: "أَنَّ عَبْدَ اللَّهِ ـ رضى الله عنه ـ كَانَ يَنْحَرُ فِي الْمَنْحَرِ‏.‏",
    kind: "companion_words"
  },
  // 34: bukhari:1711
  "https://sunnah.com/bukhari:1711": {
    start: "أَنَّ ابْنَ عُمَرَ ـ رضى الله عنهما ـ كَانَ يَبْعَثُ بِهَدْيِهِ",
    kind: "companion_words"
  },
  // 35: bukhari:1712
  "https://sunnah.com/bukhari:1712": {
    start: "وَنَحَرَ النَّبِيُّ صلى الله عليه وسلم بِيَدِهِ سَبْعَ بُدْنٍ قِيَامًا،",
    kind: "companion_words"
  },
  // 36: bukhari:1713
  "https://sunnah.com/bukhari:1713": {
    start: "أَتَى عَلَى رَجُلٍ، قَدْ أَنَاخَ بَدَنَتَهُ يَنْحَرُهَا،",
    kind: "dialogue",
    tail_start: "وَقَالَ شُعْبَةُ عَنْ يُونُسَ"
  },
  // 37: bukhari:1714
  "https://sunnah.com/bukhari:1714": {
    start: "صَلَّى النَّبِيُّ صلى الله عليه وسلم الظُّهْرَ بِالْمَدِينَةِ أَرْبَعًا،",
    kind: "companion_words"
  },
  // 38: bukhari:1715
  "https://sunnah.com/bukhari:1715": {
    start: "صَلَّى النَّبِيُّ صلى الله عليه وسلم الظُّهْرَ بِالْمَدِينَةِ أَرْبَعًا، وَالْعَصْرَ بِذِي الْحُلَيْفَةِ رَكْعَتَيْنِ‏.‏",
    kind: "companion_words"
  },
  // 39: bukhari:1716
  "https://sunnah.com/bukhari:1716": {
    start: "بَعَثَنِي النَّبِيُّ صلى الله عليه وسلم فَقُمْتُ عَلَى الْبُدْنِ،",
    kind: "companion_words",
    tail_start: "قَالَ سُفْيَانُ وَحَدَّثَنِي عَبْدُ الْكَرِيمِ،"
  },
  // 40: bukhari:1717
  "https://sunnah.com/bukhari:1717": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَمَرَهُ أَنْ يَقُومَ عَلَى بُدْنِهِ،",
    kind: "companion_words"
  },
  // 41: bukhari:1718
  "https://sunnah.com/bukhari:1718": {
    start: "أَهْدَى النَّبِيُّ صلى الله عليه وسلم مِائَةَ بَدَنَةٍ،",
    kind: "companion_words"
  },
  // 42: bukhari:1720
  "https://sunnah.com/bukhari:1720": {
    start: "خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم لِخَمْسٍ بَقِينَ مِنْ ذِي الْقَعْدَةِ،",
    kind: "dialogue",
    tail_start: "قَالَ يَحْيَى فَذَكَرْتُ هَذَا الْحَدِيثَ لِلْقَاسِمِ‏.‏"
  },
  // 43: bukhari:1721
  "https://sunnah.com/bukhari:1721": {
    start: "سُئِلَ النَّبِيُّ صلى الله عليه وسلم عَمَّنْ حَلَقَ قَبْلَ أَنْ يَذْبَحَ وَنَحْوِهِ‏.‏",
    kind: "dialogue"
  },
  // 44: bukhari:1722
  "https://sunnah.com/bukhari:1722": {
    start: "قَالَ رَجُلٌ لِلنَّبِيِّ صلى الله عليه وسلم زُرْتُ قَبْلَ أَنْ أَرْمِيَ‏.‏",
    kind: "dialogue",
    tail_start: "وَقَالَ عَبْدُ الرَّحِيمِ الرَّازِيُّ عَنِ ابْنِ خُثَيْمٍ"
  },
  // 45: bukhari:1723
  "https://sunnah.com/bukhari:1723": {
    start: "سُئِلَ النَّبِيُّ صلى الله عليه وسلم فَقَالَ رَمَيْتُ بَعْدَ مَا أَمْسَيْتُ‏.‏",
    kind: "dialogue"
  },
  // 46: bukhari:1724
  "https://sunnah.com/bukhari:1724": {
    start: "قَدِمْتُ عَلَى رَسُولِ اللَّهِ صلى الله عليه وسلم وَهُوَ بِالْبَطْحَاءِ‏.‏",
    kind: "dialogue"
  },
  // 47: bukhari:1726
  "https://sunnah.com/bukhari:1726": {
    start: "حَلَقَ رَسُولُ اللَّهِ صلى الله عليه وسلم فِي حَجَّتِهِ‏.‏",
    kind: "companion_words"
  },
  // 48: bukhari:1727
  "https://sunnah.com/bukhari:1727": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏\"‏ اللَّهُمَّ ارْحَمِ الْمُحَلِّقِينَ ‏\"‏‏.‏",
    kind: "prophet_statement",
    tail_start: "وَقَالَ اللَّيْثُ حَدَّثَنِي نَافِعٌ"
  },
  // 49: bukhari:1728
  "https://sunnah.com/bukhari:1728": {
    start: "قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏\"‏ اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ ‏\"‏‏.‏",
    kind: "prophet_statement"
  },
  // 50: bukhari:1729
  "https://sunnah.com/bukhari:1729": {
    start: "حَلَقَ النَّبِيُّ صلى الله عليه وسلم وَطَائِفَةٌ مِنْ أَصْحَابِهِ،",
    kind: "companion_words"
  },
  // 51: bukhari:1730
  "https://sunnah.com/bukhari:1730": {
    start: "قَصَّرْتُ عَنْ رَسُولِ اللَّهِ صلى الله عليه وسلم بِمِشْقَصٍ‏.‏",
    kind: "companion_words"
  },
  // 52: bukhari:1731
  "https://sunnah.com/bukhari:1731": {
    start: "لَمَّا قَدِمَ النَّبِيُّ صلى الله عليه وسلم مَكَّةَ أَمَرَ أَصْحَابَهُ",
    kind: "companion_words"
  },
  // 53: bukhari:1732
  "https://sunnah.com/bukhari:1732": {
    start: "أَنَّهُ طَافَ طَوَافًا وَاحِدًا،",
    kind: "companion_words",
    tail_start: "وَرَفَعَهُ عَبْدُ الرَّزَّاقِ أَخْبَرَنَا عُبَيْدُ اللَّهِ‏.‏"
  },
  // 54: bukhari:1733
  "https://sunnah.com/bukhari:1733": {
    start: "حَجَجْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم فَأَفَضْنَا يَوْمَ النَّحْرِ،",
    kind: "dialogue",
    tail_start: "وَيُذْكَرُ عَنِ الْقَاسِمِ وَعُرْوَةَ وَالأَسْوَدِ"
  },
  // 55: bukhari:1735
  "https://sunnah.com/bukhari:1735": {
    start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُسْأَلُ يَوْمَ النَّحْرِ بِمِنًى،",
    kind: "dialogue"
  },
  // 56: bukhari:1736
  "https://sunnah.com/bukhari:1736": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم وَقَفَ فِي حَجَّةِ الْوَدَاعِ،",
    kind: "dialogue"
  },
  // 57: bukhari:1738
  "https://sunnah.com/bukhari:1738": {
    start: null,
    kind: "reference_only"
  },
  // 58: bukhari:1739
  "https://sunnah.com/bukhari:1739": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم خَطَبَ النَّاسَ يَوْمَ النَّحْرِ فَقَالَ",
    kind: "prophet_statement"
  },
  // 59: bukhari:1740
  "https://sunnah.com/bukhari:1740": {
    start: "سَمِعْتُ النَّبِيَّ صلى الله عليه وسلم يَخْطُبُ بِعَرَفَاتٍ‏.‏",
    kind: "companion_words",
    tail_start: "تَابَعَهُ ابْنُ عُيَيْنَةَ عَنْ عَمْرٍو‏.‏"
  }
};

const results = batch.map((item: any) => {
  const mark = marksData[item.url];
  if (!mark) {
    throw new Error(`Missing mark for ${item.url}`);
  }
  return {
    id: item.id,
    url: item.url,
    start: mark.start,
    kind: mark.kind,
    ...(mark.tail_start ? { tail_start: mark.tail_start } : {})
  };
});

fs.writeFileSync('data/hadith-split/marks-018.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Successfully wrote data/hadith-split/marks-018.json with ' + results.length + ' marks.');
