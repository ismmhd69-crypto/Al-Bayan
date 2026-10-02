import fs from 'fs';

const batch = JSON.parse(fs.readFileSync('data/hadith-split/batch-019.json', 'utf8'));

// Define marks for batch 19 (Bukhari 1741 to 1813)
const marksData: Record<string, { start: string | null; kind: string; tail_start?: string }> = {
  // 0: bukhari:1741
  "https://sunnah.com/bukhari:1741": {
    start: "خَطَبَنَا النَّبِيُّ صلى الله عليه وسلم يَوْمَ النَّحْرِ، قَالَ ‏\"‏ أَتَدْرُونَ أَىُّ يَوْمٍ هَذَا ‏\"‏‏.‏",
    kind: "dialogue"
  },
  // 1: bukhari:1742
  "https://sunnah.com/bukhari:1742": {
    start: "قَالَ النَّبِيُّ صلى الله عليه وسلم بِمِنًى ‏\"‏ أَتَدْرُونَ أَىُّ يَوْمٍ هَذَا ‏\"‏‏.‏",
    kind: "dialogue",
    tail_start: "وَقَالَ هِشَامُ بْنُ الْغَازِ أَخْبَرَنِي نَافِعٌ"
  },
  // 2: bukhari:1743
  "https://sunnah.com/bukhari:1743": {
    start: null,
    kind: "reference_only"
  },
  // 3: bukhari:1744
  "https://sunnah.com/bukhari:1744": {
    start: null,
    kind: "reference_only"
  },
  // 4: bukhari:1745
  "https://sunnah.com/bukhari:1745": {
    start: "أَنَّ الْعَبَّاسَ ـ رضى الله عنه ـ اسْتَأْذَنَ النَّبِيَّ صلى الله عليه وسلم",
    kind: "companion_words",
    tail_start: "تَابَعَهُ أَبُو أُسَامَةَ وَعُقْبَةُ بْنُ خَالِدٍ"
  },
  // 5: bukhari:1746
  "https://sunnah.com/bukhari:1746": {
    start: "سَأَلْتُ ابْنَ عُمَرَ ـ رضى الله عنهما ـ مَتَى أَرْمِي الْجِمَارَ",
    kind: "dialogue"
  },
  // 6: bukhari:1747
  "https://sunnah.com/bukhari:1747": {
    start: "رَمَى عَبْدُ اللَّهِ مِنْ بَطْنِ الْوَادِي،",
    kind: "dialogue",
    tail_start: "وَقَالَ عَبْدُ اللَّهِ بْنُ الْوَلِيدِ حَدَّثَنَا سُفْيَانُ"
  },
  // 7: bukhari:1748
  "https://sunnah.com/bukhari:1748": {
    start: "أَنَّهُ انْتَهَى إِلَى الْجَمْرَةِ الْكُبْرَى جَعَلَ الْبَيْتَ عَنْ يَسَارِهِ،",
    kind: "companion_words"
  },
  // 8: bukhari:1749
  "https://sunnah.com/bukhari:1749": {
    start: "أَنَّهُ حَجَّ مَعَ ابْنِ مَسْعُودٍ ـ رضى الله عنه ـ فَرَآهُ يَرْمِي الْجَمْرَةَ الْكُبْرَى",
    kind: "companion_words"
  },
  // 9: bukhari:1750
  "https://sunnah.com/bukhari:1750": {
    start: "السُّورَةُ الَّتِي يُذْكَرُ فِيهَا الْبَقَرَةُ،",
    kind: "dialogue"
  },
  // 10: bukhari:1751
  "https://sunnah.com/bukhari:1751": {
    start: "أَنَّهُ كَانَ يَرْمِي الْجَمْرَةَ الدُّنْيَا بِسَبْعِ حَصَيَاتٍ،",
    kind: "companion_words"
  },
  // 11: bukhari:1752
  "https://sunnah.com/bukhari:1752": {
    start: "أَنَّ عَبْدَ اللَّهِ بْنَ عُمَرَ ـ رضى الله عنهما ـ كَانَ يَرْمِي الْجَمْرَةَ الدُّنْيَا",
    kind: "companion_words"
  },
  // 12: bukhari:1753
  "https://sunnah.com/bukhari:1753": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا رَمَى الْجَمْرَةَ الَّتِي تَلِي مَسْجِدَ مِنًى",
    kind: "narration",
    tail_start: "قَالَ الزُّهْرِيُّ سَمِعْتُ سَالِمَ بْنَ عَبْدِ اللَّهِ"
  },
  // 13: bukhari:1754
  "https://sunnah.com/bukhari:1754": {
    start: "طَيَّبْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم بِيَدَىَّ هَاتَيْنِ حِينَ أَحْرَمَ،",
    kind: "companion_words"
  },
  // 14: bukhari:1755
  "https://sunnah.com/bukhari:1755": {
    start: "أُمِرَ النَّاسُ أَنْ يَكُونَ آخِرُ عَهْدِهِمْ بِالْبَيْتِ،",
    kind: "companion_words"
  },
  // 15: bukhari:1756
  "https://sunnah.com/bukhari:1756": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم صَلَّى الظُّهْرَ وَالْعَصْرَ،",
    kind: "narration",
    tail_start: "تَابَعَهُ اللَّيْثُ حَدَّثَنِي خَالِدٌ،"
  },
  // 16: bukhari:1757
  "https://sunnah.com/bukhari:1757": {
    start: "أَنَّ صَفِيَّةَ بِنْتَ حُيَىٍّ، زَوْجَ النَّبِيِّ صلى الله عليه وسلم حَاضَتْ،",
    kind: "dialogue"
  },
  // 17: bukhari:1758
  "https://sunnah.com/bukhari:1758": {
    start: "أَنَّ أَهْلَ الْمَدِينَةِ، سَأَلُوا ابْنَ عَبَّاسٍ ـ رضى الله عنهما ـ عَنِ امْرَأَةٍ،",
    kind: "dialogue",
    tail_start: "رَوَاهُ خَالِدٌ وَقَتَادَةُ عَنْ عِكْرِمَةَ‏.‏"
  },
  // 18: bukhari:1760
  "https://sunnah.com/bukhari:1760": {
    start: "رُخِّصَ لِلْحَائِضِ أَنْ تَنْفِرَ إِذَا أَفَاضَتْ‏.‏",
    kind: "companion_words"
  },
  // 19: bukhari:1762
  "https://sunnah.com/bukhari:1762": {
    start: "خَرَجْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم وَلاَ نُرَى إِلاَّ الْحَجَّ،",
    kind: "dialogue",
    tail_start: "وَقَالَ مُسَدَّدٌ قُلْتُ لاَ‏.‏"
  },
  // 20: bukhari:1763
  "https://sunnah.com/bukhari:1763": {
    start: "سَأَلْتُ أَنَسَ بْنَ مَالِكٍ أَخْبِرْنِي بِشَىْءٍ،",
    kind: "dialogue"
  },
  // 21: bukhari:1764
  "https://sunnah.com/bukhari:1764": {
    start: "أَنَّهُ صَلَّى الظُّهْرَ وَالْعَصْرَ، وَالْمَغْرِبَ وَالْعِشَاءَ،",
    kind: "narration"
  },
  // 22: bukhari:1765
  "https://sunnah.com/bukhari:1765": {
    start: "إِنَّمَا كَانَ مَنْزِلٌ يَنْزِلُهُ النَّبِيُّ صلى الله عليه وسلم",
    kind: "companion_words"
  },
  // 23: bukhari:1766
  "https://sunnah.com/bukhari:1766": {
    start: "لَيْسَ التَّحْصِيبُ بِشَىْءٍ، إِنَّمَا هُوَ مَنْزِلٌ نَزَلَهُ رَسُولُ اللَّهِ",
    kind: "companion_words"
  },
  // 24: bukhari:1767
  "https://sunnah.com/bukhari:1767": {
    start: "أَنَّ ابْنَ عُمَرَ ـ رضى الله عنهما ـ كَانَ يَبِيتُ بِذِي طُوًى",
    kind: "companion_words"
  },
  // 25: bukhari:1768
  "https://sunnah.com/bukhari:1768": {
    start: "نَزَلَ بِهَا رَسُولُ اللَّهِ صلى الله عليه وسلم وَعُمَرُ وَابْنُ عُمَرَ‏.‏",
    kind: "companion_words"
  },
  // 26: bukhari:1769
  "https://sunnah.com/bukhari:1769": {
    start: "أَنَّهُ كَانَ إِذَا أَقْبَلَ بَاتَ بِذِي طُوًى،",
    kind: "companion_words"
  },
  // 27: bukhari:1770
  "https://sunnah.com/bukhari:1770": {
    start: "كَانَ ذُو الْمَجَازِ وَعُكَاظٌ مَتْجَرَ النَّاسِ فِي الْجَاهِلِيَّةِ،",
    kind: "companion_words"
  },
  // 28: bukhari:1771
  "https://sunnah.com/bukhari:1771": {
    start: "حَاضَتْ صَفِيَّةُ لَيْلَةَ النَّفْرِ،",
    kind: "dialogue",
    tail_start: "قَالَ أَبُو عَبْدِ اللَّهِ وَزَادَنِي مُحَمَّدٌ"
  },
  // 29: bukhari:1774
  "https://sunnah.com/bukhari:1774": {
    start: "أَنَّ عِكْرِمَةَ بْنَ خَالِدٍ، سَأَلَ ابْنَ عُمَرَ ـ رضى الله عنهما ـ عَنِ الْعُمْرَةِ،",
    kind: "dialogue",
    tail_start: "وَقَالَ إِبْرَاهِيمُ بْنُ سَعْدٍ عَنِ ابْنِ إِسْحَاقَ"
  },
  // 30: bukhari:1775
  "https://sunnah.com/bukhari:1775": {
    start: "دَخَلْتُ أَنَا وَعُرْوَةُ بْنُ الزُّبَيْرِ الْمَسْجِدَ،،",
    kind: "dialogue"
  },
  // 31: bukhari:1777
  "https://sunnah.com/bukhari:1777": {
    start: "سَأَلْتُ عَائِشَةَ ـ رضى الله عنها ـ قَالَتْ مَا اعْتَمَرَ رَسُولُ اللَّهِ",
    kind: "dialogue"
  },
  // 32: bukhari:1778
  "https://sunnah.com/bukhari:1778": {
    start: "سَأَلْتُ أَنَسًا ـ رضى الله عنه ـ كَمِ اعْتَمَرَ النَّبِيُّ صلى الله عليه وسلم",
    kind: "dialogue"
  },
  // 33: bukhari:1779
  "https://sunnah.com/bukhari:1779": {
    start: "سَأَلْتُ أَنَسًا ـ رضى الله عنه ـ فَقَالَ اعْتَمَرَ النَّبِيُّ",
    kind: "dialogue"
  },
  // 34: bukhari:1780
  "https://sunnah.com/bukhari:1780": {
    start: "اعْتَمَرَ أَرْبَعَ عُمَرٍ فِي ذِي الْقَعْدَةِ",
    kind: "companion_words"
  },
  // 35: bukhari:1781
  "https://sunnah.com/bukhari:1781": {
    start: "سَأَلْتُ مَسْرُوقًا وَعَطَاءً وَمُجَاهِدًا‏.‏ فَقَالُوا اعْتَمَرَ رَسُولُ اللَّهِ",
    kind: "companion_words"
  },
  // 36: bukhari:1782
  "https://sunnah.com/bukhari:1782": {
    start: "قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم لاِمْرَأَةٍ مِنَ الأَنْصَارِ",
    kind: "dialogue"
  },
  // 37: bukhari:1783
  "https://sunnah.com/bukhari:1783": {
    start: "خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم مُوَافِينَ لِهِلاَلِ ذِي الْحَجَّةِ",
    kind: "dialogue"
  },
  // 38: bukhari:1784
  "https://sunnah.com/bukhari:1784": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَمَرَهُ أَنْ يُرْدِفَ عَائِشَةَ،",
    kind: "narration",
    tail_start: "قَالَ سُفْيَانُ مَرَّةً سَمِعْتُ عَمْرًا،"
  },
  // 39: bukhari:1785
  "https://sunnah.com/bukhari:1785": {
    start: "أَنَّ النَّبِيَّ صلى الله عليه وسلم أَهَلَّ وَأَصْحَابُهُ بِالْحَجِّ",
    kind: "dialogue"
  },
  // 40: bukhari:1786
  "https://sunnah.com/bukhari:1786": {
    start: "قَالَتْ خَرَجْنَا مَعَ رَسُولِ اللَّهِ صلى الله عليه وسلم مُوَافِينَ لِهِلاَلِ ذِي الْحَجَّةِ،",
    kind: "dialogue"
  },
  // 41: bukhari:1788
  "https://sunnah.com/bukhari:1788": {
    start: "خَرَجْنَا مُهِلِّينَ بِالْحَجِّ فِي أَشْهُرِ الْحَجِّ،",
    kind: "dialogue"
  },
  // 42: bukhari:1790
  "https://sunnah.com/bukhari:1790": {
    start: "قُلْتُ لِعَائِشَةَ ـ رضى الله عنها ـ زَوْجِ النَّبِيِّ صلى الله عليه وسلم",
    kind: "dialogue",
    tail_start: "زَادَ سُفْيَانُ وَأَبُو مُعَاوِيَةَ عَنْ هِشَامٍ"
  },
  // 43: bukhari:1793
  "https://sunnah.com/bukhari:1793": {
    start: "سَأَلْنَا ابْنَ عُمَرَ ـ رضى الله عنهما ـ عَنْ رَجُلٍ، طَافَ بِالْبَيْتِ فِي عُمْرَةٍ،",
    kind: "dialogue"
  },
  // 44: bukhari:1795
  "https://sunnah.com/bukhari:1795": {
    start: "قَدِمْتُ عَلَى النَّبِيِّ صلى الله عليه وسلم بِالْبَطْحَاءِ وَهُوَ مُنِيخٌ",
    kind: "dialogue"
  },
  // 45: bukhari:1796
  "https://sunnah.com/bukhari:1796": {
    start: "كُلَّمَا مَرَّتْ بِالْحَجُونِ صَلَّى اللَّهُ عَلَى مُحَمَّدٍ",
    kind: "companion_words"
  },
  // 46: bukhari:1798
  "https://sunnah.com/bukhari:1798": {
    start: "لَمَّا قَدِمَ النَّبِيُّ صلى الله عليه وسلم مَكَّةَ اسْتَقْبَلَتْهُ أُغَيْلِمَةُ بَنِي عَبْدِ الْمُطَّلِبِ،",
    kind: "narration"
  },
  // 47: bukhari:1799
  "https://sunnah.com/bukhari:1799": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ إِذَا خَرَجَ إِلَى مَكَّةَ يُصَلِّي فِي مَسْجِدِ الشَّجَرَةِ،",
    kind: "narration"
  },
  // 48: bukhari:1800
  "https://sunnah.com/bukhari:1800": {
    start: "كَانَ النَّبِيُّ صلى الله عليه وسلم لاَ يَطْرُقُ أَهْلَهُ،",
    kind: "companion_words"
  },
  // 49: bukhari:1801
  "https://sunnah.com/bukhari:1801": {
    start: "نَهَى النَّبِيُّ صلى الله عليه وسلم أَنْ يَطْرُقَ أَهْلَهُ لَيْلاً‏.‏",
    kind: "companion_words"
  },
  // 50: bukhari:1802
  "https://sunnah.com/bukhari:1802": {
    start: "كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم إِذَا قَدِمَ مِنْ سَفَرٍ،",
    kind: "narration",
    tail_start: "قَالَ أَبُو عَبْدِ اللَّهِ زَادَ الْحَارِثُ بْنُ عُمَيْرٍ"
  },
  // 51: bukhari:1803
  "https://sunnah.com/bukhari:1803": {
    start: "نَزَلَتْ هَذِهِ الآيَةُ فِينَا، كَانَتِ الأَنْصَارُ إِذَا حَجُّوا",
    kind: "companion_words"
  },
  // 52: bukhari:1805
  "https://sunnah.com/bukhari:1805": {
    start: "كُنْتُ مَعَ عَبْدِ اللَّهِ بْنِ عُمَرَ ـ رضى الله عنهما ـ بِطَرِيقِ مَكَّةَ،",
    kind: "companion_words"
  },
  // 53: bukhari:1806
  "https://sunnah.com/bukhari:1806": {
    start: "حِينَ خَرَجَ إِلَى مَكَّةَ مُعْتَمِرًا فِي الْفِتْنَةِ قَالَ",
    kind: "companion_words"
  },
  // 54: bukhari:1808
  "https://sunnah.com/bukhari:1808": {
    start: null,
    kind: "reference_only"
  },
  // 55: bukhari:1809
  "https://sunnah.com/bukhari:1809": {
    start: "قَدْ أُحْصِرَ رَسُولُ اللَّهِ صلى الله عليه وسلم فَحَلَقَ رَأْسَهُ",
    kind: "companion_words"
  },
  // 56: bukhari:1810
  "https://sunnah.com/bukhari:1810": {
    start: "أَلَيْسَ حَسْبُكُمْ سُنَّةَ رَسُولِ اللَّهِ صلى الله عليه وسلم،",
    kind: "companion_words",
    tail_start: "وَعَنْ عَبْدِ اللَّهِ، أَخْبَرَنَا مَعْمَرٌ،"
  },
  // 57: bukhari:1811
  "https://sunnah.com/bukhari:1811": {
    start: "أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم نَحَرَ قَبْلَ أَنْ يَحْلِقَ،",
    kind: "narration"
  },
  // 58: bukhari:1812
  "https://sunnah.com/bukhari:1812": {
    start: "خَرَجْنَا مَعَ النَّبِيِّ صلى الله عليه وسلم مُعْتَمِرِينَ،",
    kind: "companion_words"
  },
  // 59: bukhari:1813
  "https://sunnah.com/bukhari:1813": {
    start: "حِينَ خَرَجَ إِلَى مَكَّةَ مُعْتَمِرًا فِي الْفِتْنَةِ إِنْ صُدِدْتُ",
    kind: "companion_words"
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

fs.writeFileSync('data/hadith-split/marks-019.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Successfully wrote data/hadith-split/marks-019.json with ' + results.length + ' marks.');
