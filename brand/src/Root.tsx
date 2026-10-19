import React from "react";
import { Composition, Folder, Still } from "remotion";
import { LogoReveal } from "./LogoReveal";
import { Horizontal, MarkOnly, Stacked } from "./Layouts";
import { HadithReel, calculateHadithMetadata } from "./HadithReel";
import { bukhari1De, bukhari1En } from "./hadith/bukhari-1";
import { PuppetSheet } from "./motion/PuppetSheet";
import { ReelCover } from "./ReelCover";
import { MotherMotion, calculateMotherMetadata } from "./MotherMotion";
import { motherMotionTr } from "./hadith/mother-motion";
import { BestQuranMotion, calculateBestQuranMetadata } from "./BestQuranMotion";
import { bestQuranMotionTr } from "./hadith/best-quran-motion";
import { OneBodyMotion, calculateOneBodyMetadata } from "./OneBodyMotion";
import { oneBodyMotionTr } from "./hadith/one-body-motion";
import { AngerMotion, calculateAngerMetadata } from "./AngerMotion";
import { angerMotion, angerMotionTr } from "./hadith/anger-motion";
import { SpeakGoodMotion, calculateSpeakGoodMetadata } from "./SpeakGoodMotion";
import { speakGoodMotion, speakGoodMotionTr } from "./hadith/speak-good-motion";
import { IntentionMotion, calculateIntentionMetadata } from "./IntentionMotion";
import { bukhari1Motion, bukhari1MotionTr } from "./hadith/bukhari-1-motion";
import { SalamMotion, calculateSalamMetadata } from "./SalamMotion";
import { salamMotionTr } from "./hadith/salam-motion";
import { BrotherMotion, calculateBrotherMetadata } from "./BrotherMotion";
import { brotherMotionTr } from "./hadith/brother-motion";
import { TreeMotion, calculateTreeMetadata } from "./TreeMotion";
import { treeMotionTr } from "./hadith/tree-motion";
import { DogMotion, calculateDogMetadata } from "./DogMotion";
import { dogMotionTr } from "./hadith/dog-motion";
import { ThornMotion, calculateThornMetadata } from "./ThornMotion";
import { thornMotionTr } from "./hadith/thorn-motion";
import { FivePrayersMotion, calculateFivePrayersMetadata } from "./FivePrayersMotion";
import { fivePrayersMotionTr } from "./hadith/five-prayers-motion";
import { NightMotion, calculateNightMetadata } from "./NightMotion";
import { nightMotionTr } from "./hadith/night-motion";
import { PatienceMotion, calculatePatienceMetadata } from "./PatienceMotion";
import { patienceMotionTr } from "./hadith/patience-motion";
import { TruthMotion, calculateTruthMetadata } from "./TruthMotion";
import { truthMotionTr } from "./hadith/truth-motion";
import { TwoWordsMotion, calculateTwoWordsMetadata } from "./TwoWordsMotion";
import { twoWordsMotionTr } from "./hadith/two-words-motion";
import { TawbaMotion, calculateTawbaMetadata } from "./TawbaMotion";
import { tawbaMotionTr } from "./hadith/tawba-motion";
import { GheebaMotion, calculateGheebaMetadata } from "./GheebaMotion";
import { gheebaMotionTr } from "./hadith/gheeba-motion";
import { ThreeDeedsMotion, calculateThreeDeedsMetadata } from "./ThreeDeedsMotion";
import { threeDeedsMotionTr } from "./hadith/three-deeds-motion";
import { NearMotion, calculateNearMetadata } from "./NearMotion";
import { nearMotionTr } from "./hadith/near-motion";
import { EasyMotion, calculateEasyMetadata } from "./EasyMotion";
import { easyMotionTr } from "./hadith/easy-motion";
import { dark, light, transparentDark, transparentLight } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Animation">
        <Composition
          id="LogoReveal"
          component={LogoReveal}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ theme: light, markSize: 360 }}
        />
        <Composition
          id="LogoRevealSquareDark"
          component={LogoReveal}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1080}
          defaultProps={{ theme: dark, markSize: 380 }}
        />
      </Folder>
      <Folder name="Social">
        {/* Vertical hadith teaching reels with voiceover, no music. Length follows the voice clips. */}
        <Composition id="HadithReel" component={HadithReel} calculateMetadata={calculateHadithMetadata} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={bukhari1En} />
        <Composition id="HadithReelDE" component={HadithReel} calculateMetadata={calculateHadithMetadata} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={bukhari1De} />
        {/* Motion-design pilot: rigged characters, moving camera, sound effects, voice-synced captions. */}
        <Composition id="IntentionMotion" component={IntentionMotion} calculateMetadata={calculateIntentionMetadata} durationInFrames={1500} fps={30} width={1080} height={1920} defaultProps={bukhari1Motion} />
        <Composition id="AngerMotion" component={AngerMotion} calculateMetadata={calculateAngerMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={angerMotion} />
        {/* Turkish versions (HadeethEnc Turkish hadith text; Ibn Baz lines need a Turkish reviewer). */}
        <Composition id="IntentionMotionTR" component={IntentionMotion} calculateMetadata={calculateIntentionMetadata} durationInFrames={1500} fps={30} width={1080} height={1920} defaultProps={bukhari1MotionTr} />
        <Composition id="AngerMotionTR" component={AngerMotion} calculateMetadata={calculateAngerMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={angerMotionTr} />
        <Composition id="SpeakGoodMotion" component={SpeakGoodMotion} calculateMetadata={calculateSpeakGoodMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={speakGoodMotion} />
        <Composition id="SpeakGoodMotionTR" component={SpeakGoodMotion} calculateMetadata={calculateSpeakGoodMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={speakGoodMotionTr} />
        <Composition id="MotherMotionTR" component={MotherMotion} calculateMetadata={calculateMotherMetadata} durationInFrames={2400} fps={30} width={1080} height={1920} defaultProps={motherMotionTr} />
        <Composition id="BestQuranMotionTR" component={BestQuranMotion} calculateMetadata={calculateBestQuranMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={bestQuranMotionTr} />
        <Composition id="OneBodyMotionTR" component={OneBodyMotion} calculateMetadata={calculateOneBodyMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={oneBodyMotionTr} />
        <Composition id="SalamMotionTR" component={SalamMotion} calculateMetadata={calculateSalamMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={salamMotionTr} />
        <Composition id="BrotherMotionTR" component={BrotherMotion} calculateMetadata={calculateBrotherMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={brotherMotionTr} />
        <Composition id="TreeMotionTR" component={TreeMotion} calculateMetadata={calculateTreeMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={treeMotionTr} />
        <Composition id="DogMotionTR" component={DogMotion} calculateMetadata={calculateDogMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={dogMotionTr} />
        <Composition id="ThornMotionTR" component={ThornMotion} calculateMetadata={calculateThornMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={thornMotionTr} />
        <Composition id="FivePrayersMotionTR" component={FivePrayersMotion} calculateMetadata={calculateFivePrayersMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={fivePrayersMotionTr} />
        <Composition id="NightMotionTR" component={NightMotion} calculateMetadata={calculateNightMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={nightMotionTr} />
        <Composition id="PatienceMotionTR" component={PatienceMotion} calculateMetadata={calculatePatienceMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={patienceMotionTr} />
        <Composition id="TruthMotionTR" component={TruthMotion} calculateMetadata={calculateTruthMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={truthMotionTr} />
        <Composition id="TwoWordsMotionTR" component={TwoWordsMotion} calculateMetadata={calculateTwoWordsMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={twoWordsMotionTr} />
        <Composition id="TawbaMotionTR" component={TawbaMotion} calculateMetadata={calculateTawbaMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={tawbaMotionTr} />
        <Composition id="GheebaMotionTR" component={GheebaMotion} calculateMetadata={calculateGheebaMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={gheebaMotionTr} />
        <Composition id="ThreeDeedsMotionTR" component={ThreeDeedsMotion} calculateMetadata={calculateThreeDeedsMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={threeDeedsMotionTr} />
        <Composition id="NearMotionTR" component={NearMotion} calculateMetadata={calculateNearMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={nearMotionTr} />
        <Composition id="EasyMotionTR" component={EasyMotion} calculateMetadata={calculateEasyMetadata} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={easyMotionTr} />
      </Folder>
      <Folder name="Covers">
        {/* One cover per reel. Key content stays inside the 3:4 grid crop (y 240 to 1680). */}
        <Still id="Cover-01-Intentions" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "INTENTIONS", arabicTitle: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "Sahih al-Bukhari 1", art: "intention" as const }} />
        <Still id="Cover-02-TrueStrength" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "TRUE STRENGTH", titleSize: 128, arabicTitle: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ", source: "Sahih al-Bukhari 6114", art: "anger" as const }} />
        <Still id="Cover-01-Intentions-TR" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "NİYET", arabicTitle: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "Sahih Buhârî 1", art: "intention" as const }} />
        <Still id="Cover-02-TrueStrength-TR" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "GERÇEK GÜÇ", titleSize: 140, arabicTitle: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ", source: "Sahih Buhârî 6114", art: "anger" as const }} />
        <Still id="Cover-03-SpeakGood" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "SPEAK GOOD", titleSize: 144, arabicTitle: "فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", source: "Sahih al-Bukhari 6018", art: "speak" as const }} />
        <Still id="Cover-03-SpeakGood-TR" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "HAYIR SÖYLE", titleSize: 136, arabicTitle: "فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", source: "Sahih Buhârî 6018", art: "speak" as const }} />
        <Still id="Cover-04-Annen" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "ANNEN", arabicTitle: "أُمُّكَ ثُمَّ أُمُّكَ ثُمَّ أُمُّكَ", source: "Sahih Buhârî 5971", art: "mother" as const }} />
        <Still id="Cover-05-EnHayirliniz" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "EN HAYIRLINIZ", titleSize: 118, arabicTitle: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "Sahih Buhârî 5027", art: "quran" as const }} />
        <Still id="Cover-06-TekVucut" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "TEK VÜCUT", titleSize: 150, arabicTitle: "كَمَثَلِ الْجَسَدِ", source: "Sahih Buhârî 6011", art: "onebody" as const }} />
        <Still id="Cover-07-SelamiYayin" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "SELAMI YAYIN", titleSize: 128, arabicTitle: "أَفْشُوا السَّلَامَ بَيْنَكُمْ", source: "Sahih Müslim 54", art: "salam" as const }} />
        <Still id="Cover-08-KardesinIcin" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "KARDEŞİN İÇİN", titleSize: 116, arabicTitle: "حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", source: "Sahih Buhârî 13", art: "brother" as const }} />
        <Still id="Cover-09-AgacDik" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "AĞAÇ DİK", titleSize: 150, arabicTitle: "مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْسًا", source: "Sahih Buhârî 2320", art: "tree" as const }} />
        <Still id="Cover-10-SusuzKopek" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "SUSUZ KÖPEK", titleSize: 130, arabicTitle: "فِي كُلِّ كَبِدٍ رَطْبَةٍ أَجْرٌ", source: "Sahih Buhârî 2363", art: "dog" as const }} />
        <Still id="Cover-11-YoldakiDiken" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "YOLDAKİ DİKEN", titleSize: 118, arabicTitle: "وَجَدَ غُصْنَ شَوْكٍ فَأَخَذَهُ", source: "Sahih Buhârî 2472", art: "thorn" as const }} />
        <Still id="Cover-12-BesVakit" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "BEŞ VAKİT", titleSize: 160, arabicTitle: "فَذَلِكَ مِثْلُ الصَّلَوَاتِ الْخَمْسِ", source: "Sahih Buhârî 528", art: "five" as const }} />
        <Still id="Cover-13-SonUcteBir" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "SON ÜÇTE BİR", titleSize: 128, arabicTitle: "حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ", source: "Sahih Buhârî 1145", art: "night" as const }} />
        <Still id="Cover-14-IlkSarsinti" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "İLK SARSINTI", titleSize: 132, arabicTitle: "إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الأُولَى", source: "Sahih Buhârî 1283", art: "patience" as const }} />
        <Still id="Cover-15-Dogruluk" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "DOĞRULUK", titleSize: 150, arabicTitle: "إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ", source: "Sahih Buhârî 6094", art: "truth" as const }} />
        <Still id="Cover-16-IkiKelime" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "İKİ KELİME", titleSize: 150, arabicTitle: "كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ", source: "Sahih Buhârî 6406", art: "twowords" as const }} />
        <Still id="Cover-17-Tovbe" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "TÖVBE", titleSize: 170, arabicTitle: "اللَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ", source: "Sahih Buhârî 6309", art: "tawba" as const }} />
        <Still id="Cover-18-Giybet" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "GIYBET", titleSize: 170, arabicTitle: "أَتَدْرُونَ مَا الْغِيبَةُ", source: "Sahih Müslim 2589", art: "gheeba" as const }} />
        <Still id="Cover-19-UcAmel" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "ÜÇ AMEL", titleSize: 170, arabicTitle: "إِلاَّ مِنْ ثَلاَثَةٍ", source: "Sahih Müslim 1631", art: "three" as const }} />
        <Still id="Cover-20-CennetYakin" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "CENNET YAKIN", titleSize: 130, arabicTitle: "الْجَنَّةُ أَقْرَبُ إِلَى أَحَدِكُمْ مِنْ شِرَاكِ نَعْلِهِ", source: "Sahih Buhârî 6488", art: "near" as const }} />
        <Still id="Cover-21-DinKolayliktir" component={ReelCover} width={1080} height={1920} defaultProps={{ title: "DİN KOLAYLIKTIR", titleSize: 104, arabicTitle: "إِنَّ الدِّينَ يُسْرٌ", source: "Sahih Buhârî 39", art: "easy" as const }} />
      </Folder>
      <Folder name="Dev">
        <Still id="PuppetSheet" component={PuppetSheet} width={2400} height={1500} />
      </Folder>
      <Folder name="Stills">
        {/* Profile picture (Buy Me a Coffee, social): safe inside a circle crop. */}
        <Still id="Avatar" component={Stacked} width={1024} height={1024} defaultProps={{ theme: dark, markSize: 400 }} />
        <Still id="AvatarLight" component={Stacked} width={1024} height={1024} defaultProps={{ theme: light, markSize: 400 }} />
        <Still id="Mark" component={MarkOnly} width={1024} height={1024} defaultProps={{ theme: transparentLight, markSize: 1000 }} />
        <Still id="MarkLightOnDark" component={MarkOnly} width={1024} height={1024} defaultProps={{ theme: transparentDark, markSize: 1000 }} />
        <Still id="Stacked" component={Stacked} width={1600} height={1600} defaultProps={{ theme: transparentLight, markSize: 640 }} />
        <Still id="Horizontal" component={Horizontal} width={2400} height={800} defaultProps={{ theme: transparentLight, markSize: 520 }} />
        <Still id="HorizontalDark" component={Horizontal} width={2400} height={800} defaultProps={{ theme: dark, markSize: 520 }} />
        {/* Website files: app/apple-icon.png and app/[lang]/opengraph-image.png */}
        {/* Social media profile picture (Instagram, TikTok, YouTube, X): star only, sized to sit inside the round crop. */}
        <Still id="SocialProfile" component={MarkOnly} width={2048} height={2048} defaultProps={{ theme: dark, markSize: 1340 }} />
        <Still id="AppleIcon" component={MarkOnly} width={180} height={180} defaultProps={{ theme: dark, markSize: 132 }} />
        <Still id="OgImage" component={Horizontal} width={1200} height={630} defaultProps={{ theme: light, markSize: 300 }} />
      </Folder>
    </>
  );
};
