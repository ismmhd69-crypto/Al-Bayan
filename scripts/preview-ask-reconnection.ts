// Isolated OFFLINE browser harness. Real React components/CSS, invented evidence and fake HTTP.
// Never reads .env, creates a provider, contacts Supabase or serves the production application.
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { build } from "esbuild";
import { richAnswer } from "../tests/fixtures/rich";
import type { RichAnswer } from "../lib/ask/rich-answer";
import { APPROVED_CHANNELS } from "../lib/sources/youtube-channels";

async function main() {
  const project = resolve(process.cwd()),
    root = join(
      project,
      "work/private-ask-evaluation/browser-research-fixture",
    );
  await mkdir(root, { recursive: true });
  const alias = join(root, "browser.jsx"),
    entry = join(root, "entry.jsx");
  // Generated fixtures are JavaScript, not application TypeScript input.
  for (const name of ["browser.tsx", "entry.tsx"])
    await unlink(join(root, name)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  await writeFile(
    alias,
    `
import React from 'react';
const callbacks=new Set();
let user={id:'user-a',email:'a@offline.invalid'};
const session=()=>user?{user,access_token:'fixture-'+user.id}:null;
window.__qaSetUser=id=>{user=id?{id,email:id+'@offline.invalid'}:null;callbacks.forEach(cb=>cb('SIGNED_IN',session()));};
export const browserSupabase=()=>({auth:{getSession:async()=>({data:{session:session()},error:null}),onAuthStateChange:cb=>{callbacks.add(cb);return {data:{sub:{},subscription:{unsubscribe:()=>callbacks.delete(cb)}}};}}});
export const listChats=async()=>[];
export const openChat=async id=>({id,turns:[]});
export const deleteChat=async()=>{};
export const deleteAllChats=async()=>{};
export async function saveExchange(chatId,position,lang,question,reply,options){
 const res=await fetch('/__qa/save',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer fixture-'+user?.id},body:JSON.stringify({chatId,position,lang,question,reply,options})});
 if(!res.ok)throw new Error('synthetic_save_failure');return res.json();
}
export default function Link({href,children,prefetch,...props}){return <a href={href} {...props}>{children}</a>;}
`,
  );
  const importPath = (path: string) =>
    JSON.stringify(join(project, path).replace(/\\/g, "/"));
  await writeFile(
    entry,
    `
import React from 'react';
import {createRoot} from 'react-dom/client';
import AskWorkspace from ${importPath("components/AskWorkspace.tsx")};
import {getDictionary} from ${importPath("lib/i18n.ts")};
import {chatText} from ${importPath("lib/chat-text.ts")};
import ${importPath("app/globals.css")};
const lang=new URLSearchParams(location.search).get('lang')||'en';
document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
const d=getDictionary(lang);
createRoot(document.getElementById('root')).render(<React.StrictMode><p style={{margin:0,padding:8,background:'#fff1c2',color:'#111'}}>OFFLINE UI TEST. Invented evidence. No model or real account.</p><div style={{height:'calc(100dvh - 38px)'}}><AskWorkspace lang={lang} t={d.ask} chat={chatText[lang]} backLabel={d.common.back} suggestions={[]} testMode={false} richEnabled={true} durableEnabled={true}/></div></React.StrictMode>);
`,
  );
  await build({
    entryPoints: [entry],
    outfile: join(root, "bundle.js"),
    bundle: true,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    tsconfig: join(project, "tsconfig.json"),
    define: { "process.env.NODE_ENV": '"development"' },
    logLevel: "silent",
    plugins: [
      {
        name: "offline-only-adapters",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^next\/link$|^@\/lib\/supabase-browser$|^@\/lib\/chat\/chats$/,
            },
            () => ({ path: alias }),
          );
        },
      },
    ],
  });
  if (process.argv.includes("--build-only")) return;
  const jobs = new Map<
    string,
    {
      id: string;
      key: string;
      question: string;
      lang: string;
      scope: string;
      state: string;
      reads: number;
      lost: boolean;
      patient?: boolean;
      continued?: boolean;
      events: unknown[];
    }
  >();
  let scenario = "normal",
    startRequests = 0,
    starts = 0,
    finds = 0,
    reads = 0,
    cancels = 0,
    saveCalls = 0,
    saved = 0,
    saveFailures = 0;
  const savedIds = new Set<string>();
  const json = (
    res: import("node:http").ServerResponse,
    value: unknown,
    status = 200,
  ) => {
    res.writeHead(status, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
      if (path === "/" || path === "/bundle.js" || path === "/bundle.css") {
        if (path === "/") {
          res.setHeader("content-type", "text/html");
          res.end(
            '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>',
          );
          return;
        }
        res.setHeader(
          "content-type",
          path.endsWith(".css") ? "text/css" : "text/javascript",
        );
        res.end(await readFile(join(root, path.slice(1))));
        return;
      }
      const chunks: Buffer[] = [];
      for await (const part of req) {
        chunks.push(Buffer.from(part));
        if (chunks.reduce((n, b) => n + b.length, 0) > 500000) {
          json(res, { error: "fixture_too_large" }, 413);
          return;
        }
      }
      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString())
        : {};
      if (path === "/__qa/reset") {
        jobs.clear();
        savedIds.clear();
        scenario = body.scenario ?? "normal";
        starts =
          startRequests =
          finds =
          reads =
          cancels =
          saveCalls =
          saved =
            0;
        saveFailures = scenario === "save-fail" ? 1 : 0;
        json(res, { ok: true });
        return;
      }
      if (path === "/__qa/state") {
        json(res, {
          scenario,
          starts,
          startRequests,
          finds,
          reads,
          cancels,
          saveCalls,
          saved,
          savedIds: [...savedIds],
          jobs: [...jobs.values()].map((j) => ({
            id: j.id,
            state: j.state,
            scope: j.scope,
          })),
        });
        return;
      }
      if (path === "/__qa/save") {
        saveCalls++;
        if (saveFailures-- > 0) {
          json(res, { error: "synthetic_save_failure" }, 500);
          return;
        }
        if (
          body.options?.userId !==
          String(req.headers.authorization ?? "").replace("Bearer fixture-", "")
        ) {
          json(res, { error: "owner_changed" }, 401);
          return;
        }
        if (!savedIds.has(body.options?.exchangeId)) {
          saved++;
          savedIds.add(body.options?.exchangeId);
        }
        json(res, {
          chatId: body.chatId ?? body.options?.exchangeId ?? randomUUID(),
          position: body.position,
        });
        return;
      }
      if (!path.startsWith("/api/ask/jobs")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const scope = createHash("sha256")
        .update(String(req.headers.authorization ?? "anonymous"))
        .digest("hex")
        .slice(0, 32);
      const answer = (value: object, status = 200) =>
        json(res, { version: 1, scope, ...value }, status);
      if (path.endsWith("/session")) {
        answer({ status: "ready" });
        return;
      }
      if (req.headers["x-bayan-research-scope"] !== scope) {
        answer({ status: "scope_changed" }, 409);
        return;
      }
      const key = String(req.headers["idempotency-key"] ?? body.key ?? "");
      const owned = [...jobs.values()].filter((j) => j.scope === scope);
      if (path.endsWith("/cancel")) {
        cancels++;
        const job = owned.find((j) => j.key === key);
        if (job) job.state = "cancelled";
        answer({
          status: "job",
          id: job?.id ?? randomUUID(),
          state: "cancelled",
          sequence: 0,
        });
        return;
      }
      if (path.endsWith("/find")) {
        finds++;
        const job = owned.find((j) => j.key === key);
        if (!job) {
          answer({ status: "not_found" }, 404);
          return;
        }
        answer({
          status: "job",
          id: job.id,
          state: job.state,
          language: job.lang,
          question: job.question,
          sequence: 0,
        });
        return;
      }
      if (path.endsWith("/continue")) {
        const job = owned.find(j => j.id === body.id);
        if (!job || !job.patient || job.state !== "paused") { answer({ status: "not_ready" }, 409); return; }
        job.continued = true; job.state = "running";
        answer({ version: 2, status: "job", id: job.id, state: "queued", sequence: 3 }); return;
      }
      if (path.endsWith("/read")) {
        reads++;
        const job = owned.find((j) => j.id === body.id);
        if (!job) {
          answer({ status: "not_found" }, 404);
          return;
        }
        job.reads++;
        if (job.patient) {
          const pause = scenario === "patient-pause";
          const count = pause && !job.continued ? 3 : !pause && job.reads < 4 ? 2 : job.events.length;
          job.state = pause && !job.continued ? "paused" : count === job.events.length ? "complete" : "running";
          answer({ version: 2, status: "job", id: job.id, language: job.lang, state: job.state,
            sequence: count, events: job.events.slice(Number(body.after ?? 0), count) }); return;
        }
        if (scenario === "drop" && job.reads === 1) {
          req.socket.destroy();
          return;
        }
        if (scenario === "changed" && job.reads > 1) {
          answer({ status: "sources_changed", withdraw: true }, 409);
          return;
        }
        const final = job.reads > 1 && scenario !== "slow";
        const count = final ? job.events.length : 3;
        const events = job.events.slice(Number(body.after ?? 0), count);
        if (final) job.state = "complete";
        answer({
          status: "job",
          id: job.id,
          language: job.lang,
          state: job.state,
          sequence: count,
          events,
        });
        return;
      }
      startRequests++;
      const existing = jobs.get(`${scope}:${key}`);
      if (existing) {
        answer(
          {
            status: "job",
            id: existing.id,
            state: existing.state,
            sequence: 0,
          },
          202,
        );
        return;
      }
      starts++;
      const id = randomUUID(), lang = body.lang ?? "en";
      let answerData: RichAnswer = structuredClone(richAnswer);
      if (scenario === "videos" || scenario.startsWith("patient-")) answerData = {
        ...answerData, version: 4,
        guide: { kind: "learning", refs: [], text: lang === "ar" ? "اقرأ المصادر التجريبية لفهم هذا المثال." : lang === "de" ? "Lesen Sie die erfundenen Quellen dieses Beispiels." : "Read the invented sources for this example." },
        sections: answerData.sections.map(s => ({ ...s, sources: s.sources.map(source => ({ ...source, role: "direct", requirementIds: ["R1"], explanationRequirementIds: [] })) })),
        videos: { version: 1, basis: "title_only", items: [{ youtubeId: "abcdefghijk", channelId: APPROVED_CHANNELS[0].channelId,
          title: lang === "de" ? "Erfundenes Lernvideo mit einem langen deutschen Titel zur Prüfung des mobilen Layouts" : lang === "ar" ? "عنوان تجريبي للتعلّم وليس مقطعاً حقيقياً" : "Invented learning clip for offline layout inspection", minutes: 3, language: lang }] },
      };
      answerData.language = lang;
      const texts =
        lang === "ar"
          ? [
              "يوضح القرآن معنى المسؤولية في المثال التجريبي.",
              "يوضح الحديث معنى العناية بالأعمال في المثال التجريبي.",
              "يوضح ابن باز معنى الفكرة وشروطها في المثال التجريبي.",
              "توضح هذه المصادر معنى العناية بالمسؤولية في المثال التجريبي.",
            ]
          : lang === "de"
            ? [
                "Der Koran beschreibt Sorgfalt als Verantwortung im erfundenen Beispiel.",
                "Der Prophet erklärt die Aufmerksamkeit im erfundenen Beispiel.",
                "Ibn Baz erklärt die Bedingungen im erfundenen Beispiel.",
                "Zusammen erläutern diese Quellen die Verantwortung und ihre Bedingungen.",
              ]
            : null;
      if (texts)
        answerData.sections.forEach((section, i) =>
          section.claims.forEach((claim) => {
            claim.text = texts[i];
          }),
        );
      const events: unknown[] = [
        { request_id: id, sequence: 1, type: "progress", stage: "searching" },
        {
          request_id: id,
          sequence: 2,
          type: "section",
          section: answerData.sections[0],
        },
        {
          request_id: id,
          sequence: 3,
          type: "progress",
          stage: "checking_remaining",
        },
      ];
      for (const section of answerData.sections.slice(1))
        events.push({
          request_id: id,
          sequence: events.length + 1,
          type: "section",
          section,
        });
      events.push({
        request_id: id,
        sequence: events.length + 1,
        type: "terminal",
        result: { status: "rich_answer", answer: answerData },
      });
      const patient = scenario.startsWith("patient-");
      if (patient) {
        events.length = 0;
        const emit = (body: object) => events.push({ ...body, version: 2, job_id: id, sequence: events.length + 1 });
        emit({ type: "section", section: answerData.sections[0], revision: 1, evidence_revision: 1 });
        emit({ type: "section", section: answerData.sections[1], revision: 1, evidence_revision: 2 });
        if (scenario === "patient-pause") { emit({ type: "pause", reason: "source_failed" }); emit({ type: "resume" }); }
        emit({ type: "section", section: answerData.sections[2], revision: 1, evidence_revision: 3 });
        emit({ type: "section", section: answerData.sections[3], revision: 1, evidence_revision: 3 });
        emit({ type: "terminal", status: "complete", answer: answerData });
        delete answerData.videos;
      }
      jobs.set(`${scope}:${key}`, {
        id,
        key,
        question: body.question,
        lang,
        scope,
        state: "running",
        reads: 0,
        lost: false,
        patient,
        events,
      });
      if (scenario === "lost") {
        req.socket.destroy();
        return;
      }
      answer({ status: "job", id, state: "queued", sequence: 0 }, 202);
    } catch {
      json(res, { error: "offline_fixture_error" }, 500);
    }
  });
  server.listen(3107, "127.0.0.1", () =>
    console.info(
      "Offline component fixture: http://127.0.0.1:3107 (no real services or keys)",
    ),
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "offline_fixture_failed",
  );
  process.exitCode = 1;
});
