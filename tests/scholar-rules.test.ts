import { describe, expect, it } from "vitest";
import {
  scholarQuoteAllowed,
  searchQueryLevels,
  toSearchQuery,
  isScholarTitleRelevant,
  type ScholarQuote,
} from "@/lib/sources/scholar-rules";

const quote: ScholarQuote = {
  id: "S11111111-1111-1111-1111-111111111111",
  scholarId: "ibn-baz",
  scholarName: { ar: "عبد العزيز بن باز", en: "Shaykh Abdul-Aziz ibn Baz", de: "Scheich Abdul-Aziz ibn Baz" },
  title: "حكم تجريبي",
  reference: "مجموع فتاوى تجريبي (1/ 1)",
  arabic: "هذا نص تجريبي قصير من كلام الشيخ.",
  url: "https://binbaz.org.sa/fatwas/1/test",
};

describe("scholarQuoteAllowed", () => {
  it("accepts an approved scholar's short quote from his official site", () => {
    expect(scholarQuoteAllowed(quote)).toBe(true);
    expect(scholarQuoteAllowed({ ...quote, url: "https://www.binbaz.org.sa/fatwas/1/x" })).toBe(true);
    expect(scholarQuoteAllowed({ ...quote, url: "https://alifta.gov.sa/fatwa/1" })).toBe(true); // Permanent Committee
  });
  it("rejects other scholars, other sites, long or empty quotes and bad links", () => {
    expect(scholarQuoteAllowed({ ...quote, scholarId: "someone-else" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, url: "https://example.com/fatwa" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, url: "http://binbaz.org.sa/fatwas/1" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, scholarId: "ibn-uthaymeen" })).toBe(false); // wrong site for him
    expect(scholarQuoteAllowed({ ...quote, arabic: "ن".repeat(601) })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, arabic: "   " })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, arabic: "English only text" })).toBe(false);
    expect(scholarQuoteAllowed({ ...quote, id: "S1" })).toBe(false);
  });
});

describe("toSearchQuery", () => {
  it("joins phrases with 'or', drops small words and the article, unifies letters", () => {
    expect(toSearchQuery(["الحكمة من الصِّيام", "فضل صيام رمضان"])).toBe("حكمه صيام or فضل صيام رمضان");
  });
  it("returns an empty query when nothing meaningful is left", () => {
    expect(toSearchQuery(["من في", "hello"])).toBe("");
    expect(toSearchQuery([])).toBe("");
  });
  it("handles Arabic prefix stripping and spelling normalisation", () => {
    expect(toSearchQuery(["والصلاة بالصيام", "كالزكاة والحج"])).toBe("صلاه صيام or زكاه حج");
  });
});

describe("searchQueryLevels", () => {
  it("goes from the full phrases to shorter ones, dropping question-frame words", () => {
    const levels = searchQueryLevels(["حكم التوسل بالنبي الأحاديث", "التوسل بجاه النبي أدلة الجواز"]);
    expect(levels[0]).toBe("حكم توسل نبي احاديث or توسل بجاه نبي ادله جواز");
    expect(levels).toContain("توسل نبي or توسل بجاه");
    // Never a single word on its own.
    for (const q of levels) for (const part of q.split(" or ")) expect(part.split(" ").length).toBeGreaterThanOrEqual(2);
  });

  it("never falls back to broad, generic, numeric, or single-word fragments", () => {
    // "كم مرة" or "كم عدد" must never be emitted as standalone query levels
    const divorceLevels = searchQueryLevels(["كم مرة يحق للزوج طلاق زوجته رجعيا"]);
    for (const lvl of divorceLevels) {
      for (const phrase of lvl.split(" or ")) {
        expect(phrase).not.toBe("كم مره");
        expect(phrase).not.toBe("كم عدد");
        expect(phrase.split(" ").length).toBeGreaterThanOrEqual(2);
      }
    }

    const wivesLevels = searchQueryLevels(["كم عدد الزوجات المسموح به للرجل المسلم في سورة النساء"]);
    for (const lvl of wivesLevels) {
      for (const phrase of lvl.split(" or ")) {
        expect(phrase).not.toBe("كم عدد");
        expect(phrase.split(" ").length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("preserves specific Islamic topic words such as divorce, fasting, riba, tawhid, zakah, prayer", () => {
    const levels = searchQueryLevels([
      "حكم طلاق الثلاث",
      "صيام رمضان",
      "تحريم الربا",
      "اقسام التوحيد",
      "وجوب الزكاة",
      "ترك الصلاة",
    ]);
    const joined = levels.join(" ");
    expect(joined).toContain("طلاق");
    expect(joined).toContain("صيام");
    expect(joined).toContain("ربا");
    expect(joined).toContain("توحيد");
    expect(joined).toContain("زكاه");
    expect(joined).toContain("صلاه");
  });

  it("returns nothing for phrases without usable words", () => {
    expect(searchQueryLevels(["ما هو", "?"])).toEqual([]);
    expect(searchQueryLevels(["كم مرة", "كم عدد"])).toEqual([]);
  });
});

describe("isScholarTitleRelevant - Strict Title Relevance Gate", () => {
  it("reproduces and rejects all seven reported wrong-source evaluation patterns", () => {
    // 1. divorce-limit cannot retrieve wudu doubts
    expect(
      isScholarTitleRelevant(
        ["كم مرة يحق للزوج طلاق زوجته رجعيا"],
        "الوسوسة في الوضوء وكيفية علاجها"
      )
    ).toBe(false);

    // 2. polygyny-limit cannot retrieve prayer counting / doubts
    expect(
      isScholarTitleRelevant(
        ["كم عدد الزوجات المسموح به للرجل المسلم في سورة النساء"],
        "إذا شك في صلاته فلم يدري كما صلى فماذا يلزمه ؟"
      )
    ).toBe(false);

    // 3. Ramadan obligation cannot retrieve voluntary/makeup fasting
    expect(
      isScholarTitleRelevant(
        ["هل صيام رمضان فرض على كل مسلم"],
        "المشروع تقديم القضاء على صوم الست"
      )
    ).toBe(false);

    // 4. wudu organs cannot retrieve splint wiping
    expect(
      isScholarTitleRelevant(
        ["ما هي اعضاء الوضوء المذكورة نصا في اية سورة المائدة"],
        "هل يصح حديث الجبيرة ؟ وإن كان ضعيفًا فما يفعل صاحب الجبيرة ؟"
      )
    ).toBe(false);

    // 5. five pillars cannot retrieve partial 'is X a pillar?' quote on enjoining good
    expect(
      isScholarTitleRelevant(
        ["ما هي اركان الاسلام الخمسة بالترتيب"],
        "هل الأمر بالمعروف من أركان الإسلام؟"
      )
    ).toBe(false);

    // 6. categorical riba prohibition cannot be treated as answered by narrow ignorance case
    expect(
      isScholarTitleRelevant(
        ["هل التعامل بالربا واخذ الفائدة حرام في الاسلام"],
        "حكم من تعامل بالربا جهلًا"
      )
    ).toBe(false);

    // 7. tawhid definition cannot retrieve unrelated Surah al-Ikhlas commentary
    expect(
      isScholarTitleRelevant(
        ["ما هو التوحيد وما اقسامه الثلاثة باختصار"],
        "لماذا سميت سورة الإخلاص بهذا الإسم ؟ وما وجه الدلالة على اشتمالها على أنواع التوحيد الثلاثة ؟"
      )
    ).toBe(false);
  });

  it("accepts strong direct title matches for core Islamic questions", () => {
    expect(
      isScholarTitleRelevant(
        ["ما حكم تارك الصلاة"],
        "ما حكم تارك الصلاة؟"
      )
    ).toBe(true);

    expect(
      isScholarTitleRelevant(
        ["ترك الصلاة تهاونا"],
        "حكم تارك الصلاة بالكلية والتهاون بها"
      )
    ).toBe(true);

    expect(
      isScholarTitleRelevant(
        ["حكم الربا في الاسلام"],
        "تحريم الربا وعقوبة المتعاملين به"
      )
    ).toBe(true);

    expect(
      isScholarTitleRelevant(
        ["اركان الاسلام الخمسة"],
        "بيان أركان الإسلام الخمسة"
      )
    ).toBe(true);
  });

  it("rejects empty, null, or unsafe query inputs safely", () => {
    expect(isScholarTitleRelevant([], "حكم تارك الصلاة")).toBe(false);
    expect(isScholarTitleRelevant(["   "], "حكم تارك الصلاة")).toBe(false);
    expect(isScholarTitleRelevant(["ما هو"], "حكم تارك الصلاة")).toBe(false);
    expect(isScholarTitleRelevant(["كم عدد"], "حكم تارك الصلاة")).toBe(false);
    expect(isScholarTitleRelevant(["حكم تارك الصلاة"], null)).toBe(false);
    expect(isScholarTitleRelevant(["حكم تارك الصلاة"], "")).toBe(false);
    expect(isScholarTitleRelevant(["حكم تارك الصلاة"], "   ")).toBe(false);
  });

  it("verifies representative Arabic search phrases from non-Arabic questions match expected titles", () => {
    // English question: 'Is fasting during Ramadan compulsory for all Muslims?'
    // The understanding stage provides representative Arabic search phrases:
    const enPhrases = ["وجوب صيام رمضان", "فرض صوم رمضان"];
    expect(
      isScholarTitleRelevant(enPhrases, "وجوب صيام شهر رمضان المبارك")
    ).toBe(true);
    expect(
      isScholarTitleRelevant(enPhrases, "المشروع تقديم القضاء على صوم الست")
    ).toBe(false);

    // German question: 'Ist das Fasten im Ramadan für jeden Muslim verpflichtend?'
    const dePhrases = ["حكم صيام رمضان", "فرضية صوم رمضان"];
    expect(
      isScholarTitleRelevant(dePhrases, "حكم صيام شهر رمضان وفرضيته")
    ).toBe(true);
    expect(
      isScholarTitleRelevant(dePhrases, "الوسوسة في الوضوء")
    ).toBe(false);
  });
});
