// Offline preparation only. Does not load credentials, call models, alter old
// labels/results, or authorize another paid campaign.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function qualityBankV3(old: { version: number; cases: any[]; unscoredApplication: unknown }, previousSha256: string) {
  if (old.version !== 2 || old.cases.length !== 12) throw Error("unexpected_previous_bank");
  const labels: Record<string, string> = { S01: "source_support", S03: "context_needed", S04: "source_support", S06: "source_support", S08: "source_support", S09: "source_support", S11: "missing_qualification" };
  const cases = old.cases.map(c => {
    const { request: _oldRequest, requestHash, testStatus: _oldStatus, ...sourceCase } = c;
    return { ...sourceCase, historicalRequestHash: requestHash, historicalExpected: c.expected, expected: labels[c.id] ?? "faithful_paraphrase",
    serialized: { passages: (c.originals ?? []).map((p: any) => ({ ...p, id: p.source_id,
      surrounding_context: c.restrictiveContext?.passages ?? [] })) },
    reviewBasis: c.id === "S03" ? "Literal matn support is distinct from a safe public explanation; approved interpretive context is required before making an unrestricted implication."
      : c.id === "S11" ? "Core advice is supported; practical qualifications matter. Do not infer that refusal of contact removes every duty of kindness."
      : "Reassessed against the cited Arabic original; see the full-source review. No model output determines this label.",
    liveStatus: "not_tested_v3" };
  });
  const fresh = [
    { id: "N01", source: "Q3:134", url: "https://quran.com/3/134", original: "الذين ينفقون في السراء والضراء والكاظمين الغيظ والعافين عن الناس والله يحب المحسنين", question: "كيف أتعامل مع الغضب دون إيذاء الآخرين؟", good: "تذكر الآية كظم الغيظ والعفو عن الناس ضمن الصفات المحمودة.", bad: "تضمن الآية زوال الغضب نهائيا لكل من يعفو." },
    { id: "N02", source: "Q49:12", url: "https://quran.com/49/12", original: "يا أيها الذين آمنوا اجتنبوا كثيرا من الظن إن بعض الظن إثم ولا تجسسوا ولا يغتب بعضكم بعضا", question: "هل كل ظن بالناس إثم؟", good: "تنهى الآية عن كثير من الظن وتبين أن بعضه إثم.", bad: "تقرر الآية أن كل ظن بالناس إثم بلا استثناء." },
    { id: "N03", source: "Q4:58", url: "https://quran.com/4/58", original: "إن الله يأمركم أن تؤدوا الأمانات إلى أهلها وإذا حكمتم بين الناس أن تحكموا بالعدل", question: "ما واجب من يحمل أمانة ويحكم بين الناس؟", good: "تأمر الآية برد الأمانات إلى أهلها وبالعدل عند الحكم بين الناس.", bad: "توجب الآية قبول حكم أي شخص ولو كان ظالما." },
  ];
  for (const f of fresh) for (const [suffix, text, expected] of [["A", f.good, "faithful_paraphrase"], ["B", f.bad, "source_support"]]) {
    cases.push({ id: `${f.id}${suffix}`, family: "fresh_arabic_topic", expected, historicalExpected: null, question: f.question,
      item: { text, refs: [f.source] }, serialized: { passages: [{ id: f.source, arabic: f.original }] },
      sourceUrl: f.url, reviewBasis: "Narrow source comparison reviewed against the published Arabic on 2026-10-24. No scholarly certification.", liveStatus: "not_tested_v3" });
  }
  for (const id of ["S02", "S05", "S07"]) {
    const c = cases.find(c => c.id === id)!;
    const wording: Record<string, string> = { S02: "يبين النص أن جزاء الفضل يتعلق بالإيمان والعمل الصالح معا.", S05: "يفيد النص أن الله لا يطلب منهم أن يرزقوه أو يطعموه.", S07: "نفع شكر الله يعود إلى الشاكر نفسه." };
    cases.push({ ...c, id: `${id}P`, family: "alternate_wording", item: { ...c.item, text: wording[id] }, historicalExpected: null });
  }
  return { version: 3, status: "prepared_offline_only", previousSha256, cases,
    unscoredApplication: old.unscoredApplication, sourceReview: "docs/ask-assistant-full-source-review-2026-10-24.md",
    dimensions: ["source_support", "missing_qualification", "context_needed", "faithful_paraphrase"],
    protections: "Historical inputs, results and spending remain unchanged. This bank grants no paid-call permission and cannot establish religious accuracy by itself." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const previous = "work/private-ask-evaluation/semantic-failure-regression-bank-v2-20261024.json";
  const bytes = readFileSync(previous), hash = createHash("sha256").update(bytes).digest("hex");
  const output = "work/private-ask-evaluation/meaning-quality-bank-v3-20261024.json";
  const value = JSON.stringify(qualityBankV3(JSON.parse(bytes.toString("utf8")), hash), null, 2) + "\n";
  if (existsSync(output) && readFileSync(output, "utf8") !== value) throw Error("refusing_to_overwrite_existing_bank");
  if (!existsSync(output)) writeFileSync(output, value, { flag: "wx" });
  if (createHash("sha256").update(readFileSync(previous)).digest("hex") !== hash) throw Error("historical_bank_changed");
  console.log(JSON.stringify({ output, cases: JSON.parse(value).cases.length, previousSha256: hash, paidCalls: 0 }));
}
