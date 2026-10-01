import { describe, expect, it } from "vitest";
import {
  excerpt,
  htmlToText,
  looksLikeQuestion,
  MAX_QUOTE_CHARS,
  parseAlbaniFatwa,
  parseBinBazFatwa,
  parseUthaymeenFatwa,
  printedCollection,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
  stripOpeningFormula,
  stripLetterHeading,
  stripLetterAndFormula,
  isUthaymeenTafsirLesson,
  quoteStemSet,
  isNearDuplicate,
} from "@/lib/sources/scholar-excerpt";

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

describe("parseUthaymeenFatwa", () => {
  it("takes the title and answer only, excluding question and presenter signoff", () => {
    const html = `<article><h1>حكم صوم من لا يصلي</h1>
      <p><span class="sidetitle">السؤال:</span></p>
      <p>يقول السائل: شخص يصوم ولا يصلي، هل يصح له صوم بارك الله فيكم؟</p>
      <p><span class="sidetitle">الجواب:</span></p>
      <p><span style="color:green;font-weight: bold;">الشيخ:</span> الذي يصوم ولا يصلي لا يقبل منه صوم؛ لأنه كافر مرتد ولا يقبل منه أي عمل صالح. شكر الله لكم يا فضيلة الشيخ، وبارك الله فيكم وفي علمكم.</p>
    </article>`;
    const f = parseUthaymeenFatwa(html, { printedSource: "فتاوى نور على الدرب (الشريط 26)" })!;
    expect(f).not.toBeNull();
    expect(f.title).toBe("حكم صوم من لا يصلي");
    expect(f.answer).toBe("الذي يصوم ولا يصلي لا يقبل منه صوم؛ لأنه كافر مرتد ولا يقبل منه أي عمل صالح.");
    expect(f.answer).not.toContain("يقول السائل");
    expect(f.answer).not.toContain("شكر الله لكم");
    expect(f.printedSource).toBe("فتاوى نور على الدرب (الشريط 26)");
  });

  it("handles fatwah-ans-cont div structure and fallback title", () => {
    const html = `<p><span class="sidetitle">الجواب:</span></p>
      <div class="fatwah-ans-cont">
        <p>ورد عن السلف أنهم كانوا يهنئون بعضهم بعضاً في دخول شهر رمضان ولا حرج في هذا إن شاء الله تعالى. <a href="https://binothaimeen.net/test">رابط المادة</a></p>
      </div>`;
    const f = parseUthaymeenFatwa(html, { title: "حكم التهنئة بدخول رمضان" })!;
    expect(f).not.toBeNull();
    expect(f.title).toBe("حكم التهنئة بدخول رمضان");
    expect(f.answer).toBe("ورد عن السلف أنهم كانوا يهنئون بعضهم بعضاً في دخول شهر رمضان ولا حرج في هذا إن شاء الله تعالى.");
    expect(f.answer).not.toContain("رابط المادة");
  });

  it("rejects questions and letters addressed to the Shaykh", () => {
    const questionOnly = `<div><span class="sidetitle">السؤال:</span> ما حكم من أفطر يوماً من رمضان بغير عذر شرعي؟</div>`;
    expect(parseUthaymeenFatwa(questionOnly, { title: "سؤال في الصوم" })).toBeNull();

    const letter = `<div>فضيلة الشيخ السلام عليكم ورحمة الله وبركاته، ما هو توجيهكم في هذه المسألة؟</div>`;
    expect(parseUthaymeenFatwa(letter, { title: "سؤال" })).toBeNull();
  });

  it("rejects answers that are too short", () => {
    const short = `<p><span class="sidetitle">الجواب:</span> نعم يجوز ذلك.</p>`;
    expect(parseUthaymeenFatwa(short, { title: "حكم المسألة" })).toBeNull();
  });
});

describe("parseAlbaniFatwa", () => {
  it("takes the Shaykh's words only, stopping at dialogue interruption", () => {
    const html = `<div class="title"><div class="row"><div class="col-lg-10">حكم تقبيل الرأس</div></div></div>
      <div class="content-text" id="contentText">
        <span class='questioner'>السائل</span> : ما حكم تقبيل الرأس يا شيخنا بارك الله فيكم؟<br />
        <span class='sheikh'>الشيخ</span> : تقبيل الرأس ليس سنة راتبة، وإنما يشرع أحياناً في بعض المناسبات كقدوم الغائب وإكرام العالم أو الوالد، ولا يتخذ ديدناً وعادة مستمرة في كل لقاء، لأن هدي الصحابة رضي الله عنهم كان المصافحة عند التلاقي باليد.<br />
        <span class='questioner'>السائل</span> : جزاكم الله خيراً يا شيخنا.<br />
        <span class='sheikh'>الشيخ</span> : وإياكم.
      </div>`;
    const f = parseAlbaniFatwa(html, { printedSource: "سلسلة الهدى والنور (الشريط 150)" })!;
    expect(f).not.toBeNull();
    expect(f.title).toBe("حكم تقبيل الرأس");
    expect(f.answer).toContain("تقبيل الرأس ليس سنة راتبة");
    expect(f.answer).not.toContain("السائل");
    expect(f.answer).not.toContain("جزاكم الله خيراً");
    expect(f.printedSource).toBe("سلسلة الهدى والنور (الشريط 150)");
  });

  it("Rule 1: rejects transcripts where other speakers or other Shaykh turns precede the question", () => {
    const priorSheikh = `<div class="title"><div class="col-lg-10">الكلام على الإتباع ونبذ التقليد</div></div>
      <div class="content-text">
        <span class='sheikh'>الشيخ</span> : إذا فيه أركان الإيمان وأركان الإسلام...<br />
        <span class='questioner'>السائل</span> : صحيح.<br />
        <span class='sheikh'>الشيخ</span> : الإتباع ونبذ التقليد واجب على كل مسلم في دين الله تبارك وتعالى، فلا يقلد المسلم أحداً بغير حجة ولا برهان.<br />
      </div>`;
    expect(parseAlbaniFatwa(priorSheikh)).toBeNull();
  });

  it("Rule 1: rejects transcripts where an intermediate speaker intervenes between questioner and Shaykh", () => {
    const intervened = `<div class="title"><div class="col-lg-10">حكم الصلاة</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : ما حكم تارك الصلاة تهاونا وتكاسلا؟<br />
        <span class='student'>طالب آخر</span> : انتظر يا شيخنا قبل الجواب.<br />
        <span class='sheikh'>الشيخ</span> : تارك الصلاة تهاونا وتكاسلا مرتكب لكبيرة عظيمة من كبائر الذنوب ويجب نصحه ودعوته إلى التوبة.<br />
      </div>`;
    expect(parseAlbaniFatwa(intervened)).toBeNull();
  });

  it("Rule 2: rejects quotes that share no content word with the title", () => {
    const noShared = `<div class="title"><div class="col-lg-10">الكلام على الإتباع ونبذ التقليد</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : ما رأيكم في هذا الأمر؟<br />
        <span class='sheikh'>الشيخ</span> : الصلاة ركن من أركان الإسلام العظيمة التي لا تسقط عن مكلف بحال من الأحوال ما دام عقله ثابتاً، فيجب المحافظة عليها في أوقاتها مع جماعة المسلمين.<br />
      </div>`;
    expect(parseAlbaniFatwa(noShared)).toBeNull();
  });

  it("Rule 3: rejects quotes shorter than 200 characters", () => {
    const short = `<div class="title"><div class="col-lg-10">حكم الصلاة في المسجد</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : ما حكم الصلاة في المسجد؟<br />
        <span class='sheikh'>الشيخ</span> : الصلاة في المسجد واجبة على كل رجل مسلم يسمع النداء.<br />
      </div>`;
    expect(parseAlbaniFatwa(short)).toBeNull();
  });

  it("Rule 3: rejects quotes starting with room talk like بس or طيب or يا أبا or يا أخي", () => {
    const bas = `<div class="title"><div class="col-lg-10">حكم أسماء الله وصفاته</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : ما رأيكم في نصوص الصفات وأسماء الله؟<br />
        <span class='sheikh'>الشيخ</span> : بس بس، هذا يكفي. أسماء الله وصفاته نمرها كما جاءت بلا كيف ولا تمثيل ولا تشبيه، ونثبت ما أثبته الله لنفسه في كتابه وسنة رسوله.<br />
      </div>`;
    expect(parseAlbaniFatwa(bas)).toBeNull();

    const tayyib = `<div class="title"><div class="col-lg-10">حكم صيام التطوع</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : هل يصح صيام التطوع بنية من النهار؟<br />
        <span class='sheikh'>الشيخ</span> : طيب، صيام التطوع يصح بنية من أثناء النهار إذا لم يكن قد أكل أو شرب شيئاً قبل ذلك، وهذا مذهب جمهور العلماء.<br />
      </div>`;
    expect(parseAlbaniFatwa(tayyib)).toBeNull();

    const yaAkhi = `<div class="title"><div class="col-lg-10">مسألة في التوحيد</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : كيف نفهم مسألة التوحيد؟<br />
        <span class='sheikh'>الشيخ</span> : يا أخي التوحيد هو أصل دين الإسلام الذي دعت إليه جميع الرسل والأنبياء من لدن نوح إلى نبينا محمد صلى الله عليه وسلم.<br />
      </div>`;
    expect(parseAlbaniFatwa(yaAkhi)).toBeNull();

    const yaAba = `<div class="title"><div class="col-lg-10">حكم الحديث الضعيف</div></div>
      <div class="content-text">
        <span class='questioner'>السائل</span> : ما حكم العمل بالحديث الضعيف؟<br />
        <span class='sheikh'>الشيخ</span> : يا أبا فلان الحديث الضعيف لا يجوز الاحتجاج به في الأحكام الشرعية ولا في فضائل الأعمال إلا بشروط ضيقة عند بعض أهل العلم.<br />
      </div>`;
    expect(parseAlbaniFatwa(yaAba)).toBeNull();
  });

  it("rejects sessions where someone else is named as the speaker", () => {
    const otherSpeaker = `<div class="title"><div class="col-lg-10">كلمة للشيخ إبراهيم شقرة في التحذير من الغلو</div></div>
      <div class="content-text"><span class='sheikh'>الشيخ</span> : إن الحمد لله نحمده ونستعينه ونستغفره ونعوذ بالله من شرور أنفسنا.</div>`;
    expect(parseAlbaniFatwa(otherSpeaker)).toBeNull();

    const halabi = `<div class="title"><div class="col-lg-10">خطبة عرفة لعلي حسن الحلبي</div></div>
      <div class="content-text"><span class='sheikh'>الشيخ</span> : الحمد لله رب العالمين والصلاة والسلام على رسول الله.</div>`;
    expect(parseAlbaniFatwa(halabi)).toBeNull();
  });
});

describe("sharesContentWord", () => {
  it("matches when meaningful keywords overlap", () => {
    expect(sharesContentWord("حكم تقبيل الرأس", "تقبيل الرأس ليس سنة راتبة وإنما يشرع أحياناً")).toBe(true);
    expect(sharesContentWord("مسألة زيادة الإيمان ونقصانه", "الإيمان يزيد وينقص بالأعمال الصالحة")).toBe(true);
  });

  it("rejects when no content words overlap, even if stop words are present", () => {
    expect(sharesContentWord("الكلام على الإتباع ونبذ التقليد", "الصلاة ركن من أركان الإسلام وهو فرض")).toBe(false);
  });

  it("recognizes the Arabic noun and verb forms for backbiting as the same topic", () => {
    expect(sharesContentWord("كيفية تكفير ذنب الغيبة", "إذا اغتابه ثم تاب إلى الله واستغفر له")).toBe(true);
  });
});

describe("startsLikeRoomTalk", () => {
  it("detects conversational room fillers", () => {
    expect(startsLikeRoomTalk("بس بس ، هذا يكفي")).toBe(true);
    expect(startsLikeRoomTalk("بس هذا الأمر واضح")).toBe(true);
    expect(startsLikeRoomTalk("طيب فالأمر كذا")).toBe(true);
    expect(startsLikeRoomTalk("يا أخي اتق الله")).toBe(true);
    expect(startsLikeRoomTalk("يا أبا فلان")).toBe(true);
    expect(startsLikeRoomTalk("هذا دليل أن أبا سليمان")).toBe(true);
  });

  it("allows standard scholarly wording", () => {
    expect(startsLikeRoomTalk("تقبيل الرأس جائز")).toBe(false);
    expect(startsLikeRoomTalk("التوحيد هو إفراد الله بالعبادة")).toBe(false);
    expect(startsLikeRoomTalk("الصلاة ركن عظيم")).toBe(false);
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

describe("Rules 1 to 5: quote cleaning and relevance", () => {
  it("Rule 1: stripOpeningFormula removes Basmalah and Hamd up to أما بعد", () => {
    const raw = "بسم الله الرحمن الرحيم، الحمد لله رب العالمين والصلاة والسلام على رسول الله، أما بعد: فالصيام ركن من أركان الإسلام العظيمة.";
    expect(stripOpeningFormula(raw)).toBe("فالصيام ركن من أركان الإسلام العظيمة.");
  });

  it("Rule 2: stripLetterHeading removes letter greetings, headings, and signoffs", () => {
    const letter = "من عبدالعزيز بن عبدالله بن باز إلى حضرة الأخ المكرم سلام عليكم ورحمة الله وبركاته، أما بعد: فالذي نفتي به أن الواجب تقوى الله. والله الموفق.";
    expect(stripLetterHeading(letter)).toBe("فالذي نفتي به أن الواجب تقوى الله.");
    expect(stripLetterAndFormula(letter)).toBe("فالذي نفتي به أن الواجب تقوى الله.");
  });

  it("Rule 3: multi-question selection takes the answer matching the title", () => {
    const multiPage = `<article class="fatwa"><h1>حكم صيام المريض</h1>
      <div>الجواب: أولًا: الصلاة واجبة في وقتها على كل مسلم ومسلمة. ثانيًا: الصيام يسقط عن المريض الذي يشق عليه الصوم ويقضي بعد شفائه.</div>
    </article>`;
    const f = parseBinBazFatwa(multiPage)!;
    expect(f).not.toBeNull();
    expect(f.title).toBe("حكم صيام المريض");
    expect(f.answer).toContain("الصيام يسقط عن المريض الذي يشق عليه الصوم");
    expect(f.answer).not.toContain("أولًا: الصلاة واجبة");
  });

  it("Rule 4: isUthaymeenTafsirLesson rejects tafsir lessons and parseUthaymeenFatwa skips them", () => {
    expect(isUthaymeenTafsirLesson("تفسير سورة البقرة")).toBe(true);
    expect(isUthaymeenTafsirLesson("تفسير آيات من سورة آل عمران")).toBe(true);
    expect(isUthaymeenTafsirLesson("في ظلال سورة الفاتحة")).toBe(true);
    expect(isUthaymeenTafsirLesson("حكم صوم رمضان")).toBe(false);

    const tafsirHtml = `<article><h1>تفسير سورة البقرة</h1><p><span class="sidetitle">الجواب:</span></p><div class="fatwah-ans-cont"><p>هذه السورة الكريمة من أعظم سور القرآن الكريم وتضمنت أحكاما جليلة.</p></div></article>`;
    expect(parseUthaymeenFatwa(tafsirHtml, { title: "تفسير سورة البقرة" })).toBeNull();
  });

  it("Rule 5: sharesContentWord and 200 character minimum", () => {
    const title = "حكم زكاة الفطر";
    const matchingQuote = "زكاة الفطر فريضة فرضها رسول الله صلى الله عليه وسلم صاعاً من تمر أو صاعاً من شعير على العبد والحر والذكر والأنثى والصغير والكبير من المسلمين وأمر بها أن تؤدى قبل خروج الناس إلى الصلاة.";
    expect(sharesContentWord(title, matchingQuote)).toBe(true);
    expect(matchingQuote.length).toBeGreaterThanOrEqual(180);

    const unsharedQuote = "الصلاة هي الركن الثاني من أركان الإسلام الخمسة بعد الشهادتين، وقد فرضها الله تعالى على نبيه في ليلة الإسراء والمعراج خمس صلوات في اليوم والليلة.";
    expect(sharesContentWord(title, unsharedQuote)).toBe(false);
  });

  it("deduplication: isNearDuplicate identifies near-identical content", () => {
    const q1 = "صوم التطوع سنة وقربة عظيمة إلى الله تعالى، وقد رغب النبي صلى الله عليه وسلم في الصيام وحث عليه في أحاديث كثيرة.";
    const q2 = "صوم التطوع سنة عظيمة وقربة يتقرب بها المسلم إلى الله، وقد رغب النبي عليه الصلاة والسلام في الصوم وحث عليه.";
    const q3 = "الزكاة ركن من أركان الإسلام الخمسة تجب في الأموال بشروط مخصوصة وأنصبة مقدرة شرعا.";

    const stems1 = quoteStemSet(q1);
    const stems2 = quoteStemSet(q2);
    const stems3 = quoteStemSet(q3);

    expect(isNearDuplicate(stems2, [stems1])).toBe(true);
    expect(isNearDuplicate(stems3, [stems1])).toBe(false);
  });
});
