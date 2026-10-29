"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { AuthText } from "@/lib/auth-text";
import { browserSupabase } from "@/lib/supabase-browser";
import { deleteAllChats, exportChats } from "@/lib/chat/chats";
import { exportResearchRequests } from "@/lib/chat/research-export";
import { buildAccountExport } from "@/lib/chat/account-export";
import { isTeamUser } from "./TeamReviewSection";
import styles from "./AuthPanel.module.css";

type Mode = "signin" | "signup" | "forgot" | "reset";
type Note = { kind: "ok" | "error"; text: string } | null;

const MIN_PASSWORD = 8;
const isRateLimit = (e: { code?: string } | null) => e?.code === "over_email_send_rate_limit";
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Optional account: sign in with Google, or email plus password (sign in, create an account, forgot password).
// Bayan works fully without it. Never says whether an email already has an account.
export default function AuthPanel({ lang, t, researchPrivacyEnabled = false }: { lang: Locale; t: AuthText; researchPrivacyEnabled?: boolean }) {
  const uid = useId();
  const [mode, setMode] = useState<Mode>("signin");
  const [user, setUser] = useState<{ email: string; app_metadata?: Record<string, unknown> } | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<"chats" | "account" | null>(null);

  useEffect(() => {
    const supabase = browserSupabase();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ? { email: data.session.user.email ?? "", app_metadata: data.session.user.app_metadata } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? { email: session.user.email ?? "", app_metadata: session.user.app_metadata } : null);
      // The link in the "forgot password" email brings the person back here to choose a new one.
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setNote(null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const go = (next: Mode) => {
    setMode(next);
    setNote(null);
    setNeedsConfirm(false);
    setPassword("");
    setShowPassword(false);
  };
  const origin = () => `${window.location.origin}/${lang}/account`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const address = email.trim();
    setNote(null);
    setNeedsConfirm(false);
    if (mode !== "reset" && !looksLikeEmail(address)) return setNote({ kind: "error", text: t.invalidEmail });
    if ((mode === "signup" || mode === "reset") && password.length < MIN_PASSWORD) return setNote({ kind: "error", text: t.weakPassword });
    if (mode === "signup" && !consent) return setNote({ kind: "error", text: t.consentRequired });

    setBusy(true);
    const supabase = browserSupabase();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) {
          if (error.code === "email_not_confirmed") {
            setNeedsConfirm(true);
            setNote({ kind: "error", text: t.notConfirmed });
          } else {
            setNote({ kind: "error", text: error.code === "invalid_credentials" ? t.wrongLogin : t.error });
          }
        } else {
          setPassword("");
        }
      } else if (mode === "signup") {
        // The consent (when, in which language) is kept with the account.
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: origin(), data: { consent_at: new Date().toISOString(), consent_lang: lang } },
        });
        if (error) setNote({ kind: "error", text: error.code === "weak_password" ? t.weakPassword : isRateLimit(error) ? t.tooMany : t.error });
        else {
          setPassword("");
          // With email confirmation off, the account is signed in at once and the signed-in view shows.
          // With it on (needed before launch), the person must confirm by email first.
          if (!data.session) setNote({ kind: "ok", text: t.checkEmail });
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: origin() });
        // Same message whether or not the email has an account.
        setNote(isRateLimit(error) ? { kind: "error", text: t.tooMany } : error && error.status !== 400 ? { kind: "error", text: t.error } : { kind: "ok", text: t.resetSent });
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) setNote({ kind: "error", text: error.code === "weak_password" ? t.weakPassword : t.error });
        else {
          setPassword("");
          setMode("signin");
          setNote({ kind: "ok", text: t.passwordChanged });
        }
      }
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  // Google sign-in (Mo, 2026-10-29). Supabase sends the person to Google and back to this account page,
  // where the browser client finishes the sign-in from the address (detectSessionInUrl).
  async function google() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    const { error } = await browserSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin() } });
    if (error) { setNote({ kind: "error", text: t.error }); setBusy(false); }
  }

  async function resend() {
    setBusy(true);
    try {
      const { error } = await browserSupabase().auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: origin() } });
      setNote({ kind: error ? "error" : "ok", text: error ? (isRateLimit(error) ? t.tooMany : t.error) : t.confirmationResent });
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  // Your data: download it, delete the chats, or delete the whole account (the server removes everything saved).
  async function exportData() {
    setBusy(true);
    setNote(null);
    try {
      const supabase = browserSupabase();
      const file = await buildAccountExport({
        session: async () => (await supabase.auth.getSession()).data.session,
        userFor: async token => { const { data, error } = await supabase.auth.getUser(token); return error ? null : data.user; },
        chats: token => exportChats({ accessToken: token }), research: exportResearchRequests,
      });
      const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "bayan-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  async function removeChats() {
    setConfirmDelete(null);
    setBusy(true);
    try {
      await deleteAllChats();
      setNote({ kind: "ok", text: t.chatsDeleted });
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount() {
    setConfirmDelete(null);
    setBusy(true);
    try {
      const supabase = browserSupabase();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("not signed in");
      const res = await fetch("/api/account/delete", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("delete failed");
      await supabase.auth.signOut();
      go("signin");
      setNote({ kind: "ok", text: t.accountDeleted });
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await browserSupabase().auth.signOut();
    go("signin");
  }

  if (user === undefined) return <p role="status" className="muted">{t.working}</p>;

  // Signed in (and not in the middle of choosing a new password).
  if (user && mode !== "reset") {
    return (
      <div className={styles.panel}>
        {note && <p role="status" className={`${styles.message} ${styles[note.kind]}`}>{note.text}</p>}
        <div className={styles.form}>
          <p>
            {t.signedInAs} <span className={styles.who}>{user.email}</span>
          </p>
          <p className="muted">{t.saved}</p>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            {t.signOut}
          </button>
        </div>

        {isTeamUser(user) && (
          <div className={styles.form} style={{ borderInlineStart: "4px solid var(--accent)", background: "var(--accent-soft)" }}>
            <h2 style={{ fontSize: "var(--fs-lg)", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-hover)" }}>
              <ShieldCheck size={20} aria-hidden="true" style={{ color: "var(--accent)" }} />
              Team Member Portal
            </h2>
            <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
              You are recognized as an authorized Bayan team member.
            </p>
            <Link href={`/${lang}/review?kind=reports`} className="btn btn-primary" style={{ textAlign: "center" }}>
              View Problem Reports & Review
            </Link>
          </div>
        )}

        <div className={styles.form}>
          <h2>{t.yourData}</h2>
          {researchPrivacyEnabled && <p>{t.researchPrivacy}</p>}
          <button type="button" className="btn btn-ghost" onClick={exportData} disabled={busy}>
            {t.exportData}
          </button>
          {confirmDelete === "chats" ? (
            <div role="group" aria-label={t.deleteChatsAsk} className={styles.confirm}>
              <p>{t.deleteChatsAsk}</p>
              <div className={styles.confirmRow}>
                <button type="button" className={`btn btn-ghost ${styles.danger}`} onClick={removeChats}>{t.deleteYes}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>{t.deleteNo}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete("chats")} disabled={busy}>
              {t.deleteChats}
            </button>
          )}
          {confirmDelete === "account" ? (
            <div role="group" aria-label={t.deleteAccountAsk} className={styles.confirm}>
              <p>{t.deleteAccountAsk}</p>
              <div className={styles.confirmRow}>
                <button type="button" className={`btn btn-ghost ${styles.danger}`} onClick={removeAccount}>{t.deleteYes}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>{t.deleteNo}</button>
              </div>
            </div>
          ) : (
            <button type="button" className={`btn btn-ghost ${styles.danger}`} onClick={() => setConfirmDelete("account")} disabled={busy}>
              {t.deleteAccount}
            </button>
          )}
        </div>
      </div>
    );
  }

  const title = mode === "signin" ? t.signInTitle : mode === "signup" ? t.signUpTitle : mode === "forgot" ? t.forgotTitle : t.resetTitle;
  const submitLabel = mode === "signin" ? t.signIn : mode === "signup" ? t.createAccount : mode === "forgot" ? t.sendReset : t.saveNewPassword;
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const consentId = `${uid}-consent`;

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <h2>{title}</h2>

        {(mode === "signin" || mode === "signup") && <>
          <button type="button" className={`btn ${styles.google}`} onClick={() => void google()} disabled={busy}>
            <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            {t.google}
          </button>
          <p className={styles.hint}>{t.googleNote} <Link href={`/${lang}/privacy`} className={styles.link}>{t.privacyLink}</Link></p>
          <p className={styles.divider}><span>{t.orEmail}</span></p>
        </>}

        {mode !== "reset" && (
          <div className={styles.field}>
            <label htmlFor={emailId}>{t.email}</label>
            <input
              id={emailId}
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {mode !== "forgot" && (
          <div className={styles.field}>
            <label htmlFor={passwordId}>{mode === "reset" ? t.newPassword : t.password}</label>
            <div className={styles.passwordRow}>
              <input
                id={passwordId}
                className={styles.input}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby={mode === "signin" ? undefined : `${passwordId}-hint`}
              />
              <button type="button" className={styles.toggle} onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.hide : t.show}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
            {mode !== "signin" && <p id={`${passwordId}-hint`} className={styles.hint}>{t.passwordHint}</p>}
          </div>
        )}

        {mode === "signup" && (
          <div className={styles.consent}>
            <input id={consentId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <label htmlFor={consentId}>
              {t.consent}{" "}
              <Link href={`/${lang}/privacy`} className={styles.link}>
                {t.privacyLink}
              </Link>
            </label>
          </div>
        )}

        {note && (
          <p role={note.kind === "error" ? "alert" : "status"} className={`${styles.message} ${styles[note.kind]}`}>
            {note.text}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t.working : submitLabel}
        </button>

        {needsConfirm && (
          <button type="button" className={styles.link} onClick={resend} disabled={busy}>
            {t.resend}
          </button>
        )}

        <div className={styles.links}>
          {mode === "signin" && (
            <>
              <button type="button" className={styles.link} onClick={() => go("forgot")}>{t.forgot}</button>
              <button type="button" className={styles.link} onClick={() => go("signup")}>{t.noAccount}</button>
            </>
          )}
          {mode === "signup" && <button type="button" className={styles.link} onClick={() => go("signin")}>{t.haveAccount}</button>}
          {(mode === "forgot" || mode === "reset") && <button type="button" className={styles.link} onClick={() => go("signin")}>{t.back}</button>}
        </div>
      </form>
    </div>
  );
}
