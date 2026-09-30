import type { Locale } from "@/lib/i18n";

// Words for New chat and Recent chats on the Ask screen. Kept apart from the main dictionaries.
// The Arabic is AI-drafted and needs a native speaker check before launch, like the rest of the site.
export type ChatText = {
  recent: string;
  newChat: string;
  openRecent: string;
  close: string;
  today: string;
  yesterday: string;
  earlier: string;
  oneQuestion: string;
  manyQuestions: string; // {n} is replaced
  deleteChat: string;
  deleteAsk: string;
  deleteYes: string;
  deleteNo: string;
  deleteAll: string;
  deleteAllAsk: string;
  savedInAccount: string;
  nothingSaved: string;
  keepTitle: string;
  keepText: string;
  signInButton: string;
  loading: string;
  empty: string;
  loadError: string;
  retry: string;
  openError: string;
  saveError: string;
  unavailable: string;
  opened: string;
  started: string;
  deleted: string;
};

export const chatText: Record<Locale, ChatText> = {
  en: {
    recent: "Recent chats",
    newChat: "New chat",
    openRecent: "Recent chats",
    close: "Close",
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
    oneQuestion: "1 question",
    manyQuestions: "{n} questions",
    deleteChat: "Delete this chat",
    deleteAsk: "Delete this chat?",
    deleteYes: "Delete",
    deleteNo: "Keep",
    deleteAll: "Delete all",
    deleteAllAsk: "Delete all your saved chats?",
    savedInAccount: "Saved in your account.",
    nothingSaved: "Nothing from this chat is saved.",
    keepTitle: "Keep your chats",
    keepText: "Bayan works without an account, but chats are not saved. Sign in to keep a list of your recent chats on every device.",
    signInButton: "Sign in or create account",
    loading: "Loading your chats...",
    empty: "No saved chats yet. Ask a question and it appears here.",
    loadError: "Your chats could not be loaded.",
    retry: "Try again",
    openError: "This chat could not be opened. Please try again.",
    saveError: "The last question could not be saved to your account.",
    unavailable: "This saved answer could not be loaded right now. Please try again later.",
    opened: "Chat opened.",
    started: "New chat started.",
    deleted: "Chat deleted.",
  },
  de: {
    recent: "Letzte Chats",
    newChat: "Neuer Chat",
    openRecent: "Letzte Chats",
    close: "Schließen",
    today: "Heute",
    yesterday: "Gestern",
    earlier: "Früher",
    oneQuestion: "1 Frage",
    manyQuestions: "{n} Fragen",
    deleteChat: "Diesen Chat löschen",
    deleteAsk: "Diesen Chat löschen?",
    deleteYes: "Löschen",
    deleteNo: "Behalten",
    deleteAll: "Alle löschen",
    deleteAllAsk: "Alle gespeicherten Chats löschen?",
    savedInAccount: "In deinem Konto gespeichert.",
    nothingSaved: "Aus diesem Chat wird nichts gespeichert.",
    keepTitle: "Chats behalten",
    keepText: "Bayan funktioniert ohne Konto, aber Chats werden nicht gespeichert. Melde dich an, um deine letzten Chats auf jedem Gerät zu behalten.",
    signInButton: "Anmelden oder Konto erstellen",
    loading: "Deine Chats werden geladen...",
    empty: "Noch keine gespeicherten Chats. Stelle eine Frage, dann erscheint sie hier.",
    loadError: "Deine Chats konnten nicht geladen werden.",
    retry: "Erneut versuchen",
    openError: "Dieser Chat konnte nicht geöffnet werden. Bitte versuche es erneut.",
    saveError: "Die letzte Frage konnte nicht in deinem Konto gespeichert werden.",
    unavailable: "Diese gespeicherte Antwort konnte gerade nicht geladen werden. Bitte versuche es später erneut.",
    opened: "Chat geöffnet.",
    started: "Neuer Chat gestartet.",
    deleted: "Chat gelöscht.",
  },
  ar: {
    recent: "المحادثات الأخيرة",
    newChat: "محادثة جديدة",
    openRecent: "المحادثات الأخيرة",
    close: "إغلاق",
    today: "اليوم",
    yesterday: "أمس",
    earlier: "أقدم",
    oneQuestion: "سؤال واحد",
    manyQuestions: "{n} أسئلة",
    deleteChat: "حذف هذه المحادثة",
    deleteAsk: "حذف هذه المحادثة؟",
    deleteYes: "حذف",
    deleteNo: "إبقاء",
    deleteAll: "حذف الكل",
    deleteAllAsk: "حذف جميع محادثاتك المحفوظة؟",
    savedInAccount: "محفوظة في حسابك.",
    nothingSaved: "لن يُحفظ شيء من هذه المحادثة.",
    keepTitle: "احتفظ بمحادثاتك",
    keepText: "يعمل بيان دون حساب، لكن المحادثات لا تُحفظ. سجّل الدخول لتحتفظ بقائمة محادثاتك الأخيرة على كل جهاز.",
    signInButton: "تسجيل الدخول أو إنشاء حساب",
    loading: "جارٍ تحميل محادثاتك...",
    empty: "لا توجد محادثات محفوظة بعد. اطرح سؤالًا وسيظهر هنا.",
    loadError: "تعذّر تحميل محادثاتك.",
    retry: "حاول مرة أخرى",
    openError: "تعذّر فتح هذه المحادثة. يرجى المحاولة مرة أخرى.",
    saveError: "تعذّر حفظ آخر سؤال في حسابك.",
    unavailable: "تعذّر تحميل هذه الإجابة المحفوظة الآن. يرجى المحاولة لاحقًا.",
    opened: "تم فتح المحادثة.",
    started: "بدأت محادثة جديدة.",
    deleted: "تم حذف المحادثة.",
  },
};
