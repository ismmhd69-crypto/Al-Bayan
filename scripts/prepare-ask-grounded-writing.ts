// Six fixed source-writing components. Source reads only; no model dispatch.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistCampaign, digest } from "./ask-arabic-campaign-guard";

async function main() {
  const path = resolve("work/private-ask-evaluation/grounded-writing-bank-20261024.json");
  if (existsSync(path)) throw Error("fixed_grounded_bank_already_prepared");
  const specs = [
    { id: "W01", keys: ["31:15"], question: "كيف أعامل والدي غير المسلمين؟ وهل البر يعني طاعتهما في كل شيء؟", concern: "Kind treatment of non-Muslim parents and the stated limit on obedience", review: "Preserve the explicit pressure toward association, refusal to obey that demand, and continued kind companionship. No unrestricted obedience or severance." },
    { id: "W02", keys: ["49:6"], question: "كيف أتحقق من خبر قد يؤذي شخصا إذا نشرته؟", concern: "Verification before harm from a report", review: "Preserve the verse's specified reporter and warning about harming people through ignorance. Do not invent a universal presumption that every reporter is dishonest." },
    { id: "W03", keys: ["2:185"], question: "ما الذي يذكره القرآن عن الصيام عند المرض أو السفر؟", concern: "Illness and travel in the fasting passage", review: "Keep illness/travel and making up the number on other days. No invented medical threshold or blanket exemption without later accounting." },
    { id: "W04", keys: ["20:43", "20:44"], question: "كيف أتكلم مع شخص يسيء إلي دون أن أزيد المشكلة؟", concern: "A bounded example of gentle speech", review: "Retain the command to the two sent to Pharaoh and the tentative hope expressed. Do not promise gentle speech always changes an aggressor or decide a visitor-specific safety obligation." },
    { id: "W05", keys: ["18:65", "18:79", "18:82"], question: "كيف ننتبه للسياق قبل الحكم على فعل يبدو ضارا؟", concern: "A narrated event whose reasons and authority have specific limits", review: "Keep the narrated boat, its poor owners, threat of seizure and explicit not-on-my-own-command boundary. No general permission to damage others' property or invented named identity from outside the supplied originals." },
  ];
  for (const env of [".env.local", ".env"]) if (existsSync(env)) process.loadEnvFile(env);
  const { getVerse, neighbours } = await import("../lib/sources/quran");
  const { sealedPackageJson } = await import("../lib/ask/core");
  const traceBytes = readFileSync(resolve("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"), "utf8");
  const events = traceBytes.trim().split(/\r?\n/u).map(s => JSON.parse(s));
  const captured = events.find(e => e.event === "model_request" && e.data.call_id === "A9")?.data;
  if (captured.phase !== "draft" || captured.prompt.sections_to_write.join(",") !== "hadith,scholar") throw Error("source_writer_template_changed");
  const cases: any[] = [{ id: "W00", group: "hadith", question: "لماذا يأمرنا الله بعبادته وهو غني عنا؟ وما الفائدة التي تعود علينا من العبادة؟", knownRegression: true,
    serialized: captured.prompt.evidence_package, review: "Describe the elderly man's walking vow as that narrated case and retain being told to ride. The rights narration keeps worship/non-association and no invented licence to abandon duties. No general prohibition/conclusion about all worship hardship." }];
  for (const spec of specs) {
    const passages = [];
    for (const key of spec.keys) {
      const verse = await getVerse(key);
      if (!verse || verse.key !== key || verse.url !== `https://quran.com/${key.replace(":", "/")}` || !verse.arabic.trim()) throw Error("source_read_or_identity_failed");
      passages.push({ id: `Q${key}`, source: { kind: "quran", verse }, context: await neighbours(key), requirementIds: ["R1"], facets: ["general"] });
    }
    const question = { language: "ar", kind: "question", questionType: "general", subjects: [spec.concern], requirements: [{ id: "R1", text: spec.concern, facet: "general", scope: "general" }], qualifiers: [], searchQueries: { ar: [], en: [], de: [] } };
    cases.push({ ...spec, group: "quran", knownRegression: false, serialized: sealedPackageJson({ question, passages, cards: [] } as any, "ar", false, true) });
  }
  const report = { status: "prepared_fixed_before_model_calls", scope: "Source-writing components only, not search/selection, full Ask accuracy or scholarly certification. W00 is a known failure; five fresh source/concern controls are not a population estimate. Expected review notes are never sent to the writer.",
    templateTraceHash: digest(traceBytes), modelCalls: 0, modelCost: 0, cases };
  persistCampaign(path, report); console.log(JSON.stringify({ status: report.status, cases: cases.length, modelCalls: 0, modelCost: 0, ids: cases.map(c => c.id) }));
}
main().catch(e => { console.error(e instanceof Error ? e.message : "source_bank_preparation_failed"); process.exitCode = 1; });
