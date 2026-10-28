import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Hanken_Grotesk, Newsreader, Noto_Naskh_Arabic, Reem_Kufi } from "next/font/google";
import { dirOf, getDictionary, isLocale, locales } from "@/lib/i18n";
import { getSiteUrl, buildWebSiteSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Shell from "@/components/Shell";
import "../globals.css";

// Fonts are downloaded at build time and served from our own domain,
// so visitors' browsers never contact Google.
const display = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const kufi = Reem_Kufi({ subsets: ["arabic"], variable: "--font-ar-display", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-ar-body", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: t.meta.title, template: `%s · Bayan` },
    description: t.meta.description,
    // Keep postponed German pages out of search without removing their content.
    ...(lang === "de" ? { robots: { index: false, follow: true } } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F7F9",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${kufi.variable} ${naskh.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bayan_theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <JsonLd data={buildWebSiteSchema(lang, t.meta.description)} />
        <a className="skip-link" href="#main">
          {t.common.skip}
        </a>
        <Shell
          lang={lang}
          nav={t.nav}
          brandAr={t.common.brandAr}
          langLabel={t.more.language}
          themeLabels={{ light: t.more.themeLight, dark: t.more.themeDark }}
        >
          {children}
        </Shell>
      </body>
    </html>
  );
}
