import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import fr from "@/dictionaries/fr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: fr.meta.title,
  description: fr.meta.description,
  robots: { index: false, follow: false },
};

function isLoopbackHost(hostHeader: string | null) {
  if (!hostHeader) return false;
  try {
    const host = new URL(`http://${hostHeader}`).hostname.toLowerCase().replace(/^\[|\]$/gu, "");
    return ["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

export default async function FrenchPreviewPage() {
  if (process.env.NODE_ENV !== "development" || !isLoopbackHost((await headers()).get("host"))) notFound();
  const t = fr;

  return (
    <main className="fr-preview" id="main">
      <header className="fr-preview-header">
        <a href="#main" aria-label={t.common.brandAr} className="fr-preview-brand">{t.common.brandAr} · Bayan</a>
        <nav aria-label={t.nav.label}>
          <a href="#ask">{t.nav.ask}</a>
          <a href="#topics">{t.nav.topics}</a>
          <a href="#readers">{t.nav.quran}</a>
          <a href="#readers">{t.nav.hadith}</a>
        </nav>
      </header>

      <section className="fr-preview-hero">
        <p className="eyebrow">Aperçu privé, visible uniquement en développement local</p>
        <h1>{t.home.title}</h1>
        <p>{t.home.sub}</p>
      </section>

      <section className="fr-preview-card" id="ask" aria-labelledby="fr-preview-ask-title">
        <h2 id="fr-preview-ask-title">{t.ask.title}</h2>
        <p>{t.ask.notice}</p>
        <label htmlFor="fr-preview-question">{t.ask.placeholder}</label>
        <textarea id="fr-preview-question" placeholder={t.ask.placeholder} rows={3} />
        <button type="button" disabled>{t.ask.send}</button>
        <p role="status">{t.ask.notReady}</p>
        <p>{t.ask.parts.short} · {t.ask.parts.evidence} · {t.ask.parts.scholars}</p>
        <p>{t.ask.thinking} · {t.ask.busy}</p>
      </section>

      <section className="fr-preview-card" id="topics" aria-labelledby="fr-preview-topics-title">
        <h2 id="fr-preview-topics-title">{t.topics.title}</h2>
        <p>{t.topics.intro}</p>
        <button type="button">{t.home.browse}</button>
        <p>{t.topics.preparing}</p>
      </section>

      <section className="fr-preview-card" id="readers" aria-labelledby="fr-preview-readers-title">
        <h2 id="fr-preview-readers-title">{t.quran.title} · {t.hadith.title}</h2>
        <p>{t.quran.intro}</p>
        <label htmlFor="fr-preview-search">{t.hadith.searchPlaceholder}</label>
        <input id="fr-preview-search" placeholder={t.hadith.searchPlaceholder} />
        <p role="status">{t.quran.translationUnavailable}</p>
        <p role="status">{t.hadith.translationUnavailable}</p>
        <button type="button" aria-label={t.quran.playVerse.replace("{verse}", "1")}>{t.quran.audioUnavailable}</button>
      </section>
    </main>
  );
}
