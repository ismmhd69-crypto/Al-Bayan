import { BookOpen, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { referenceVerseKeys, type LearningReference } from "@/lib/learning/course";
import { learningText, learningSourceLabel } from "@/lib/learning/text";
import { getVerse, TRANSLATIONS } from "@/lib/sources/quran";
import { getChapterVerses } from "@/lib/quran/service";
import VerseActions from "./VerseActions";

/** Recitation links straight from Quran Foundation's verse data (validated hosts only), by verse key.
 * Audio is optional: any failure just leaves the verse without a play button. */
async function recitations(keys: string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const pages = new Map<number, Set<number>>();
  for (const key of keys) {
    const [surah, verse] = key.split(":").map(Number);
    pages.set(surah, (pages.get(surah) ?? new Set()).add(Math.ceil(verse / 50)));
  }
  await Promise.all([...pages].flatMap(([surah, wanted]) => [...wanted].map(async (page) => {
    try {
      const { verses } = await getChapterVerses(surah, { page, perPage: 50 });
      for (const v of verses) if (v.audioUrl) found.set(v.verseKey, v.audioUrl);
    } catch { /* No recitation for these verses. */ }
  })));
  return found;
}

/** Uses the existing website connector. No stored or AI-authored Quran translations. */
export default async function LearningEvidence({ lang, references }: { lang: Locale; references: LearningReference[] }) {
  const t = learningText[lang];
  const passages = await Promise.all(references.filter((reference) => reference.kind === "quran").map(async (reference) => {
    const keys = referenceVerseKeys(reference);
    const verses = await Promise.all(keys.map(async (key) => { try { return await getVerse(key); } catch { return undefined; } }));
    return { reference, keys, verses };
  }));
  if (passages.length === 0) return null;
  const audio = await recitations(passages.flatMap((p) => p.keys));
  return <section id="lesson-quran" className="learning-evidence" aria-labelledby="learning-quran-title">
    <h2 id="learning-quran-title"><BookOpen aria-hidden="true" />{t.quran}</h2>
    {passages.map(({ reference, keys, verses }) => <div key={reference.id} className="lesson-passage" id={`learning-source-${reference.id}`} tabIndex={-1}>
      <a className="lesson-passage-title" href={reference.url} target="_blank" rel="noopener noreferrer">{learningSourceLabel(reference.title, lang)}<ExternalLink aria-hidden="true" size={13} /><span className="lesson-visually-hidden"> · {t.openSource}</span></a>
      {keys.length === 0 && <p className="learning-small">{t.evidenceUnavailable}</p>}
      {keys.map((key, n) => {
        const verse = verses[n];
        if (!verse || verse.key !== key) return <p key={key} className="learning-small">{key}: {t.evidenceUnavailable}</p>;
        const translation = lang === "ar" ? null : verse.translations[lang];
        const by = lang === "ar" ? "" : TRANSLATIONS[lang].name;
        return <div className="lesson-verse" key={key}>
          <p className="lesson-verse-ar" lang="ar" dir="rtl" translate="no">{verse.arabic}</p>
          <div className="lesson-verse-text">
            <p className="lesson-verse-key"><bdi dir="ltr">{key}</bdi></p>
            {lang !== "ar" && (translation
              ? <><p className="lesson-verse-tr" lang={lang} dir="ltr" translate="no">{translation}</p><p className="lesson-verse-by">{by}</p></>
              : <p className="learning-small">{t.translationUnavailable}</p>)}
            <VerseActions audioUrl={audio.get(key) ?? null}
              copyText={[`${key}`, verse.arabic, translation, translation ? `(${by})` : ""].filter(Boolean).join("\n")}
              playLabel={t.playVerse.replace("{key}", key)} copyLabel={t.copyVerse.replace("{key}", key)} copiedLabel={t.verseCopied} />
          </div>
        </div>;
      })}
    </div>)}
  </section>;
}
