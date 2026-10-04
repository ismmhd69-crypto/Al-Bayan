import type { HadithReelProps } from "../HadithReel";
import en from "../../voiceover/bukhari-1-en.durations.json";
import de from "../../voiceover/bukhari-1-de.durations.json";

// Sahih al-Bukhari 1. Hadith text from data/sunnah/bukhari-1-1.json.
// Explanations: Ibn Baz quotes stored in Supabase `sources`
// (916e042e... binbaz.org.sa/fatwas/8343 and 9c74bed3... binbaz.org.sa/fatwas/22896).
// Their English and German translations are AI drafts (not yet reviewed by Mo).
// The cited hadith is Sahih al-Bukhari 2996 (data/sunnah/bukhari-56-3.json); the
// Arabic shown is Ibn Baz's own wording of it, as he quoted it.

const arabicLines = ["إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ،", "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى"];

const ar1a = "النية لابد منها في العبادات كلها";
const ar1b = "وإنما النية تكون بالقلب لا باللسان";
// "|" marks a line break on screen.
const ar2a = "إذا نوى العمل الطيب ثم حبسه عذر | صار له أجر العاملين";
const ar2b = "إذا مرض العبد أو سافر | كتب الله له ما كان يعمل وهو صحيح مقيم";

export const bukhari1En: HadithReelProps = {
  id: "bukhari-1",
  lang: "en",
  durations: en,
  hook: "One sentence that changes every deed.",
  intro: "The Prophet ﷺ said:",
  narrator: "Narrated by Umar ibn al-Khattab",
  arabicLines,
  translation: ["“Actions are only by intentions,", "and every person will have", "only what they intended.”"],
  source: "Sahih al-Bukhari 1",
  grade: "Sahih",
  explain: [
    {
      kicker: "Explanation",
      scholar: "Shaykh Abdul-Aziz ibn Baz",
      link: "binbaz.org.sa/fatwas/8343",
      segments: [
        { ar: ar1a, tr: "“Intention is indispensable in all acts of worship.", at: 0.3 },
        { ar: ar1b, tr: "Intention is only in the heart, not on the tongue.”", at: 0.62 },
      ],
    },
    {
      kicker: "Explanation",
      scholar: "Shaykh Abdul-Aziz ibn Baz",
      link: "binbaz.org.sa/fatwas/22896",
      segments: [
        { ar: ar2a, tr: "“If he intends a good deed and is then held back by an excuse, he receives the reward of those who do it.”", at: 0.05 },
        {
          ar: ar2b,
          tr: "“When a servant falls ill or travels, Allah writes for him what he used to do when he was healthy and at home.”",
          at: 0.5,
          cited: "Sahih al-Bukhari 2996",
        },
      ],
    },
  ],
  closeLine: "Share it, and may Allah accept your deeds.",
  tagline: "Authentic answers. Clear sources.",
};

export const bukhari1De: HadithReelProps = {
  ...bukhari1En,
  lang: "de",
  durations: de,
  hook: "Ein Satz, der jede Tat verändert.",
  intro: "Der Prophet ﷺ sagte:",
  narrator: "Überliefert von Umar ibn al-Khattab",
  translation: ["„Die Taten sind nur gemäß den Absichten,", "und jedem Menschen gehört nur", "das, was er beabsichtigt hat.“"],
  explain: [
    {
      kicker: "Erklärung",
      scholar: "Scheich Abdul-Aziz ibn Baz",
      link: "binbaz.org.sa/fatwas/8343",
      segments: [
        { ar: ar1a, tr: "„Die Absicht ist bei allen Gottesdiensten unerlässlich.", at: 0.3 },
        { ar: ar1b, tr: "Die Absicht ist allein im Herzen, nicht mit der Zunge.“", at: 0.62 },
      ],
    },
    {
      kicker: "Erklärung",
      scholar: "Scheich Abdul-Aziz ibn Baz",
      link: "binbaz.org.sa/fatwas/22896",
      segments: [
        { ar: ar2a, tr: "„Wenn jemand eine gute Tat beabsichtigt und dann durch einen triftigen Grund daran gehindert wird, erhält er den Lohn derer, die sie tun.“", at: 0.05 },
        {
          ar: ar2b,
          tr: "„Wenn ein Diener krank wird oder reist, schreibt Allah ihm das auf, was er zu tun pflegte, als er gesund und zu Hause war.“",
          at: 0.5,
          cited: "Sahih al-Bukhari 2996",
        },
      ],
    },
  ],
  closeLine: "Teile es, und möge Allah deine Taten annehmen.",
  tagline: "Authentische Antworten. Klare Quellen.",
};
