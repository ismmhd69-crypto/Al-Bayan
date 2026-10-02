import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

process.loadEnvFile(".env");

const API = "https://api.sunnah.com/v1";
const RAW_DIR = path.resolve("data/sunnah");
const STATE_FILE = path.resolve("docs/hadith-sunnah-state.json");
const MAX_REQUESTS = 4_500;
const MAX_RPS = 2;
const APPROVED_BY = "Automatic collection authorised by Mo (2026-10-02)";
const GRADER = "Sunnah.com / consensus of the scholars on the soundness of the two Sahihs";
const RIGHTS_ID = "fd8cd4f5-5011-40a1-ae14-cb6e8fa165b7";
const RIGHTS_MAX_QUOTE_CHARS = 14_845;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Json = Record<string, unknown> | unknown[];
type State = {
  requests: number;
  lastRequestAt: number;
  collectionsFetched: boolean;
  booksFetched: Record<string, boolean>;
  hadithPagesFetched: Record<string, boolean>;
  imported: Record<string, string>;
  skipped: Record<string, string>;
};

const emptyState = (): State => ({
  requests: 0,
  lastRequestAt: 0,
  collectionsFetched: false,
  booksFetched: {},
  hadithPagesFetched: {},
  imported: {},
  skipped: {},
});

async function exists(file: string): Promise<boolean> {
  try { await access(file, fsConstants.F_OK); return true; } catch { return false; }
}

async function loadState(): Promise<State> {
  if (!(await exists(STATE_FILE))) return emptyState();
  return { ...emptyState(), ...(JSON.parse(await readFile(STATE_FILE, "utf8")) as Partial<State>) };
}

async function saveState(state: State): Promise<void> {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function apiGet(state: State, endpoint: string, rawName: string): Promise<Json> {
  const rawPath = path.join(RAW_DIR, `${safeName(rawName)}.json`);
  if (await exists(rawPath)) return JSON.parse(await readFile(rawPath, "utf8")) as Json;

  const apiKey = process.env.SUNNAH_API_KEY;
  if (!apiKey || apiKey.length < 20) throw new Error("SUNNAH_API_KEY is missing or too short");
  if (state.requests >= MAX_REQUESTS) throw new Error(`Request ceiling reached at ${MAX_REQUESTS}`);

  for (let attempt = 1; attempt <= 5; attempt++) {
    const wait = Math.max(0, 500 - (Date.now() - state.lastRequestAt));
    if (wait) await sleep(wait);
    state.lastRequestAt = Date.now();
    state.requests++;
    const response = await fetch(`${API}${endpoint}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json", "User-Agent": "Al-Bayan hadith importer" },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) {
      await sleep(5_000 * attempt);
      continue;
    }
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        const body = { error: { status: response.status, body: errorText } };
        await writeFile(rawPath, JSON.stringify(body, null, 2) + "\n", "utf8");
        await saveState(state);
        return body;
      }
      throw new Error(`Sunnah API ${response.status} for ${endpoint}`);
    }
    const body = await response.json() as Json;
    await writeFile(rawPath, JSON.stringify(body, null, 2) + "\n", "utf8");
    await saveState(state);
    return body;
  }
  throw new Error(`Sunnah API kept returning 429 for ${endpoint}`);
}

function records(body: Json): Record<string, unknown>[] {
  if (Array.isArray(body)) return body.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  for (const key of ["data", "books", "hadiths", "results", "items"]) {
    const value = body[key];
    if (Array.isArray(value)) return value.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  }
  return [];
}

function numberOfHadith(book: Record<string, unknown>): number | null {
  for (const key of ["numberOfHadith", "hadithCount", "totalHadith"]) {
    const n = Number(book[key]);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return null;
}

async function fetchMetadata(state: State): Promise<void> {
  await mkdir(RAW_DIR, { recursive: true });
  const collections = await apiGet(state, "/collections", "collections");
  state.collectionsFetched = true;
  await saveState(state);
  console.log(`Collections response saved. Top-level shape: ${Array.isArray(collections) ? "array" : "object"}. Requests: ${state.requests}`);
  for (const collection of ["bukhari", "muslim"]) {
    const body = await apiGet(state, `/collections/${collection}/books?limit=100`, `${collection}-books`);
    const books = records(body);
    state.booksFetched[collection] = true;
    await saveState(state);
    console.log(`${collection}: ${books.length} books in API response; declared hadith totals: ${books.reduce((n, b) => n + (numberOfHadith(b) ?? 0), 0)}; requests: ${state.requests}`);
  }
}

type Book = { bookNumber: string; book: unknown; numberOfHadith: number | null; hadithStartNumber: number | null; hadithEndNumber: number | null };

function booksFrom(body: Json): Book[] {
  return records(body).map((raw) => ({
    bookNumber: String(raw.bookNumber ?? ""),
    book: raw.book,
    numberOfHadith: numberOfHadith(raw),
    hadithStartNumber: Number.isInteger(Number(raw.hadithStartNumber)) ? Number(raw.hadithStartNumber) : null,
    hadithEndNumber: Number.isInteger(Number(raw.hadithEndNumber)) ? Number(raw.hadithEndNumber) : null,
  })).filter((book) => /^\d+$/.test(book.bookNumber));
}

function pageRecords(body: Json): Record<string, unknown>[] {
  return records(body);
}

function hasNext(body: Json): boolean {
  return typeof body === "object" && !Array.isArray(body) && !!body.next;
}

function apiError(body: Json): boolean {
  return typeof body === "object" && !Array.isArray(body) && !!body.error;
}

async function fetchAllHadith(state: State): Promise<{ books: Record<string, Book[]>; records: Record<string, Record<string, unknown>[]> }> {
  const allBooks: Record<string, Book[]> = {};
  const allRecords: Record<string, Record<string, unknown>[]> = {};
  for (const collection of ["bukhari", "muslim"]) {
    const booksBody = await apiGet(state, `/collections/${collection}/books?limit=100`, `${collection}-books`);
    const books = booksFrom(booksBody);
    allBooks[collection] = books;
    allRecords[collection] = [];
    for (const book of books) {
      let page = 1;
      while (true) {
        const key = `${collection}-${book.bookNumber}-${page}`;
        const body = await apiGet(state, `/collections/${collection}/books/${book.bookNumber}/hadiths?limit=100&page=${page}`, key);
        const pageRows = pageRecords(body);
        if (apiError(body)) {
          // The API currently returns an HTTP 200 with an embedded error for two Bukhari
          // books. Fall back to its documented individual hadith endpoint for that range.
          const start = book.hadithStartNumber;
          const end = book.hadithEndNumber;
          if (start !== null && end !== null && end >= start) {
            for (let number = start; number <= end; number++) {
              const individual = await apiGet(state, `/collections/${collection}/hadiths/${number}`, `${collection}-hadith-${number}`);
              if (!apiError(individual) && !Array.isArray(individual) && typeof individual === "object" && individual.collection) {
                allRecords[collection].push(individual as Record<string, unknown>);
              }
            }
          }
          break;
        }
        allRecords[collection].push(...pageRows);
        state.hadithPagesFetched[key] = true;
        await saveState(state);
        if (!hasNext(body) || pageRows.length === 0) break;
        page++;
      }
      console.log(`${collection} book ${book.bookNumber}: ${allRecords[collection].length} records collected, requests ${state.requests}`);
    }
  }
  return { books: allBooks, records: allRecords };
}

function bookName(book: Book): string {
  if (Array.isArray(book.book)) {
    const ar = book.book.find((x) => !!x && typeof x === "object" && (x as Record<string, unknown>).lang === "ar") as Record<string, unknown> | undefined;
    const en = book.book.find((x) => !!x && typeof x === "object" && (x as Record<string, unknown>).lang === "en") as Record<string, unknown> | undefined;
    return String(ar?.name ?? en?.name ?? "").trim();
  }
  return "";
}

function cleanArabic(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/gu, " ").trim();
}

function normalizeArabic(s: string): string {
  return s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
}

function hadithNumber(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function officialNumber(value: string): string {
  const match = value.match(/^\s*(\d+)\s*([a-z])?/i);
  return match ? `${match[1]}${match[2] ?? ""}` : "";
}

function hadithUrl(collection: string, number: string): string {
  return `https://sunnah.com/${collection}:${officialNumber(number)}`;
}

type ImportRow = {
  source: Record<string, unknown>;
  document: Record<string, unknown>;
  collection: string;
  number: string;
};

function collectionLabel(collection: string): string {
  return collection === "bukhari" ? "Sahih al-Bukhari" : "Sahih Muslim";
}

function titleFor(collection: string, book: Book | undefined, ar: Record<string, unknown>): string {
  const chapter = cleanArabic(ar.chapterTitle);
  const title = chapter && chapter !== "باب" ? chapter : (book ? bookName(book) : "");
  return title.slice(0, 300) || collectionLabel(collection);
}

function importRows(fetched: { books: Record<string, Book[]>; records: Record<string, Record<string, unknown>[]> }): ImportRow[] {
  const output: ImportRow[] = [];
  const seenText = new Map<string, string>();
  for (const collection of ["bukhari", "muslim"]) {
    const books = new Map(fetched.books[collection].map((book) => [book.bookNumber, book]));
    for (const record of fetched.records[collection]) {
      const number = hadithNumber(record.hadithNumber);
      const ar = arabicEntry(record);
      const body = cleanArabic(ar?.body);
      const bookNumber = String(record.bookNumber ?? "");
      if (!number) { continue; }
      if (collection === "muslim" && /^(?:[1-7])(?:\s|$)/.test(number)) { continue; }
      if (!body) { continue; }
      if (body.length > RIGHTS_MAX_QUOTE_CHARS) { continue; }
      const duplicate = seenText.get(`${collection}:${body}`);
      if (duplicate) { continue; }
      seenText.set(`${collection}:${body}`, number);
      const title = titleFor(collection, books.get(bookNumber), ar!);
      const label = collectionLabel(collection);
      const reference = `${label}, hadith ${number}, book ${bookNumber}, ${title}`.slice(0, 1000);
      output.push({
        collection,
        number,
        source: {
          kind: "hadith", scholar_id: null, title, reference,
          collection: label, numbering: "Sunnah.com printed numbering", grade: "sahih", grader: GRADER,
          language: "ar", text_original: body, url: hadithUrl(collection, number), rights_id: RIGHTS_ID, published: true,
        },
        document: {
          lang: "ar", search_text: `${title}\n${normalizeArabic(body)}`,
          approved: true, approved_by: APPROVED_BY, approved_at: new Date().toISOString(), question_types: ["general"], facets: [],
        },
      });
    }
  }
  return output;
}

async function appendLog(line: string): Promise<void> {
  const file = path.resolve("docs/hadith-import-log.md");
  const current = await readFile(file, "utf8");
  await writeFile(file, `${current.trimEnd()}\n${line}\n`, "utf8");
}

async function managementQuery(sql: string): Promise<unknown> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = (SUPABASE_URL ?? "").match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!token || !ref) throw new Error("Supabase management credentials are missing");
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) throw new Error(`Supabase count query failed: ${response.status}`);
  return response.json();
}

async function importMode(state: State): Promise<void> {
  if (!SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Supabase URL or secret key is missing");
  const fetched = await fetchAllHadith(state);
  const rows = importRows(fetched);
  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const existing: Array<{ id: string; url: string; text_original: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sources").select("id,url,text_original").eq("kind", "hadith").range(from, from + 999);
    if (error) throw error;
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const byUrl = new Map(existing.map((row) => [row.url, row]));
  const byText = new Map(existing.map((row) => [row.text_original, row]));
  let pending = rows.filter((row) => !byText.has(row.source.text_original as string));
  const existingIds = existing.map((row) => row.id);
  const documented = new Set<string>();
  for (let from = 0; from < existingIds.length; from += 100) {
    const { data, error } = await db.from("source_search_documents").select("source_id").in("source_id", existingIds.slice(from, from + 100));
    if (error) throw error;
    for (const row of data ?? []) documented.add(row.source_id);
  }
  for (let from = 0; from < pending.length; from += 500) {
    const batch = pending.slice(from, from + 500);
    const { data, error } = await db.from("sources").insert(batch.map((row) => row.source)).select("id,url,text_original");
    if (error) throw error;
    for (const row of data ?? []) { byUrl.set(row.url, row); byText.set(row.text_original, row); }
    const docsBySource = new Map<string, Record<string, unknown>>();
    for (const row of batch) {
      const source = byText.get(row.source.text_original as string) ?? byUrl.get(row.source.url as string);
      if (source && !documented.has(source.id) && !docsBySource.has(source.id)) docsBySource.set(source.id, { ...row.document, source_id: source.id });
    }
    const docs = [...docsBySource.values()];
    if (docs.length) {
      const result = await db.from("source_search_documents").insert(docs);
      if (result.error) throw result.error;
      for (const doc of docs) documented.add(doc.source_id as string);
    }
    const count = await managementQuery("select collection, count(*)::int as count from public.sources where kind='hadith' group by collection order by collection;");
    state.imported[`batch-${from}`] = new Date().toISOString();
    await saveState(state);
    console.log(`Imported batch ${from}-${from + batch.length - 1}; count check ${JSON.stringify(count)}`);
  }
  const missingDocs = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const source = byText.get(row.source.text_original as string) ?? byUrl.get(row.source.url as string);
    if (source && !documented.has(source.id) && !missingDocs.has(source.id)) missingDocs.set(source.id, { ...row.document, source_id: source.id });
  }
  for (const docs of [...missingDocs.values()].reduce((all, doc, index) => { const batchIndex = Math.floor(index / 500); (all[batchIndex] ??= []).push(doc); return all; }, [] as Record<string, unknown>[][])) {
    const result = await db.from("source_search_documents").insert(docs);
    if (result.error) throw result.error;
  }
  await appendLog(`- Import completed: ${rows.length} available hadith rows prepared; existing rows were reused by URL or exact text, and search documents were backfilled.`);
  console.log(`Import complete. Prepared ${rows.length} rows. Final count check: ${JSON.stringify(await managementQuery("select collection, count(*)::int as count from public.sources where kind='hadith' group by collection order by collection;"))}`);
}

function arabicEntry(record: Record<string, unknown>): Record<string, unknown> | null {
  const entries = Array.isArray(record.hadith) ? record.hadith : [];
  const ar = entries.find((x) => !!x && typeof x === "object" && (x as Record<string, unknown>).lang === "ar");
  return ar && typeof ar === "object" ? ar as Record<string, unknown> : null;
}

async function fetchMode(state: State): Promise<void> {
  const fetched = await fetchAllHadith(state);
  for (const collection of ["bukhari", "muslim"]) {
    const rows = fetched.records[collection];
    const numbered = rows.filter((row) => /^\d+$/.test(String(row.hadithNumber ?? "")));
    const emptyArabic = rows.filter((row) => !cleanArabic(arabicEntry(row)?.body));
    const separateMatn = rows.filter((row) => {
      const ar = arabicEntry(row);
      return !!ar && Object.keys(ar).some((key) => /matn/i.test(key));
    }).length;
    const numbers = numbered.map((row) => Number(row.hadithNumber)).filter(Number.isInteger);
    console.log(`${collection}: fetched ${rows.length}, numbered ${numbered.length}, empty Arabic ${emptyArabic.length}, range ${Math.min(...numbers)}-${Math.max(...numbers)}, separate matn fields ${separateMatn}`);
  }
  console.log(`Fetch complete. Raw responses are in data/sunnah and request count is ${state.requests}.`);
}

function mode(): "metadata" | "fetch" | "import" {
  if (process.argv.includes("--metadata-only")) return "metadata";
  if (process.argv.includes("--fetch")) return "fetch";
  if (process.argv.includes("--import")) return "import";
  throw new Error("Use --metadata-only, --fetch, or --import");
}

async function main(): Promise<void> {
  const state = await loadState();
  const selected = mode();
  if (selected === "metadata") { await fetchMetadata(state); return; }
  if (selected === "fetch") { await fetchMode(state); return; }
  await importMode(state);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
