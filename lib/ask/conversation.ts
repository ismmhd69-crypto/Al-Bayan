// Only visitor messages travel with a follow-up. Previous AI replies are never evidence.
export const MAX_HISTORY = 4;
export const MAX_USER_MESSAGE = 500;
export const MAX_ASK_BODY_BYTES = 12_288;
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

export function previousUserMessages(messages: { role: string; text?: string }[]): string[] {
  return messages.filter((message) => message.role === "user" && typeof message.text === "string")
    .slice(-MAX_HISTORY).map((message) => message.text!.slice(0, MAX_USER_MESSAGE));
}
