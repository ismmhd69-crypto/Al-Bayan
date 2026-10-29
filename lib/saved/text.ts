import type { Locale } from "@/lib/i18n";

const en = {
  title: "Saved", answers: "Answers", lessons: "Lessons",
  save: "Save", saved: "Saved", saveLesson: "Save lesson", removeLesson: "Remove from Saved", remove: "Remove",
  toastSaved: "Saved", toastDevice: "Saved on this device", toastRemoved: "Removed", toastFailed: "Could not save. Please try again.",
  toastDropped: "Saved. Your oldest saved answer made room for it.",
  deviceNote: "Saved on this device.", signIn: "Sign in", deviceNoteEnd: "to keep them on all your devices.", accountNote: "Saved to your account.",
  emptyTitle: "Nothing saved yet", emptyText: "Tap Save at the end of an answer, or the bookmark at the top of a lesson.",
  lessonLabel: "Lesson", savedOn: "Saved",
  loading: "Loading your saved answer…", unavailable: "This saved answer can't be shown any more, because one of its sources could not be loaded again.", askAgain: "Ask it again", back: "All saved",
};
type SavedText = typeof en;

export const savedText: Record<Locale, SavedText> = {
  en,
  ar: {
    title: "المحفوظات", answers: "الإجابات", lessons: "الدروس",
    save: "حفظ", saved: "محفوظ", saveLesson: "حفظ الدرس", removeLesson: "إزالة من المحفوظات", remove: "إزالة",
    toastSaved: "تم الحفظ", toastDevice: "حُفظ على هذا الجهاز", toastRemoved: "أُزيل", toastFailed: "تعذّر الحفظ. حاول مرة أخرى.",
    toastDropped: "تم الحفظ. أُزيلت أقدم إجابة محفوظة لإفساح المجال.",
    deviceNote: "محفوظة على هذا الجهاز.", signIn: "سجّل الدخول", deviceNoteEnd: "لتبقى على كل أجهزتك.", accountNote: "محفوظة في حسابك.",
    emptyTitle: "لا شيء محفوظ بعد", emptyText: "اضغط «حفظ» في آخر الإجابة، أو علامة الحفظ أعلى الدرس.",
    lessonLabel: "الدرس", savedOn: "حُفظ",
    loading: "جارٍ تحميل إجابتك المحفوظة…", unavailable: "لا يمكن عرض هذه الإجابة المحفوظة الآن، لأن أحد مصادرها تعذّر تحميله من جديد.", askAgain: "اسأل مرة أخرى", back: "كل المحفوظات",
  },
  de: {
    title: "Gespeichert", answers: "Antworten", lessons: "Lektionen",
    save: "Speichern", saved: "Gespeichert", saveLesson: "Lektion speichern", removeLesson: "Aus Gespeichert entfernen", remove: "Entfernen",
    toastSaved: "Gespeichert", toastDevice: "Auf diesem Gerät gespeichert", toastRemoved: "Entfernt", toastFailed: "Speichern fehlgeschlagen. Bitte versuch es noch einmal.",
    toastDropped: "Gespeichert. Deine älteste gespeicherte Antwort wurde dafür entfernt.",
    deviceNote: "Auf diesem Gerät gespeichert.", signIn: "Melde dich an", deviceNoteEnd: "um sie auf all deinen Geräten zu behalten.", accountNote: "In deinem Konto gespeichert.",
    emptyTitle: "Noch nichts gespeichert", emptyText: "Tippe am Ende einer Antwort auf Speichern oder oben in einer Lektion auf das Lesezeichen.",
    lessonLabel: "Lektion", savedOn: "Gespeichert",
    loading: "Deine gespeicherte Antwort wird geladen…", unavailable: "Diese gespeicherte Antwort kann nicht mehr angezeigt werden, weil eine ihrer Quellen nicht erneut geladen werden konnte.", askAgain: "Noch einmal fragen", back: "Alle gespeicherten",
  },
};
