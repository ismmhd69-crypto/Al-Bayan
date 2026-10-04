import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Hanken_Grotesk, Newsreader, Noto_Naskh_Arabic, Reem_Kufi } from "next/font/google";
import { dirOf, getDictionary, isLocale, locales } from "@/lib/i18n";
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
    // The site's main address, needed for absolute link-preview images. SITE_URL wins (set it to
    // https://askbayan.org); otherwise the host's own variable: Netlify sets URL, Vercel sets
    // VERCEL_PROJECT_PRODUCTION_URL (host only, no https://).
    metadataBase: new URL(
      process.env.SITE_URL ??
        process.env.URL ??
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
    ),
    title: { default: t.meta.title, template: `%s · Bayan` },
    description: t.meta.description,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) },
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
      className={`${display.variable} ${body.variable} ${kufi.variable} ${naskh.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          {t.common.skip}
        </a>
        <Shell lang={lang} nav={t.nav} brandAr={t.common.brandAr} langLabel={t.more.language}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
