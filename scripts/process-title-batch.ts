import { getProvider } from "@/lib/ai";
import * as fs from "node:fs";
import * as path from "node:path";

process.loadEnvFile(".env");

// Batch size: 50 titles per batch
export const BATCH_SIZE = 50;

const GLOSSARY = `Fixed Islamic terms to use consistently:
- حكم = Ruling on | فضل = Virtue of | معنى = Meaning of | شروط = Conditions of | ضوابط = Guidelines/Criteria of | كيفية = Manner/Method of | وجوب = Obligation of | تحريم = Prohibition of
- التوحيد = Tawhid | الشرك = Shirk | البدعة = Bid'ah | الكفر = Kufr | النفاق = Nifaq | الإيمان = Iman | الإسلام = Islam
- الأسماء والصفات = the Names and Attributes | الاستواء = Istiwa'
- التوسل = Tawassul | الدعاء = Supplication (Du'a) | الاستغاثة = Seeking help (Istighatha)
- الزكاة = Zakah | الصلاة = Prayer (Salah) | الصيام = Fasting | الحج = Hajj | العمرة = Umrah
- سجود السهو = Prostration of forgetfulness (Sujud as-Sahw) | سجود التلاوة = Prostration of recitation | سجود الشكر = Prostration of gratitude
- الوضوء = Ablution (Wudu) | الغسل = Ritual bath (Ghusl) | التيمم = Dry ablution (Tayammum)
- الطلاق = Divorce | النكاح = Marriage | الخلع = Khul' | العدة = Waiting period ('Iddah) | المهر = Dowry/Bridal gift (Mahr)
- الربا = Riba (Usury/Interest) | البيع = Sale/Trade | الوقف = Endowment (Waqf)
- النبي ﷺ = the Prophet ﷺ
German equivalents:
- حكم = Urteil über | فضل = Vorzug von | معنى = Bedeutung von | شروط = Bedingungen von | كيفية = Art und Weise von | وجوب = Verpflichtung zu / Pflicht von | تحريم = Verbot von
- Tauhid, Schirk, Bid'ah, Kufr, Nifaq, Iman, Islam, Zakah, Salah, Hadsch, Umrah, Du'a, Wudu, Ghusl, Tayammum, Riba
- Use REAL German umlauts (ä, ö, ü, ß). Never use ae, oe, ue, ss.`;

const SYSTEM = `You translate Arabic fatwa questions and titles into English and German concisely and faithfully.
Rules:
1. Translate accurately without altering scope or meaning.
2. English should be clear, professional, title-case or sentence-case suitable for headings.
3. German must use genuine umlauts (ä, ö, ü, ß).
4. Strictly follow the fixed glossary terms.
5. Return strictly a JSON array of objects with fields: "id", "en", "de".`;

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

function fixUmlauts(text: string): string {
  const map: Record<string, string> = {
    fuer: "für", Fuer: "Für", ueber: "über", Ueber: "Über",
    koennen: "können", Koennen: "Können", muessen: "müssen", Muessen: "Müssen",
    waehrend: "während", Waehrend: "Während", traegt: "trägt", Traegt: "Trägt",
    ausser: "außer", Ausser: "Außer", gemaess: "gemäß", Gemaess: "Gemäß",
    moeglich: "möglich", Moeglich: "Möglich", zurueck: "zurück", Zurueck: "Zurück",
    natuerlich: "natürlich", Natuerlich: "Natürlich", gross: "groß", Gross: "Groß",
    grosse: "große", Grosse: "Große", grossen: "großen", Grossen: "Großen",
    grosser: "großer", Grosser: "Großer", heisst: "heißt", Heisst: "Heißt",
    schliesst: "schließt", Schliesst: "Schließt", laesst: "lässt",
    ausschliesslich: "ausschließlich", Ausschliesslich: "Ausschließlich",
    regelmaessig: "regelmäßig", Regelmaessig: "Regelmäßig",
  };
  let res = text;
  for (const [k, v] of Object.entries(map)) {
    res = res.replace(new RegExp(`\\b${k}\\b`, "g"), v);
  }
  return res;
}

export type TranslatedTitle = {
  id: string;
  title_ar: string;
  title_en: string;
  title_de: string;
};

export async function processTitleBatch(batchIndex: number): Promise<{ processed: number; totalBatches: number }> {
  const allTitlesFile = path.join("data", "fatwa-title-translations", "all-titles.json");
  const allTitles = JSON.parse(fs.readFileSync(allTitlesFile, "utf8")) as Array<{ id: string; scholar_id: string; reference: string; title: string }>;

  const totalBatches = Math.ceil(allTitles.length / BATCH_SIZE);
  const pad = String(batchIndex).padStart(3, "0");
  const batchOutFile = path.join("data", "fatwa-title-translations", `batch-${pad}.json`);

  if (fs.existsSync(batchOutFile)) {
    console.log(`Batch ${pad} already translated at ${batchOutFile}`);
    const existing = JSON.parse(fs.readFileSync(batchOutFile, "utf8"));
    return { processed: existing.length, totalBatches };
  }

  const start = (batchIndex - 1) * BATCH_SIZE;
  const chunk = allTitles.slice(start, start + BATCH_SIZE);

  if (chunk.length === 0) {
    return { processed: 0, totalBatches };
  }

  console.log(`Translating batch ${pad} (${chunk.length} titles: items ${start + 1} to ${start + chunk.length} of ${allTitles.length})...`);
  process.env.AI_MODELS = "gemini-3.1-flash-lite,gemini-3.6-flash";
  const writer = getProvider();

  // Send in sub-chunks of 25 for maximum precision and schema compliance
  const SUB_CHUNK = 25;
  const subChunks: Array<typeof chunk> = [];
  for (let i = 0; i < chunk.length; i += SUB_CHUNK) {
    subChunks.push(chunk.slice(i, i + SUB_CHUNK));
  }

  const results: TranslatedTitle[] = [];

  for (let s = 0; s < subChunks.length; s++) {
    const sc = subChunks[s];
    const promptList = sc.map((item, idx) => `[${idx + 1}] ID: ${item.id}\nArabic: ${item.title}`).join("\n\n");

    let res: Array<{ id: string; en: string; de: string }> | null = null;
    const delays = [2000, 5000, 15000, 30000];
    for (let attempt = 1; attempt <= delays.length; attempt++) {
      try {
        res = (await writer.generateJson({
          system: `${SYSTEM}\n${GLOSSARY}`,
          prompt: `Translate each of the following ${sc.length} titles into English and German:\n\n${promptList}`,
          schema: TRANSLATE_SCHEMA,
          maxOutputTokens: 4000,
        })) as any;

        if (Array.isArray(res) && res.length === sc.length) break;
      } catch (err: any) {
        console.warn(`Subchunk ${s + 1} attempt ${attempt} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, delays[attempt - 1]));
      }
    }

    if (!res || !Array.isArray(res) || res.length !== sc.length) {
      throw new Error(`Failed to translate subchunk ${s + 1} in batch ${pad}`);
    }

    for (let idx = 0; idx < sc.length; idx++) {
      const orig = sc[idx];
      const r = res[idx];
      results.push({
        id: orig.id,
        title_ar: orig.title,
        title_en: r.en.trim(),
        title_de: fixUmlauts(r.de.trim()),
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  fs.writeFileSync(batchOutFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved Batch ${pad} with ${results.length} translated titles.`);
  return { processed: results.length, totalBatches };
}

