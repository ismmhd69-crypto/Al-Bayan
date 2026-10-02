import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  excerpt,
  isNearDuplicate,
  looksLikeQuestion,
  parseBinBazFatwa,
  printedCollection,
  quoteStemSet,
  searchText,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const SITE = "https://binbaz.org.sa";
const STATE_PATH = "docs/binbaz-sweep-state.json";
const INDEX_PATH = "docs/binbaz-archive-index.json";
const NEEDS_MO_PATH = "docs/IBN_BAZ_SWEEP_NEEDS_MO.md";
const CANDIDATE_DIR = "docs/binbaz-sweep-candidates";
const RIGHTS_ID = "fabd29fd-a03d-4421-a685-638383570001";
const APPROVED_BY = "Automatic collection authorised by Mo (2026-10-02)";
const PAUSE_MS = 1500;
const MAX_RETRIES = 3;
const HEADERS = {
  "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)",
  Accept: "text/html,application/xhtml+xml",
};

type Entry = {
  status: string;
  reference?: number;
  url?: string;
  title?: string;
  quote?: string;
  reason?: string;
  retries?: number;
};

type State = {
  highestId: number | null;
  probeNext: number;
  probe404: number;
  nextId: number;
  processed: Record<string, Entry>;
  requests: number;
  requestErrors: number;
  retryLater: number[];
  candidateBatch: number;
  done: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const saveJson = (file: string, value: unknown) => {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(temporary, file);
};

const LOCK_PATH = "docs/binbaz-sweep.lock";
function acquireLock(): () => void {
  if (fs.existsSync(LOCK_PATH)) {
    const oldPid = Number(fs.readFileSync(LOCK_PATH, "utf8"));
    try {
      process.kill(oldPid, 0);
      throw new Error(`another sweep is already running (PID ${oldPid})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already running")) throw error;
      fs.unlinkSync(LOCK_PATH);
    }
  }
  fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
  return () => { if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH); };
}

function loadState(): State {
  if (fs.existsSync(STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as Partial<State>;
    return {
      highestId: state.highestId ?? null,
      probeNext: state.probeNext ?? 31001,
      probe404: state.probe404 ?? 0,
      nextId: state.nextId ?? 1,
      processed: state.processed ?? {},
      requests: state.requests ?? 0,
      requestErrors: state.requestErrors ?? 0,
      retryLater: state.retryLater ?? [],
      candidateBatch: state.candidateBatch ?? 0,
      done: state.done ?? false,
    };
  }
  return {
    highestId: null,
    probeNext: 31001,
    probe404: 0,
    nextId: 1,
    processed: {},
    requests: 0,
    requestErrors: 0,
    retryLater: [],
    candidateBatch: 0,
    done: false,
  };
}

function archiveReferences(): Set<number> {
  if (!fs.existsSync(INDEX_PATH)) return new Set();
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as { items?: Record<string, unknown> };
  return new Set(Object.keys(index.items ?? {}).map(Number).filter(Number.isInteger));
}

function sensitiveReason(title: string): string | null {
  const t = title.toLowerCase();
  const arabicSensitiveRules: Array<[RegExp, string]> = [
    [/\u0642\u062a\u0644|\u064a\u0642\u062a\u0644|\u0627\u0644\u0642\u062a\u0644/, "killing or execution ruling"],
    [/\u062a\u0639\u0630\u064a\u0628|\u064a\u0636\u0631\u0628|\u0636\u0631\u0628/, "torture or violence ruling"],
    [/\u0627\u0633\u062a\u0631\u0642\u0627\u0642|\u0627\u0644\u0639\u0628\u064a\u062f|\u0627\u0644\u0631\u0642|\u0627\u0644\u0639\u0628\u0648\u062f\u064a\u0629/, "slavery ruling"],
    [/\u0627\u0644\u0645\u0631\u062a\u062f|\u0627\u0644\u0631\u062f\u0629|\u062a\u0643\u0641\u064a\u0631|\u0643\u0627\u0641\u0631/, "apostasy or takfir ruling"],
    [/\u0633\u0627\u062d\u0631|\u0627\u0644\u0633\u062d\u0631/, "sorcery punishment ruling"],
    [/\u062c\u0627\u0633\u0648\u0633|\u062c\u0648\u0627\u0633\u064a\u0633|\u0627\u0644\u062a\u062c\u0633\u0633/, "spy ruling"],
  ];
  const arabicReason = arabicSensitiveRules.find(([re]) => re.test(t))?.[1];
  if (arabicReason) return arabicReason;
  const rules: Array<[RegExp, string]> = [
    [/قتل|يقتل|قتلًا|القتل/, "killing or execution ruling"],
    [/تعذيب|يضرب|ضرب|يُضرب/, "torture or violence ruling"],
    [/استرقاق|العبيد|الرقيق|العبودية/, "slavery ruling"],
    [/المرتد|الردة|كافر|تكفير/, "apostasy or takfir ruling"],
    [/ساحر|السحر/, "sorcery punishment ruling"],
    [/جاسوس|جواسيس/, "spy ruling"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? null;
}

function enforceErrorStop(state: State) {
  if (state.requests > 0 && state.requestErrors / state.requests > 0.2) {
    throw new Error(`request error rate exceeded 20% (${state.requestErrors}/${state.requests})`);
  }
}

function appendNeedsMo(reference: number, title: string, url: string, reason: string) {
  if (!fs.existsSync(NEEDS_MO_PATH)) {
    fs.writeFileSync(NEEDS_MO_PATH, "# Ibn Baz sweep: needs Mo\n\n| Fatwa no. | Title | Link | Reason |\n|---:|---|---|---|\n", "utf8");
  }
  const current = fs.readFileSync(NEEDS_MO_PATH, "utf8");
  if (!current.includes(`| ${reference} |`)) {
    const safeTitle = title.replace(/\|/g, "\\|");
    fs.appendFileSync(NEEDS_MO_PATH, `| ${reference} | ${safeTitle} | ${url} | ${reason} |\n`, "utf8");
  }
}

function writeCandidateBatch(state: State, candidate: Entry) {
  fs.mkdirSync(CANDIDATE_DIR, { recursive: true });
  const pending = Object.entries(state.processed)
    .filter(([, e]) => e.status === "candidate" && e.title && e.quote && e.url)
    .map(([id, e]) => ({ internalId: Number(id), ...e }));
  const batchNo = Math.floor((pending.length - 1) / 50) + 1;
  const file = path.join(CANDIDATE_DIR, `batch-${String(batchNo).padStart(4, "0")}.json`);
  saveJson(file, { candidates: pending.slice((batchNo - 1) * 50, batchNo * 50) });
  state.candidateBatch = Math.max(state.candidateBatch, batchNo);
  void candidate;
}

async function loadDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows: Array<{ url: string; title: string; text_original: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sources").select("url,title,text_original").eq("scholar_id", "ibn-baz").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { db, rows };
}

async function findHighest(state: State) {
  if (state.highestId !== null) return;
  let consecutive404 = state.probe404;
  let id = state.probeNext;
  while (consecutive404 < 500) {
    const result = await requestBare(id, state);
    if (result.kind === "error") throw new Error(`highest-id probe stopped at ${id}: ${result.reason}`);
    if (result.status === 404) consecutive404++;
    else if (result.status >= 200 && result.status < 400) {
      state.highestId = id;
      consecutive404 = 0;
    }
    id++;
    state.probeNext = id;
    state.probe404 = consecutive404;
    if ((id - 31001) % 50 === 0) {
      saveJson(STATE_PATH, state);
      console.log(`highest-id probe ${id - 1}, consecutive 404 ${consecutive404}`);
    }
  }
  state.highestId = Math.max(state.highestId ?? 0, id - consecutive404 - 1);
  saveJson(STATE_PATH, state);
  console.log(`highest internal id found: ${state.highestId}`);
}

async function requestBare(id: number, state: State): Promise<{ kind: "ok"; status: number; location?: string; body?: string } | { kind: "error"; reason: string }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    state.requests++;
    try {
      const res = await fetch(`${SITE}/fatwas/${id}`, { headers: HEADERS, redirect: "manual", signal: AbortSignal.timeout(30_000) });
      if (res.status === 429 || res.status >= 500) {
        state.requestErrors++;
        if (attempt === MAX_RETRIES) return { kind: "error", reason: `HTTP ${res.status}` };
        await sleep(60_000);
        continue;
      }
      if (res.status === 403) return { kind: "error", reason: "HTTP 403 site block" };
      if (res.status === 404) {
        await sleep(PAUSE_MS);
        return { kind: "ok", status: 404 };
      }
      const location = res.headers.get("location") ?? undefined;
      const body = res.status >= 200 && res.status < 300 ? await res.text() : undefined;
      await sleep(PAUSE_MS);
      return { kind: "ok", status: res.status, location, body };
    } catch (error) {
      state.requestErrors++;
      if (attempt === MAX_RETRIES) return { kind: "error", reason: (error as Error).message };
      await sleep(60_000);
    }
  }
  return { kind: "error", reason: "unreachable" };
}

async function main() {
  const releaseLock = acquireLock();
  try {
  const state = loadState();
  const { rows } = await loadDatabase();
  const knownUrls = new Set(rows.map((r) => r.url));
  const existingStems = rows.map((r) => quoteStemSet(r.text_original));
  const knownReferences = archiveReferences();

  await findHighest(state);
  const stopAt = state.highestId!;
  let sinceSave = 0;
  for (let id = state.nextId; id <= stopAt; id++) {
    state.nextId = id + 1;
    if (state.processed[String(id)]) continue;
    const result = await requestBare(id, state);
    enforceErrorStop(state);
    if (result.kind === "error") {
      state.processed[String(id)] = { status: "retry later", reason: result.reason };
      state.retryLater.push(id);
      saveJson(STATE_PATH, state);
      if (/403/.test(result.reason)) throw new Error(result.reason);
      continue;
    }
    if (result.status === 404) state.processed[String(id)] = { status: "404" };
    else {
      const location = result.location ?? `${SITE}/fatwas/${id}`;
      const refMatch = location.match(/\/fatwas\/(\d+)(?:\/|$)/);
      if (!refMatch) state.processed[String(id)] = { status: "rejected", reason: "redirect had no fatwa reference", url: location };
      else {
        const reference = Number(refMatch[1]);
        if (knownReferences.has(reference) || rows.some((r) => r.url.includes(`/fatwas/${reference}/`))) {
          state.processed[String(id)] = { status: "already ours", reference, url: location };
        } else {
          let html = result.body;
          if (!html) {
            const page = await fetch(location, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
            html = await page.text();
            await sleep(PAUSE_MS);
          }
          const fatwa = parseBinBazFatwa(html, { minChars: 200 });
          const quote = fatwa && excerpt(fatwa.answer);
          const reason = !fatwa ? "not parsed" : !quote ? "no clean excerpt" : quote.length < 200 ? "quote under 200 characters" : looksLikeQuestion(quote) ? "looks like question" : startsLikeRoomTalk(quote) ? "starts like room talk" : !sharesContentWord(fatwa.title, quote) ? "no shared content word with title" : isNearDuplicate(quoteStemSet(quote), existingStems) ? "near duplicate" : null;
          if (!fatwa || !quote || reason) {
            state.processed[String(id)] = { status: "rejected", reference, url: location, title: fatwa?.title, reason: reason ?? "rejected" };
          } else {
            const sensitive = sensitiveReason(fatwa.title);
            const printed = printedCollection(fatwa.printedSource);
            const entry: Entry = { status: sensitive ? "sensitive" : "candidate", reference, url: location, title: fatwa.title, quote };
            if (sensitive) {
              entry.reason = sensitive;
              appendNeedsMo(reference, fatwa.title, location, sensitive);
            }
            state.processed[String(id)] = entry;
            if (!sensitive) writeCandidateBatch(state, entry);
            void printed;
          }
        }
      }
    }
    sinceSave++;
    if (sinceSave >= 50) {
      enforceErrorStop(state);
      saveJson(STATE_PATH, state);
      console.log(`sweep id ${id}/${stopAt}; requests ${state.requests}; errors ${state.requestErrors}`);
      sinceSave = 0;
    }
  }
  state.done = true;
  saveJson(STATE_PATH, state);
  console.log(`sweep complete at ${stopAt}`);
  } finally {
    releaseLock();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
