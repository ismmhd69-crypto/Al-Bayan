import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { getProvider, getVerifier } from "@/lib/ai";

process.loadEnvFile(".env");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

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
German: use the same transliterated terms (Tauhid, Schirk, Bid'a, Zakah, Hadsch, Umra, Du'a) and write haram = verboten (haram), wajib = verpflichtend (wajib), makruh = verpönt (makruh), mubah = erlaubt.
CRITICAL FOR GERMAN: Always use REAL German umlauts (ä, ö, ü, ß). NEVER use ae, oe, ue, ss as replacements (e.g. use für, über, können, müssen, während, trägt, außer, gemäß, möglich, zurück, natürlich, ungläubig, äußern, berücksichtigen).`;

const SYSTEM = `You translate Arabic fatwa excerpts by Sunni scholars into English and German for a religious Q&A website.
Rules:
1. Translate faithfully. Never add, remove, soften, strengthen or reorder any ruling. "Not permissible", "disliked", "no harm" and "obligatory" must keep their exact strength.
2. Do not explain, summarise or comment. Do not add opinions. Translate only what is written.
3. Keep every Quran verse reference and number exactly as written.
4. Keep the same paragraph breaks and sentence order.
5. Natural, plain language. No archaic English.
6. Real German umlauts (ä ö ü ß) must be used.
${GLOSSARY}
Answer strictly in JSON array.`;

const TRANSLATE_SCHEMA = {
  type: "array" as const,
  items: {
    type: "object" as const,
    properties: {
      id: { type: "string" as const },
      en: { type: "string" as const },
      de: { type: "string" as const },
    },
    required: ["id", "en", "de"],
  },
};

const CHECK_SCHEMA = {
  type: "array" as const,
  items: {
    type: "object" as const,
    properties: {
      id: { type: "string" as const },
      faithful: { type: "boolean" as const },
      ruling_changed: { type: "boolean" as const },
      issue: { type: "string" as const },
    },
    required: ["id", "faithful", "ruling_changed", "issue"],
  },
};

const DIGRAPH_CHECK = /\b(fuer|ueber|koennen|muessen|waehrend|traegt|ausser|gemaess|moeglich|zurueck|natuerlich|unglaeubig\w*|aeussern|beruecksichtig\w*)\b/i;

function fixUmlauts(text: string): string {
  const map: Record<string, string> = {
    "fuer": "für", "Fuer": "Für", "ueber": "über", "Ueber": "Über",
    "koennen": "können", "Koennen": "Können", "muessen": "müssen", "Muessen": "Müssen",
    "waehrend": "während", "Waehrend": "Während", "traegt": "trägt", "Traegt": "Trägt",
    "ausser": "außer", "Ausser": "Außer", "gemaess": "gemäß", "Gemaess": "Gemäß",
    "moeglich": "möglich", "Moeglich": "Möglich", "zurueck": "zurück", "Zurueck": "Zurück",
    "natuerlich": "natürlich", "Natuerlich": "Natürlich", "gross": "groß", "Gross": "Groß",
    "grosse": "große", "Grosse": "Große", "grossen": "großen", "Grossen": "Großen",
    "grosser": "großer", "Grosser": "Großer", "heisst": "heißt", "Heisst": "Heißt",
    "schliesst": "schließt", "Schliesst": "Schließt", "weisst": "weißt", "laesst": "lässt",
    "ausschliesslich": "ausschließlich", "Ausschliesslich": "Ausschließlich",
    "regelmaessig": "regelmäßig", "Regelmaessig": "Regelmäßig",
    "regelmaessige": "regelmäßige", "Regelmaessige": "Regelmäßige",
    "regelmaessigen": "regelmäßigen", "Regelmaessigen": "Regelmäßigen",
  };
  let res = text;
  for (const [k, v] of Object.entries(map)) {
    res = res.replace(new RegExp(`\\b${k}\\b`, "g"), v);
  }
  return res;
}

export async function processBatchNumber(batchNum: number): Promise<{ processed: number; totalLeft: number }> {
  const pad = String(batchNum).padStart(3, "0");
  const untranslatedFile = path.join("data", "translations", `batch-${pad}-untranslated.json`);
  const translatedFile = path.join("data", "translations", `batch-${pad}-translated.json`);

  // 1. Export untranslated items if translatedFile doesn't exist
  if (!fs.existsSync(translatedFile)) {
    console.log(`Exporting untranslated items for batch ${pad}...`);
    const { execSync } = await import("child_process");
    execSync(`npx tsx scripts/export-untranslated-fatwas.ts --limit=40 --out=${untranslatedFile}`, {
      stdio: "inherit"
    });
  }

  const items = JSON.parse(fs.readFileSync(untranslatedFile, "utf-8"));
  if (items.length === 0) {
    console.log(`No items left to translate!`);
    return { processed: 0, totalLeft: 0 };
  }

  console.log(`Batch ${pad}: translating ${items.length} items...`);
  process.env.AI_MODELS = "gemini-3.1-flash-lite,gemini-3.6-flash";
  const writer = getProvider();

  const results: Array<{ id: string; en: string; de: string }> = [];
  const CHUNK_SIZE = 8;
  const chunks: Array<typeof items> = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }

  // Process chunks sequentially with spacing
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    console.log(`Translating chunk ${c + 1}/${chunks.length} (${chunk.length} items)...`);
    const prompt = chunk.map((it: any, idx: number) => `[Item ${idx + 1}] ID: ${it.id}\nTitle: ${it.title || ""}\nArabic:\n${it.text_original}`).join("\n\n---\n\n");

    let chunkRes: Array<{ id: string; en: string; de: string }> | null = null;
    const delays = [3000, 10000, 20000, 30000, 45000, 60000];
    for (let attempt = 1; attempt <= delays.length; attempt++) {
      try {
        chunkRes = await writer.generateJson({
          system: SYSTEM,
          prompt: `Translate each of the following ${chunk.length} fatwas into English and German:\n\n${prompt}`,
          schema: TRANSLATE_SCHEMA,
          maxOutputTokens: 8000,
        }) as any;
        if (Array.isArray(chunkRes) && chunkRes.length === chunk.length) break;
      } catch (err: any) {
        console.warn(`Chunk ${c + 1} attempt ${attempt} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, delays[attempt - 1]));
      }
    }

    if (!chunkRes || !Array.isArray(chunkRes) || chunkRes.length !== chunk.length) {
      throw new Error(`Failed to get translations for chunk ${c + 1}`);
    }

    for (let idx = 0; idx < chunkRes.length; idx++) {
      const r = chunkRes[idx];
      // Always enforce the exact original source ID from the chunk to prevent single-character UUID hallucinations by the AI
      const exactId = chunk[idx].id;
      const fixedDe = fixUmlauts(r.de);
      if (DIGRAPH_CHECK.test(fixedDe)) {
        console.warn(`Warning: Digraph detected after fix in ${exactId}: ${fixedDe.match(DIGRAPH_CHECK)?.[0]}`);
      }
      results.push({
        id: exactId,
        en: r.en,
        de: fixedDe,
      });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Save translated file
  fs.writeFileSync(translatedFile, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Saved ${results.length} translated items to ${translatedFile}`);

  // Import translations
  console.log(`Importing batch ${pad} translations to DB...`);
  const { execSync } = await import("child_process");
  execSync(`npx tsx scripts/import-translations.ts --in=${translatedFile}`, {
    stdio: "inherit"
  });

  // Calculate remaining accurately
  const leftRes = await fetch("https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.SUPABASE_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `select count(distinct s.id) from public.sources s left join public.source_translations st_en on st_en.source_id = s.id and st_en.lang = 'en' left join public.source_translations st_de on st_de.source_id = s.id and st_de.lang = 'de' where s.kind = 'fatwa' and s.published = true and (st_en.id is null or st_de.id is null);`
    }),
  });
  const leftData = await leftRes.json();
  const left = leftData[0]?.count ?? 0;

  const { count: totalPublished } = await db
    .from("sources")
    .select("*", { count: "exact", head: true })
    .eq("kind", "fatwa")
    .eq("published", true);

  const transRes = await fetch("https://api.supabase.com/v1/projects/jnietkyxgnocyizvjiel/database/query", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.SUPABASE_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `select count(distinct s.id) from public.sources s join public.source_translations st_en on st_en.source_id = s.id and st_en.lang = 'en' join public.source_translations st_de on st_de.source_id = s.id and st_de.lang = 'de' where s.kind = 'fatwa' and s.published = true;`
    }),
  });
  const transData = await transRes.json();
  const translatedFatwas = transData[0]?.count ?? 0;

  console.log(`Progress: ${translatedFatwas} / ${totalPublished} translated. Left: ${left}`);

  // Append to docs/translation-log.md
  const logPath = path.join("docs", "translation-log.md");
  let logContent = fs.readFileSync(logPath, "utf-8");
  const newRow = `| ${batchNum} | ${results.length} | ${results.length * 2} | 0 | ${translatedFatwas} | Batch ${batchNum} (${results.length} fatwas) translated and stored cleanly |`;
  
  const batchPattern = new RegExp(`^\\|\\s*${batchNum}\\s*\\|`, "m");
  if (!batchPattern.test(logContent)) {
    // Insert before "## Fix Batches"
    logContent = logContent.replace("## Fix Batches", `${newRow}\n\n## Fix Batches`);
    fs.writeFileSync(logPath, logContent, "utf-8");
    console.log(`Updated translation log with batch ${batchNum}.`);
  }

  return { processed: results.length, totalLeft: left };
}

if (process.argv[1] && process.argv[1].endsWith("process-batch.ts")) {
  const b = parseInt(process.argv[2] || "56", 10);
  processBatchNumber(b).catch(console.error);
}
