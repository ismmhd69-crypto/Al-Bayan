// Hands a question from Home or a topic page to the Ask screen on this device only,
// so the question never appears in the web address (privacy rule, plan section 10).
const KEY = "bayan:pending-question";

export function setPendingQuestion(question: string) {
  try {
    sessionStorage.setItem(KEY, question);
  } catch {
    // Storage blocked: Ask simply opens empty.
  }
}

export function takePendingQuestion(): string | null {
  try {
    const q = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return q;
  } catch {
    return null;
  }
}
