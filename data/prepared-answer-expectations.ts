// Human-reviewed evidence baselines for prepared AnswerV2 files. The dry run fails if a later edit
// silently adds, removes or swaps a cited source. Content hashes still control publication approval.
export const PREPARED_EXPECTED_SOURCES: Record<string, readonly string[]> = {
  "celebrating-mawlid": ["S88100000-0000-4000-a000-000000000001"],
  "congregational-prayer-men": ["S20555000-0000-4000-a000-000000000001"],
  "dhikr-after-prayer": ["S17728000-0000-4000-a000-000000000001"],
  "divorce-basics": ["Q2:228", "Q2:229", "S88640000-0000-4000-a000-000000000001"],
  "fasting-sick-traveller": ["Q2:185", "S81370000-0000-4000-a000-000000000001"],
  "five-pillars": ["HE66512", "S18974000-0000-4000-a000-000000000002"],
  "friday-prayer": ["Q62:9", "S51060000-0000-4000-a000-000000000001"],
  "greeting-non-muslims-holidays": ["Q5:2", "S21240000-0000-4000-a000-000000000001"],
  "halal-meat-people-of-the-book": ["Q5:5", "S76850000-0000-4000-a000-000000000001"],
  "how-to-become-muslim": ["HE66512", "S85ba041c-2d11-4730-95af-f5bbdcd6e8d3"],
  "how-to-pray": ["HE3185", "S40220000-0000-4000-a000-000000000002"],
  "how-to-pray-witr": ["S51290000-0000-4000-a000-000000000001"],
  "how-to-repent": ["S0772d6ef-b31d-477f-b827-d1c22b506d95"],
  "how-to-wudu": ["Q5:6", "S40220000-0000-4000-a000-000000000003"],
  "is-hijab-obligatory": ["Q33:59", "S10957000-0000-4000-a000-000000000001"],
  "is-interest-haram": ["Q2:275", "Q2:278", "Sa53d290c-21d7-4ae5-b9c1-d616d5add625"],
  "is-music-haram": ["Q31:6", "S893c05e3-5314-4874-8f7c-77348d5ef29b"],
  "is-smoking-haram": ["Q7:157", "S20830000-0000-4000-a000-000000000001"],
  "marriage-muslim-woman-non-muslim": ["Q60:10", "S20080000-0000-4000-a000-000000000001"],
  "missed-prayer": ["Q20:14", "S92460000-0000-4000-a000-000000000001"],
  "pillars-of-iman": ["Q4:136", "S18974000-0000-4000-a000-000000000001"],
  "praying-traveller": ["Q4:101", "S12329000-0000-4000-a000-000000000001"],
  "prophet-muhammad": ["HE6180", "Q21:25", "Q33:40", "Q68:4", "S12434000-0000-4000-a000-000000000001"],
  "rights-of-parents": ["Q17:23", "Q31:14", "S18535000-0000-4000-a000-000000000001"],
  "steps-of-hajj": ["S10034000-0000-4000-a000-000000000001"],
  "visiting-graves-asking-dead": ["Q35:14", "S67460000-0000-4000-a000-000000000001"],
  "what-breaks-the-fast": ["Q2:187", "S47810000-0000-4000-a000-000000000001", "S88540000-0000-4000-a000-000000000001"],
  "what-breaks-wudu": ["S65910000-0000-4000-a000-000000000001"],
  "what-is-shirk": ["Q4:48", "S14401000-0000-4000-a000-000000000001"],
  "zakat-al-fitr": ["Q87:14", "S53260000-0000-4000-a000-000000000001"],
  "zakat-gold": ["Q9:34", "S250705e5-1fb7-4c73-92a1-b42da15acddc"],
  "zakat-savings": ["Q9:103", "Q9:34", "S099b0a1a-9048-47b0-91da-96c4f5243bcc"],
  "doubt": ["HE65011", "Q49:15"],
  "evolution": ["Q3:59", "Q32:7", "Q32:8", "Q32:9", "Sd340b9a0-176c-447d-bd3a-45595c5716a7"],
  "faith-reason": ["Q2:164", "Q3:190", "Q52:35"],
  "hadith-late": ["Sa8c92f14-0b73-4f9e-9d21-4828dbcf2419"],
  "inheritance": ["Q4:11", "Q4:34"],
  "never-heard": ["Q17:15", "Q4:165", "S0a82040b-ffa0-4734-aa2f-064bb04933b7"],
  "purpose": ["Q2:21", "Q51:56", "Q67:2"],
  "quran-preserved": ["Q15:9", "Q41:42", "Q75:17", "Q75:18", "Q75:19"],
  "suffering": ["HE3701", "Q2:155"],
  "sword": ["S9d295174-07ff-4455-8952-776ed3a1c094"],
  "who-created": ["Q112:2", "Q112:3", "Q35:15", "Q52:35"],
  "women-spiritual": ["Q16:97", "Q33:35"],
};

// Procedures whose individual points must remain visible in every language.
export const PREPARED_EXPECTED_LIST_LENGTHS: Record<string, number> = {
  "how-to-pray": 8,
  "how-to-pray-witr": 4,
  "how-to-repent": 4,
  "how-to-wudu": 6,
  "steps-of-hajj": 6,
};

// These broad verse badges previously appeared beside details the verse did not itself establish.
export const PREPARED_FORBIDDEN_SOURCES: Record<string, readonly string[]> = {
  "congregational-prayer-men": ["Q2:43"],
  "dhikr-after-prayer": ["Q4:103"],
  "how-to-pray-witr": ["Q73:20"],
  "what-breaks-wudu": ["Q4:43"],
};

export const PREPARED_REQUIRED_TEXT: Record<string, Partial<Record<"ar" | "en" | "de", readonly string[]>>> = {
  "how-to-become-muslim": {
    ar: ["لله", "محمد"], en: ["Allah", "Muhammad", "Messenger"], de: ["Allah", "Muhammad", "Gesandter"],
  },
  "how-to-pray-witr": {
    ar: ["العشاء", "الفجر", "ركعتين", "ركعة واحدة"], en: ["Isha", "dawn", "sets of two", "one rak'ah"], de: ["Ischa", "Morgendämmerung", "zwei Rak'ahs", "einer Rak'ah"],
  },
  "how-to-repent": {
    ar: ["اترك", "الندم", "عدم الرجوع", "حقوق الناس"], en: ["Stop", "remorse", "not to return", "rights"], de: ["Beende", "Reue", "nicht zu ihr zurückzukehren", "Rechte"],
  },
  "how-to-wudu": {
    ar: ["وجهك", "المرفقين", "رأسك", "الكعبين"], en: ["face", "elbows", "head", "ankles"], de: ["Gesicht", "Ellbogen", "Kopf", "Knöcheln"],
  },
  "zakat-gold": { ar: ["2.5%"], en: ["2.5%"], de: ["2,5"] },
};
