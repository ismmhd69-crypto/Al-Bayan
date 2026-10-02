import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-020.json', 'utf8'));

// Define marks for batch 20 (Bukhari 1814 to 1959)
const marksData: Record<string, { start: string | null; kind: string; tail_start?: string }> = {
  // 0: bukhari:1814
  "https://sunnah.com/bukhari:1814": {
    start: "أَنَّهُ قَالَ ‏\"‏ لَعَلَّكَ آذَاكَ هَوَامُّكَ ‏\"‏‏.‏",
    kind: "dialogue"
  },
  // 1: bukhari:1815
  "https://sunnah.com/bukhari:1815": {
    start: "وَقَفَ عَلَىَّ رَسُولُ اللَّهِ صلى الله عليه وسلم بِالْحُدَيْبِيَةِ،",
    kind: "dialogue"
  },
  // 2: bukhari:1816
  "https://sunnah.com/bukhari:1816": {
    start: "جَلَسْتُ إِلَى كَعْبِ بْنِ عُجْرَةَ ـ رضى الله عنه ـ فَسَأَلْتُهُ عَنِ الْفِدْيَةِ،",
    kind: "dialogue"
  },
  // 3: bukhari:1818
  "https://sunnah.com/bukhari:1818": {
    start: null,
    kind: "reference_only"
  },
  // 4: bukhari:1824
  "https://sunnah.com/bukhari:1824": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم خَرَجَ حَاجًّا،",
    kind: "dialogue"
  },
  // 5: bukhari:1830
  "https://sunnah.com/bukhari:1830": {
    start: "بَيْنَمَا نَحْنُ مَعَ النَّبِيِّ صلى الله عليه وسلم فِي غَارٍ بِمِنًى،",
    kind: "companion_words"
  },
  // 6: bukhari:1833
  "https://sunnah.com/bukhari:1833": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ ‏\"‏ إِنَّ اللَّهَ حَرَّمَ مَكَّةَ،",
    kind: "prophet_statement",
    tail_start: "وَعَنْ خَالِدٍ عَنْ عِكْرِمَةَ قَالَ"
  },
  // 7: bukhari:1834
  "https://sunnah.com/bukhari:1834": {
    start: "قَالَ قَالَ النَّبِيُّ صلى الله عليه وسلم يَوْمَ افْتَتَحَ مَكَّةَ ‏\"‏ لاَ هِجْرَةَ",
    kind: "dialogue"
  },
  // 8: bukhari:1835
  "https://sunnah.com/bukhari:1835": {
    start: "احْتَجَمَ رَسُولُ اللَّهِ صلى الله عليه وسلم وَهُوَ مُحْرِمٌ‏.‏",
    kind: "companion_words",
    tail_start: "ثُمَّ سَمِعْتُهُ يَقُولُ حَدَّثَنِي طَاوُسٌ"
  },
  // 9: bukhari:1836
  "https://sunnah.com/bukhari:1836": {
    start: "احْتَجَمَ النَّبِيُّ صلى الله عليه وسلم وَهْوَ مُحْرِمٌ بِلَحْىِ جَمَلٍ",
    kind: "companion_words"
  },
  // 10: bukhari:1837
  "https://sunnah.com/bukhari:1837": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم تَزَوَّجَ مَيْمُونَةَ وَهُوَ مُحْرِمٌ‏.‏",
    kind: "companion_words"
  },
  // 11: bukhari:1840
  "https://sunnah.com/bukhari:1840": {
    start: "أَنَّ عَبْدَ اللَّهِ بْنَ الْعَبَّاسِ، وَالْمِسْوَرَ بْنَ مَخْرَمَةَ، اخْتَلَفَا بِالأَبْوَاءِ،",
    kind: "dialogue"
  },
  // 12: bukhari:1844
  "https://sunnah.com/bukhari:1844": {
    start: "اعْتَمَرَ النَّبِيُّ صلى الله عليه وسلم فِي ذِي الْقَعْدَةِ،",
    kind: "narration"
  },
  // 13: bukhari:1845
  "https://sunnah.com/bukhari:1845": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم وَقَّتَ لأَهْلِ الْمَدِينَةِ ذَا الْحُلَيْفَةِ،",
    kind: "narration"
  },
  // 14: bukhari:1848
  "https://sunnah.com/bukhari:1848": {
    start: null,
    kind: "reference_only"
  },
  // 15: bukhari:1853
  "https://sunnah.com/bukhari:1853": {
    start: null,
    kind: "reference_only"
  },
  // 16: bukhari:1856
  "https://sunnah.com/bukhari:1856": {
    start: "بَعَثَنِي ـ أَوْ قَدَّمَنِي ـ النَّبِيُّ صلى الله عليه وسلم فِي الثَّقَلِ",
    kind: "companion_words"
  },
  // 17: bukhari:1857
  "https://sunnah.com/bukhari:1857": {
    start: "أَقْبَلْتُ وَقَدْ نَاهَزْتُ الْحُلُمَ، أَسِيرُ عَلَى أَتَانٍ لِي،",
    kind: "companion_words",
    tail_start: "وَقَالَ يُونُسُ عَنِ ابْنِ شِهَابٍ"
  },
  // 18: bukhari:1858
  "https://sunnah.com/bukhari:1858": {
    start: "حُجَّ بِي مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم وَأَنَا ابْنُ سَبْعِ سِنِينَ‏.‏",
    kind: "companion_words"
  },
  // 19: bukhari:1859
  "https://sunnah.com/bukhari:1859": {
    start: "يَقُولُ لِلسَّائِبِ بْنِ يَزِيدَ، وَكَانَ قَدْ حُجَّ بِهِ فِي ثَقَلِ النَّبِيِّ",
    kind: "companion_words"
  },
  // 20: bukhari:1860
  "https://sunnah.com/bukhari:1860": {
    start: "أَذِنَ عُمَرُ ـ رضى الله عنه ـ لأَزْوَاجِ النَّبِيِّ صلى الله عليه وسلم",
    kind: "companion_words"
  },
  // 21: bukhari:1862
  "https://sunnah.com/bukhari:1862": {
    start: "قَالَ قَالَ النَّبِيُّ صلى الله عليه وسلم ‏\"‏ لاَ تُسَافِرِ الْمَرْأَةُ إِلاَّ مَعَ ذِي مَحْرَمٍ،",
    kind: "dialogue"
  },
  // 22: bukhari:1863
  "https://sunnah.com/bukhari:1863": {
    start: "لَمَّا رَجَعَ النَّبِيُّ صلى الله عليه وسلم مِنْ حَجَّتِهِ قَالَ لأُمِّ سِنَانٍ",
    kind: "dialogue",
    tail_start: "رَوَاهُ ابْنُ جُرَيْجٍ عَنْ عَطَاءٍ"
  },
  // 23: bukhari:1865
  "https://sunnah.com/bukhari:1865": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم رَأَى شَيْخًا يُهَادَى بَيْنَ ابْنَيْهِ",
    kind: "dialogue"
  },
  // 24: bukhari:1869
  "https://sunnah.com/bukhari:1869": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم قَالَ ‏\"‏ حُرِّمَ مَا بَيْنَ لاَبَتَىِ الْمَدِينَةِ عَلَى لِسَانِي ‏\"‏‏.‏",
    kind: "prophet_statement"
  },
  // 25: bukhari:1870
  "https://sunnah.com/bukhari:1870": {
    start: "مَا عِنْدَنَا شَىْءٌ إِلاَّ كِتَابُ اللَّهِ، وَهَذِهِ الصَّحِيفَةُ",
    kind: "dialogue"
  },
  // 26: bukhari:1886
  "https://sunnah.com/bukhari:1886": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ إِذَا قَدِمَ مِنْ سَفَرٍ، فَنَظَرَ إِلَى جُدُرَاتِ الْمَدِينَةِ",
    kind: "narration"
  },
  // 27: bukhari:1890
  "https://sunnah.com/bukhari:1890": {
    start: "قَالَ اللَّهُمَّ ارْزُقْنِي شَهَادَةً فِي سَبِيلِكَ،",
    kind: "companion_words",
    tail_start: "وَقَالَ ابْنُ زُرَيْعٍ عَنْ رَوْحِ بْنِ الْقَاسِمِ،"
  },
  // 28: bukhari:1891
  "https://sunnah.com/bukhari:1891": {
    start: "أَنَّ أَعْرَابِيًّا، جَاءَ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم ثَائِرَ الرَّأْسِ",
    kind: "dialogue"
  },
  // 29: bukhari:1892
  "https://sunnah.com/bukhari:1892": {
    start: "صَامَ النَّبِيُّ صلى الله عليه وسلم عَاشُورَاءَ، وَأَمَرَ بِصِيَامِهِ‏.‏",
    kind: "companion_words"
  },
  // 30: bukhari:1897
  "https://sunnah.com/bukhari:1897": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏\"‏ مَنْ أَنْفَقَ زَوْجَيْنِ فِي سَبِيلِ اللَّهِ",
    kind: "dialogue"
  },
  // 31: bukhari:1902
  "https://sunnah.com/bukhari:1902": {
    start: "كَانَ النَّبِيُّ صلى الله عليه وسلم أَجْوَدَ النَّاسِ بِالْخَيْرِ،",
    kind: "companion_words"
  },
  // 32: bukhari:1915
  "https://sunnah.com/bukhari:1915": {
    start: "كَانَ أَصْحَابُ مُحَمَّدٍ صلى الله عليه وسلم إِذَا كَانَ الرَّجُلُ صَائِمًا،",
    kind: "companion_words"
  },
  // 33: bukhari:1917
  "https://sunnah.com/bukhari:1917": {
    start: "قَالَ أُنْزِلَتْ ‏[quran sura=\"2\" aya_start=\"187\" aya_end=\"187\"] {‏وَكُلُوا وَاشْرَبُوا حَتَّى يَتَبَيَّنَ لَكُمُ الْخَيْطُ الأَبْيَضُ مِنَ الْخَيْطِ الأَسْوَدِ‏} ‏ وَلَمْ يَنْزِلْ مِنَ الْفَجْرِ،",
    kind: "companion_words"
  },
  // 34: bukhari:1920
  "https://sunnah.com/bukhari:1920": {
    start: "كُنْتُ أَتَسَحَّرُ فِي أَهْلِي، ثُمَّ تَكُونُ سُرْعَتِي أَنْ أُدْرِكَ السُّجُودَ",
    kind: "companion_words"
  },
  // 35: bukhari:1921
  "https://sunnah.com/bukhari:1921": {
    start: "تَسَحَّرْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم ثُمَّ قَامَ إِلَى الصَّلاَةِ‏.‏",
    kind: "dialogue"
  },
  // 36: bukhari:1925
  "https://sunnah.com/bukhari:1925": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يُدْرِكُهُ الْفَجْرُ وَهُوَ جُنُبٌ مِنْ أَهْلِهِ،",
    kind: "dialogue",
    tail_start: "وَقَالَ هَمَّامٌ وَابْنُ عَبْدِ اللَّهِ بْنِ عُمَرَ"
  },
  // 37: bukhari:1927
  "https://sunnah.com/bukhari:1927": {
    start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُقَبِّلُ وَيُبَاشِرُ، وَهُوَ صَائِمٌ،",
    kind: "companion_words",
    tail_start: "وَقَالَ قَالَ ابْنُ عَبَّاسٍ"
  },
  // 38: bukhari:1928
  "https://sunnah.com/bukhari:1928": {
    start: "إِنْ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَيُقَبِّلُ بَعْضَ أَزْوَاجِهِ وَهُوَ صَائِمٌ‏.‏",
    kind: "companion_words"
  },
  // 39: bukhari:1930
  "https://sunnah.com/bukhari:1930": {
    start: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُدْرِكُهُ الْفَجْرُ ‏{‏جُنُبًا‏}‏ فِي رَمَضَانَ،",
    kind: "companion_words"
  },
  // 40: bukhari:1931
  "https://sunnah.com/bukhari:1931": {
    start: "أَشْهَدُ عَلَى رَسُولِ اللَّهِ صلى الله عليه وسلم إِنْ كَانَ لَيُصْبِحُ جُنُبًا",
    kind: "companion_words"
  },
  // 41: bukhari:1935
  "https://sunnah.com/bukhari:1935": {
    start: "إِنَّ رَجُلاً أَتَى النَّبِيَّ صلى الله عليه وسلم فَقَالَ إِنَّهُ احْتَرَقَ‏.‏",
    kind: "dialogue"
  },
  // 42: bukhari:1936
  "https://sunnah.com/bukhari:1936": {
    start: "بَيْنَمَا نَحْنُ جُلُوسٌ عِنْدَ النَّبِيِّ صلى الله عليه وسلم إِذْ جَاءَهُ رَجُلٌ،",
    kind: "dialogue"
  },
  // 43: bukhari:1937
  "https://sunnah.com/bukhari:1937": {
    start: "جَاءَ رَجُلٌ إِلَى النَّبِيِّ صلى الله عليه وسلم فَقَالَ إِنَّ الأَخِرَ وَقَعَ عَلَى امْرَأَتِهِ",
    kind: "dialogue"
  },
  // 44: bukhari:1938
  "https://sunnah.com/bukhari:1938": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم احْتَجَمَ، وَهْوَ مُحْرِمٌ وَاحْتَجَمَ وَهْوَ صَائِمٌ‏.‏",
    kind: "companion_words"
  },
  // 45: bukhari:1939
  "https://sunnah.com/bukhari:1939": {
    start: "احْتَجَمَ النَّبِيُّ صلى الله عليه وسلم وَهُوَ صَائِمٌ‏.‏",
    kind: "companion_words"
  },
  // 46: bukhari:1940
  "https://sunnah.com/bukhari:1940": {
    start: "أَكُنْتُمْ تَكْرَهُونَ الْحِجَامَةَ لِلصَّائِمِ قَالَ لاَ‏.‏",
    kind: "dialogue",
    tail_start: "وَزَادَ شَبَابَةُ حَدَّثَنَا شُعْبَةُ"
  },
  // 47: bukhari:1941
  "https://sunnah.com/bukhari:1941": {
    start: "كُنَّا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم فِي سَفَرٍ فَقَالَ لِرَجُلٍ ‏\"‏ انْزِلْ فَاجْدَحْ لِي ‏\"‏‏.‏",
    kind: "dialogue",
    tail_start: "تَابَعَهُ جَرِيرٌ وَأَبُو بَكْرِ بْنُ عَيَّاشٍ"
  },
  // 48: bukhari:1942
  "https://sunnah.com/bukhari:1942": {
    start: "يَا رَسُولَ اللَّهِ إِنِّي أَسْرُدُ الصَّوْمَ‏.‏",
    kind: "companion_words"
  },
  // 49: bukhari:1944
  "https://sunnah.com/bukhari:1944": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم خَرَجَ إِلَى مَكَّةَ فِي رَمَضَانَ",
    kind: "narration",
    tail_start: "قَالَ أَبُو عَبْدِ اللَّهِ وَالْكَدِيدُ مَاءٌ"
  },
  // 50: bukhari:1945
  "https://sunnah.com/bukhari:1945": {
    start: "خَرَجْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم فِي بَعْضِ أَسْفَارِهِ فِي يَوْمٍ حَارٍّ",
    kind: "companion_words"
  },
  // 51: bukhari:1946
  "https://sunnah.com/bukhari:1946": {
    start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم فِي سَفَرٍ، فَرَأَى زِحَامًا،",
    kind: "dialogue"
  },
  // 52: bukhari:1947
  "https://sunnah.com/bukhari:1947": {
    start: "كُنَّا نُسَافِرُ مَعَ النَّبِيِّ صلى الله عليه وسلم فَلَمْ يَعِبِ الصَّائِمُ عَلَى الْمُفْطِرِ،",
    kind: "companion_words"
  },
  // 53: bukhari:1948
  "https://sunnah.com/bukhari:1948": {
    start: "خَرَجَ رَسُولُ اللَّهِ صلى الله عليه وسلم مِنَ الْمَدِينَةِ إِلَى مَكَّةَ،",
    kind: "companion_words"
  },
  // 54: bukhari:1949
  "https://sunnah.com/bukhari:1949": {
    start: "قَرَأَ فِدْيَةٌ طَعَامُ مَسَاكِينَ‏.‏ قَالَ هِيَ مَنْسُوخَةٌ‏.‏",
    kind: "companion_words"
  },
  // 55: bukhari:1950
  "https://sunnah.com/bukhari:1950": {
    start: "كَانَ يَكُونُ عَلَىَّ الصَّوْمُ مِنْ رَمَضَانَ،",
    kind: "companion_words",
    tail_start: "قَالَ يَحْيَى الشُّغْلُ مِنَ النَّبِيِّ"
  },
  // 56: bukhari:1955
  "https://sunnah.com/bukhari:1955": {
    start: "كُنَّا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم فِي سَفَرٍ، وَهُوَ صَائِمٌ،",
    kind: "dialogue"
  },
  // 57: bukhari:1956
  "https://sunnah.com/bukhari:1956": {
    start: "سِرْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم وَهْوَ صَائِمٌ،",
    kind: "dialogue"
  },
  // 58: bukhari:1958
  "https://sunnah.com/bukhari:1958": {
    start: "كُنْتُ مَعَ النَّبِيِّ صلى الله عليه وسلم فِي سَفَرٍ، فَصَامَ حَتَّى أَمْسَى،",
    kind: "dialogue"
  },
  // 59: bukhari:1959
  "https://sunnah.com/bukhari:1959": {
    start: "أَفْطَرْنَا عَلَى عَهْدِ النَّبِيِّ صلى الله عليه وسلم يَوْمَ غَيْمٍ،",
    kind: "companion_words",
    tail_start: "قِيلَ لِهِشَامٍ فَأُمِرُوا بِالْقَضَاءِ"
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

fs.writeFileSync('data/hadith-split/marks-020.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Successfully wrote data/hadith-split/marks-020.json with ' + results.length + ' marks.');
