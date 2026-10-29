import type { Locale } from "@/lib/i18n";

// Text for the Support page (Mo, 2026-10-29). The hadith is quoted from the stored Sahih Muslim 1631
// (Prophet's words only, exact Arabic; English and German are the site's AI translations). The page
// never promises a reward or calls a donation sadaqah jariyah: it states the hope and leaves it to Allah.

export const SUPPORT_HADITH = {
  arabic: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ",
  url: "https://sunnah.com/muslim:1631",
};

type SupportText = {
  lead: string; cta: string; ctaNote: string;
  jariyaTitle: string; hadithIntro: string; hadithTranslation: string | null; aiTranslation: string; hadithSource: string; jariyaText: string;
  goesTitle: string; goes: [string, string][];
  promiseTitle: string; promises: [string, string][];
  helpTitle: string; help: { title: string; text: string; link?: "report" }[]; reportLink: string;
  closingTitle: string; closingText: string;
};

export const supportText: Record<Locale, SupportText> = {
  en: {
    lead: "Bayan answers questions about Islam from the Quran, authentic hadith and trusted scholars, free for everyone. Every answer is researched and checked by AI, and that has a real cost. Your support keeps it running.",
    cta: "Support Bayan on Buy Me a Coffee", ctaNote: "Opens in a new tab. Any amount helps.",
    jariyaTitle: "Good that keeps going",
    hadithIntro: "The Prophet ﷺ said:",
    hadithTranslation: "“When a person dies, his deeds come to an end except for three: ongoing charity, knowledge from which people benefit, or a righteous child who prays for him.”",
    aiTranslation: "AI translation, check the Arabic original", hadithSource: "Sahih Muslim 1631",
    jariyaText: "Helping people reach knowledge from the Quran and Sunnah is work many Muslims hope will keep benefiting others long after them. Let's take part in it together, with a sincere intention, and leave the reward to Allah.",
    goesTitle: "Where your support goes",
    goes: [
      ["AI research for every answer", "Each question runs several AI steps: finding the right verses, hadith and scholar texts, checking them, then writing and reviewing the summary."],
      ["Hosting and the database", "The website, the library of more than 22,000 sources and their translations, kept online and fast."],
      ["Sources and new languages", "Quran, hadith and translation services, and bringing every answer to more readers in Arabic, English and German."],
    ],
    promiseTitle: "Our promise",
    promises: [
      ["Bayan stays free", "No ads, no paywall. Every page and every answer stays free for everyone, whether you give or not."],
      ["Not zakat, not a registered charity", "Please do not pay your zakat here. Donations are not tax-deductible and go only to running Bayan."],
    ],
    helpTitle: "Other ways to help",
    help: [
      { title: "Share Bayan", text: "Send it to someone who has questions about Islam." },
      { title: "Tell us about mistakes", text: "If something looks wrong, report it so it can be checked.", link: "report" },
      { title: "Remember Bayan in your dua", text: "Ask Allah to put benefit in this work and to accept it." },
    ],
    reportLink: "Report a problem",
    closingTitle: "Build this together",
    closingText: "Every answer someone reads, every question that gets a sourced reply, is made possible by people like you.",
  },
  ar: {
    lead: "يجيب بيان عن الأسئلة حول الإسلام من القرآن والأحاديث الصحيحة والعلماء الموثوقين، مجانًا للجميع. كل إجابة يبحثها الذكاء الاصطناعي ويتحقق منها، ولذلك تكلفة حقيقية. دعمك يُبقي بيان مستمرًا.",
    cta: "ادعم بيان عبر Buy Me a Coffee", ctaNote: "يُفتح في نافذة جديدة. أي مبلغ يساعد.",
    jariyaTitle: "خير يستمر",
    hadithIntro: "قال النبي ﷺ:",
    hadithTranslation: null,
    aiTranslation: "ترجمة آلية، راجع النص العربي", hadithSource: "صحيح مسلم 1631",
    jariyaText: "إيصال العلم من القرآن والسنة إلى الناس عمل يرجو كثير من المسلمين أن يبقى نفعه بعدهم. لنشارك فيه معًا بنية صادقة، والأجر عند الله.",
    goesTitle: "أين يذهب دعمك",
    goes: [
      ["بحث بالذكاء الاصطناعي لكل إجابة", "كل سؤال يمرّ بعدة خطوات: إيجاد الآيات والأحاديث ونصوص العلماء المناسبة، والتحقق منها، ثم كتابة الخلاصة ومراجعتها."],
      ["الاستضافة وقاعدة البيانات", "الموقع ومكتبة تضم أكثر من 22 ألف مصدر مع ترجماتها، متاحة وسريعة."],
      ["المصادر واللغات", "خدمات القرآن والحديث والترجمة، وإيصال الإجابات إلى قرّاء أكثر بالعربية والإنجليزية والألمانية."],
    ],
    promiseTitle: "وعدنا",
    promises: [
      ["بيان يبقى مجانيًا", "لا إعلانات ولا اشتراكات. كل صفحة وكل إجابة مجانية للجميع، سواء دعمت أم لم تدعم."],
      ["ليس زكاة ولا جمعية خيرية مسجلة", "من فضلك لا تدفع زكاتك هنا. التبرعات لا تُخصم من الضرائب، وتذهب فقط لتشغيل بيان."],
    ],
    helpTitle: "طرق أخرى للمساعدة",
    help: [
      { title: "شارك بيان", text: "أرسله إلى من لديه أسئلة عن الإسلام." },
      { title: "أخبرنا بالأخطاء", text: "إن رأيت شيئًا يبدو خطأ، أبلغ عنه ليُراجع.", link: "report" },
      { title: "اذكر بيان في دعائك", text: "اسأل الله أن يجعل في هذا العمل نفعًا وأن يتقبّله." },
    ],
    reportLink: "الإبلاغ عن مشكلة",
    closingTitle: "لنبنِه معًا",
    closingText: "كل إجابة يقرؤها أحد، وكل سؤال يجد جوابًا موثقًا، يصبح ممكنًا بفضل أمثالك.",
  },
  de: {
    lead: "Bayan beantwortet Fragen zum Islam aus dem Quran, authentischen Hadithen und vertrauenswürdigen Gelehrten, kostenlos für alle. Jede Antwort wird von KI recherchiert und geprüft, und das kostet echtes Geld. Deine Unterstützung hält Bayan am Laufen.",
    cta: "Bayan auf Buy Me a Coffee unterstützen", ctaNote: "Öffnet sich in einem neuen Tab. Jeder Betrag hilft.",
    jariyaTitle: "Gutes, das weiterwirkt",
    hadithIntro: "Der Prophet ﷺ sagte:",
    hadithTranslation: "„Wenn der Mensch stirbt, enden seine Taten, außer dreierlei: außer einer fortlaufenden Spende (Sadaqa dschariya) oder Wissen, von dem Nutzen gezogen wird, oder einem rechtschaffenen Kind, das für ihn betet.“",
    aiTranslation: "KI-Übersetzung, prüfe den arabischen Originaltext", hadithSource: "Sahih Muslim 1631",
    jariyaText: "Menschen Wissen aus Quran und Sunna zugänglich zu machen, ist eine Arbeit, von der viele Muslime hoffen, dass sie anderen noch lange nach ihnen nützt. Lass uns gemeinsam daran mitwirken, mit aufrichtiger Absicht, und den Lohn Allah überlassen.",
    goesTitle: "Wohin deine Unterstützung geht",
    goes: [
      ["KI-Recherche für jede Antwort", "Jede Frage durchläuft mehrere KI-Schritte: passende Verse, Hadithe und Gelehrtentexte finden, sie prüfen, dann die Zusammenfassung schreiben und kontrollieren."],
      ["Hosting und Datenbank", "Die Website und die Bibliothek mit über 22.000 Quellen und ihren Übersetzungen, online und schnell."],
      ["Quellen und Sprachen", "Quran-, Hadith- und Übersetzungsdienste und mehr Leserinnen und Leser auf Arabisch, Englisch und Deutsch."],
    ],
    promiseTitle: "Unser Versprechen",
    promises: [
      ["Bayan bleibt kostenlos", "Keine Werbung, keine Bezahlschranke. Jede Seite und jede Antwort bleibt für alle kostenlos, ob du gibst oder nicht."],
      ["Keine Zakat, keine eingetragene Wohltätigkeitsorganisation", "Bitte zahle hier keine Zakat. Spenden sind nicht steuerlich absetzbar und gehen nur in den Betrieb von Bayan."],
    ],
    helpTitle: "Weitere Wege zu helfen",
    help: [
      { title: "Teile Bayan", text: "Schick es jemandem, der Fragen zum Islam hat." },
      { title: "Melde uns Fehler", text: "Wenn dir etwas falsch vorkommt, melde es, damit es geprüft wird.", link: "report" },
      { title: "Denk an Bayan in deinem Dua", text: "Bitte Allah, diese Arbeit nützlich zu machen und sie anzunehmen." },
    ],
    reportLink: "Problem melden",
    closingTitle: "Gemeinsam aufbauen",
    closingText: "Jede Antwort, die jemand liest, und jede Frage, die eine belegte Antwort bekommt, wird durch Menschen wie dich möglich.",
  },
};
