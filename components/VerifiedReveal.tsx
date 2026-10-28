"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { RichGroup } from "@/lib/ask/rich-answer";
import styles from "./StableAnswerView.module.css";
export type TextSlice = { text: string; glyphs: string[]; start: number; group: RichGroup };
export type RevealState = { texts: Record<string, TextSlice>; counts: Partial<Record<RichGroup, number>> };
export const RevealContext = createContext<RevealState | null>(null);
export function graphemes(text: string, language: string): string[] {
  return Array.from(new Intl.Segmenter(language, { granularity: "grapheme" }).segment(text), s => s.segment);
}
export function VerifiedText({ id, children }: { id: string; children: string }) {
  const state = useContext(RevealContext), slice = state?.texts[id];
  if (!state || !slice) return children;
  const count = Math.max(0, (state.counts[slice.group] ?? 0) - slice.start);
  return <><span className={styles.reservedText} aria-hidden="true"><span className={styles.textSizer}>{children}</span><span className={styles.textReveal}>{slice.glyphs.slice(0, count).join("")}</span></span><span className="sr-only">{children}</span></>;
}
export function RevealBlock({ id, children }: { id: string; children: ReactNode }) {
  const state = useContext(RevealContext), slice = state?.texts[id];
  if (slice && (state?.counts[slice.group] ?? 0) <= slice.start) return null;
  return children;
}
export function AfterVerifiedText({ id, children }: { id: string; children: ReactNode }) {
  const state = useContext(RevealContext), slice = state?.texts[id];
  if (slice && (state?.counts[slice.group] ?? 0) < slice.start + slice.glyphs.length) return null;
  return children;
}
