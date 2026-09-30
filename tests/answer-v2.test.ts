// AnswerV2 contract (design phase 1). Made-up texts only, never real Quran or hadith wording.
import { describe, expect, it } from "vitest";
import { countCitedItems, displaySourceId, quranCardId, validateAnswerV2, type AnswerV2, type AnswerV2Trust, type RequirementId } from "@/lib/ask/answer-v2";
import { ATTRIBUTION } from "@/lib/sources/quran-meta";
import { HADITH_ATTRIBUTION } from "@/lib/sources/hadith-rules";

const LIVE: AnswerV2Trust = { origin: "live", review: "automatic" };
const QUOTE_ID = "S22222222-2222-2222-2222-222222222222";
const verse = (s: number, v: number, translation: string | null = `Made-up translation ${s} ${v} for testing`) => ({
  id: `Q${s}:${v}`, key: `${s}:${v}`, arabic: `نص عربي تجريبي ${s} ${v}`,
  translation, translation_name: translation ? "Test translation" : null, url: `https://quran.com/${s}/${v}`,
});
const card = (s: number, from: number, to = from) => {
  const verses = Array.from({ length: to - from + 1 }, (_, i) => verse(s, from + i));
  return { id: quranCardId(verses.map((v) => v.id)), source_ids: verses.map((v) => v.id), points: ["R1"], cited: true, verses };
};
const sentence = (text: string, ids: string[], requirement: RequirementId = "R1") => ({ text, source_ids: ids, requirement_id: requirement });

function base(): AnswerV2 {
  return JSON.parse(JSON.stringify({
    version: 2,
    language: "en",
    origin: "live",
    review: "automatic",
    simple_answer: { sentences: [
      sentence("Believers are required to fast in a set month.", ["Q2:183"]),
      sentence("The Prophet taught that fasting protects the one who fasts.", ["HE9001"]),
      sentence("Shaykh Ibn Baz explained that fasting builds mindfulness of God.", [QUOTE_ID]),
    ] },
    quran: [card(2, 183)],
    hadith: [{
      id: "HE9001", points: ["R1"], cited: true, collection: "agreed", numbers: { bukhari: 1904, muslim: 1151 },
      grade_ar: "صحيح", attribution_ar: "متفق عليه", arabic: "نص حديث تجريبي عن الصيام",
      translation: "Made-up hadith text about a shield", translation_language: "en", url: "https://hadeethenc.com/en/browse/hadith/9001",
    }],
    scholars: [{
      id: QUOTE_ID, points: ["R1"], cited: true, scholar_id: "ibn-baz", scholar_name: "Shaykh Ibn Baz",
      title: "عنوان تجريبي", reference: "مرجع تجريبي", arabic: "نص تجريبي من كلام الشيخ في بيان الصيام", url: "https://binbaz.org.sa/fatwas/9/test",
    }],
    videos: [],
    attribution: { quran: { ...ATTRIBUTION }, hadith: { ...HADITH_ATTRIBUTION } },
    provenance: { model: "fake/writer", verifier: "fake/verifier" },
  }));
}

const reason = (answer: unknown, trust: AnswerV2Trust = LIVE) => {
  const result = validateAnswerV2(answer, trust);
  return result.ok ? "ok" : result.reason;
};
const scholarView = (id: string, quoteId: string, url: string, scholarId = "ibn-uthaymeen") => ({
  id, label_key: "position_b",
  sentences: [sentence("Shaykh Ibn Uthaymeen explained a different position on this point.", [quoteId])],
  scholars: [{ id: quoteId, points: ["R1"], cited: true, scholar_id: scholarId, scholar_name: "Shaykh Ibn Uthaymeen",
    title: null, reference: "مرجع", arabic: "نص تجريبي آخر من كلام الشيخ", url }],
});

describe("AnswerV2 validator", () => {
  it("accepts a well-formed live answer and keeps internal Quran ids", () => {
    expect(reason(base())).toBe("ok");
    expect(displaySourceId("Q2:255")).toBe("2:255");
    expect(displaySourceId("HE9001")).toBe("HE9001");
    expect(quranCardId(["Q1:1", "Q1:2", "Q1:3"])).toBe("quran-1-1-3");
    expect(countCitedItems(base())).toBe(3);
  });

  it("rejects unknown fields at every level", () => {
    expect(reason({ ...base(), extra: true })).toBe("unknown_field:answer.extra");
    const nested = base();
    (nested.quran[0].verses[0] as Record<string, unknown>).tafsir = "x";
    expect(reason(nested)).toMatch(/^unknown_field/);
    const sentenceExtra = base();
    (sentenceExtra.simple_answer.sentences[0] as Record<string, unknown>).review = "scholar_reviewed";
    expect(reason(sentenceExtra)).toMatch(/^unknown_field/);
  });

  it("rejects model- or file-supplied review labels and mismatched provenance", () => {
    expect(reason({ ...base(), review: "scholar_reviewed" })).toBe("untrusted_label");
    expect(reason({ ...base(), origin: "prepared" })).toBe("untrusted_label");
    expect(reason(base(), { origin: "live", review: "bayan_reviewed" })).toBe("untrusted_label");
    const prepared = { ...base(), origin: "prepared", review: "bayan_reviewed" };
    expect(reason(prepared, { origin: "prepared", review: "bayan_reviewed" })).toBe("unknown_field:provenance.model");
    expect(reason({ ...prepared, provenance: { prepared_version: "v1", approval_hash: "a".repeat(64) } },
      { origin: "prepared", review: "bayan_reviewed" })).toBe("ok");
    expect(reason({ ...prepared, provenance: { prepared_version: "v1", approval_hash: "not-a-hash" } },
      { origin: "prepared", review: "bayan_reviewed" })).toBe("provenance");
  });

  it("rejects a citation that is not rendered, and every video citation", () => {
    const missing = base();
    missing.simple_answer.sentences[0].source_ids = ["Q2:184"];
    expect(reason(missing)).toMatch(/^missing_cited_source/);
    const videoCited = base();
    videoCited.videos = [{ youtubeId: "abcdefghijk", channelId: "UCiiJRwQ0MUaQo8ZZuf18pPw", title: "عنوان", minutes: 4, language: "ar" }];
    videoCited.simple_answer.sentences[0].source_ids = ["abcdefghijk"];
    expect(reason(videoCited)).toMatch(/^video_citation/);
    const invented = base();
    invented.simple_answer.sentences[0].source_ids = ["www.example.com"];
    expect(reason(invented)).toMatch(/^invalid_source_id/);
  });

  it("rejects a checklist point that none of its cited sources directly supports", () => {
    const mismatched = base();
    mismatched.simple_answer.sentences[0].requirement_id = "R2";
    expect(reason(mismatched, { ...LIVE, requirementIds: ["R1", "R2"] })).toMatch(/^unsupported_requirement/);
  });

  it("hides uncited sources: a rendered item nobody cites fails", () => {
    const uncited = base();
    uncited.simple_answer.sentences.splice(1, 1); // the hadith is still rendered
    expect(reason(uncited)).toBe("uncited_item:HE9001");
    const flagged = base();
    flagged.hadith[0].cited = false;
    expect(reason(flagged)).toMatch(/^uncited_item/);
  });

  it("enforces section limits and the total of 12 AI-written cited items", () => {
    const none = base();
    none.simple_answer.sentences = [];
    expect(reason(none)).toBe("count:simple_answer.sentences");
    const five = base();
    five.simple_answer.sentences.push(...[1, 2].map((n) => sentence(`Another checked point number ${n} about the month.`, ["Q2:183"])));
    expect(reason(five)).toBe("count:simple_answer.sentences");
    const oneItem = base();
    oneItem.simple_answer.list = [sentence("Stop the act.", ["Q2:183"])];
    expect(reason(oneItem)).toBe("count:simple_answer.list");
    const over = base();
    over.simple_answer.sentences.push(sentence("A fourth checked point about the month.", ["Q2:183"]));
    over.simple_answer.list = Array.from({ length: 8 }, (_, n) => sentence(`Step ${n + 1} of the stated practice.`, ["Q2:183"]));
    expect(reason(over)).toBe("ok"); // exactly 12
    over.more_explanation = [{ heading: "Details", sentences: [sentence("A thirteenth checked item about the month.", ["Q2:183"])] }];
    expect(reason(over)).toBe("cited_item_budget");
    const listForbidden = base();
    listForbidden.simple_answer.list = [sentence("Stop the act.", ["Q2:183"]), sentence("Regret the act.", ["Q2:183"])];
    expect(reason(listForbidden, { ...LIVE, listAllowed: false })).toBe("list_not_allowed");
    expect(reason(listForbidden, { ...LIVE, listAllowed: true })).toBe("ok");
    const tooMany = base();
    tooMany.quran = [card(2, 183), card(3, 1), card(4, 1), card(5, 1)];
    expect(reason(tooMany)).toBe("count:quran");
  });

  it("checks Quran passage cards: consecutive verses, real ids, exact URLs, stable card ids", () => {
    const gap = base();
    gap.quran = [{ ...card(2, 183, 184), source_ids: ["Q2:183", "Q2:185"], verses: [verse(2, 183), verse(2, 185)] }];
    expect(reason(gap)).toMatch(/^quran_not_consecutive/);
    const fakeVerse = base();
    fakeVerse.quran = [{ ...card(2, 183), source_ids: ["Q2:999"], verses: [verse(2, 999)] }];
    expect(reason(fakeVerse)).toMatch(/^quran_id/);
    const badUrl = base();
    badUrl.quran[0].verses[0].url = "https://example.com/2/183";
    expect(reason(badUrl)).toMatch(/^quran_verse/);
    const badId = base();
    badId.quran[0].id = "card-1";
    expect(reason(badId)).toMatch(/^quran_card_id/);
    const arabicWithTranslation = { ...base(), language: "ar" };
    expect(reason(arabicWithTranslation)).toMatch(/^quran_translation/);
  });

  it("shows a complete named passage as one card only when the visitor named it", () => {
    const fatiha = base();
    fatiha.quran = [card(1, 1, 7)];
    fatiha.simple_answer.sentences[0] = sentence("The opening chapter praises God and asks for guidance.", ["Q1:2", "Q1:6"]);
    const named = [["Q1:1", "Q1:2", "Q1:3", "Q1:4", "Q1:5", "Q1:6", "Q1:7"]];
    expect(reason(fatiha)).toBe("uncited_item:quran-1-1-7");
    expect(reason(fatiha, { ...LIVE, namedPassages: named })).toBe("ok");
  });

  it("re-checks hadith and scholar source rules", () => {
    const weak = base();
    weak.hadith[0].grade_ar = "ضعيف";
    expect(reason(weak)).toMatch(/^hadith_rules/);
    const wrongUrl = base();
    wrongUrl.hadith[0].url = "https://hadeethenc.com/en/browse/hadith/1234";
    expect(reason(wrongUrl)).toMatch(/^hadith_url/);
    const offSite = base();
    offSite.scholars[0].url = "https://example.com/fatwa";
    expect(reason(offSite)).toMatch(/^scholar_rules/);
    const duplicateUrl = base();
    duplicateUrl.scholars.push({ ...duplicateUrl.scholars[0], id: "S33333333-3333-3333-3333-333333333333" });
    duplicateUrl.simple_answer.sentences[2].source_ids.push("S33333333-3333-3333-3333-333333333333");
    expect(reason(duplicateUrl)).toBe("duplicate_fatwa_url");
    const malformedId = base();
    malformedId.scholars[0].id = "S------------------------------------";
    malformedId.simple_answer.sentences[2].source_ids = [malformedId.scholars[0].id];
    expect(reason(malformedId)).toMatch(/^scholar_id/);
  });

  it("requires attribution links for exactly the source kinds shown", () => {
    expect(reason({ ...base(), attribution: { quran: { ...ATTRIBUTION } } })).toBe("attribution");
    const noHadith = base();
    noHadith.hadith = [];
    noHadith.simple_answer.sentences.splice(1, 1);
    expect(reason(noHadith)).toBe("attribution");
    expect(reason({ ...noHadith, attribution: { quran: { ...ATTRIBUTION } } })).toBe("ok");
    expect(reason({ ...noHadith, attribution: { quran: { text: "Other", url: "https://example.com" } } })).toBe("attribution");
  });

  it("applies the sentence rules to every AI-written field", () => {
    const quoted = base();
    quoted.simple_answer.list = [sentence("Say \"words\" here.", ["Q2:183"]), sentence("Regret the act.", ["Q2:183"])];
    expect(reason(quoted)).toMatch(/^quotation/);
    const twoSentences = base();
    twoSentences.more_explanation = [{ heading: "Details", sentences: [sentence("One fact. Another fact.", ["Q2:183"])] }];
    expect(reason(twoSentences)).toMatch(/^multiple_sentences/);
    const copied = base();
    copied.simple_answer.sentences[0].text = "It says made-up translation 2 183 for testing.";
    expect(reason(copied)).toBe("copied_source");
    const misattributed = base();
    misattributed.simple_answer.sentences[1].text = "The Quran says that fasting protects the one who fasts.";
    expect(reason(misattributed)).toMatch(/^source_attribution/);
    const prophetMisattributed = base();
    prophetMisattributed.simple_answer.sentences[0].text = "The Prophet taught that believers must fast in a set month.";
    expect(reason(prophetMisattributed)).toMatch(/^source_attribution/);
    const scholarMisattributed = base();
    scholarMisattributed.simple_answer.sentences[1].text = "Shaykh Ibn Baz explained that fasting protects the one who fasts.";
    expect(reason(scholarMisattributed)).toMatch(/^source_attribution/);
    const umlauts = { ...base(), language: "de" };
    umlauts.quran[0].verses[0].translation = null;
    umlauts.quran[0].verses[0].translation_name = null;
    umlauts.hadith[0].translation = null;
    umlauts.hadith[0].translation_language = null;
    umlauts.simple_answer.sentences = [
      sentence("Den Glaeubigen ist das Fasten fuer einen Monat vorgeschrieben.", ["Q2:183"]),
      sentence("Der Prophet lehrte, dass das Fasten schützt.", ["HE9001"]),
      sentence("Scheich Ibn Baz erklärte, dass das Fasten Gottesfurcht stärkt.", [QUOTE_ID]),
    ];
    expect(reason(umlauts)).toMatch(/^wrong_language/);
  });

  it("keeps headings and limit notes free of rulings, citations and quotations", () => {
    const rulingHeading = base();
    rulingHeading.more_explanation = [{ heading: "Why music is forbidden", sentences: [sentence("A checked detail about the month.", ["Q2:183"])] }];
    expect(reason(rulingHeading)).toMatch(/^heading/);
    const uncheckedHeading = base();
    uncheckedHeading.more_explanation = [{ heading: "The harm of music", sentences: [sentence("A checked detail about the month.", ["Q2:183"])] }];
    expect(reason(uncheckedHeading)).toMatch(/^heading/);
    expect(reason({ ...base(), limit_note: "These sources do not establish every reason for the practice." })).toBe("ok");
    expect(reason({ ...base(), limit_note: "These sources do not establish every reason." }, { ...LIVE, limitNoteAllowed: false })).toBe("limit_note_not_allowed");
    expect(reason({ ...base(), limit_note: "Music is haram according to these sources." })).toBe("limit_note");
    expect(reason({ ...base(), limit_note: "See 2:183 for the rest." })).toBe("limit_note");
  });

  it("requires every checklist point in the simple answer or list when the points are known", () => {
    const answer = base();
    answer.quran[0].points.push("R2");
    answer.more_explanation = [{ heading: "Details", sentences: [sentence("A second checked detail about the month.", ["Q2:183"], "R2")] }];
    expect(reason(answer, { ...LIVE, requirementIds: ["R1", "R2"] })).toBe("requirement_not_in_simple_answer");
    answer.simple_answer.list = [
      sentence("The first stated step applies.", ["Q2:183"], "R2"),
      sentence("The second stated step applies.", ["Q2:183"], "R2"),
    ];
    expect(reason(answer, { ...LIVE, requirementIds: ["R1", "R2"] })).toBe("ok");
    expect(reason(answer, { ...LIVE, requirementIds: ["R1"] })).toBe("points:quran[0].points");
  });

  it("validates scholarly views: fixed labels, own-view citations, unique scholars, no winner side by side", () => {
    const otherId = "S33333333-3333-3333-3333-333333333333";
    const reviewed = { ...base(), view_handling: { mode: "reviewed_main", decision_id: "music-2026-10",
      other_views: [scholarView("view-b", otherId, "https://binothaimeen.net/content/1")] } };
    expect(reason(reviewed)).toBe("ok");
    const freeLabel = JSON.parse(JSON.stringify(reviewed));
    freeLabel.view_handling.other_views[0].label_key = "The stronger view";
    expect(reason(freeLabel)).toMatch(/^view_label/);
    const crossCite = JSON.parse(JSON.stringify(reviewed));
    crossCite.simple_answer.sentences[2].source_ids = [otherId]; // main answer citing another view's quote
    expect(reason(crossCite)).toMatch(/^missing_cited_source/);
    const viewCitesMain = JSON.parse(JSON.stringify(reviewed));
    viewCitesMain.view_handling.other_views[0].sentences[0].source_ids = [QUOTE_ID];
    expect(reason(viewCitesMain)).toMatch(/^missing_cited_source/);
    const sameScholar = JSON.parse(JSON.stringify(reviewed));
    sameScholar.view_handling.other_views[0].scholars.push({ ...sameScholar.view_handling.other_views[0].scholars[0],
      id: "S44444444-4444-4444-4444-444444444444", url: "https://binothaimeen.net/content/2" });
    expect(reason(sameScholar)).toMatch(/^view_scholars/);
    const sideBySide = { ...base(), view_handling: { mode: "side_by_side", views: [
      scholarView("view-a", otherId, "https://binothaimeen.net/content/1"),
      scholarView("view-b", "S44444444-4444-4444-4444-444444444444", "https://binothaimeen.net/content/2", "al-albani"),
    ] } };
    expect(reason(sideBySide)).toMatch(/^scholar_rules/); // al-albani quote on another scholar's site
    const fair = JSON.parse(JSON.stringify(sideBySide));
    fair.view_handling.views[1].scholars[0].url = "https://al-albany.com/audios/content/2";
    expect(reason(fair)).toBe("side_by_side_main_scholar"); // a top-level quote would pick a winner
    fair.scholars = [];
    fair.simple_answer.sentences.splice(2, 1);
    expect(reason(fair)).toBe("ok");
  });
});
