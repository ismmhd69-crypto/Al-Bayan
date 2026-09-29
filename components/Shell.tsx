"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Compass, Ellipsis, HeartHandshake, House, MessageCircle, type LucideIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import Logo from "./Logo";
import LangSwitch from "./LangSwitch";

type NavKey = "home" | "ask" | "topics" | "start" | "more" | "support";

// sidebarOnly: shown in the desktop sidebar, left out of the phone tab bar (reachable via More there).
const items: { key: NavKey; path: string; Icon: LucideIcon; sidebarOnly?: boolean }[] = [
  { key: "home", path: "", Icon: House },
  { key: "ask", path: "/ask", Icon: MessageCircle },
  { key: "topics", path: "/topics", Icon: CircleHelp },
  { key: "start", path: "/start", Icon: Compass },
  { key: "support", path: "/support", Icon: HeartHandshake, sidebarOnly: true },
  { key: "more", path: "/more", Icon: Ellipsis },
];

export default function Shell({
  lang,
  nav,
  brandAr,
  langLabel,
  children,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  brandAr: string;
  langLabel: string;
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
          <LangSwitch lang={lang} label={langLabel} />
        </div>
      </aside>

      <header className="topbar">
        <Link href={base} aria-label="Bayan">
          <Logo brandAr={brandAr} />
        </Link>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>

      <nav aria-label={nav.label} className="tabbar">
        {items
          .filter((item) => !item.sidebarOnly)
          .map(({ key, path, Icon }) => (
            <Link key={key} href={`${base}${path}`} aria-current={isActive(path) ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span>{nav[key]}</span>
            </Link>
          ))}
      </nav>
    </div>
  );
}
