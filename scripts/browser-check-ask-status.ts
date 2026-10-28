// Reliability plan Phase 1: real-browser check of busy, rate-limit, expired and approved-reuse paths.
// Offline only: a scripted local server, invented fixture wording, no .env, no AI or source calls.
// Run: npx tsx scripts/browser-check-ask-status.ts
import { build } from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { sections } from "../tests/fixtures/rich";

const T1 = "1".repeat(64), T2 = "2".repeat(64), T3 = "3".repeat(64);
const link = (token: string, extra: object = {}) => ({ token, remaining: 3, expires: Date.now() + 600_000, available: true, ...extra });

async function main() {
  const root = resolve("work/private-ask-evaluation/browser-check");
  await mkdir(root, { recursive: true });
  const entry = join(root, "entry.jsx"), alias = join(root, "adapters.jsx");
  await writeFile(alias, `import React from 'react';
export default function Link({href,children,prefetch,...props}){return <a href={href} {...props}>{children}</a>;}
export const browserSupabase=()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}});`);
  const path = (v: string) => JSON.stringify(resolve(v).replace(/\\/g, "/"));
  await writeFile(entry, `import React from 'react';import {createRoot} from 'react-dom/client';
import AskChat from ${path("components/AskChat.tsx")};import {getDictionary} from ${path("lib/i18n.ts")};import ${path("app/globals.css")};
createRoot(document.getElementById('root')).render(<div style={{height:'100dvh',display:'flex',flexDirection:'column'}}><AskChat lang="en" t={getDictionary('en').ask} backLabel="Home" suggestions={[]} testMode={false} richEnabled durableEnabled={false}/></div>);`);
  await build({ entryPoints: [entry], outfile: join(root, "bundle.js"), bundle: true, platform: "browser", format: "esm", jsx: "automatic", tsconfig: resolve("tsconfig.json"),
    define: { "process.env.NODE_ENV": '"development"', "process.env.NEXT_PUBLIC_ASK_STABLE_STREAMING": '"true"' }, logLevel: "silent",
    plugins: [{ name: "offline-adapters", setup(b) { b.onResolve({ filter: /^next\/link$|^@\/lib\/supabase-browser$/ }, () => ({ path: alias })); } }] });

  const originals = sections.slice(0, 3).map(s => ({ ...s, presentation: "originals", claims: [], sources: s.sources.map(source => ({ ...source, role: "direct", requirementIds: ["R1"], explanationRequirementIds: [] })) }));
  const summary = { ...sections[3], sources: sections[3].sources.map(source => ({ ...source, role: "direct", requirementIds: ["R1"], explanationRequirementIds: [] })) };
  const received: Record<string, unknown>[] = [];
  let runs = 0;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/") { res.setHeader("content-type", "text/html"); res.end('<!doctype html><meta charset="UTF-8"><title>Ask status check</title><link rel="stylesheet" href="/bundle.css"><div id="root"></div><script type="module" src="/bundle.js"></script>'); return; }
    if (url.pathname === "/bundle.js" || url.pathname === "/bundle.css") { res.setHeader("content-type", url.pathname.endsWith("css") ? "text/css" : "text/javascript"); res.end(await readFile(join(root, url.pathname.slice(1)))); return; }
    if (url.pathname !== "/api/ask/stream") { res.writeHead(404).end(); return; }
    const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString()); received.push(body);
    const json = (code: number, value: object) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(value)); };
    const stream = (token: string | null, withSummary: boolean, terminal: object) => {
      res.writeHead(200, { "content-type": "text/event-stream" }); let sequence = 0; const id = `check-${++runs}`;
      const send = (e: object) => res.write(`data: ${JSON.stringify({ version: 3, request_id: id, sequence: ++sequence, ...e })}\n\n`);
      if (token) send({ type: "continuation", continuation: link(token) });
      const all = withSummary ? [...originals, summary] : originals;
      all.forEach((section, i) => send({ type: "section_committed", section, commit_id: String(i + 1).repeat(64), evidence_snapshot: "a".repeat(64) }));
      send({ type: "terminal", result: terminal }); res.end();
    };
    const incomplete = { status: "incomplete", language: "en", withdraw: false, failureKind: "question_coverage" };
    if (body.action === "status" && body.continue_token === T2) return json(200, { status: "research_status", continuation: link(T2, { available: false, approved: true }) });
    if (body.action) return json(200, { status: "research_cancelled" });
    if (body.continue_token === T1) return json(429, { status: "rate_limited" });
    if (body.continue_token === T3) return json(409, { status: "research_expired" });
    if (body.reuse_only) return stream(null, true, { status: "rich_answer", answer: { version: 4, language: "en", review: "automatic", complete: true, sections: [...originals, summary] } });
    if (body.question === "rate limit case") return stream(T1, false, incomplete);
    if (body.question === "expired case") return stream(T3, false, incomplete);
    if (body.question === "busy case") return json(409, { status: "research_busy", continuation: link(T2, { available: false, reason: "busy" }) });
    json(400, { status: "bad_request" });
  });
  await new Promise<void>(r => server.listen(3109, "127.0.0.1", () => r()));
  const browser = await chromium.launch();
  const results: { check: string; pass: boolean; detail?: string }[] = [];
  const check = (name: string, pass: boolean, detail?: string) => { results.push({ check: name, pass, detail }); console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`); };
  const ask = async (page: import("playwright").Page, q: string) => { await page.locator("textarea").fill(q); await page.keyboard.press("Enter"); };
  const sourceCount = (page: import("playwright").Page) => page.locator(".msg-bayan").first().locator("a[href^='https://']").count();
  try {
    // 1. Rate limit during Continue keeps the card and its checked sources.
    let page = await browser.newPage();
    await page.goto("http://127.0.0.1:3109/");
    await ask(page, "rate limit case");
    await page.getByRole("button", { name: "Continue answer" }).waitFor({ timeout: 15_000 });
    const before = await sourceCount(page);
    await page.getByRole("button", { name: "Continue answer" }).click();
    await page.getByText("You've asked a lot in a short time").waitFor({ timeout: 15_000 });
    const after = await sourceCount(page);
    check("rate-limit reply during Continue keeps the answer card", before > 0 && after === before, `source links before ${before}, after ${after}`);
    await page.close();

    // 2. Busy on a new card says research is running, keeps the link, and an approved status reuses the answer.
    page = await browser.newPage();
    await page.goto("http://127.0.0.1:3109/");
    await ask(page, "busy case");
    await page.getByText("already being researched").waitFor({ timeout: 15_000 });
    check("busy reply on a new card says research is running, not interrupted", (await page.getByText("connection was interrupted").count()) === 0);
    await page.getByRole("button", { name: "Check again" }).click();
    await page.waitForFunction(() => document.body.innerText.includes("Explain care") || document.querySelectorAll("a[href^='https://']").length > 0, undefined, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    const reuse = received.find(b => b.reuse_only === true);
    check("approved status triggers a reuse request with the question, never a token", !!reuse && reuse.question === "busy case" && !reuse.continue_token);
    check("reused answer is shown on the same card", (await page.locator(".msg-bayan").count()) === 1 && (await sourceCount(page)) > 0);
    await page.close();

    // 3. Expired during Continue shows no billing receipt button.
    page = await browser.newPage();
    await page.goto("http://127.0.0.1:3109/");
    await ask(page, "expired case");
    await page.getByRole("button", { name: "Continue answer" }).waitFor({ timeout: 15_000 });
    await page.getByRole("button", { name: "Continue answer" }).click();
    await page.waitForTimeout(1500);
    check("expired result shows no receipt or status button", (await page.getByRole("button", { name: "Check again" }).count()) === 0 && (await sourceCount(page)) > 0);
    await page.close();
  } finally {
    await browser.close(); server.close();
    await writeFile(join(root, "report.json"), JSON.stringify(results, null, 1));
  }
  if (results.some(r => !r.pass)) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
