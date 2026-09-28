// Tests for scholar quote rules. The sample page is made up, shaped like a binbaz.org.sa fatwa page.
import { describe, expect, it } from "vitest";
import { excerpt, htmlToText, looksLikeQuestion, MAX_QUOTE_CHARS, parseBinBazFatwa, printedCollection, searchText } from "@/lib/sources/scholar-excerpt";

const page = `<html><body><nav>قائمة الموقع</nav>
<article class="fatwa"><h1 class="title">حكم تجريبي</h1>
<div class="box__body"><p>س: ما حكم المسألة التجريبية؟</p>
<p>ج: هذا جواب تجريبي أول وفيه بيان.<sup><a href="#f1">[1]</a></sup> وهذه جملة ثانية&nbsp;تكمل المعنى.</p>
<section class="footnotes"><ol><li><cite>مجموع فتاوى تجريبي (6/ 298).</cite></li></ol></section></div></article>
<footer>تذييل</footer></body></html>`;

describe("parseBinBazFatwa", () => {
  it("takes the title, the answer only, and the printed source", () => {
    const f = parseBinBazFatwa(page)!;
    expect(f.title).toBe("حكم تجريبي");
    expect(f.answer).toBe("هذا جواب تجريبي أول وفيه بيان. وهذه جملة ثانية تكمل المعنى.");
    expect(f.answer).not.toContain("ما حكم المسألة");
    expect(f.answer).not.toContain("[1]");
    expect(f.printedSource).toBe("مجموع فتاوى تجريبي (6/ 298)");
  });

  it("handles the radio-programme format: answer mark, player text and presenter lines", () => {
    const radio = `<article class="fatwa"><h1>عنوان تجريبي</h1><div>السؤال: ما حكم الأمر التجريبي؟
      <audio src="x.mp3"></audio> play max volume تحميل المادة
      الجواب: هذا جواب الشيخ التجريبي وفيه تفصيل كاف لبيان المسألة المطروحة. الشيخ: أعد سؤاله. المقدم: يقول كذا.</div></article>`;
    const f = parseBinBazFatwa(radio)!;
    expect(f.answer).toBe("هذا جواب الشيخ التجريبي وفيه تفصيل كاف لبيان المسألة المطروحة.");
    expect(f.printedSource).toBeNull();
  });

  it("never takes a questioner's letter as the Shaykh's words", () => {
    const letter = `<article class="fatwa"><h1>عقيدة تجريبية</h1><div>سماحة المفتي السلام عليكم ورحمة الله، فما هي عقيدتكم التي تدينون الله بها في هذه المسألة التجريبية الطويلة؟</div></article>`;
    expect(parseBinBazFatwa(letter)).toBeNull();
    const ownWords = `<article class="fatwa"><h1>مقالة تجريبية</h1><div>الواجب على المؤمن أن يتعلم أمور دينه ويعمل بها ويدعو إليها بالحكمة والموعظة الحسنة في كل حال.</div></article>`;
    expect(parseBinBazFatwa(ownWords)?.answer).toContain("الواجب على المؤمن");
  });

  it("returns null for a page without a fatwa or with almost no answer", () => {
    expect(parseBinBazFatwa("<html><body>لا شيء</body></html>")).toBeNull();
    expect(parseBinBazFatwa('<article class="fatwa"><h1>عنوان</h1><p>ج: قصير</p></article>')).toBeNull();
  });
});

describe("excerpt", () => {
  const sentence = "هذه جملة تجريبية طويلة بعض الشيء لغرض الاختبار فقط. ";
  it("keeps short answers whole", () => {
    expect(excerpt("جواب قصير كامل.")).toBe("جواب قصير كامل.");
  });
  it("cuts only at a sentence end, within the limit", () => {
    const long = sentence.repeat(30);
    const e = excerpt(long)!;
    expect(e.length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
    expect(e.endsWith(".")).toBe(true);
    expect(long.startsWith(e)).toBe(true); // an unchanged prefix of the answer
  });
  it("skips an answer with no sentence end early enough, instead of cutting mid-sentence", () => {
    expect(excerpt("كلمة ".repeat(200))).toBeNull();
  });
});

describe("searchText", () => {
  it("is plain, unvowelled and within the limit, with prefix-free word forms added", () => {
    const s = searchText("حكم الصِّيام", "والصيام فرض على المؤمنين.");
    expect(s).not.toMatch(/[ً-ٟ.]/);
    expect(s.split(" ")).toContain("صيام");
    expect(searchText("عنوان", "كلمة ".repeat(400)).length).toBeLessThanOrEqual(MAX_QUOTE_CHARS);
  });
});

describe("htmlToText", () => {
  it("removes tags and footnote markers without changing words", () => {
    expect(htmlToText("<p>نص<sup>[2]</sup> عربي&nbsp;صحيح</p>")).toBe("نص عربي صحيح");
  });
});

describe("printedCollection", () => {
  it("reads the Majmu' Fatawa volume and page from longer footnotes", () => {
    expect(printedCollection("ضمن الأسئلة الموجهة. (مجموع فتاوى ومقالات الشيخ ابن باز 9/ 414)")).toEqual({
      reference: "مجموع فتاوى ومقالات الشيخ ابن باز (9/ 414)",
      collection: "مجموع فتاوى ومقالات الشيخ ابن باز",
    });
    expect(printedCollection("مجموع فتاوى ومقالات الشيخ ابن باز (8/43)")?.reference).toBe("مجموع فتاوى ومقالات الشيخ ابن باز (8/ 43)");
    expect(printedCollection("شرح كتاب كشف الشبهات 2")).toBeNull();
    expect(printedCollection(null)).toBeNull();
  });
});

describe("looksLikeQuestion", () => {
  it("spots questions and letters addressed to the scholar", () => {
    expect(looksLikeQuestion("سماحة الشيخ السلام عليكم")).toBe(true);
    expect(looksLikeQuestion("ما حكم كذا وكذا")).toBe(true);
    expect(looksLikeQuestion("نص فيه سؤال في أوله؟ ثم كلام")).toBe(true);
    expect(looksLikeQuestion("الواجب على المسلم أن يتقي الله.")).toBe(false);
  });
});
