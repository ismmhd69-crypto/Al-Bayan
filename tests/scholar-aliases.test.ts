import { describe, expect, it } from "vitest";
import { SCHOLAR_SEARCH_ALIASES } from "@/data/scholar-search-aliases";
import {
  expandScholarSearchAliases,
  isAliasTriggered,
  isScholarTitleRelevant,
} from "@/lib/sources/scholar-rules";

describe("Deterministic Scholar Search Aliases", () => {
  it("defines all five verified concept aliases with required metadata", () => {
    expect(SCHOLAR_SEARCH_ALIASES).toHaveLength(5);

    const ids = SCHOLAR_SEARCH_ALIASES.map((a) => a.id);
    expect(ids).toContain("fajr-cutoff-eating");
    expect(ids).toContain("qibla-facing-prayer");
    expect(ids).toContain("riba-banking-interest");
    expect(ids).toContain("widowhood-waiting-period");
    expect(ids).toContain("intention-in-worship");

    for (const alias of SCHOLAR_SEARCH_ALIASES) {
      expect(alias.id.length).toBeGreaterThan(0);
      expect(alias.reason.length).toBeGreaterThan(0);
      expect(alias.expectedTitleWording.length).toBeGreaterThan(0);
      expect(alias.expansions.length).toBeGreaterThan(0);
      for (const exp of alias.expansions) {
        expect(exp.trim().length).toBeGreaterThan(0);
        expect(/[؀-ۿ]/.test(exp)).toBe(true);
      }
    }
  });

  it("all five intended aliases retrieve and pass the expected title", () => {
    // 1. Fajr cutoff
    const fajrPhrases = ["وقت الإمساك عن الطعام والشراب للصائم"];
    const fajrExpanded = expandScholarSearchAliases(fajrPhrases);
    expect(fajrExpanded).toContain("أكل بعد طلوع الفجر");
    expect(fajrExpanded).toContain("طلوع الفجر بطل صومه");
    expect(isScholarTitleRelevant(fajrExpanded, "إذا أكل بعد طلوع الفجر بطل صومه")).toBe(true);

    // 2. Facing the Qibla
    const qiblaPhrases = ["اتجاه الصلاة نحو الكعبة"];
    const qiblaExpanded = expandScholarSearchAliases(qiblaPhrases);
    expect(qiblaExpanded).toContain("استقبال القبلة في الصلاة");
    expect(isScholarTitleRelevant(qiblaExpanded, "حكم استقبال القبلة في الصلاة في السفر")).toBe(true);

    // 3. Riba prohibition
    const ribaPhrases = ["الفوائد البنكية الربوية"];
    const ribaExpanded = expandScholarSearchAliases(ribaPhrases);
    expect(ribaExpanded).toContain("التعامل مع البنوك بالربا");
    expect(ribaExpanded).toContain("الفوائد الربوية");
    expect(isScholarTitleRelevant(ribaExpanded, "حكم التعامل مع البنوك بالربا وزكاتها")).toBe(true);

    // 4. Widowhood waiting period
    const widowPhrases = ["المتوفى عنها زوجها"];
    const widowExpanded = expandScholarSearchAliases(widowPhrases);
    expect(widowExpanded).toContain("المعتدة عدة وفاة");
    expect(widowExpanded).toContain("أحكام المعتدة عدة وفاة");
    expect(isScholarTitleRelevant(widowExpanded, "أحكام المعتدة عدة وفاة")).toBe(true);

    // 5. Intention in worship
    const intentionPhrases = ["النية في العبادة"];
    const intentionExpanded = expandScholarSearchAliases(intentionPhrases);
    expect(intentionExpanded).toContain("محل النية");
    expect(intentionExpanded).toContain("حكم التلفظ بالنية");
    expect(isScholarTitleRelevant(intentionExpanded, "محل النية وحكم التلفظ بها")).toBe(true);
  });

  it("English and German generated Arabic phrases trigger safe aliases", () => {
    // EN Fajr cutoff
    const enFajr = ["وقت الامساك عن الطعام والشراب للصائم", "غاية الأكل والشرب لصيام الفرض", "حكم الأكل بعد طلوع الفجر الصادق"];
    const expEnFajr = expandScholarSearchAliases(enFajr);
    expect(expEnFajr).toContain("أكل بعد طلوع الفجر");
    expect(isScholarTitleRelevant(expEnFajr, "إذا أكل بعد طلوع الفجر بطل صومه")).toBe(true);

    // DE Fajr cutoff
    const deFajr = ["وقت امساك الصائم عن الطعام والشراب", "انتهاء وقت السحور طلوع الفجر", "حكم الأكل والشرب بعد طلوع الفجر"];
    const expDeFajr = expandScholarSearchAliases(deFajr);
    expect(expDeFajr).toContain("طلوع الفجر بطل صومه");
    expect(isScholarTitleRelevant(expDeFajr, "إذا أكل بعد طلوع الفجر بطل صومه")).toBe(true);

    // EN Qibla
    const enQibla = ["حكم استقبال القبلة في الصلاة", "استقبال الكعبة المشرفة في الصلاة"];
    const expEnQibla = expandScholarSearchAliases(enQibla);
    expect(expEnQibla).toContain("استقبال القبلة في الصلاة");
    expect(isScholarTitleRelevant(expEnQibla, "حكم استقبال القبلة في الصلاة في السفر")).toBe(true);

    // DE Qibla
    const deQibla = ["حكم استقبال القبلة في الصلاة", "استقبال الكعبة المشرفة في الصلاة", "تحديد اتجاه القبلة للصلاة"];
    const expDeQibla = expandScholarSearchAliases(deQibla);
    expect(expDeQibla).toContain("استقبال القبلة في الصلاة");
    expect(isScholarTitleRelevant(expDeQibla, "حكم استقبال القبلة في الصلاة في السفر")).toBe(true);

    // EN Riba (Visitor asked 'Why' -> Hikmah/Illa phrasing)
    const enRiba = ["تحريم الربا الحكمة والعلة", "لماذا حرم الله الربا في الإسلام", "علة تحريم التعامل بالربا"];
    const expEnRiba = expandScholarSearchAliases(enRiba);
    expect(expEnRiba).toContain("التعامل مع البنوك بالربا");
    expect(isScholarTitleRelevant(expEnRiba, "حكم التعامل مع البنوك بالربا وزكاتها")).toBe(true);

    // DE Riba (Visitor asked 'Warum' -> Hikmah/Asbab phrasing)
    const deRiba = ["حكمة تحريم الربا في الإسلام", "أسباب تحريم التعامل بالربا", "العلة من تحريم الربا والفوائد"];
    const expDeRiba = expandScholarSearchAliases(deRiba);
    expect(expDeRiba).toContain("التعامل مع البنوك بالربا");
    expect(isScholarTitleRelevant(expDeRiba, "حكم التعامل مع البنوك بالربا وزكاتها")).toBe(true);

    // EN Widow waiting period
    const enWidow = ["عدة المتوفى عنها زوجها", "مدة عدة الوفاة للمرأة", "حكم عدة المتوفى عنها زوجها"];
    const expEnWidow = expandScholarSearchAliases(enWidow);
    expect(expEnWidow).toContain("المعتدة عدة وفاة");
    expect(isScholarTitleRelevant(expEnWidow, "أحكام المعتدة عدة وفاة")).toBe(true);

    // DE Widow waiting period
    const deWidow = ["عدة المتوفى عنها زوجها المدة", "حكم عدة الارملة"];
    const expDeWidow = expandScholarSearchAliases(deWidow);
    expect(expDeWidow).toContain("المعتدة عدة وفاة");
    expect(isScholarTitleRelevant(expDeWidow, "أحكام المعتدة عدة وفاة")).toBe(true);

    // EN Intention
    const enIntention = ["إنما الأعمال بالنيات", "قاعدة الأمور بمقاصدها", "حكم اعتبار النية في الأعمال"];
    const expEnIntention = expandScholarSearchAliases(enIntention);
    expect(expEnIntention).toContain("محل النية");
    expect(expEnIntention).toContain("حكم التلفظ بالنية");
    expect(isScholarTitleRelevant(expEnIntention, "محل النية وحكم التلفظ بها")).toBe(true);

    // DE Intention
    const deIntention = ["إنما الأعمال بالنيات", "حكم النية في العبادات والأعمال"];
    const expDeIntention = expandScholarSearchAliases(deIntention);
    expect(expDeIntention).toContain("محل النية");
    expect(expDeIntention).toContain("حكم التلفظ بالنية");
    expect(isScholarTitleRelevant(expDeIntention, "محل النية وحكم التلفظ بها")).toBe(true);
  });

  it("proves divorce cannot trigger wudu aliases", () => {
    const divorcePhrases = ["كم عدد طلقات الزواج في الإسلام", "أحكام طلاق الزوجة"];
    const expanded = expandScholarSearchAliases(divorcePhrases);
    expect(expanded).toEqual(divorcePhrases);

    // Even if compared to wudu title, title relevance gate rejects it
    expect(isScholarTitleRelevant(expanded, "الوسوسة في الوضوء وكيفية علاجها")).toBe(false);
  });

  it("proves number-of-wives cannot trigger prayer-count aliases", () => {
    const polygynyPhrases = ["كم عدد الزوجات المسموح بهن للرجل في القرآن"];
    const expanded = expandScholarSearchAliases(polygynyPhrases);
    expect(expanded).toEqual(polygynyPhrases);

    // Title relevance gate strictly rejects prayer doubt fatwa
    expect(isScholarTitleRelevant(expanded, "إذا شك في صلاته فلم يدري كما صلى فماذا يلزمه ؟")).toBe(false);
  });

  it("proves fasting obligation cannot trigger voluntary-fasting aliases", () => {
    const obligationPhrases = ["هل صيام شهر رمضان فرض على كل مسلم"];
    const expanded = expandScholarSearchAliases(obligationPhrases);

    // Should not trigger fajr-cutoff eating alias
    expect(expanded).not.toContain("أكل بعد طلوع الفجر");
    expect(expanded).not.toContain("طلوع الفجر بطل صومه");

    // Title relevance gate strictly protects Ramadan obligation
    expect(isScholarTitleRelevant(expanded, "صيام ست من شوال")).toBe(false);
  });

  it("proves generic words alone trigger no alias", () => {
    const genericInputs = [
      ["صلاة"],
      ["صيام"],
      ["عدد"],
      ["حكم"],
      ["إسلام"],
      ["دين"],
      ["شريعة"],
      ["عمل"],
      ["عبادة"],
    ];

    for (const input of genericInputs) {
      const expanded = expandScholarSearchAliases(input);
      expect(expanded).toEqual(input);
    }
  });

  it("proves personal and out-of-scope questions trigger no alias", () => {
    const personalPhrases = ["أنا طلقت زوجتي مرتين وأريد إرجاعها"];
    expect(expandScholarSearchAliases(personalPhrases)).toEqual(personalPhrases);

    const offTopicPhrases = [
      ["ما هو الطقس في باريس اليوم"],
      ["أفضل سيارة لعام 2026"],
      ["مرحبا كيف حالك"],
    ];
    for (const input of offTopicPhrases) {
      expect(expandScholarSearchAliases(input)).toEqual(input);
    }
  });

  it("proves title gate remains strict against cross-domain and unrelated fatwas", () => {
    // Riba alias expanded phrases compared against wudu fatwa
    const ribaExpanded = expandScholarSearchAliases(["الفوائد الربوية والتعامل بالربا"]);
    expect(isScholarTitleRelevant(ribaExpanded, "الوسوسة في الوضوء وكيفية علاجها")).toBe(false);

    // Qibla alias expanded phrases compared against widowhood fatwa
    const qiblaExpanded = expandScholarSearchAliases(["استقبال القبلة في الصلاة"]);
    expect(isScholarTitleRelevant(qiblaExpanded, "أحكام المعتدة عدة وفاة")).toBe(false);

    // Categorical riba guard prevents matching ignorance exception
    const ribaProhibition = expandScholarSearchAliases(["تحريم الفوائد الربوية والتعامل بالربا"]);
    expect(isScholarTitleRelevant(ribaProhibition, "حكم من تعامل بالربا جهلًا")).toBe(false);

    // Tawhid guard prevents matching Surah al-Ikhlas commentary
    const tawhidPhrases = ["تعريف التوحيد وأقسامه الثلاثة"];
    expect(isScholarTitleRelevant(tawhidPhrases, "لماذا سميت سورة الإخلاص بهذا الإسم ؟")).toBe(false);
  });
});
