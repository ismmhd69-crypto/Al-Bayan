import { Sparkles } from "lucide-react";
import { getDailyHadith } from "@/data/daily-hadiths";
import type { Locale } from "@/lib/i18n";

interface DailyHadithHighlightProps {
  lang: Locale;
  label: string;
}

export default function DailyHadithHighlight({ lang, label }: DailyHadithHighlightProps) {
  const hadith = getDailyHadith();

  return (
    <aside className="daily-hadith" aria-label={label}>
      <span className="daily-hadith-badge">
        <Sparkles aria-hidden="true" className="daily-hadith-icon" />
        {label}
      </span>
      <span className="daily-hadith-text">“{hadith.text[lang]}”</span>
      <span className="daily-hadith-source">— {hadith.source}</span>
    </aside>
  );
}
