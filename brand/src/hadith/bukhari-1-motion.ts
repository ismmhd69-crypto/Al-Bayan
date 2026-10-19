import type { IntentionMotionProps } from "../IntentionMotion";
import durations from "../../voiceover/bukhari-1-en.durations.json";
import words from "../../voiceover/bukhari-1-en.words.json";

// Motion-design pilot for Sahih al-Bukhari 1 (English). Same sources and voice as
// the reel in bukhari-1.ts: Ibn Baz, binbaz.org.sa/fatwas/8343 and /22896; the
// hadith he cites is Sahih al-Bukhari 2996 (shown in his own wording).
export const bukhari1Motion: IntentionMotionProps = {
  id: "bukhari-1",
  lang: "en",
  durations,
  words,
  tx: {
    hookBig: "ONE SENTENCE",
    hookWords: [
      { text: "that", cue: "that" },
      { text: "changes", cue: "changes" },
      { text: "every", cue: "every", gold: true },
      { text: "deed.", cue: "deed", gold: true },
    ],
    bubble: "“I intend to pray…”",
    ill: "ILL",
    travel: "TRAVELLING",
    reward: "Reward",
    cite2996: "Sahih al-Bukhari 2996",
    narrator: "Narrated by Umar ibn al-Khattab",
    stamp: "Sahih al-Bukhari 1",
    line1: ["actions", 0],
    line2: ["and", 0],
    stampWord: "reported",
  },
  arabicLines: ["إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ،", "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى"],
  quote1: ["النية لابد منها في العبادات كلها", "وإنما النية تكون بالقلب لا باللسان"],
  quote2: ["إذا نوى العمل الطيب ثم حبسه عذر صار له أجر العاملين", "إذا مرض العبد أو سافر كتب الله له ما كان يعمل وهو صحيح مقيم"],
};

// Turkish version. Hadith wording: HadeethEnc human translations (66511 for Bukhari 1,
// 3553 for Bukhari 2996, 5354 for the closing Muslim 1893). Ibn Baz lines are Claude's
// translation of his Arabic and must be checked by a Turkish speaker before posting.
import durationsTr from "../../voiceover/bukhari-1-tr.durations.json";
import wordsTr from "../../voiceover/bukhari-1-tr.words.json";

export const bukhari1MotionTr: IntentionMotionProps = {
  ...bukhari1Motion,
  lang: "tr",
  durations: durationsTr,
  words: wordsTr,
  tx: {
    hookBig: "TEK BİR CÜMLE",
    hookWords: [
      { text: "her", cue: "her" },
      { text: "ameli", cue: "ameli", gold: true },
      { text: "değiştirir.", cue: "değiştirir", gold: true },
    ],
    bubble: "“Niyet ettim, namaz kılmaya…”",
    ill: "HASTA",
    travel: "YOLCULUK",
    reward: "Sevap",
    cite2996: "Sahih Buhârî 2996",
    narrator: "Rivayet eden: Ömer b. el-Hattâb",
    stamp: "Sahih Buhârî 1",
    line1: ["ameller", 0],
    line2: ["herkes", 0],
    stampWord: "buhari",
    contentTop: 250,
    stampBottom: 24,
  },
  // In Turkish the voice quotes Bukhari 2996 itself (HadeethEnc), so the Arabic is Bukhari's wording.
  quote2: ["إذا نوى العمل الطيب ثم حبسه عذر صار له أجر العاملين", "إِذَا مَرِضَ الْعَبْدُ أَوْ سَافَرَ، كُتِبَ لَهُ مِثْلُ مَا كَانَ يَعْمَلُ مُقِيمًا صَحِيحًا"],
  alias: {
    hook: { one: ["tek", 0], that: ["her", 0], changes: ["değiştirir", 0], every: ["ameli", 0] },
    explain1: {
      "intention#0": ["niyet", 0],
      "intention#1": ["niyet", 1],
      all: ["bütün", 0],
      acts: ["ibadetlerde", 0],
      of: ["ibadetlerde", 0],
      worship: ["şarttır", 0],
      heart: ["kalptedir", 0],
      not: ["dilde", 0],
      tongue: ["değil", 0],
    },
    explain2: {
      if: ["kişi", 0],
      intends: ["niyet", 0],
      held: ["mazeret", 0],
      receives: ["yapanların", 0],
      reward: ["sevabını", 0],
      authentic: ["sahih", 0],
      when: ["kimse", 0],
      travels: ["yolculuğa", 0],
      allah: ["yapamazsa", 0],
      writes: ["kendisine", 0],
      healthy: ["sağlıklı", 0],
      home: ["yazılır", 0],
    },
    close: { share: ["paylaş", 0], deeds: ["etsin", 0] },
  },
};
