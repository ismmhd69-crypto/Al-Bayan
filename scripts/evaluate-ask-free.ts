// Owner-authorized online evaluation. Runs in a separate process; website defaults stay unchanged.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { freeTransport, withFreeTransport, type FreeReceipt } from "./ask-free-guard";

const candidates = ["xingchen-agi/xing4.0-29b-a4b:free", "nvidia/nemotron-3.5-lightning:free", "nvidia/nemotron-3-ultra-550b-a55b:free", "cohere/north-mini-code:free", "recursive/flint-v1.0:free"];
const cases = [
  ["worship", "لماذا يأمرنا الله بعبادته وهو غني عنا؟ وما الفائدة التي تعود علينا من العبادة؟"],
  ["rights", "إذا ظلمت شخصا فهل يكفي أن أستغفر الله؟ وهل يختلف الأمر بين أخذ ماله والإساءة إليه بالكلام؟"],
  ["parents", "كيف يعامل المسلم والديه غير المسلمين؟ وهل البر بهما يعني طاعتهما في كل ما يطلبان؟"],
  ["patience", "هل الصبر يعني السكوت عن الظلم؟ وكيف يجمع المسلم بين الصبر والمطالبة بحقه؟"],
  ["intention", "هل النية الحسنة تجعل العمل المحرم مباحا؟ وما علاقة النية بصحة العمل؟"],
  ["repentance", "هل يقبل الله توبة من عاد إلى الذنب مرارا؟ وما شروط التوبة؟"],
  ["charity", "ما الفرق بين الزكاة والصدقة؟ وهل تغني الصدقة التطوعية عن الزكاة الواجبة؟"],
  ["anger", "كيف يتعامل المسلم مع الغضب دون أن يظلم الناس أو يكتم حقه؟"],
  ["trust", "هل التوكل على الله يعني ترك العمل والأخذ بالأسباب؟"],
  ["rumours", "كيف أتعامل مع خبر يسيء لشخص قبل أن أتحقق منه؟ وهل يجوز نشره لمجرد أن الناس يتداولونه؟"],
  ["personal", "قال لي زوجي أنت طالق ثلاث مرات وهو غاضب أمس. هل ما زلت زوجته؟"],
  ["offtopic", "كيف أصنع كعكة الشوكولاتة؟"],
] as const;

async function main() {
  for (const path of [".env.local", ".env"]) if (existsSync(path)) process.loadEnvFile(path);
  Object.assign(process.env, { NODE_ENV: "development", ASK_LOCAL_TRACE: "false", ASK_DEBUG: "false", OPENROUTER_PRIVACY: "zdr", OPENROUTER_REASONING: "off" });
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter key unavailable");
  const folder = resolve("work/private-ask-evaluation"); mkdirSync(folder, { recursive: true });
  const path = resolve(folder, `free-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const report = { at: new Date().toISOString(), status: "preflight", privacy: "unchanged_zdr_no_training", receipts: [] as FreeReceipt[], metadata: [] as unknown[], smoke: [] as any[], rows: [] as any[], writer: "", checker: "", sourceFaithfulnessAcceptance: "pending_independent_review" };
  const save = () => writeFileSync(path, JSON.stringify(report, null, 2), { mode: 0o600 }); save();
  console.log(`Report: ${path}`);
  const catalog: any = await (await fetch("https://openrouter.ai/api/v1/models")).json();
  const selectedCandidates = process.argv.includes("--frame-only") ? candidates.slice(0, 1) : candidates;
  for (const id of selectedCandidates) {
    const entry = catalog.data.find((m: any) => m.id === id);
    if (!entry || entry.pricing.prompt !== "0" || entry.pricing.completion !== "0" || (id === candidates[0] && !entry.supported_parameters.includes("structured_outputs"))) throw new Error("free metadata acceptance failed");
    const endpoints = await (await fetch(`https://openrouter.ai/api/v1/models/${id}/endpoints`)).json();
    report.metadata.push({ id, pricing: entry.pricing, supported_parameters: entry.supported_parameters, endpoints });
  }
  save();
  const guarded = freeTransport(new Set(candidates), receipt => { report.receipts.push(receipt); save(); });
  const dispatch = (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    // MiniMax requires reasoning; Xing permits it to be disabled. No schema requirements change.
    if (body.model === "minimax/minimax-m3.1-flash:free") body.reasoning = { effort: "low", exclude: true };
    return guarded(url, { ...init, body: JSON.stringify(body) });
  };
  const { createOpenRouter } = await import("../lib/ai/openrouter");
  await withFreeTransport(dispatch, async () => {
    for (const id of selectedCandidates) {
      const start = Date.now();
      try {
        const value = await createOpenRouter(process.env.OPENROUTER_API_KEY!, id).generateJson({ system: "Follow the requested JSON format exactly.", prompt: "Return ok true and language ar.", structuredOutput: id === candidates[0],
          schema: { type: "object", properties: { ok: { type: "boolean" }, language: { type: "string", enum: ["ar"] } }, required: ["ok", "language"] }, maxOutputTokens: 2048, signal: AbortSignal.timeout(90_000) });
        report.smoke.push({ id, value, ms: Date.now() - start });
      } catch (e) { report.smoke.push({ id, error: e instanceof Error ? e.message : "failed", ms: Date.now() - start }); }
      save(); console.log(JSON.stringify(report.smoke.at(-1)));
    }
    if (process.argv.includes("--smoke-only")) { report.status = "smoke_finished"; save(); return; }
    if (process.argv.includes("--frame-only")) {
      // Capture the actual active rich-pipeline framing request before any retrieval/checking.
      // Dummy dependencies must never run: this mode does not claim to test source answers.
      const { runPipeline } = await import("../lib/ask/core");
      const { parseQuestionFrame, questionFrameMismatch, questionFrameRejection } = await import("../lib/ask/retrieval");
      const provider = createOpenRouter(process.env.OPENROUTER_API_KEY!, candidates[0]);
      report.writer = candidates[0]; report.status = "live_question_understanding_only"; save();
      for (const [id, question] of cases) {
        let request: import("../lib/ai/types").JsonRequest | undefined;
        const captured = new Error("request_captured_before_retrieval");
        const unused = async (): Promise<never> => { throw new Error("frame_test_must_not_retrieve_or_check"); };
        try { await runPipeline(question, "ar", { rich: {}, tiered: { videoBudgetMs: 0, maxVideos: 0 },
          writer: { id: provider.id, generateJson: async req => { request = req; throw captured; } },
          verifier: { id: "unused", generateJson: unused }, search: unused, getVerse: unused, neighbours: unused });
        } catch (e) { if (e !== captured) throw e; }
        if (!request) throw new Error("active_framing_request_missing");
        const start = Date.now();
        const row: any = { id, question, component: "active_rich_question_frame", status: "running" }; report.rows.push(row); save();
        try {
          const raw = await provider.generateJson(request);
          const frame = parseQuestionFrame(raw);
          row.frame = frame; row.raw = raw;
          row.status = !frame ? questionFrameRejection(raw) : questionFrameMismatch(question, frame) ?? "frame_contract_passed_requires_meaning_review";
        } catch (e) { row.status = "error"; row.error = e instanceof Error ? e.message : "failed"; }
        row.totalMs = Date.now() - start; save(); console.log(JSON.stringify({ id, status: row.status, ms: row.totalMs }));
        if (report.receipts.some(r => /uncertain|unexpected/.test(r.outcome))) { report.status = "stopped_uncertain_receipt"; save(); return; }
        if (report.rows.slice(-3).length === 3 && report.rows.slice(-3).every(r => r.status === "error")) { report.status = "stopped_three_transport_failures"; save(); return; }
        if (id !== cases.at(-1)![0]) await new Promise(resolve => setTimeout(resolve, 15_000));
      }
      report.status = "frame_tests_finished_not_answer_accuracy"; save(); return;
    }
    const working = report.smoke.filter(r => r.value?.ok === true && r.value?.language === "ar").map(r => r.id);
    if (!working.includes(candidates[0]) || working.length < 2) { report.status = "blocked_fewer_than_two_compatible_free_models"; save(); return; }
    report.writer = working[0]; report.checker = working[1];
    process.env.AI_MODELS = `openrouter:${report.writer}`;
    process.env.AI_VERIFIER_MODELS = `openrouter:${report.checker}`;
    const { ask } = await import("../lib/ask/pipeline");
    const { stripAnswer } = await import("../lib/chat/answer-store");
    const limit = Number(process.argv.find(a => a.startsWith("--limit="))?.slice(8) ?? 12);
    report.status = "running";
    for (const [id, question] of cases.slice(0, limit)) {
      const started = Date.now();
      const row: any = { id, question, status: "running", sections: [], firstCheckedMs: null }; report.rows.push(row); save();
      try {
        const result = await ask(question, "ar", { onFrame: () => {} }, [], { disableReferenceHints: true, rich: {
          onSection: section => { if (section.outcome === "ready" && row.firstCheckedMs === null) row.firstCheckedMs = Date.now() - started;
            row.sections.push({ group: section.group, outcome: section.outcome, claims: section.claims }); save(); },
          onWithdraw: () => { row.withdrawn = true; save(); },
        } });
        row.status = result.status;
        row.result = result.status === "rich_answer" ? { ...result, answer: stripAnswer(result.answer) } : result.status === "incomplete" ? { status: result.status, withdraw: result.withdraw } : result;
      } catch (e) { row.status = "error"; row.error = e instanceof Error ? e.message : "failed"; }
      row.totalMs = Date.now() - started; save();
      console.log(JSON.stringify({ id, status: row.status, totalMs: row.totalMs, sections: row.sections.map((s: any) => `${s.group}:${s.outcome}`) }));
      if (report.receipts.some(r => /uncertain|unexpected/.test(r.outcome))) { report.status = "stopped_uncertain_receipt"; save(); return; }
    }
    report.status = "finished_requires_source_review"; save();
  });
}
main().catch(e => { console.error(e instanceof Error ? e.message : "free evaluation failed"); process.exitCode = 1; });
