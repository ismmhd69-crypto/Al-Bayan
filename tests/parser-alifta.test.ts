import { describe, expect, it } from "vitest";
import { parseAliftaFatwa } from "@/lib/sources/parsers/alifta";

describe("parseAliftaFatwa", () => {
  it("keeps the committee answer only and reads its separate signatories", () => {
    const html = `<article>
      <h1>حكم تجريبي في الصيام</h1>
      <p>السؤال: ما حكم المسألة التجريبية؟</p>
      <p>الجواب: هذا جواب اللجنة في المسألة التجريبية، وفيه بيان كاف للمقصود دون نقل السؤال أو أسماء الموقعين.</p>
      <div>التوقيعات:</div>
      <p>الرئيس: عبد العزيز بن باز</p>
      <p>عضو: عبد الله بن غديان</p>
      <p>المصدر: فتاوى اللجنة الدائمة (5/ 123)</p>
    </article>`;

    const fatwa = parseAliftaFatwa(html)!;
    expect(fatwa).not.toBeNull();
    expect(fatwa.title).toBe("حكم تجريبي في الصيام");
    expect(fatwa.answer).toBe("هذا جواب اللجنة في المسألة التجريبية، وفيه بيان كاف للمقصود دون نقل السؤال أو أسماء الموقعين.");
    expect(fatwa.answer).not.toContain("ما حكم المسألة");
    expect(fatwa.answer).not.toContain("عبد العزيز بن باز");
    expect(fatwa.signatories).toEqual(["عبد العزيز بن باز", "عبد الله بن غديان"]);
    expect(fatwa.printedSource).toBe("فتاوى اللجنة الدائمة (5/ 123)");
  });

  it("rejects a question-only page", () => {
    const html = `<article><h1>سؤال تجريبي</h1><p>السؤال: ما حكم المسألة التجريبية؟</p></article>`;
    expect(parseAliftaFatwa(html)).toBeNull();
  });

  it("rejects an answer without a separate signatory block", () => {
    const html = `<article><h1>عنوان تجريبي</h1><p>الجواب: هذا نص طويل بما يكفي للاختبار ولكنه لا يحمل أي توقيعات أو أسماء معتمدة في الصفحة.</p></article>`;
    expect(parseAliftaFatwa(html)).toBeNull();
  });

  it("does not include a presenter after the answer", () => {
    const html = `<article>
      <h1>عنوان تجريبي</h1>
      <p>الجواب: هذا هو جواب اللجنة في المسألة المذكورة، وهو نص مستقل كامل لا يحتاج إلى كلام مقدم أو سائل.</p>
      <p>الموقعون:</p>
      <p>عضو: صالح بن فوزان الفوزان</p>
      <p>المقدم: شكرا لكم.</p>
    </article>`;
    const fatwa = parseAliftaFatwa(html)!;
    expect(fatwa.answer).not.toContain("المقدم");
    expect(fatwa.signatories).toEqual(["صالح بن فوزان الفوزان"]);
  });
});
