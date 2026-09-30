import type { Locale } from "@/lib/i18n";

// Words for the optional account pages. Kept apart from the main dictionaries.
// The Arabic is AI-drafted and needs a native speaker check before launch, like the rest of the site.
export type AuthText = {
  title: string;
  intro: string;
  signInTitle: string;
  signUpTitle: string;
  forgotTitle: string;
  resetTitle: string;
  email: string;
  password: string;
  newPassword: string;
  passwordHint: string;
  show: string;
  hide: string;
  consent: string;
  privacyLink: string;
  signIn: string;
  createAccount: string;
  sendReset: string;
  saveNewPassword: string;
  signOut: string;
  resend: string;
  noAccount: string;
  haveAccount: string;
  forgot: string;
  back: string;
  working: string;
  checkEmail: string;
  resetSent: string;
  passwordChanged: string;
  wrongLogin: string;
  notConfirmed: string;
  confirmationResent: string;
  weakPassword: string;
  invalidEmail: string;
  consentRequired: string;
  error: string;
  tooMany: string;
  signedInAs: string;
  saved: string;
  yourData: string;
  exportData: string;
  deleteChats: string;
  deleteChatsAsk: string;
  deleteAccount: string;
  deleteAccountAsk: string;
  deleteYes: string;
  deleteNo: string;
  chatsDeleted: string;
  accountDeleted: string;
};

export const authText: Record<Locale, AuthText> = {
  en: {
    title: "Your account",
    intro: "Optional. Bayan works fully without an account. Sign in only if you want your questions, answers and progress saved.",
    signInTitle: "Sign in",
    signUpTitle: "Create an account",
    forgotTitle: "Forgot your password?",
    resetTitle: "Choose a new password",
    email: "Email",
    password: "Password",
    newPassword: "New password",
    passwordHint: "At least 8 characters.",
    show: "Show password",
    hide: "Hide password",
    consent: "I agree that Bayan saves my questions, answers and progress in my account. I can export or delete everything at any time.",
    privacyLink: "Read the privacy page",
    signIn: "Sign in",
    createAccount: "Create account",
    sendReset: "Send reset link",
    saveNewPassword: "Save new password",
    signOut: "Sign out",
    resend: "Send the confirmation email again",
    noAccount: "No account yet? Create one",
    haveAccount: "Already have an account? Sign in",
    forgot: "Forgot your password?",
    back: "Back to sign in",
    working: "One moment...",
    checkEmail: "Almost done. We sent you an email: open it and confirm your address, then sign in.",
    resetSent: "If an account exists for this email, we sent a link to choose a new password.",
    passwordChanged: "Your password was changed. You are signed in.",
    wrongLogin: "The email or password is wrong.",
    notConfirmed: "Please confirm your email first. Check your inbox.",
    confirmationResent: "We sent the confirmation email again.",
    weakPassword: "Please choose a password with at least 8 characters.",
    invalidEmail: "Please enter a valid email address.",
    consentRequired: "Please tick the box to create an account.",
    error: "Something went wrong. Please try again.",
    tooMany: "Too many emails were sent. Please wait about an hour and try again.",
    signedInAs: "Signed in as",
    saved: "Your Ask chats are saved in your account. Saving answers and progress comes next.",
    yourData: "Your data",
    exportData: "Export my data",
    deleteChats: "Delete all my chats",
    deleteChatsAsk: "Delete all your saved chats? This cannot be undone.",
    deleteAccount: "Delete my account",
    deleteAccountAsk: "Delete your account and everything saved in it? This cannot be undone.",
    deleteYes: "Yes, delete",
    deleteNo: "Keep",
    chatsDeleted: "All your saved chats were deleted.",
    accountDeleted: "Your account and everything saved in it were deleted.",
  },
  de: {
    title: "Dein Konto",
    intro: "Freiwillig. Bayan funktioniert komplett ohne Konto. Melde dich nur an, wenn deine Fragen, Antworten und dein Fortschritt gespeichert werden sollen.",
    signInTitle: "Anmelden",
    signUpTitle: "Konto erstellen",
    forgotTitle: "Passwort vergessen?",
    resetTitle: "Neues Passwort wählen",
    email: "E-Mail",
    password: "Passwort",
    newPassword: "Neues Passwort",
    passwordHint: "Mindestens 8 Zeichen.",
    show: "Passwort anzeigen",
    hide: "Passwort verbergen",
    consent: "Ich bin einverstanden, dass Bayan meine Fragen, Antworten und meinen Fortschritt in meinem Konto speichert. Ich kann alles jederzeit exportieren oder löschen.",
    privacyLink: "Datenschutzseite lesen",
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    sendReset: "Link zum Zurücksetzen senden",
    saveNewPassword: "Neues Passwort speichern",
    signOut: "Abmelden",
    resend: "Bestätigungs-E-Mail erneut senden",
    noAccount: "Noch kein Konto? Jetzt erstellen",
    haveAccount: "Schon ein Konto? Anmelden",
    forgot: "Passwort vergessen?",
    back: "Zurück zur Anmeldung",
    working: "Einen Moment...",
    checkEmail: "Fast geschafft. Wir haben dir eine E-Mail geschickt: Öffne sie und bestätige deine Adresse, dann melde dich an.",
    resetSent: "Falls zu dieser E-Mail ein Konto existiert, haben wir einen Link zum Wählen eines neuen Passworts geschickt.",
    passwordChanged: "Dein Passwort wurde geändert. Du bist angemeldet.",
    wrongLogin: "E-Mail oder Passwort ist falsch.",
    notConfirmed: "Bitte bestätige zuerst deine E-Mail. Sieh in deinem Posteingang nach.",
    confirmationResent: "Wir haben die Bestätigungs-E-Mail erneut gesendet.",
    weakPassword: "Bitte wähle ein Passwort mit mindestens 8 Zeichen.",
    invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    consentRequired: "Bitte setze das Häkchen, um ein Konto zu erstellen.",
    error: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    tooMany: "Es wurden zu viele E-Mails gesendet. Bitte warte etwa eine Stunde und versuche es dann erneut.",
    signedInAs: "Angemeldet als",
    saved: "Deine Ask-Chats werden in deinem Konto gespeichert. Das Speichern von Antworten und Fortschritt folgt als Nächstes.",
    yourData: "Deine Daten",
    exportData: "Meine Daten exportieren",
    deleteChats: "Alle meine Chats löschen",
    deleteChatsAsk: "Alle gespeicherten Chats löschen? Das lässt sich nicht rückgängig machen.",
    deleteAccount: "Mein Konto löschen",
    deleteAccountAsk: "Dein Konto und alles darin Gespeicherte löschen? Das lässt sich nicht rückgängig machen.",
    deleteYes: "Ja, löschen",
    deleteNo: "Behalten",
    chatsDeleted: "Alle deine gespeicherten Chats wurden gelöscht.",
    accountDeleted: "Dein Konto und alles darin Gespeicherte wurde gelöscht.",
  },
  ar: {
    title: "حسابك",
    intro: "اختياري. يعمل بيان بالكامل دون حساب. سجّل الدخول فقط إن أردت حفظ أسئلتك وأجوبتك وتقدّمك.",
    signInTitle: "تسجيل الدخول",
    signUpTitle: "إنشاء حساب",
    forgotTitle: "نسيت كلمة المرور؟",
    resetTitle: "اختر كلمة مرور جديدة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    passwordHint: "٨ أحرف على الأقل.",
    show: "إظهار كلمة المرور",
    hide: "إخفاء كلمة المرور",
    consent: "أوافق على أن يحفظ بيان أسئلتي وأجوبتي وتقدّمي في حسابي. ويمكنني تصدير كل شيء أو حذفه في أي وقت.",
    privacyLink: "اقرأ صفحة الخصوصية",
    signIn: "تسجيل الدخول",
    createAccount: "إنشاء الحساب",
    sendReset: "إرسال رابط إعادة التعيين",
    saveNewPassword: "حفظ كلمة المرور الجديدة",
    signOut: "تسجيل الخروج",
    resend: "إعادة إرسال رسالة التأكيد",
    noAccount: "ليس لديك حساب؟ أنشئ حسابًا",
    haveAccount: "لديك حساب؟ سجّل الدخول",
    forgot: "نسيت كلمة المرور؟",
    back: "العودة إلى تسجيل الدخول",
    working: "لحظة من فضلك...",
    checkEmail: "شارفنا على الانتهاء. أرسلنا إليك رسالة: افتحها وأكّد بريدك، ثم سجّل الدخول.",
    resetSent: "إن كان هناك حساب لهذا البريد فقد أرسلنا رابطًا لاختيار كلمة مرور جديدة.",
    passwordChanged: "تم تغيير كلمة المرور، وقد سجّلت الدخول.",
    wrongLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    notConfirmed: "يرجى تأكيد بريدك الإلكتروني أولًا. تحقّق من صندوق الوارد.",
    confirmationResent: "أعدنا إرسال رسالة التأكيد.",
    weakPassword: "يرجى اختيار كلمة مرور من ٨ أحرف على الأقل.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    consentRequired: "يرجى وضع علامة الموافقة لإنشاء حساب.",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    tooMany: "تم إرسال رسائل كثيرة. يرجى الانتظار نحو ساعة ثم المحاولة مرة أخرى.",
    signedInAs: "مسجّل الدخول باسم",
    saved: "محادثاتك في «اسأل» محفوظة في حسابك. حفظ الأجوبة والتقدّم هو الخطوة التالية.",
    yourData: "بياناتك",
    exportData: "تصدير بياناتي",
    deleteChats: "حذف كل محادثاتي",
    deleteChatsAsk: "حذف جميع محادثاتك المحفوظة؟ لا يمكن التراجع عن ذلك.",
    deleteAccount: "حذف حسابي",
    deleteAccountAsk: "حذف حسابك وكل ما حُفظ فيه؟ لا يمكن التراجع عن ذلك.",
    deleteYes: "نعم، احذف",
    deleteNo: "إبقاء",
    chatsDeleted: "تم حذف جميع محادثاتك المحفوظة.",
    accountDeleted: "تم حذف حسابك وكل ما حُفظ فيه.",
  },
};
