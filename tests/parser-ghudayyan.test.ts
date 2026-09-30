import { describe, expect, it } from "vitest";
import { parseGhudayyanFatwa } from "@/lib/sources/parsers/ghudayyan";

describe("parseGhudayyanFatwa", () => {
  it("keeps the answer between the question and scholar footer", () => {
    const html = `<article><h4>حكم الصيام التجريبي</h4><p>السؤال: ما حكم الصيام التجريبي؟</p><p>الجواب: الصيام التجريبي لا يشرع بهذا الوصف، والواجب أن تكون العبادة على ما ثبت في الشرع وأن يتعلم المسلم أحكامها من أهل العلم.</p><footer>فضيلة الشيخ عبدالله بن عبدالرحمن بن غديان رحمه الله</footer></article>`;
    const fatwa = parseGhudayyanFatwa(html)!;
    expect(fatwa.answer).toContain("الصيام التجريبي لا يشرع");
    expect(fatwa.answer).not.toContain("ما حكم");
    expect(fatwa.answer).not.toContain("عبدالله بن");
  });

  it("rejects a question-only page", () => {
    expect(parseGhudayyanFatwa("<h4>حكم الصيام</h4><p>السؤال: ما حكم الصيام؟</p>")).toBeNull();
  });

  it("rejects an answer without the scholar footer", () => {
    expect(parseGhudayyanFatwa("<h4>حكم الصيام</h4><p>السؤال: ما حكم الصيام؟</p><p>الجواب: الصيام عبادة عظيمة وفيها أحكام كثيرة يجب تعلمها من أهل العلم والدليل الصحيح.</p>")).toBeNull();
  });

  it("rejects an answer unrelated to its title", () => {
    expect(parseGhudayyanFatwa("<h4>حكم الصيام</h4><p>السؤال: ما حكم الصيام؟</p><p>الجواب: البيع باب من أبواب المعاملات وله ضوابط شرعية يجب تعلمها من أهل العلم والدليل الصحيح.</p><footer>فضيلة الشيخ عبدالله بن عبدالرحمن بن غديان رحمه الله</footer>")).toBeNull();
  });
});
