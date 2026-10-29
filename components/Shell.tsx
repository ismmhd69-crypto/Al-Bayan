"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, ChevronRight, CircleHelp, Compass, Ellipsis, Globe, HeartHandshake, House, MessageCircle, ScrollText, UserRound, X, type LucideIcon } from "lucide-react";
import { localeNames, type Dictionary, type Locale } from "@/lib/i18n";
import { savedText } from "@/lib/saved/text";
import { useSaved } from "@/lib/saved/useSaved";
import { authText } from "@/lib/auth-text";
import { browserSupabase } from "@/lib/supabase-browser";
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

// Phone tab bar: five buttons with Ask raised in the middle. More opens a sheet with the rest.
const PHONE_ORDER: NavKey[] = ["home", "quran", "ask", "hadith", "more"];
const phoneItems = PHONE_ORDER.map((key) => items.find((item) => item.key === key)!);
// The pages reached through More keep the More button lit.
const MORE_PATHS = ["/more", "/topics", "/start", "/support", "/account"];
const CLOSE_LABEL: Record<Locale, string> = { ar: "إغلاق", en: "Close", de: "Schließen" };
// Dragging the sheet's top area down by this much (or flicking it down) closes it.
const DRAG_CLOSE_PX = 80;

export default function Shell({
  lang,
  nav,
  brandAr,
  langLabel,
  themeLabels,
  moreLabels,
  children,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  brandAr: string;
  langLabel: string;
  themeLabels?: { light: string; dark: string };
  moreLabels: { title: string; settings: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${lang}`;
  const sub = pathname.slice(base.length) || "";
  const isActive = (path: string) => (path === "" ? sub === "" : sub === path || sub.startsWith(`${path}/`));
  // Ask brings its own header and composer, so on a phone it gets the full screen.
  const onAsk = isActive("/ask");
  const onAccount = isActive("/account");

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = browserSupabase();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const tAuth = authText[lang] ?? authText.en;
  const initial = (email?.[0] || "U").toUpperCase();

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  // A native modal dialog gives focus trapping, Escape to close and the backdrop for free.
  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (sheetOpen && !dialog.open) dialog.showModal();
    if (!sheetOpen && dialog.open) dialog.close();
    dialog.style.transform = "";
  }, [sheetOpen]);
  // Drag down to close, from the handle and title row. The sheet follows the finger, then
  // either closes or springs back.
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    sheet.current?.classList.add("more-sheet--dragging");
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !sheet.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    sheet.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !sheet.current) return;
    sheet.current.classList.remove("more-sheet--dragging");
    const flick = d.dy > 24 && d.dy / Math.max(1, e.timeStamp - d.t) > 0.5;
    if (d.dy > DRAG_CLOSE_PX || flick) setSheetOpen(false);
    else sheet.current.style.transform = "";
  };
  const saved = useSaved();
  const sheetRows: { href: string; label: string; Icon: LucideIcon; note?: string }[] = [
    {
      href: `${base}/account`,
      label: email ? tAuth.title : tAuth.signIn,
      Icon: UserRound,
      note: email ?? undefined,
    },
    { href: `${base}/saved`, label: savedText[lang].title, Icon: Bookmark, note: saved.items.length ? String(saved.items.length) : undefined },
    { href: `${base}/topics`, label: nav.topics, Icon: CircleHelp },
    { href: `${base}/start`, label: nav.start, Icon: Compass },
    { href: `${base}/support`, label: nav.support, Icon: HeartHandshake },
    { href: `${base}/more`, label: moreLabels.settings, Icon: Globe, note: localeNames[lang] },
  ];

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
          <Link
            href={`${base}/account`}
            className={`sidebar-account-btn${email ? " sidebar-account-btn--signed-in" : ""}`}
            aria-current={onAccount ? "page" : undefined}
          >
            {email ? (
              <>
                <span className="sidebar-avatar" aria-hidden="true">{initial}</span>
                <span className="sidebar-account-info">
                  <span className="sidebar-account-title">{tAuth.title}</span>
                  <span className="sidebar-account-email" dir="ltr">{email}</span>
                </span>
                <ChevronRight aria-hidden="true" className="flip-rtl sidebar-account-arrow" />
              </>
            ) : (
              <>
                <UserRound aria-hidden="true" className="sidebar-account-icon" />
                <span className="sidebar-account-text">{tAuth.signIn}</span>
                <ChevronRight aria-hidden="true" className="flip-rtl sidebar-account-arrow" />
              </>
            )}
          </Link>
          <ThemeToggle labels={themeLabels} />
          <LangSwitch lang={lang} label={langLabel} />
        </div>
      </aside>

      <header className="topbar">
        <Link href={base} aria-label="Bayan">
          <Logo brandAr={brandAr} />
        </Link>
        <div className="topbar-actions">
          <Link
            href={`${base}/account`}
            className="topbar-account-btn"
            aria-label={email ? tAuth.title : tAuth.signIn}
            aria-current={onAccount ? "page" : undefined}
          >
            {email ? (
              <span className="topbar-avatar" aria-hidden="true">{initial}</span>
            ) : (
              <UserRound aria-hidden="true" className="topbar-account-icon" />
            )}
          </Link>
          <ThemeToggle labels={themeLabels} />
        </div>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>

      <nav aria-label={nav.label} className="tabbar">
        {phoneItems.map(({ key, path, Icon }) => key === "more" ? (
          <button key={key} type="button" className="tab-more" aria-haspopup="dialog" aria-expanded={sheetOpen}
            aria-current={MORE_PATHS.some(isActive) ? "page" : undefined} onClick={() => setSheetOpen(true)}>
            <Icon aria-hidden="true" />
            <span>{nav[key]}</span>
          </button>
        ) : (
          <Link key={key} href={`${base}${path}`} className={key === "ask" ? "tab-ask" : undefined}
            aria-current={isActive(path) ? "page" : undefined}>
            {key === "ask" ? <span className="tab-ask-bubble"><Icon aria-hidden="true" /></span> : <Icon aria-hidden="true" />}
            <span>{nav[key]}</span>
          </Link>
        ))}
      </nav>

      <dialog ref={sheet} className="more-sheet" aria-labelledby="more-sheet-title"
        onClose={() => setSheetOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}>
        <div className="more-sheet-head" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
          <div className="more-sheet-grab" aria-hidden="true" />
          <div className="more-sheet-title">
            <h2 id="more-sheet-title">{moreLabels.title}</h2>
            <button type="button" className="more-sheet-close" aria-label={CLOSE_LABEL[lang]} onClick={() => setSheetOpen(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
        <ul>
          {sheetRows.map(({ href, label, Icon, note }) => (
            <li key={href}>
              <Link href={href} onClick={() => setSheetOpen(false)} aria-current={sub === href.slice(base.length) ? "page" : undefined}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {note ? <small>{note}</small> : <ChevronRight aria-hidden="true" className="flip-rtl" />}
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
