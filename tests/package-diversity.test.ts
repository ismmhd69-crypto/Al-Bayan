import { expect, it } from "vitest";
import { chooseSealedPackage } from "../lib/ask/package";
import type { SelectedPassage } from "../lib/ask/retrieval";

const passage = (key: string, req: string, text: string): SelectedPassage => ({ id: `Q${key}`, context: [], requirementIds: [req], explanationRequirementIds: [], facets: [], contribution: { role: "direct", scope: "general", conditions: [] },
  source: { kind: "quran", verse: { key, arabic: text, arabicPlain: text, translations: { en: null, de: null }, url: `https://quran.com/${key.replace(":", "/")}` } } });
const shared = "كلمات لغوية مختلقة لا تنقل عن مصدر ديني";
const pool = () => [passage("1:1", "R1", "مثال مختلف مستقل في ترتيب المعاني"), passage("2:1", "R2", `${shared} خاتمة أولى`), passage("3:1", "R2", `${shared} خاتمة ثانية`), passage("4:1", "R1", "تفصيل آخر مختلف في المثال اللغوي المستقل")];
const opts = { caps: { quranCards: 3, passages: 8, hadith: 2, scholar: 2 }, diverseQuranFillers: true };
const ids = (r: ReturnType<typeof chooseSealedPackage>) => r?.passages.map(p => p.id);
it("prefers another eligible contribution before a high-overlap optional Quran filler within the same caps", () => {
  const input = pool(), before = JSON.stringify(input);
  expect(ids(chooseSealedPackage(input, ["R1", "R2"], { ...opts, diverseQuranFillers: false }))).toEqual(["Q1:1", "Q2:1", "Q3:1"]);
  const result = chooseSealedPackage(input, ["R1", "R2"], opts)!;
  expect(ids(result)).toEqual(["Q1:1", "Q4:1", "Q2:1"]); expect(result.cards).toHaveLength(3); expect(JSON.stringify(input)).toBe(before);
  expect(ids(chooseSealedPackage(input, ["R1", "R2"], { ...opts, caps: { ...opts.caps, quranCards: 4 } }))).toContain("Q3:1");
});
it("never replaces mandatory coverage, explicit conditions, named complete units or necessary plan citations", () => {
  const input = pool(); input[2].requirementIds = ["R3"];
  expect(ids(chooseSealedPackage(input, ["R1", "R2", "R3"], opts))).toContain("Q3:1");
  const conditional = pool(); conditional[2].contribution!.conditions = ["A stated condition"];
  expect(ids(chooseSealedPackage(conditional, ["R1", "R2"], opts))).toContain("Q3:1");
  const named = pool(); named[2].source = { ...named[2].source, kind: "quran", verse: { ...(named[2].source as any).verse, key: "2:2", url: "https://quran.com/2/2" } }; named[2].id = "Q2:2";
  const kept = chooseSealedPackage(named, ["R1", "R2"], { ...opts, namedPassages: [["Q2:1", "Q2:2"]] })!;
  expect(ids(kept)).toEqual(expect.arrayContaining(["Q2:1", "Q2:2"]));
  const planned = chooseSealedPackage(pool(), ["R1", "R2"], { ...opts, contributionPlan: [
    { sourceIds: ["Q1:1"], requirementIds: ["R1"], purpose: "answer", necessary: true, description: "First" },
    { sourceIds: ["Q2:1", "Q3:1"], requirementIds: ["R2"], purpose: "answer", necessary: true, description: "Joint originals" },
  ] });
  expect(ids(planned)).toEqual(expect.arrayContaining(["Q2:1", "Q3:1"]));
});
it("does not classify short common openings or differing requested points as repeat fillers", () => {
  const input = pool();
  if (input[2].source.kind !== "quran") throw Error("fixture");
  input[2].source.verse.arabic = "كلمات مشتركة فقط ثم تفصيل مغاير";
  expect(ids(chooseSealedPackage(input, ["R1", "R2"], opts))).toContain("Q3:1");
});
