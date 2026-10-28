"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleHelp, Compass, Ellipsis, HeartHandshake, House, MessageCircle, ScrollText, type LucideIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import Logo from "./Logo";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";

type NavKey = "home" | "quran" | "hadith" | "ask" | "topics" | "start" | "more" | "support";

// sidebarOnly: shown in the desktop sidebar, left out of the phone tab bar (reachable via More there).
const items: { key: NavKey; path: string; Icon: LucideIcon; sidebarOnly?: boolean }[] = [
  { key: "home", path: "", Icon: House },
  { key: "quran", path: "/quran", Icon: BookOpen },
  { key: "hadith", path: "/hadith", Icon: ScrollText },
  { key: "ask", path: "/ask", Icon: MessageCircle },
  { key: "topics", path: "/topics", Icon: CircleHelp, sidebarOnly: true },
  { key: "start", path: "/start", Icon: Compass, sidebarOnly: true },
  { key: "support", path: "/support", Icon: HeartHandshake, sidebarOnly: true },
  { key: "more", path: "/more", Icon: Ellipsis },
];

// Phone tab bar: five buttons with Ask raised in the middle. Everything else is on the More page.
const PHONE_ORDER: NavKey[] = ["home", "quran", "ask", "hadith", "more"];
const phoneItems = PHONE_ORDER.map((key) => items.find((item) => item.key === key)!);
// The pages reached through More keep the More button lit.
const MORE_PATHS = ["/more", "/topics", "/start", "/support"];

export default function Shell({
  lang,
  nav,
  brandAr,
  langLabel,
  themeLabels,
  children,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  brandAr: string;
  langLabel: string;
  themeLabels?: { light: string; dark: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${lang}`;
  const sub = pathname.slice(base.length) || "";
  const isActive = (path: string) => (path === "" ? sub === "" : sub === path || sub.startsWith(`${path}/`));
  // Ask brings its own header and composer, so on a phone it gets the full screen.
  const onAsk = isActive("/ask");

  return (
    <div className={`shell${onAsk ? " shell--ask" : ""}`}>
      <aside className="sidebar">
        <Link href={base} className="sidebar-brand" aria-label="Bayan">
          <Logo brandAr={brandAr} />
        </Link>
        <nav aria-label={nav.label} className="sidebar-nav">
          {items.map(({ key, path, Icon }) => (
            <Link key={key} href={`${base}${path}`} aria-current={isActive(path) ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span>{nav[key]}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ThemeToggle labels={themeLabels} />
          <LangSwitch lang={lang} label={langLabel} />
        </div>
      </aside>

      <header className="topbar">
        <Link href={base} aria-label="Bayan">
          <Logo brandAr={brandAr} />
        </Link>
        <ThemeToggle labels={themeLabels} />
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>

      <nav aria-label={nav.label} className="tabbar">
        {phoneItems.map(({ key, path, Icon }) => (
          <Link key={key} href={`${base}${path}`} className={key === "ask" ? "tab-ask" : undefined}
            aria-current={(key === "more" ? MORE_PATHS.some(isActive) : isActive(path)) ? "page" : undefined}>
            {key === "ask" ? <span className="tab-ask-bubble"><Icon aria-hidden="true" /></span> : <Icon aria-hidden="true" />}
            <span>{nav[key]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
