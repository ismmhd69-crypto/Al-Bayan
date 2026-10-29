import type { Locale } from "@/lib/i18n";
import type { RichFailureKind } from "./rich-answer";
const messages = {
  en: {
    selection_failure: "Source selection returned an invalid or inconsistent assessment. Available source sections are kept; the summary could not proceed.",
    source_revalidation_unavailable: "A saved source or its context could not be rechecked. The available sources are kept above; the summary is paused until this check can succeed.",
    checkpoint_incompatible: "This saved research can no longer be continued because it expired or the research settings changed. Checked sections are kept. No new research was started.",
    connection_interrupted: "The connection was interrupted before research finished. Checked sections are kept. Continue from the available work when possible.",
    cancelled: "You stopped this answer. Checked sections are kept.",
    wording_rejected: "The conclusion could not finish its wording checks. Checked source explanations are kept above.",
    spending_limit: "Research reached its spending or request allowance. Checked sections are kept; no final conclusion was approved.",
    billing_uncertain: "Research is waiting for an earlier request's cost to be confirmed. Checked sections are kept; no new paid request was made.",
    transport_failure: "A research service connection failed. Checked sections are kept; the final answer was not completed.",
    research_running: "This question is already being researched in another window or request. No second research was started. Use Check status to see when it finishes.",
  },
  ar: {
    selection_failure: "تعذّر اعتماد تقييم اختيار المصادر لوجود خطأ أو تناقض فيه. احتُفظ بأقسام المصادر المتاحة، ولم تكتمل الخلاصة.",
    source_revalidation_unavailable: "تعذّرت إعادة التحقق من مصدر محفوظ أو سياقه. احتُفظ بالمصادر المتاحة أعلاه، وتوقفت الخلاصة إلى أن ينجح التحقق.",
    checkpoint_incompatible: "تعذّرت متابعة البحث المحفوظ لانتهاء صلاحيته أو تغيّر إعدادات البحث. احتُفظ بالأقسام التي اجتازت التحقق، ولم يبدأ بحث جديد.",
    connection_interrupted: "انقطع الاتصال قبل اكتمال البحث. احتُفظ بالأقسام التي اجتازت التحقق. يمكنك متابعة العمل المتاح متى أمكن.",
    cancelled: "أوقفت هذه الإجابة. احتُفظ بالأقسام التي اجتازت التحقق.",
    wording_rejected: "لم تكتمل مراجعة صياغة الخلاصة. احتُفظ بشروح المصادر التي اجتازت التحقق أعلاه.",
    spending_limit: "بلغ البحث حد الإنفاق أو عدد الطلبات المسموح به. احتُفظ بالأقسام التي اجتازت التحقق، ولم تُعتمد خلاصة نهائية.",
    billing_uncertain: "ينتظر البحث تأكيد تكلفة طلب سابق. احتُفظ بالأقسام التي اجتازت التحقق، ولم يُرسل طلب مدفوع جديد.",
    transport_failure: "تعذّر الاتصال بإحدى خدمات البحث. احتُفظ بالأقسام التي اجتازت التحقق، ولم تكتمل الإجابة النهائية.",
    research_running: "يجري البحث في هذا السؤال بالفعل في نافذة أو طلب آخر، ولم يبدأ بحث ثانٍ. استخدم زر التحقق من الحالة لمعرفة متى ينتهي.",
  },
  de: {
    selection_failure: "Die Quellenauswahl lieferte eine ungültige oder widersprüchliche Bewertung. Die verfügbaren Quellenabschnitte bleiben erhalten, die Zusammenfassung konnte nicht weitergehen.",
    source_revalidation_unavailable: "Eine gespeicherte Quelle oder ihr Zusammenhang konnte nicht erneut geprüft werden. Die verfügbaren Quellen bleiben oben erhalten, die Zusammenfassung pausiert, bis diese Prüfung gelingt.",
    checkpoint_incompatible: "Diese gespeicherte Recherche kann nicht fortgesetzt werden, weil sie abgelaufen ist oder sich die Einstellungen geändert haben. Geprüfte Abschnitte bleiben erhalten. Es wurde keine neue Recherche gestartet.",
    connection_interrupted: "Die Verbindung wurde unterbrochen, bevor die Recherche fertig war. Geprüfte Abschnitte bleiben erhalten. Setze die verfügbare Arbeit fort, wenn möglich.",
    cancelled: "Du hast diese Antwort gestoppt. Geprüfte Abschnitte bleiben erhalten.",
    wording_rejected: "Das Fazit hat seine Formulierungsprüfungen nicht bestanden. Die geprüften Quellenerklärungen bleiben oben erhalten.",
    spending_limit: "Die Recherche hat ihr Kosten- oder Anfragelimit erreicht. Geprüfte Abschnitte bleiben erhalten, es wurde kein abschließendes Fazit freigegeben.",
    billing_uncertain: "Die Recherche wartet auf die Bestätigung der Kosten einer früheren Anfrage. Geprüfte Abschnitte bleiben erhalten, es wurde keine neue bezahlte Anfrage gestellt.",
    transport_failure: "Die Verbindung zu einem Recherchedienst ist fehlgeschlagen. Geprüfte Abschnitte bleiben erhalten, die endgültige Antwort wurde nicht fertiggestellt.",
    research_running: "Diese Frage wird bereits in einem anderen Fenster oder einer anderen Anfrage recherchiert. Es wurde keine zweite Recherche gestartet. Nutze „Status prüfen“, um zu sehen, wann sie fertig ist.",
  },
};
export function researchFailureText(language: Locale, kind?: RichFailureKind | null): string | null {
  if (!kind) return null;
  return messages[language][kind as keyof typeof messages.en] ?? null;
}
