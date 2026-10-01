// Ibn Uthaymeen expansion collector (official site binothaimeen.net, section listing API).
// The official search endpoint returns nothing, so this walks the official fatwa collections
// ("اللقاءات والفتاوى": Nur ala al-Darb, Liqa al-Bab al-Maftuh, al-Liqa al-Shahri, ...) section by section.
// Each listing request returns up to 50 whole fatwas, so no per-fatwa request is needed.
//
// Usage: npx tsx scripts/collect-uthaymeen-batch.ts [--size=50]
// Writes docs/uthaymeen-batches/batch-NNN.json (+ batch-NNN-view.txt for reading) and stops.
// Progress is in docs/uthaymeen-batches/state.json, so every run resumes where the last one stopped.
// Dry run only: nothing is written to the database here.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  excerpt,
  extractContentStems,
  htmlToText,
  isNearDuplicate,
  isUthaymeenTafsirLesson,
  looksLikeQuestion,
  parseUthaymeenFatwa,
  quoteStemSet,
  sharesContentWord,
  startsLikeRoomTalk,
} from "../lib/sources/scholar-excerpt";

process.loadEnvFile(".env");

const API = "https://shekhapi.binothaimeen.net/course/sections/audio_library";
const SITE = "https://binothaimeen.net";
const ROOT_ID = "59d21fb4-6758-4c4a-9240-440aca48eb59"; // اللقاءات والفتاوى
const PAUSE_MS = 1500;
const HEADERS = { "User-Agent": "AlBayan-Collector/0.1 (non-commercial Islamic Q&A; short credited quotes)" };
const DIR = "docs/uthaymeen-batches";
const TREE_FILE = `${DIR}/section-tree.json`;
const STATE_FILE = `${DIR}/state.json`;
const SIZE = Number(process.argv.find((a) => a.startsWith("--size="))?.split("=")[1] ?? 50);

type Section = { id: string; title: string; parent: string; grandparent: string; lessons: number };
type State = { processed: Record<string, string>; sectionsDone: string[]; requests: number; requestErrors: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let requests = 0;
let requestErrors = 0;

async function getJson(url: string): Promise<any | null> {
  requests++;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
    await sleep(PAUSE_MS);
    if (!res.ok) { requestErrors++; console.log(`  HTTP ${res.status} ${url}`); return null; }
    return await res.json();
  } catch (e) {
    requestErrors++;
    console.log(`  request error ${(e as Error).message} ${url}`);
    await sleep(PAUSE_MS);
    return null;
  }
}

async function buildTree(): Promise<Section[]> {
  if (fs.existsSync(TREE_FILE)) return JSON.parse(fs.readFileSync(TREE_FILE, "utf-8"));
  const out: Section[] = [];
  const rootTitle = "اللقاءات والفتاوى";
  async function walk(id: string, title: string, parent: string, grandparent: string) {
    const kids = await getJson(`${API}/children/${id}?pageSize=500`);
    if (!kids) throw new Error(`tree: cannot read children of ${id}`);
    for (const c of kids.data as any[]) {
      const t = String(c.title?.ar ?? "").trim();
      if (c.many_lessons_count > 0) out.push({ id: c.id, title: t, parent: title, grandparent: parent, lessons: c.many_lessons_count });
      if (c.children_count > 0) await walk(c.id, t, title, parent);
    }
  }
  await walk(ROOT_ID, rootTitle, "", "");
  fs.writeFileSync(TREE_FILE, JSON.stringify(out, null, 1), "utf-8");
  return out;
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const sections = await buildTree();
  console.log(`Sections with fatwas: ${sections.length}, lessons listed: ${sections.reduce((a, s) => a + s.lessons, 0)}`);
  const state: State = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) : { processed: {}, sectionsDone: [], requests: 0, requestErrors: 0 };
  const done = new Set(state.sectionsDone);
  const save = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state), "utf-8");

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const rows: Array<{ url: string; title: string | null; text_original: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sources").select("url, title, text_original").eq("scholar_id", "ibn-uthaymeen").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const existingIds = new Set(rows.map((r) => r.url.split("/").pop()!));
  const existingStems: Set<string>[] = rows.map((r) => quoteStemSet(r.text_original));
  const titleStems: Set<string>[] = rows.map((r) => extractContentStems(r.title ?? ""));
  console.log(`Existing Ibn Uthaymeen rows: ${rows.length}`);
  const sameTopicTitle = (t: string) => {
    const mine = extractContentStems(t);
    if (mine.size < 2) return false;
    for (const other of titleStems) {
      if (other.size < 2) continue;
      let common = 0;
      for (const w of mine) if (other.has(w)) common++;
      if (common >= 2 && common / Math.min(mine.size, other.size) >= 0.67) return true;
    }
    return false;
  };

  const existingBatches = fs.readdirSync(DIR).filter((f) => /^batch-\d{3}\.json$/.test(f)).length;
  const num = String(existingBatches + 1).padStart(3, "0");
  const candidates: any[] = [];
  const skipReasons: Record<string, number> = {};
  const skip = (id: string, reason: string) => { state.processed[id] = reason; skipReasons[reason] = (skipReasons[reason] ?? 0) + 1; };

  outer: for (const sec of sections) {
    if (done.has(sec.id)) continue;
    const collectionName = sec.parent || sec.grandparent || "فتاوى الشيخ ابن عثيمين";
    const reference = `${collectionName} (${sec.title || "فتاوى"})`;
    for (let page = 1; ; page++) {
      const json = await getJson(`${API}/many_lessons/${sec.id}/50?page=${page}`);
      if (!json) { if (requestErrors / Math.max(1, requests) > 0.2 && requests > 10) { console.log("Too many request errors"); break outer; } break; }
      const lessons = json.data as any[];
      for (const l of lessons) {
        const id = String(l.id);
        if (state.processed[id]) continue;
        if (existingIds.has(id)) { skip(id, "Already stored"); continue; }
        const title = htmlToText(String(l.title?.ar ?? "")).replace(/^-\s*/, "").trim();
        if (isUthaymeenTafsirLesson(title)) { skip(id, "Tafsir lesson"); continue; }
        const html = l.objective?.content?.ar;
        if (!html) { skip(id, "No content"); continue; }
        const fatwa = parseUthaymeenFatwa(html, { title, printedSource: reference, minChars: 200 });
        if (!fatwa) { skip(id, "Not parsed / too short / question"); continue; }
        // A trailing "نعم." / "أحسنتم" is the presenter's filler, not part of the ruling: drop it so the quote ends at the last real sentence.
        let answerText = fatwa.answer;
        for (let k = 0; k < 3; k++) {
          const trimmed = answerText.replace(/(^|\s)(نعم|أحسنتم|جزاكم الله خيرا|بارك الله فيك)\s*[.!]?\s*$/, "").trimEnd();
          if (trimmed === answerText) break;
          answerText = trimmed;
        }
        const quote = excerpt(answerText);
        if (!quote) { skip(id, "No clean excerpt"); continue; }
        if (quote.length < 200) { skip(id, "Quote under 200 chars"); continue; }
        if (startsLikeRoomTalk(quote)) { skip(id, "Room talk start"); continue; }
        if (!sharesContentWord(fatwa.title, quote)) { skip(id, "No shared content word"); continue; }
        if (looksLikeQuestion(quote)) { skip(id, "Looks like question"); continue; }
        if (/\.{2,}|…|&[a-z]+;/.test(quote)) { skip(id, "Gap marks"); continue; }
        if (/^(فقد (وصلني|اطلعت|قرأت)|فلقد قرأت|تقدم|مثل ما تقدم|على كل حال|بسم الله|سمعتم|كما (قلنا|سبق|تقدم|ذكرنا)|هذا (الذي|ما) (قلنا|ذكرنا)|والجواب على (هذا|ذلك) كما)/.test(quote)) { skip(id, "Context opener"); continue; }
        // Gates added after reading batch 1: stray punctuation start, answers that talk about the asker,
        // the presenter closing the episode, and quotes that do not end at a finished sentence.
        if (/^[\s:：،,.\-–؛;]/.test(quote) || /^(الشيح|الشيخ|المجيب)\s*[:：]/.test(quote)) { skip(id, "Starts with punctuation or label"); continue; }
        if (/^[\s:：،,.\-–]/.test(quote)) { skip(id, "Starts with punctuation"); continue; }
        if (/(السائل|السائلة|المذكور|المذكورة|هذا الأخ|هذه الأخت|أشرنا|السؤال الذي قبل|الجواب السابق|أيها (السادة|الإخوة|الأخوة|المستمعون)|إلى هنا|نهاية اللقاء|نلتقي|إلى لقاء)/.test(quote)) { skip(id, "Talks about the asker or the episode"); continue; }
        if (/^(ظاهر (حالهم|سؤال|كلام)|هذه (القصة|المرأة|الحال)|هذا السؤال|ليس الأمر كما|الذي يفهم|السؤال)/.test(quote)) { skip(id, "Context opener"); continue; }
        if (!/[.!؟?]["»”\]\)]?$/.test(quote)) { skip(id, "Does not end at a sentence end"); continue; }
        // Gates added after batch 2 (62% rejected): labels, praise preambles, answers aimed at the asker's own case,
        // filler endings, multi-part titles, and weak title/quote overlap.
        if (/(كما (أسلفنا|قلنا|ذكرنا|سبق|تقدم)|لا أدري|لا أعرف|أشار إليه|سأل عنه|السؤال|نبدأ|مستمعي|الأخ بنجلاديشي|هذه القبيلة)/.test(quote) || /[؟?]$/.test(quote)) { skip(id, "Refers to question or earlier answer, or ends with a question"); continue; }
        if (/(قوله تعالى|قول الله تعالى|قوله جل وعلا|الآية الكريمة)/.test(fatwa.title) && /^(تفسير|معنى|بيان معنى|توضيح|ما المقصود|ما المراد|المراد|المقصود|الجمع بين|تفسير وقوله|الحكمة من)/.test(fatwa.title.trim())) { skip(id, "Tafsir of a verse"); continue; }
        if (/(حلقة قادمة|أشرت|سردته|نقول لها|نقول لهذه|فإنك|وأما أنت|إنك|هل أنت|ننصحك|أنصحك)/.test(quote)) { skip(id, "Aimed at the asker (2)"); continue; }
        if (/^تفسير/.test(fatwa.title.trim()) || /^(عدة|مسائل متعددة|أسئلة)/.test(fatwa.title.trim())) { skip(id, "Tafsir or vague multi-question title"); continue; }
        if (/^(الجواب|الشيخ|نقول)/.test(quote)) { skip(id, "Starts with a label"); continue; }
        if (/(وأصلي وأسلم|والصلاة والسلام على|أسأله التوفيق|وأسأل الله)/.test(quote.slice(0, 250)) || /^الحمد لله رب العالمين/.test(quote)) { skip(id, "Praise preamble"); continue; }
        if (/(^|\s)(نعم|أحسنتم|جزاكم الله خيرا|بارك الله فيك)[.!]?$/.test(quote)) { skip(id, "Filler ending"); continue; }
        if (/(هذا الرجل|هذه المرأة|هذه البنت|هذا الشاب|هؤلاء|هولاء|رميك|حجك|إحرامك|صلاتك|صيامك|زوجتك|زوجك|والدتك|والدك|أختك|أخيك|ابنك|بنتك|عليك|أيها الأخ|يا أخي|أخي الكريم|ما وصفت|كما ذكرت|فيما ذكرت|كما قال السائل|وصفته|ذكرته|أرى لك|أنصحك|وفقك)/.test(quote)) { skip(id, "Aimed at the asker's own case"); continue; }
        if (/\sو(هل|ما|ماذا|حكم|كيف|هل)\s/.test(" " + fatwa.title + " ")) { skip(id, "Multi-part title"); continue; }
        {
          const ts = extractContentStems(fatwa.title);
          const qs = extractContentStems(quote);
          let common = 0;
          for (const w of ts) if (qs.has(w)) common++;
          if (ts.size >= 3 && common < Math.ceil(ts.size * 0.34)) { skip(id, "Weak title overlap"); continue; }
        }
        if (extractContentStems(fatwa.title).size < 2) { skip(id, "Title too thin"); continue; }
        if (sameTopicTitle(fatwa.title)) { skip(id, "Same topic as a stored title"); continue; }
        const stems = quoteStemSet(quote);
        if (isNearDuplicate(stems, existingStemsAll())) { skip(id, "Near duplicate"); continue; }

        const sectionTitle = sec.title || "فتاوى";
        const url = `${SITE}/ar/voice_library/lessonDetails/${encodeURIComponent(sectionTitle.replace(/\s+/g, "-"))}/${encodeURIComponent(fatwa.title.replace(/\s+/g, "-"))}/${id}`;
        existingStems.push(stems);
        titleStems.push(extractContentStems(fatwa.title));
        state.processed[id] = "candidate";
        candidates.push({
          lessonId: id,
          title: fatwa.title,
          url,
          reference,
          collection: collectionName,
          quote,
          cutFromLonger: fatwa.answer.replace(/\s*\n\s*/g, " ").trim().length > quote.length,
          flags: {
            hadith: /(قال النبي|قال رسول الله|حديث|صلى الله عليه وسلم|عليه الصلاة والسلام)/.test(quote),
            views: /(اختلف|خلاف|قولان|أقوال|للعلماء|من العلماء من)/.test(quote),
          },
        });
        if (candidates.length >= SIZE) break outer;
      }
      save();
      if (page >= (json.meta?.last_page ?? 1)) { done.add(sec.id); state.sectionsDone = [...done]; save(); break; }
    }
  }
  function existingStemsAll() { return existingStems; }

  state.requests += requests;
  state.requestErrors += requestErrors;
  save();
  const remaining = sections.filter((s) => !done.has(s.id)).length;
  fs.writeFileSync(`${DIR}/batch-${num}.json`, JSON.stringify({ requests, requestErrors, skipReasons, sectionsRemaining: remaining, candidates }, null, 2), "utf-8");
  const view = candidates.map((c, i) => `#${i + 1} [${c.lessonId.slice(0, 8)}] ${c.reference}${c.cutFromLonger ? " [CUT]" : ""}${c.flags.hadith ? " [HADITH]" : ""}${c.flags.views ? " [VIEWS]" : ""}\nT: ${c.title}\nQ: ${c.quote}\n`).join("\n");
  fs.writeFileSync(`${DIR}/batch-${num}-view.txt`, view, "utf-8");
  console.log(`Batch ${num}: ${candidates.length} candidates, ${requests} requests, ${requestErrors} errors, sections remaining ${remaining}`);
  console.log("Skip reasons:", JSON.stringify(skipReasons));
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
