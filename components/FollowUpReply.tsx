"use client";
import { RichAnswerView } from "./RichAnswerView";
import { richFailureKind, type RichAnswer, type RichStreamState } from "@/lib/ask/rich-answer";
import type { ConversationMode } from "@/lib/ask/follow-up";
import { richText } from "@/lib/ask/rich-text";
import { researchFailureText } from "@/lib/ask/research-failure-text";
import type { Dictionary, Locale } from "@/lib/i18n";
import styles from "./StableAnswerView.module.css";

/** The mode of a follow-up reply: from the finished answer when there is one, else from the stream. */
export function conversationalOf(state: RichStreamState): ConversationMode | undefined {
  const result = state.result as { status?: string; answer?: RichAnswer } | undefined;
  return (result?.status === "rich_answer" ? result.answer?.conversational : undefined) ?? state.conversational;
}

/** A follow-up reads like a chat message (Mo, 2026-10-31): natural text with small source links.
 * Sources already shown in the chat are not repeated as cards. Nothing appears before the final review passes. */
export function FollowUpReply({ state, mode, language, text, working, repeated, saveSlot }: {
  state: RichStreamState; mode: ConversationMode; language: Locale; text: Dictionary["ask"]; working: boolean; repeated: Set<string>; saveSlot?: React.ReactNode;
}) {
  const copy = richText[language];
  const result = state.result as { status?: string; answer?: RichAnswer } | undefined;
  if (state.terminal && result?.status === "rich_answer" && result.answer)
    return <RichAnswerView sections={result.answer.sections} language={result.answer.language} text={text} guide={null} complete conversational={{ repeated }} saveSlot={saveSlot} />;
  if (working || !state.terminal) return <div className={`${styles.gapLoader} ${styles.summary}`} role="status" aria-live="polite" dir={language === "ar" ? "rtl" : "ltr"}>
    <span className={styles.spinner} aria-hidden="true" /><div><strong>{state.progress === "correcting_summary" ? copy.progress.correcting_summary : copy.progress[mode === "explain" ? "follow_up_explain" : "follow_up_search"]}</strong></div>
  </div>;
  const kind = richFailureKind(state.result);
  // Connection and allowance problems keep their own wording; anything else is an honest "could not reword".
  const transient = kind && ["connection_interrupted", "transport_failure", "spending_limit", "billing_uncertain", "research_running"].includes(kind) ? researchFailureText(language, kind) : null;
  // A search follow-up that found nothing on the new point says so, and never repeats the earlier answer.
  return <p role="status" dir={language === "ar" ? "rtl" : "ltr"}>{kind === "cancelled" ? copy.followUpStopped : transient || (mode === "look_further" ? copy.followUpNotFound : copy.followUpFailed)}</p>;
}
