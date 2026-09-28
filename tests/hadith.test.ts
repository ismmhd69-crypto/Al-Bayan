// Tests for the hadith rules (Sahihayn only, sahih/hasan only, text unchanged).
// The sample records are shaped like HadeethEnc responses; texts are short made-up placeholders.
import { describe, expect, it } from "vitest";
import { acceptableGrade, collectionOf, parseHadith, readReference } from "@/lib/sources/hadith-rules";

describe("collectionOf: Bukhari or Muslim only", () => {
  it("accepts the two Sahihs and agreed-upon hadith", () => {
    expect(collectionOf("رواه البخاري")).toBe("bukhari");
    expect(collectionOf("رواه مسلم")).toBe("muslim");
    expect(collectionOf("رواه البخاري ومسلم")).toBe("agreed");
    expect(collectionOf("رواه البخاري ومسلم في صحيحيهما بهذه الحروف")).toBe("agreed");
    expect(collectionOf("متفق عليه")).toBe("agreed");
    expect(collectionOf("رواه مسلم وأحمد")).toBe("muslim");
  });
  it("rejects every other collection", () => {
    for (const a of ["رواه الترمذي", "رواه أحمد", "رواه أبو داود والترمذي", "رويناه في كتاب الحجة بإسناد صحيح", "رواه ابن ماجه", ""]) {
      expect(collectionOf(a)).toBeNull();
    }
  });
});

describe("acceptableGrade: sahih or hasan only", () => {
  it("accepts sahih and hasan wordings", () => {
    for (const g of ["صحيح", "حسن", "قال النووي: حديث صحيح", "حسن صحيح"]) expect(acceptableGrade(g)).toBe(true);
  });
  it("rejects weak, fabricated or missing grades", () => {
    for (const g of ["ضعيف", "موضوع", "حسن لكن في إسناده ضعيف", "منكر", ""]) expect(acceptableGrade(g)).toBe(false);
  });
});

describe("parseHadith", () => {
  // Shaped like the Arabic record: plain field names plus the printed reference.
  const ar = {
    id: "5913",
    attribution: "رواه البخاري",
    grade: "صحيح",
    hadeeth: "نص عربي تجريبي",
    reference: "صحيح البخاري (6/ 192) (5027).\nشرح رياض الصالحين، لابن عثيمين (4/ 638).",
  };
  const en = { id: "5913", hadeeth: "Test English text" };
  const de = { id: "5913", hadeeth: "Deutscher Testtext" };

  it("keeps text exactly as served and links to the source", () => {
    const h = parseHadith(ar, en, de)!;
    expect(h).toEqual({
      id: "HE5913",
      collection: "bukhari",
      numbers: { bukhari: 5027, muslim: null },
      attributionAr: "رواه البخاري",
      gradeAr: "صحيح",
      arabic: "نص عربي تجريبي",
      translations: { en: "Test English text", de: "Deutscher Testtext" },
      url: "https://hadeethenc.com/en/browse/hadith/5913",
    });
  });
  it("drops hadith outside the Sahihayn or with a weak grade", () => {
    expect(parseHadith({ ...ar, attribution: "رواه الترمذي" }, en, de)).toBeNull();
    expect(parseHadith({ ...ar, grade: "ضعيف" }, en, de)).toBeNull();
  });
  it("never shows a translation with markup or from a different hadith", () => {
    expect(parseHadith(ar, { ...en, hadeeth: "<b>x</b>" }, de)!.translations.en).toBeNull();
    expect(parseHadith(ar, en, { id: "1", hadeeth: "other" })!.translations.de).toBeNull();
  });
  it("requires a real Bukhari or Muslim number in the reference", () => {
    expect(parseHadith({ ...ar, reference: "بهجة الناظرين (2/ 226)." }, en, de)).toBeNull();
  });
  it("skips reports that are only in Muslim's introduction", () => {
    const intro = { ...ar, attribution: "رواه مسلم", reference: "صحيح مسلم (1/ 10) (3)" };
    expect(parseHadith(intro, en, de)).toBeNull();
    const main = { ...ar, attribution: "رواه مسلم", reference: "صحيح مسلم (2/ 807) (1151)" };
    expect(parseHadith(main, en, de)!.numbers).toEqual({ bukhari: null, muslim: 1151 });
  });
  it("labels agreed-upon only when both numbers are confirmed", () => {
    const both = { ...ar, attribution: "متفق عليه", reference: "صحيح البخاري (3/ 26) (1904).\nصحيح مسلم (2/ 807) (1151)." };
    expect(parseHadith(both, en, de)!.collection).toBe("agreed");
    const introOnly = { ...ar, attribution: "متفق عليه", reference: "صحيح البخاري (1/ 33) (110)، صحيح مسلم (1/ 10) (3)" };
    const h = parseHadith(introOnly, en, de)!;
    expect(h.collection).toBe("bukhari");
    expect(h.numbers).toEqual({ bukhari: 110, muslim: null });
  });
  it("reads printed references", () => {
    expect(readReference("صحيح البخاري (6/ 192) (5027).", "bukhari")).toEqual({ volume: 6, page: 192, number: 5027 });
    expect(readReference("صحيح البخاري (6/ 192) (5027).", "muslim")).toBeNull();
  });
  it("works for Arabic-only hadith with no English or German", () => {
    expect(parseHadith(ar, null, null)!.translations).toEqual({ en: null, de: null });
  });
  it("rejects malformed records", () => {
    expect(parseHadith(null, null, null)).toBeNull();
    expect(parseHadith({ ...ar, id: 5913 }, en, de)).toBeNull();
  });
});
