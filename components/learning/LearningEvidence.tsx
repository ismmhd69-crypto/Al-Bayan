import { BookOpen, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { referenceVerseKeys, type LearningReference } from "@/lib/learning/course";
import { learningText, learningSourceLabel } from "@/lib/learning/text";
import { ATTRIBUTION, getVerse, TRANSLATIONS } from "@/lib/sources/quran";

/** Uses the existing website connector. No stored or AI-authored Quran translations. */
export default async function LearningEvidence({ lang, references }: { lang: Locale; references: LearningReference[] }) {
  const t = learningText[lang];
  const passages = await Promise.all(references.filter((reference) => reference.kind === "quran").map(async (reference) => {
    const keys = referenceVerseKeys(reference);
    const verses = await Promise.all(keys.map(async (key) => { try { return await getVerse(key); } catch { return undefined; } }));
    return { reference, keys, verses };
  }));
  if (passages.length === 0) return null;
  return <section className="learning-evidence" aria-labelledby="learning-quran-title">
    <h2 id="learning-quran-title"><BookOpen aria-hidden="true" />{t.quran}</h2>
    {passages.map(({ reference, keys, verses }) => <details key={reference.id} open className="learning-source answer-source-card" id={`learning-source-${reference.id}`} tabIndex={-1}>
      <summary><span>{learningSourceLabel(reference.title, lang)}</span><span className="learning-source-kind">{t.quran}</span></summary>
      <div className="learning-source-content">
        {keys.length === 0 && <p>{t.evidenceUnavailable}</p>}
        {keys.map((key, n) => {
          const verse = verses[n];
          if (!verse || verse.key !== key) return <p key={key}>{key}: {t.evidenceUnavailable}</p>;
          const translation = lang === "ar" ? null : verse.translations[lang];
          return <div className="quran-verse" key={key}>
            <p className="source-language-label"><bdi dir="ltr">{key}</bdi></p>
            <p className="verse-ar" lang="ar" dir="rtl" translate="no">{verse.arabic}</p>
            {lang !== "ar" && (translation ? <div className="verse-tr" lang={lang} dir="ltr" translate="no"><p>{translation}</p><p className="verse-by">{TRANSLATIONS[lang].name}</p></div> : <p className="learning-small">{t.translationUnavailable}</p>)}
          </div>;
        })}
        <a href={reference.url} className="text-link" target="_blank" rel="noopener noreferrer">{t.openSource}<ExternalLink aria-hidden="true" size={14} /></a>
      </div>
    </details>)}
    <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer" className="learning-small text-link">{ATTRIBUTION.text}</a>
  </section>;
}
