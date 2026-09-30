import { describe, expect, it } from "vitest";
import { parseBarrakFatwa } from "@/lib/sources/parsers/barrak";

function page(post: object) {
  return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { postContent: post } } })}</script>`;
}

describe("parseBarrakFatwa", () => {
  it("keeps only the written answer before the Shaykh's signature", () => {
    const html = page({
      title: "حكم الصيام التجريبي",
      question: "ما حكم الصيام التجريبي؟",
      type: { title: "فتاوى", link: "/fatwas" },
      content: "<p>الصيام التجريبي لا يصح إذا خالف ما شرعه الله، وعلى المسلم أن يتعلم الحكم من الدليل وأن يلتزم به في عبادته كلها.</p><p>أملاه:</p><p>عبدالرحمن بن ناصر البراك</p><p>ملاحظة محرر لا تدخل في الجواب.</p>",
    });
    const fatwa = parseBarrakFatwa(html)!;
    expect(fatwa.answer).toContain("الصيام التجريبي لا يصح");
    expect(fatwa.answer).not.toContain("ما حكم");
    expect(fatwa.answer).not.toContain("ملاحظة محرر");
  });

  it("starts after the opening formula without changing any answer words", () => {
    const html = page({
      title: "حكم الصيام التجريبي", question: "ما حكم الصيام التجريبي؟", type: { title: "فتاوى" },
      content: "<p>الحمد لله وحده، وصلى الله وسلم على نبينا محمد؛ أما بعد: الصيام التجريبي لا يصح إذا خالف ما شرعه الله، وعلى المسلم أن يتعلم الحكم من الدليل الصحيح.</p><p>أملاه:</p><p>عبدالرحمن بن ناصر البراك</p>",
    });
    const fatwa = parseBarrakFatwa(html)!;
    expect(fatwa.answer).toBe("الصيام التجريبي لا يصح إذا خالف ما شرعه الله، وعلى المسلم أن يتعلم الحكم من الدليل الصحيح.");
    expect(fatwa.answer).not.toContain("الحمد لله");
  });

  it("rejects a page without the Shaykh's signature", () => {
    expect(parseBarrakFatwa(page({
      title: "حكم الصيام", question: "ما حكم الصيام؟", type: { title: "فتاوى" }, content: "<p>الصيام عبادة عظيمة وفيها أحكام كثيرة يجب تعلمها من أهل العلم والدليل الصحيح.</p>",
    }))).toBeNull();
  });

  it("rejects an answer unrelated to its title", () => {
    expect(parseBarrakFatwa(page({
      title: "حكم الصيام", question: "ما حكم الصيام؟", type: { title: "فتاوى" }, content: "<p>البيع باب من أبواب المعاملات وله ضوابط شرعية يجب على المسلم معرفتها قبل الدخول فيه.</p><p>أملاه:</p><p>عبدالرحمن بن ناصر البراك</p>",
    }))).toBeNull();
  });
});
