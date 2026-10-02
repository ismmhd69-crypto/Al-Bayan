import fs from "node:fs";
type Kind="prophet_words"|"narration"|"companion_words"|"dialogue"|"reference_only"|"unclear";
const kinds:Kind[]=["dialogue","dialogue","companion_words","dialogue","dialogue","narration","companion_words","companion_words","dialogue","prophet_words","dialogue","companion_words","dialogue","companion_words","dialogue","prophet_words","companion_words","prophet_words","companion_words","dialogue","companion_words","narration","companion_words","companion_words","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","companion_words","prophet_words","prophet_words","companion_words","prophet_words","dialogue","dialogue","narration","dialogue","companion_words","companion_words","dialogue","dialogue","dialogue","dialogue","prophet_words","prophet_words","dialogue","dialogue","dialogue","dialogue","dialogue","dialogue","companion_words","companion_words","dialogue","dialogue","dialogue","companion_words","companion_words"];
const batch=JSON.parse(fs.readFileSync("data/hadith-split/batch-064.json","utf8"));if(batch.length!==60)throw new Error(`Expected 60 items, got ${batch.length}`);
const starts:string[]=["قَالَ رَجُلٌ يَا رَسُولَ اللَّهِ","يَقُولُ سُئِلَ رَسُولُ اللَّهِ","قَالَ لَقَدْ خَطَبَنَا النَّبِيُّ","قَالَ كُنَّا جُلُوسًا مَعَ النَّبِيِّ","قَالَ شَهِدْنَا مَعَ رَسُولِ اللَّهِ","أَنَّ رَجُلاً، مِنْ أَعْظَمِ الْمُسْلِمِينَ","قَالَ كُنَّا مَعَ رَسُولِ اللَّهِ","قَالَ هَاجَرْنَا مَعَ رَسُولِ اللَّهِ","قَالَ أَتَيْتُ عُثْمَانَ بِطَهُورٍ","قَالَ كُنَّا نَرَى هَذَا مِنَ الْقُرْآنِ","قَالَ قَالَ النَّبِيُّ صلى الله عليه وسلم","قَالَ خَرَجْتُ لَيْلَةً","قَالَ قَالَ أَبُو ذَرٍّ","أَنَّهُ قَالَ مَرَّ رَجُلٌ","قَالَ عُدْنَا خَبَّابًا","قَالَ لَمْ يَأْكُلِ النَّبِيُّ","قَالَتْ لَقَدْ تُوُفِّيَ النَّبِيُّ","قَالَ انْتَهَيْتُ إِلَيْهِ","قَالَ أُهْدِيَ إِلَى النَّبِيِّ","قَالَتْ إِنَّ هِنْدَ بِنْتَ عُتْبَةَ","قَالَ بَيْنَمَا رَسُولُ اللَّهِ","قَالَ كَانَ بَيْنَ هَذَا الْحَىِّ","أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم اصْطَنَعَ","عَنِ النَّبِيِّ صلى الله عليه وسلم","أَرْسَلَتْ إِلَيْهِ وَمَعَ رَسُولِ اللَّهِ","قَالَ سَأَلْتُ عَائِشَةَ","قَالَتْ أُنْزِلَتْ فِي قَوْلِهِ","أَنَّ النَّبِيَّ صلى الله عليه وسلم بَيْنَمَا هُوَ","قَالَ قَالَ رَجُلٌ لِلنَّبِيِّ","أَنَّ رَجُلاً، دَخَلَ الْمَسْجِدَ","قَالَتْ هُزِمَ الْمُشْرِكُونَ","قَالَ صَلَّى بِنَا النَّبِيُّ","أَنَّ نَبِيَّ اللَّهِ صلى الله عليه وسلم صَلَّى","قَالَ قَالَ الْبَرَاءُ بْنُ عَازِبٍ","قَالَ قَالَ رَسُولُ اللَّهِ","قَالَ أَرْسَلَنِي أَصْحَابِي إِلَى النَّبِيِّ","أَنَّ عَائِشَةَ ـ رضى الله عنها ـ كَانَتْ","قَالَ آلَى رَسُولُ اللَّهِ","أَنَّ أَبَا أُسَيْدٍ، صَاحِبَ النَّبِيِّ","قَالَتْ مَاتَتْ لَنَا شَاةٌ","قَالَتْ مَا شَبِعَ آلُ مُحَمَّدٍ","قَالَ قَالَ أَبُو طَلْحَةَ","قَالَتْ تَزْعُمُ أَنَّ النَّبِيَّ","أَنَّ سَعْدَ بْنَ عُبَادَةَ","قَالَ أَتَى رَجُلٌ النَّبِيَّ","أَنَّ النَّبِيَّ صلى الله عليه وسلم رَأَى رَجُلاً","أَنَّ النَّبِيَّ صلى الله عليه وسلم مَرَّ","سُئِلَ عَنْ رَجُلٍ","قَالَ كُنْتُ مَعَ ابْنِ عُمَرَ","قَالَ خَرَجْنَا مَعَ رَسُولِ اللَّهِ","قَالَ أَتَيْتُهُ يَعْنِي النَّبِيَّ","قَالَ جَاءَ رَجُلٌ إِلَى النَّبِيِّ","قَالَ جَاءَ رَجُلٌ إِلَى رَسُولِ اللَّهِ","قَالَ جَاءَ رَجُلٌ إِلَى النَّبِيِّ","قَالَ كَانَ الصَّاعُ","قَالَ كَانَ ابْنُ عُمَرَ","قَالَ أَتَيْتُ رَسُولَ اللَّهِ","قَالَ إِلاَّ كَفَّرْتُ يَمِينِي","قَالَ قَالَ سُلَيْمَانُ","قَالَ كُنَّا عِنْدَ أَبِي مُوسَى"];
const marks=batch.map((x:any,i:number)=>({id:x.id,url:x.url,start:starts[i],kind:kinds[i]}));
marks[56].start="قَالَ أَتَيْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم";
marks[7].start="قَالَ هِيَ فِتْنَةٌ لِلنَّاسِ";
marks[8].start="قَالَ ‏\"‏ احْتَجَّ آدَمُ وَمُوسَى";
marks[9].start="قَالَ كَثِيرًا مِمَّا كَانَ النَّبِيُّ";
marks[11].start="أَنَّ أَبَا بَكْرٍ ـ رضى الله عنه ـ لَمْ يَكُنْ";
marks[12].start="قَالَ أَتَيْتُ النَّبِيَّ صلى الله عليه وسلم";
marks[13].start="قَالَ كُنَّا مَعَ النَّبِيِّ صلى الله عليه وسلم";
marks[14].start="أَنَّ رَجُلَيْنِ اخْتَصَمَا إِلَى رَسُولِ اللَّهِ";
marks[15].start="عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏\"‏ أَرَأَيْتُمْ";
marks[16].start="أَنَّهُ أَخْبَرَهُ أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم";
marks[25].start="قَالَ سَمِعْتُ عُرْوَةَ بْنَ الزُّبَيْرِ";
marks[36].start="عَنْ حَدِيثِ، عَائِشَةَ زَوْجِ النَّبِيِّ صلى الله عليه وسلم";
marks[40].start="قَالَتْ مَا شَبِعَ آلُ مُحَمَّدٍ";
marks[42].start="تَزْعُمُ أَنَّ النَّبِيَّ صلى الله عليه وسلم";
marks[57].start=null;marks[57].kind="reference_only";
marks[7].start="قَالَ هِيَ رُؤْيَا عَيْنٍ";
marks[59].start="قَالَ كُنَّا عِنْدَ أَبِي مُوسَى";
const tails:Record<number,string>={17:"وَعَنْ أَبِي ذَرٍّ",23:"وَحَدَّثَنِي مُحَمَّدُ بْنُ بَشَّارٍ",25:"ح وَحَدَّثَنَا حَجَّاجٌ",36:"ح وَحَدَّثَنَا الْحَجَّاجُ"};
for(const [i,s] of Object.entries(tails)){const n=+i,p=batch[n].text_original.indexOf(s);if(p>=0)marks[n].tail_start=batch[n].text_original.slice(p)}
delete marks[25].tail_start; delete marks[36].tail_start;
for(let i=0;i<60;i++){const t=batch[i].text_original,b=marks[i].start;if(b===null||t.split(b).length===2)continue;const p=t.indexOf(b);for(let l=b.length;l<=t.length-p;l++){const c=t.slice(p,p+l);if(t.split(c).length===2){marks[i].start=c;break}}}
fs.writeFileSync("data/hadith-split/marks-064.json",JSON.stringify(marks,null,2)+"\n","utf8");console.log("Wrote 60 marks to data/hadith-split/marks-064.json");
