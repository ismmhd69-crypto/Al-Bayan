// Known disagreements stay unavailable until a real reviewed view decision supplies the main view
// and the checked other-view material required by AnswerV2. Retrieval count never chooses a winner.
export const PREPARED_IDS_AWAITING_VIEW_DECISION = new Set(["is-music-haram"]);

// Music was removed (Mo, 2026-10-30): the approved scholars in the library agree, so Ask answers it with
// named, linked sources. Its prepared page above stays held until Mo reviews it.
const UNRESOLVED_RULING_TOPICS = [
  /\b(?:tawassul)\b|التوسل/iu,
];

export function asksKnownUnresolvedView(question: string, questionType: string): boolean {
  if (!["ruling", "evidence", "reason", "comparison"].includes(questionType)) return false;
  return UNRESOLVED_RULING_TOPICS.some((pattern) => pattern.test(question));
}
