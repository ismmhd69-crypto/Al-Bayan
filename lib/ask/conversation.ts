// Only visitor messages travel with a follow-up. Previous AI replies are never evidence.
export const MAX_HISTORY = 4;
export const MAX_USER_MESSAGE = 500;
export const MAX_ASK_BODY_BYTES = 12_288;
// Never truncate signed sentences. If the optional parent will not fit, tell the
// server it is unavailable, so a dependent request can clarify instead of guessing.
export function parentRequestBody(body: Record<string, unknown>, parent?: { ref: string; sentences: string[] }) {
  const full = JSON.stringify({ ...body, ...(parent ? { parent } : {}) });
  return parent && new TextEncoder().encode(full).length > MAX_ASK_BODY_BYTES
    ? JSON.stringify({ ...body, parent: { ref: "", sentences: [] } }) : full;
}
// Clarification labels have no independent source check. Render only these reviewed neutral
// topic names, never a free-form model statement. Other ambiguities request typed detail.
const TOPIC_NAMES = {
  charity: { en: "Voluntary charity", de: "Freiwillige Spende", ar: "صدقة التطوع" },
  zakat: { en: "Zakat", de: "Zakat", ar: "الزكاة" },
};
export function safeClarificationChoices(labels: string[], lang: "en" | "de" | "ar"): string[] {
  const choices = labels.map((label) => {
    if (/^(voluntary charity|freiwillige spende[n]?|صدقة التطوع|الصدقة التطوعية)$/iu.test(label)) return TOPIC_NAMES.charity[lang];
    if (/^(obligatory zakat|zakat|zakah|verpflichtende zakat|الزكاة|زكاة المال|الزكاة الواجبة)$/iu.test(label)) return TOPIC_NAMES.zakat[lang];
    return null;
  });
  return choices.length === 2 && choices.every((choice) => choice !== null) && new Set(choices).size === 2 ? choices as string[] : [];
}

export function parseUserHistory(raw: unknown): string[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_HISTORY) return null;
  if (!raw.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= MAX_USER_MESSAGE)) return null;
  return raw.map((item: string) => item.trim());
}

/** A whole message that is only thanks, inside a chat. It gets a fixed reply and no paid research. */
export function socialMessage(message: string): boolean {
  const text = message.normalize("NFC").toLowerCase().replace(/[ً-ٰٟ]/g, "").replace(/[.!،,\s]+$/u, "").replace(/\s+/g, " ").trim();
  return /^(?:ok(?:ay)?,? )?(?:thanks|thank you|thank u|thx)(?: (?:so much|very much|a lot))?$|^(?:jazak ?allahu? ?kh?a[iy]r(?:an)?|barak ?allahu? ?fee?k(?:um)?|may allah reward you)$/.test(text)
    || /^(?:شكرا(?: لك| لكم| جزيلا)?|جزاك(?:م)? الله خيرا|بارك الله فيك(?:م)?|[أا]حسنت)$/u.test(text);
}

// Thanks carries no question, so it never takes one of the few earlier messages the planner reads.
export function previousUserMessages(messages: { role: string; text?: string }[]): string[] {
  return messages.filter((message) => message.role === "user" && typeof message.text === "string" && !socialMessage(message.text))
    .slice(-MAX_HISTORY).map((message) => message.text!.slice(0, MAX_USER_MESSAGE));
}
