import type en from "./en";

// AI-drafted German. Needs a native speaker check before launch.
const de: typeof en = {
  meta: {
    title: "Bayan: Frag alles über den Islam",
    description:
      "Stell jede Frage zum Islam und erhalte eine klare Antwort aus dem Koran, authentischen Hadithen und vertrauenswürdigen Gelehrten, mit einer Quelle für jeden Punkt.",
  },
  common: {
    skip: "Zum Inhalt springen",
    back: "Zurück",
    comingSoon: "Bald verfügbar",
    brandAr: "بيان",
  },
  nav: {
    label: "Hauptmenü",
    home: "Start",
    ask: "Fragen",
    topics: "Schwierige Fragen",
    start: "Neu im Islam",
    more: "Mehr",
  },
  home: {
    title: "Frag alles über den Islam.",
    sub: "Antworten nur aus dem Koran, authentischen Hadithen und vertrauenswürdigen Gelehrten, mit einer Quelle für jeden Punkt.",
    placeholder: "Deine Frage eingeben...",
    askButton: "Fragen",
    popular: "Beliebte Fragen",
    browse: "Schwierige Fragen ansehen",
    newHere: "Neu im Islam? Hier beginnen",
  },
  ask: {
    title: "Fragen",
    notice:
      "Diese KI antwortet nur aus vertrauenswürdigen Quellen (Koran, authentische Hadithe und anerkannte Gelehrte), nicht aus eigenem Wissen. Jede Antwort zeigt ihre Quellen.",
    placeholder: "Stell deine Frage...",
    send: "Senden",
    emptyTitle: "Was möchtest du wissen?",
    emptySub: "Frag auf Arabisch, Deutsch oder Englisch.",
    suggestions: "Probier eine davon",
    you: "Du",
    bayan: "Bayan",
    thinking: "Quellen werden durchsucht...",
    notReady:
      "Antworten sind noch nicht eingeschaltet. Zuerst bauen wir die Bibliothek vertrauenswürdiger Quellen auf, die die KI nutzen darf. Bis dahin antwortet sie lieber nicht, statt zu raten.",
    previewToggle: "So wird eine Antwort aussehen",
    notFatwa: "Keine Fatwa. Für deine persönliche Situation frag einen qualifizierten Gelehrten, dem du vertraust.",
    error: "Etwas ist schiefgelaufen. Bitte versuch es noch einmal.",
    tooLong: "Bitte halte deine Frage unter 500 Zeichen.",
    parts: {
      short: "Kurze Antwort",
      evidence: "Belege",
      scholars: "Was die Gelehrten sagten",
      watch: "Mehr ansehen",
      otherViews: "Andere Gelehrtenmeinungen",
    },
    previewText: {
      short: "Zwei oder drei einfache Sätze, nur aus den Quellen unten geschrieben.",
      evidence: "Der Vers oder Hadith auf Arabisch, mit Übersetzung, Bewertung und Link.",
      scholars: "Ein Zitat eines anerkannten Gelehrten, mit Namen und Link zum Original.",
      watch: "Ein kurzer Videoausschnitt eines Gelehrten, wenn vorhanden.",
      otherViews: "Nur sichtbar, wenn anerkannte Gelehrte sich unterscheiden. Standardmäßig geschlossen.",
    },
    label: "Automatische Antwort aus den genannten Quellen",
    noSource:
      "Wir haben keine vertrauenswürdige Quelle gefunden, die das beantwortet. Bitte frag einen qualifizierten Gelehrten, dem du vertraust.",
    outOfScope: "Ich beantworte nur Fragen zum Islam, aus vertrauenswürdigen Quellen. Was möchtest du wissen?",
    rateLimited: "Du hast in kurzer Zeit viel gefragt. Bitte warte ein paar Minuten und versuch es noch einmal.",
    checked: "Zitate genau wie in der Quelle",
    quran: "Koran",
    translation: "Übersetzung",
    scholarsEmpty: "Noch keine Gelehrtenzitate in der Bibliothek.",
    personal: "Für deine persönliche Situation frag bitte einen qualifizierten Gelehrten, dem du vertraust.",
    testMode: "Testmodus: Bisher sind nur die Suren 1 und 2 in der Bibliothek.",
    source: "Quelle",
  },
  topics: {
    title: "Schwierige Fragen",
    intro: "Häufige Fragen und Zweifel zum Islam, ruhig und mit Quellen beantwortet.",
    all: "Alle",
    categories: {
      belief: "Gott und Glaube",
      science: "Glaube und Wissenschaft",
      preservation: "Koran und Hadith",
      women: "Frauen im Islam",
      history: "Gerechtigkeit und Geschichte",
    },
    preparing:
      "Diese Antwort wird vorbereitet. Sie wird den Koran, authentische Hadithe und anerkannte Gelehrte zitieren, mit einem Link für jeden Punkt.",
    askAbout: "Jetzt danach fragen",
    backToList: "Alle schwierigen Fragen",
    related: "Verwandt",
  },
  start: {
    title: "Neu im Islam",
    intro: "Ein ruhiger Weg, Schritt für Schritt. In deinem eigenen Tempo. Dein Fortschritt bleibt auf diesem Gerät.",
    step: "Schritt",
    done: "Erledigt",
    markDone: "Als erledigt markieren",
    undo: "Nicht erledigt",
    read: "Lesen",
    ask: "Danach fragen",
    progress: "{done} von {total} erledigt",
  },
  more: {
    title: "Mehr",
    language: "Sprache",
    account: "Anmelden",
    accountNote: "Freiwillig. Nur um Antworten zu speichern.",
    saved: "Gespeicherte Antworten",
    about: "Wie Bayan funktioniert",
    privacy: "Datenschutz",
    report: "Problem melden",
    reportNote: "Einen Fehler gefunden? Sag es uns.",
  },
  about: {
    title: "Wie Bayan funktioniert",
    intro:
      "Bayan beantwortet Fragen zum Islam automatisch, aber nur aus vertrauenswürdigen Quellen. Das bedeutet genau Folgendes.",
    points: [
      ["Geschlossene Bibliothek", "Die KI antwortet nur aus unseren anerkannten Quellen. Sie durchsucht nie das offene Internet und antwortet nicht aus eigenem Wissen."],
      ["Jeder Satz hat eine Quelle", "Jeder Satz einer Antwort verweist auf eine Quelle. Sätze ohne Quelle werden entfernt, bevor du die Antwort siehst."],
      ["Zitate werden per Code geprüft", "Jeder zitierte Vers, Hadith und jedes Gelehrtenzitat wird Wort für Wort mit dem Original verglichen, bevor es angezeigt wird."],
      ["Nur authentische Hadithe", "Es werden nur Hadithe mit der Bewertung sahih oder hasan verwendet. Bewertung und Bewerter werden immer angezeigt."],
      ["Anerkannte Gelehrte", "Urteile werden nur von einer festen Liste sunnitischer Gelehrter zitiert, mit Link zum Original."],
      ["Ehrlich, wenn unsicher", "Wenn keine vertrauenswürdige Quelle gefunden wird, sagt Bayan das, statt zu raten."],
      ["Keine Fatwa", "Antworten erklären, was die Gelehrten sagten. Für deine persönliche Situation frag einen qualifizierten Gelehrten, dem du vertraust."],
    ],
  },
  privacy: {
    title: "Datenschutz",
    draft: "Entwurf. Die vollständige Datenschutzerklärung wird von einem Anwalt geprüft, bevor Bayan öffentlich startet.",
    points: [
      "Für eine Frage brauchst du kein Konto.",
      "Fragen von Besuchern ohne Konto werden nicht in unserer Datenbank gespeichert.",
      "Deine Frage erscheint nie in Webadressen oder Statistiken.",
      "Dein Fortschritt bei Neu im Islam und deine Sprache bleiben auf deinem Gerät.",
      "Unsere Datenbank liegt in Frankfurt, Deutschland.",
    ],
  },
};

export default de;
