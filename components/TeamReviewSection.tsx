"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { browserSupabase } from "@/lib/supabase-browser";

const LABELS: Record<Locale, { eyebrow: string; title: string; note: string; badge: string }> = {
  en: {
    eyebrow: "Team member access",
    title: "Problem reports & review",
    note: "View submitted problem reports and review answers",
    badge: "Team",
  },
  ar: {
    eyebrow: "صلاحيات فريق العمل",
    title: "البلاغات ومراجعة الإجابات",
    note: "متابعة بلاغات المستخدمين ومراجعة الإجابات",
    badge: "فريق",
  },
  de: {
    eyebrow: "Team-Zugang",
    title: "Problemmeldungen & Prüfung",
    note: "Eingegangene Meldungen und Antworten prüfen",
    badge: "Team",
  },
};

export function isTeamUser(user: { email?: string | null; app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  if (!user || !user.email) return false;
  if (user.email.toLowerCase() === "mo.issmail@gmail.com") return true;
  if (user.app_metadata?.team_member === true) return true;
  if (user.app_metadata?.role === "team_member") return true;
  return false;
}

export default function TeamReviewSection({ lang }: { lang: Locale }) {
  const [isTeam, setIsTeam] = useState(false);
  const t = LABELS[lang] ?? LABELS.en;

  useEffect(() => {
    const supabase = browserSupabase();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setIsTeam(isTeamUser(data.session?.user));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsTeam(isTeamUser(session?.user));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!isTeam) return null;

  return (
    <section className="topic-group" aria-label={t.eyebrow} style={{ marginBlockEnd: "16px" }}>
      <h2 className="eyebrow" style={{ color: "var(--accent)", fontWeight: 700 }}>
        {t.eyebrow}
      </h2>
      <ul className="list" style={{ border: "1px solid var(--accent-line)", background: "var(--surface)" }}>
        <li>
          <Link
            href={`/${lang}/review?kind=reports`}
            className="list-row"
            style={{
              background: "var(--accent-soft)",
              borderInlineStart: "4px solid var(--accent)",
            }}
          >
            <ShieldCheck aria-hidden="true" className="row-icon" style={{ color: "var(--accent)" }} />
            <span>
              <span className="list-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-hover)" }}>
                {t.title}
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "2px 6px",
                    background: "var(--accent)",
                    color: "#ffffff",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  {t.badge}
                </span>
              </span>
              <span className="list-sub" style={{ color: "var(--ink-2)" }}>
                {t.note}
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="flip-rtl" style={{ color: "var(--accent)" }} />
          </Link>
        </li>
      </ul>
    </section>
  );
}
