import { createClient } from "@supabase/supabase-js";
import { getProvider, getVerifier } from "@/lib/ai";

process.loadEnvFile(".env");

// Gemini drafts English and German versions of published fatwas. A second Gemini model checks each
// draft against the Arabic. Drafts are stored UNPUBLISHED and labelled origin "ai"; publishing is a
// separate step after a human spot-check. Safe to stop and restart: finished fatwas are skipped.
//
// Run: npx tsx --conditions=react-server scripts/translate-fatwas.ts [--limit=30] [--scholar=ibn-baz] [--dry-run]

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const LIMIT = Number(arg("limit") ?? Infinity);
const SCHOLAR = arg("scholar");
const DRY_RUN = process.argv.includes("--dry-run");
const PAUSE_MS = 800;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const GLOSSARY = `Fixed terms (use exactly these):
- التوحيد = tawhid (the oneness of Allah) | الشرك = shirk (associating partners with Allah) | البدعة = bid'ah (religious innovation)
- الكفر = kufr | النفاق = nifaq (hypocrisy) | الإيمان = iman (faith) | الإسلام = Islam
- الأسماء والصفات = the Names and Attributes (of Allah) | الاستواء = istiwa' (Allah's rising above the Throne)
- التوسل = tawassul | الدعاء = du'a (supplication) | الاستغاثة = istighatha (calling for help)
- الواجب = obligatory (wajib) | المستحب / السنة = recommended (sunnah) | المباح = permissible | المكروه = disliked (makruh) | الحرام / المحرم = forbidden (haram) | لا حرج / لا بأس = there is no harm / no objection
- لا يجوز = it is not permissible | يجوز = it is permissible | الأولى = it is better / preferable
- الزكاة = zakah | الصلاة = prayer (salah) | الصيام = fasting | الحج = Hajj | العمرة = Umrah | التمتع / القران / الإفراد = tamattu' / qiran / ifrad
- النبي ﷺ = the Prophet (peace be upon him) | رضي الله عنه = may Allah be pleased with him | رحمه الله = may Allah have mercy on him
- جل وعلا / سبحانه وتعالى = the Exalted, Glorified (translate naturally once; do not repeat endlessly)
- أهل السنة والجماعة = Ahl as-Sunnah wal-Jama'ah | السلف = the Salaf (righteous predecessors)
German: use the same transliterated terms (Tauhid, Schirk, Bid'a, Zakah, Hadsch, Umra, Du'a) and write haram = verboten (haram), wajib = verpflichtend (wajib), makruh = verpönt (makruh), mubah = erlaubt.`;

const SYSTEM = `You translate short Arabic fatwa excerpts by a Sunni scholar into English and German for a religious Q&A website.
Rules:
1. Translate faithfully. Never add, remove, soften, strengthen or reorder any ruling. "Not permissible", "disliked", "no harm" and "obligatory" must keep their exact strength.
2. Do not explain, summarise or comment. Do not add opinions. Translate only what is written.
3. Keep every Quran verse reference and number exactly as written, e.g. [الذاريات:56] becomes [Adh-Dhariyat 51:56] only if you are certain of the surah number, otherwise keep the reference as written. Never invent a reference.
4. Quran verses and hadith inside the text: translate their meaning; do not use a famous translation word for word from memory if unsure.
5. Keep the same paragraph breaks and the same order of sentences.
6. Natural, plain language. No archaic English.
${GLOSSARY}
Answer strictly in JSON.`;

const TRANSLATE_SCHEMA = {
  type: "object" as const,
  properties: {
    en: { type: "string" as const, description: "English translation of the excerpt" },
    de: { type: "string" as const, description: "German translation of the excerpt" },
  },
  required: ["en", "de"],
};

const CHECK_SCHEMA = {
  type: "object" as const,
  properties: {
    faithful: { type: "boolean" as const, description: "True only if the translation says exactly what the Arabic says" },
    ruling_changed: { type: "boolean" as const, description: "True if any ruling (obligatory, permissible, disliked, forbidden, no harm) or any negation differs from the Arabic" },
    issue: { type: "string" as const, description: "Short description of the problem, or empty" },
  },
  required: ["faithful", "ruling_changed", "issue"],
};

type Source = { id: string; title: string | null; text_original: string };

function arabicRatio(s: string) {
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (!letters.length) return 0;
  return (s.match(/[؀-ۿ]/g)?.length ?? 0) / letters.length;
}

// Cheap local checks before spending a second model call.
function localProblem(src: Source, en: string, de: string): string | null {
  for (const [lang, t] of [["en", en], ["de", de]] as const) {
    if (!t || t.trim().length < 40) return `${lang} too short`;
    const ratio = t.length / src.text_original.length;
    if (ratio < 0.6 || ratio > 3.5) return `${lang} length ratio ${ratio.toFixed(2)}`;
    if (arabicRatio(t) > 0.25) return `${lang} still mostly Arabic`;
  }
  // every number in the Arabic (verse and hadith numbers, counts) must survive
  const nums = src.text_original.match(/\d+/g) ?? [];
  for (const n of nums) {
    if (!en.includes(n) || !de.includes(n)) return `number ${n} missing`;
  }
  return null;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let wait = 5_000;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const busy = /429|busy|503|overloaded|timeout|fetch failed/i.test(msg);
      if (!busy || attempt >= 6) throw err;
      await sleep(wait);
      wait = Math.min(wait * 2, 120_000);
    }
  }
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const writer = getProvider();
  const checker = getVerifier();
  console.log(`Translator: ${writer.id}\nChecker: ${checker.id}\n${DRY_RUN ? "DRY RUN (nothing stored)" : "Storing unpublished AI translations"}`);

  // Fatwas that do not yet have both an English and a German translation.
  const { data: done } = await db.from("source_translations").select("source_id, lang").in("lang", ["en", "de"]);
  const have = new Map<string, Set<string>>();
  for (const r of done ?? []) {
    if (!have.has(r.source_id)) have.set(r.source_id, new Set());
    have.get(r.source_id)!.add(r.lang);
  }

  const todo: Source[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("sources").select("id, title, text_original").eq("kind", "fatwa").eq("published", true).order("created_at", { ascending: true }).range(from, from + 999);
    if (SCHOLAR) q = q.eq("scholar_id", SCHOLAR);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    for (const s of data) if ((have.get(s.id)?.size ?? 0) < 2) todo.push(s);
    if (data.length < 1000) break;
  }
  console.log(`Fatwas still to translate: ${todo.length}`);

  const fs = await import("fs");
  const rejectPath = "docs/translation-rejects.json";
  const rejects: Array<{ id: string; title: string | null; reason: string }> = fs.existsSync(rejectPath) ? JSON.parse(fs.readFileSync(rejectPath, "utf-8")) : [];
  const rejectedBefore = new Set(rejects.map((r) => r.id));

  let stored = 0, rejected = 0, errors = 0, consecutiveErrors = 0;
  const batch = todo.filter((s) => !rejectedBefore.has(s.id)).slice(0, LIMIT);

  for (const [i, src] of batch.entries()) {
    const reject = (reason: string) => {
      rejected++;
      rejects.push({ id: src.id, title: src.title, reason });
      fs.writeFileSync(rejectPath, JSON.stringify(rejects, null, 2), "utf-8");
      console.log(`[${i + 1}/${batch.length}] REJECTED ${src.id.slice(0, 8)}: ${reason}`);
    };
    try {
      const out = (await withRetry(() =>
        writer.generateJson({
          system: SYSTEM,
          prompt: `Title (context only, do not translate it): ${src.title ?? ""}\n\nExcerpt to translate:\n${src.text_original}`,
          schema: TRANSLATE_SCHEMA,
          maxOutputTokens: 4000,
        })
      )) as { en: string; de: string };

      const problem = localProblem(src, out.en, out.de);
      if (problem) { reject(`local check: ${problem}`); await sleep(PAUSE_MS); continue; }

      type Verdict = { faithful: boolean; ruling_changed: boolean; issue: string };
      let verdict = null as Verdict | null;
      for (let tries = 0; tries < 2 && !verdict; tries++) {
        verdict = (await withRetry(() =>
          checker.generateJson({
            system:
              "You are a strict checker of Arabic to English and Arabic to German translations of fatwa excerpts. Compare each translation to the Arabic. Mark faithful=false if anything is added, missing, softened, strengthened or reversed, and ruling_changed=true if any ruling word or negation differs. Answer strictly in JSON.",
            prompt: `Arabic:\n${src.text_original}\n\nEnglish:\n${out.en}\n\nGerman:\n${out.de}`,
            schema: CHECK_SCHEMA,
            maxOutputTokens: 1500,
          })
        )) as Verdict | null;
      }

      // An empty check is never an approval.
      if (!verdict) { reject("checker returned nothing twice"); await sleep(PAUSE_MS); continue; }
      if (!verdict.faithful || verdict.ruling_changed) { reject(`checker: ${verdict.issue || "not faithful"}`); await sleep(PAUSE_MS); continue; }

      if (!DRY_RUN) {
        const rows = (["en", "de"] as const)
          .filter((lang) => !have.get(src.id)?.has(lang))
          .map((lang) => ({ source_id: src.id, lang, text: out[lang].trim(), origin: "ai", translator: writer.id.slice(0, 120), published: false }));
        const { error } = await db.from("source_translations").insert(rows);
        if (error) throw new Error(`DB insert: ${error.message}`);
      }
      stored++;
      consecutiveErrors = 0;
      if (stored % 10 === 0 || i < 3) console.log(`[${i + 1}/${batch.length}] stored ${stored}, rejected ${rejected}, errors ${errors}`);
    } catch (err) {
      errors++;
      consecutiveErrors++;
      console.log(`[${i + 1}/${batch.length}] ERROR ${src.id.slice(0, 8)}: ${(err as Error).message}`);
      if (/DB insert/.test((err as Error).message) || consecutiveErrors >= 8) {
        console.log("Stopping: repeated errors. Fix the cause, then run again; finished work is kept.");
        break;
      }
    }
    await sleep(PAUSE_MS);
  }

  console.log(`\nDone. Stored ${stored}, rejected ${rejected}, errors ${errors}, remaining after this run: ${Math.max(0, todo.length - stored - rejected)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
