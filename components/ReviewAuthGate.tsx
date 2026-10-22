"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { browserSupabase } from "@/lib/supabase-browser";
import { isTeamUser } from "./TeamReviewSection";

const LABELS: Record<Locale, { title: string; subtitle: string; signIn: string; back: string }> = {
  en: {
    title: "Team Access Only",
    subtitle: "This internal review section is restricted to authorized Bayan team members.",
    signIn: "Sign in with team account",
    back: "Back to More",
  },
  ar: {
    title: "خاص بفريق العمل فقط",
    subtitle: "هذا القسم الداخلي مخصص لأعضاء فريق بيان المصرح لهم فقط.",
    signIn: "تسجيل الدخول بحساب الفريق",
    back: "العودة للمزيد",
  },
  de: {
    title: "Nur für Team-Mitglieder",
    subtitle: "Dieser interne Prüfbereich ist autorisierten Bayan-Teammitgliedern vorbehalten.",
    signIn: "Mit Team-Konto anmelden",
    back: "Zurück zu Mehr",
  },
};

export default function ReviewAuthGate({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const t = LABELS[lang] ?? LABELS.en;

  useEffect(() => {
    const supabase = browserSupabase();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (isTeamUser(data.session?.user)) {
        setStatus("authorized");
      } else {
        setStatus("unauthorized");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isTeamUser(session?.user)) {
        setStatus("authorized");
      } else {
        setStatus("unauthorized");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <article className="page">
        <p className="muted" role="status" style={{ paddingBlock: "32px", textAlign: "center" }}>
          Verifying team access...
        </p>
      </article>
    );
  }

  if (status === "unauthorized") {
    return (
      <article className="page">
        <Link href={`/${lang}/more`} className="back-link">
          <ArrowLeft aria-hidden="true" className="flip-rtl" />
          {t.back}
        </Link>
        <div
          className="card"
          style={{
            display: "grid",
            gap: "16px",
            padding: "32px 24px",
            textAlign: "center",
            justifyItems: "center",
            marginBlockStart: "24px",
          }}
        >
          <div
            style={{
              inlineSize: "52px",
              blockSize: "52px",
              borderRadius: "50%",
              background: "#fbefee",
              color: "#8a2a22",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShieldAlert size={28} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: "var(--fs-xl)" }}>{t.title}</h1>
          <p className="muted" style={{ maxInlineSize: "420px" }}>
            {t.subtitle}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href={`/${lang}/account`} className="btn btn-primary">
              <Lock size={16} aria-hidden="true" />
              {t.signIn}
            </Link>
            <Link href={`/${lang}/more`} className="btn">
              {t.back}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return <>{children}</>;
}
