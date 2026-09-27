"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/lib/i18n";

// Remembers the choice on this device for one year.
function remember(locale: Locale) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `lang=${locale}; path=/; max-age=31536000; samesite=lax${secure}`;
}

export default function LangSwitch({ lang, label }: { lang: Locale; label?: string }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(ar|en|de)(?=\/|$)/, "");

  return (
    <nav className="lang-switch" aria-label={label ?? "Language"}>
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          lang={l}
          hrefLang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => remember(l)}
        >
          {localeNames[l]}
        </Link>
      ))}
    </nav>
  );
}
