"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, UserRound } from "lucide-react";
import { browserSupabase } from "@/lib/supabase-browser";

// The account row on the More page: "Sign in" when signed out, the account's email when signed in.
export default function AccountRow({
  href,
  signInTitle,
  signInNote,
  accountTitle,
}: {
  href: string;
  signInTitle: string;
  signInNote: string;
  accountTitle: string;
}) {
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

  return (
    <Link href={href} className="list-row">
      <UserRound aria-hidden="true" className="row-icon" />
      <span>
        <span className="list-title">{email ? accountTitle : signInTitle}</span>
        <span className="list-sub" dir={email ? "ltr" : undefined}>{email ?? signInNote}</span>
      </span>
      <ChevronRight aria-hidden="true" className="flip-rtl" />
    </Link>
  );
}
