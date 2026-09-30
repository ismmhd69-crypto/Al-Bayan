import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getProvider } from "../lib/ai";
import { UNDERSTAND_SYSTEM } from "../lib/ask/core";
import {
  ANSWER_FACETS,
  QUESTION_TYPES,
  parseQuestionFrame,
  type QuestionFrame,
} from "../lib/ask/retrieval";
import { isScholarTitleRelevant, searchQueryLevels, type ScholarQuote } from "../lib/sources/scholar-rules";

import type { JsonSchema } from "../lib/ai/types";

process.loadEnvFile(".env");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PAUSE_BETWEEN_CALLS_MS = 2500;

export type TestQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  lang: "ar" | "en" | "de";
  question: string;
  expectedSourceId: string;
  expectedScholarId: string;
  expectedTitle: string;
};

export const TEST_QUESTIONS: TestQuestion[] = [
  // Topic 1: Fajr cutoff while fasting
  {
    id: "fasting-fajr-cutoff-ar",
    topicId: "fasting-fajr-cutoff",
    topicName: "Fajr cutoff while fasting",
    lang: "ar",
    question: "متى يمسك الصائم عن الاكل والشرب بالضبط؟",
    expectedSourceId: "4c6297b5-5544-455b-8c21-d1d167a4c861",
    expectedScholarId: "ibn-baz",
    expectedTitle: "إذا أكل بعد طلوع الفجر بطل صومه",
  },
  {
    id: "fasting-fajr-cutoff-en",
    topicId: "fasting-fajr-cutoff",
    topicName: "Fajr cutoff while fasting",
    lang: "en",
    question: "Until what time can we eat and drink before starting the daily fast?",
    expectedSourceId: "4c6297b5-5544-455b-8c21-d1d167a4c861",
    expectedScholarId: "ibn-baz",
    expectedTitle: "إذا أكل بعد طلوع الفجر بطل صومه",
  },
  {
    id: "fasting-fajr-cutoff-de",
    topicId: "fasting-fajr-cutoff",
    topicName: "Fajr cutoff while fasting",
    lang: "de",
    question: "Bis zu welcher Uhrzeit darf man morgens im Ramadan essen und trinken?",
    expectedSourceId: "4c6297b5-5544-455b-8c21-d1d167a4c861",
    expectedScholarId: "ibn-baz",
    expectedTitle: "إذا أكل بعد طلوع الفجر بطل صومه",
  },

  // Topic 2: Facing the Qibla for obligatory prayer
  {
    id: "qibla-facing-kabah-ar",
    topicId: "qibla-facing-kabah",
    topicName: "Facing the Qibla for obligatory prayer",
    lang: "ar",
    question: "ما هي القبلة التي يتجه اليها المسلمون في الصلاة؟",
    expectedSourceId: "726e59d2-ec39-4f09-9ab8-a5cc8e9996fb",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم استقبال القبلة في الصلاة في السفر",
  },
  {
    id: "qibla-facing-kabah-en",
    topicId: "qibla-facing-kabah",
    topicName: "Facing the Qibla for obligatory prayer",
    lang: "en",
    question: "Which direction do Muslims face during prayer?",
    expectedSourceId: "726e59d2-ec39-4f09-9ab8-a5cc8e9996fb",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم استقبال القبلة في الصلاة في السفر",
  },
  {
    id: "qibla-facing-kabah-de",
    topicId: "qibla-facing-kabah",
    topicName: "Facing the Qibla for obligatory prayer",
    lang: "de",
    question: "In welche Richtung müssen sich Muslime beim Gebet wenden?",
    expectedSourceId: "726e59d2-ec39-4f09-9ab8-a5cc8e9996fb",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم استقبال القبلة في الصلاة في السفر",
  },

  // Topic 3: Riba prohibition
  {
    id: "riba-prohibition-ar",
    topicId: "riba-categorical-prohibition",
    topicName: "Riba prohibition",
    lang: "ar",
    question: "هل التعامل بالربا واخذ الفائدة حرام في الاسلام؟",
    expectedSourceId: "27c5737a-03b2-45b0-8b60-f40fff386519",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم التعامل مع البنوك بالربا وزكاتها",
  },
  {
    id: "riba-prohibition-en",
    topicId: "riba-categorical-prohibition",
    topicName: "Riba prohibition",
    lang: "en",
    question: "Why is taking interest and usury (riba) forbidden in Islam?",
    expectedSourceId: "27c5737a-03b2-45b0-8b60-f40fff386519",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم التعامل مع البنوك بالربا وزكاتها",
  },
  {
    id: "riba-prohibition-de",
    topicId: "riba-categorical-prohibition",
    topicName: "Riba prohibition",
    lang: "de",
    question: "Warum sind Zinsen und Wucher (Riba) im Islam verboten?",
    expectedSourceId: "27c5737a-03b2-45b0-8b60-f40fff386519",
    expectedScholarId: "ibn-baz",
    expectedTitle: "حكم التعامل مع البنوك بالربا وزكاتها",
  },

  // Topic 4: Widow's waiting period
  {
    id: "widow-waiting-period-ar",
    topicId: "widow-waiting-period",
    topicName: "Widow's waiting period",
    lang: "ar",
    question: "كم مدة عدة المراة التي توفي عنها زوجها؟",
    expectedSourceId: "e609bbcd-92a7-4bed-9a55-34d9d0ee849b",
    expectedScholarId: "ibn-baz",
    expectedTitle: "أحكام المعتدة عدة وفاة",
  },
  {
    id: "widow-waiting-period-en",
    topicId: "widow-waiting-period",
    topicName: "Widow's waiting period",
    lang: "en",
    question: "What is the waiting period for a widow whose husband passed away?",
    expectedSourceId: "e609bbcd-92a7-4bed-9a55-34d9d0ee849b",
    expectedScholarId: "ibn-baz",
    expectedTitle: "أحكام المعتدة عدة وفاة",
  },
  {
    id: "widow-waiting-period-de",
    topicId: "widow-waiting-period",
    topicName: "Widow's waiting period",
    lang: "de",
    question: "Wie lange ist die Wartezeit für eine Frau, deren Ehemann verstorben ist?",
    expectedSourceId: "e609bbcd-92a7-4bed-9a55-34d9d0ee849b",
    expectedScholarId: "ibn-baz",
    expectedTitle: "أحكام المعتدة عدة وفاة",
  },

  // Topic 5: Intention in worship
  {
    id: "intention-in-worship-ar",
    topicId: "intention-in-worship",
    topicName: "Intention in worship",
    lang: "ar",
    question: "هل يشترط النية لصحة العمل والعبادة في الاسلام؟",
    expectedSourceId: "916e042e-8573-4e52-b138-8bb26b56360e",
    expectedScholarId: "ibn-baz",
    expectedTitle: "محل النية وحكم التلفظ بها",
  },
  {
    id: "intention-in-worship-en",
    topicId: "intention-in-worship",
    topicName: "Intention in worship",
    lang: "en",
    question: "Are actions in Islam judged by their underlying intentions?",
    expectedSourceId: "916e042e-8573-4e52-b138-8bb26b56360e",
    expectedScholarId: "ibn-baz",
    expectedTitle: "محل النية وحكم التلفظ بها",
  },
  {
    id: "intention-in-worship-de",
    topicId: "intention-in-worship",
    topicName: "Intention in worship",
    lang: "de",
    question: "Werden Taten im Islam nach der Absicht beurteilt?",
    expectedSourceId: "916e042e-8573-4e52-b138-8bb26b56360e",
    expectedScholarId: "ibn-baz",
    expectedTitle: "محل النية وحكم التلفظ بها",
  },
];

export type EvaluationItemResult = {
  testId: string;
  topicName: string;
  lang: "ar" | "en" | "de";
  question: string;
  generatedArabicPhrases: string[];
  expectedSourceId: string;
  expectedTitle: string;
  retrievedQuotes: Array<{
    sourceId: string;
    scholarId: string;
    title: string | null;
    passedTitleGate: boolean;
  }>;
  expectedQuoteRetrieved: boolean;
  passedTitleGate: boolean;
  unrelatedQuoteAppeared: boolean;
  status: "success" | "failure";
  failureCause?: "gemini_phrase_generation" | "retrieval" | "title_gate" | "timeout" | "quota" | "error";
  failureDetails?: string;
};

const words = { type: "array", items: { type: "string" } } as const;
const QUESTION_FRAME_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    language: { type: "string", enum: ["ar", "en", "de"] },
    kind: { type: "string", enum: ["question", "personal", "greeting", "off_topic", "harmful"] },
    question_type: { type: "string", enum: [...QUESTION_TYPES] },
    subjects: words,
    requested_points: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          facet: { type: "string", enum: [...ANSWER_FACETS] },
        },
        required: ["text", "facet"],
      },
    },
    qualifiers: words,
    search_queries_en: words,
    search_queries_de: words,
    search_queries_ar: words,
  },
  required: [
    "language",
    "kind",
    "question_type",
    "subjects",
    "requested_points",
    "qualifiers",
    "search_queries_en",
    "search_queries_de",
    "search_queries_ar",
  ],
};

async function executeScholarRetrieval(
  db: SupabaseClient,
  phrases: string[],
  limit = 6,
): Promise<{
  rpcCandidateIds: string[];
  quotes: Array<{
    sourceId: string;
    scholarId: string;
    title: string | null;
    passedTitleGate: boolean;
  }>;
}> {
  if (phrases.length === 0) return { rpcCandidateIds: [], quotes: [] };

  let hits: { source_id: string }[] = [];
  for (const query of searchQueryLevels(phrases)) {
    const { data, error } = await db.rpc("search_approved_source_candidates", {
      query_text: query,
      answer_language: "ar",
      question_type: "general",
      required_facets: [],
      match_count: limit * 3,
    });
    if (error) throw new Error(`Scholar search RPC failed: ${error.message}`);
    hits = (data as { source_id: string }[] | null) ?? [];
    if (hits.length > 0) break;
  }

  const ids = [...new Set(hits.map((h) => h.source_id))].slice(0, limit * 2);
  if (ids.length === 0) return { rpcCandidateIds: [], quotes: [] };

  const { data: rows, error: rowError } = await db
    .from("sources")
    .select("id, kind, scholar_id, title, reference, url, scholars(name_ar, name_en, name_de)")
    .in("id", ids)
    .eq("published", true)
    .eq("kind", "fatwa");

  if (rowError || !rows) throw new Error(`Could not fetch sources: ${rowError?.message}`);

  const byId = new Map(rows.map((r: any) => [r.id, r]));

  const quotes = ids
    .map((id) => byId.get(id))
    .filter((r): r is any => !!r && !!r.scholar_id)
    .map((r) => {
      const gatePass = isScholarTitleRelevant(phrases, r.title);
      return {
        sourceId: r.id,
        scholarId: r.scholar_id,
        title: r.title,
        passedTitleGate: gatePass,
      };
    });

  return { rpcCandidateIds: ids, quotes };
}

async function runEvaluation(): Promise<EvaluationItemResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const writer = getProvider();

  console.log("=================================================================");
  console.log("LIVE MULTILINGUAL SCHOLAR RETRIEVAL EVALUATION");
  console.log(`Evaluating ${TEST_QUESTIONS.length} test questions across AR, EN, DE`);
  console.log("=================================================================\n");

  const results: EvaluationItemResult[] = [];

  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const t = TEST_QUESTIONS[i];
    console.log(`[${i + 1}/${TEST_QUESTIONS.length}] Testing ${t.id} (${t.lang.toUpperCase()}): "${t.question}"...`);

    if (i > 0) {
      await sleep(PAUSE_BETWEEN_CALLS_MS);
    }

    let frame: QuestionFrame | null = null;
    let failureCause: EvaluationItemResult["failureCause"] | undefined;
    let failureDetails: string | undefined;

    try {
      const abortSignal = AbortSignal.timeout(20_000);
      const raw = await writer.generateJson({
        system: UNDERSTAND_SYSTEM,
        prompt: JSON.stringify({ visitor_text: t.question }),
        maxOutputTokens: 900,
        signal: abortSignal,
        schema: QUESTION_FRAME_SCHEMA,
      });

      frame = parseQuestionFrame(raw);
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      console.log(`   AI Understanding call failed: ${msg}`);
      if (msg.includes("503") || msg.includes("busy") || msg.includes("High demand")) {
        failureCause = "busy" as any;
        failureDetails = "Gemini service temporarily busy (503)";
      } else if (msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        failureCause = "quota";
        failureDetails = "Gemini rate limit or quota exceeded";
      } else if (msg.includes("timeout") || msg.includes("AbortError")) {
        failureCause = "timeout";
        failureDetails = "Gemini request timed out";
      } else {
        failureCause = "error";
        failureDetails = msg;
      }
    }

    const arabicPhrases = frame?.searchQueries?.ar ?? [];
    console.log(`   Generated Arabic phrases (${arabicPhrases.length}): ${JSON.stringify(arabicPhrases)}`);

    if (!frame || arabicPhrases.length === 0) {
      if (!failureCause) {
        failureCause = "gemini_phrase_generation";
        failureDetails = "No valid Arabic search phrases generated in question frame";
      }
      results.push({
        testId: t.id,
        topicName: t.topicName,
        lang: t.lang,
        question: t.question,
        generatedArabicPhrases: arabicPhrases,
        expectedSourceId: t.expectedSourceId,
        expectedTitle: t.expectedTitle,
        retrievedQuotes: [],
        expectedQuoteRetrieved: false,
        passedTitleGate: false,
        unrelatedQuoteAppeared: false,
        status: "failure",
        failureCause,
        failureDetails,
      });
      continue;
    }

    // Step 2: Scholar retrieval using generated Arabic phrases
    try {
      const { rpcCandidateIds, quotes } = await executeScholarRetrieval(db, arabicPhrases, 6);

      const matchingExpected = quotes.find((q) => q.sourceId === t.expectedSourceId);
      const expectedRetrieved = !!matchingExpected;
      const expectedPassedGate = matchingExpected ? matchingExpected.passedTitleGate : false;

      // Filter quotes that actually passed the gate
      const survivingQuotes = quotes.filter((q) => q.passedTitleGate);
      const unrelatedAppeared = survivingQuotes.some((q) => q.sourceId !== t.expectedSourceId);

      let itemStatus: "success" | "failure" = "failure";

      if (expectedRetrieved && expectedPassedGate && !unrelatedAppeared) {
        itemStatus = "success";
        console.log(`   SUCCESS: Expected quote retrieved and title gate passed: "${t.expectedTitle}"`);
      } else {
        if (!expectedRetrieved) {
          failureCause = "retrieval";
          failureDetails = rpcCandidateIds.length === 0
            ? "RPC search returned 0 candidate hits for phrases"
            : `RPC candidates (${rpcCandidateIds.length}) did not include expected quote`;
        } else if (!expectedPassedGate) {
          failureCause = "title_gate";
          failureDetails = "Expected quote retrieved by RPC but rejected by title relevance gate";
        } else if (unrelatedAppeared) {
          failureCause = "retrieval";
          failureDetails = "Unrelated quote passed title gate alongside or instead of expected quote";
        }
        console.log(`   FAILURE: ${failureCause}: ${failureDetails}`);
      }

      results.push({
        testId: t.id,
        topicName: t.topicName,
        lang: t.lang,
        question: t.question,
        generatedArabicPhrases: arabicPhrases,
        expectedSourceId: t.expectedSourceId,
        expectedTitle: t.expectedTitle,
        retrievedQuotes: quotes,
        expectedQuoteRetrieved: expectedRetrieved,
        passedTitleGate: expectedPassedGate,
        unrelatedQuoteAppeared: unrelatedAppeared,
        status: itemStatus,
        failureCause,
        failureDetails,
      });
    } catch (dbErr: any) {
      console.log(`   Retrieval database error: ${dbErr?.message}`);
      results.push({
        testId: t.id,
        topicName: t.topicName,
        lang: t.lang,
        question: t.question,
        generatedArabicPhrases: arabicPhrases,
        expectedSourceId: t.expectedSourceId,
        expectedTitle: t.expectedTitle,
        retrievedQuotes: [],
        expectedQuoteRetrieved: false,
        passedTitleGate: false,
        unrelatedQuoteAppeared: false,
        status: "failure",
        failureCause: "error",
        failureDetails: dbErr?.message,
      });
    }
  }

  return results;
}

async function main() {
  const results = await runEvaluation();

  // Print Summary Table
  console.log("\n=================================================================");
  console.log("EVALUATION SUMMARY");
  console.log("=================================================================");
  const total = results.length;
  const successes = results.filter((r) => r.status === "success").length;
  const arSuccesses = results.filter((r) => r.lang === "ar" && r.status === "success").length;
  const enSuccesses = results.filter((r) => r.lang === "en" && r.status === "success").length;
  const deSuccesses = results.filter((r) => r.lang === "de" && r.status === "success").length;

  console.log(`Total questions: ${total}`);
  console.log(`Overall Success: ${successes}/${total} (${((successes / total) * 100).toFixed(1)}%)`);
  console.log(`Arabic (AR) Success: ${arSuccesses}/5 (${((arSuccesses / 5) * 100).toFixed(1)}%)`);
  console.log(`English (EN) Success: ${enSuccesses}/5 (${((enSuccesses / 5) * 100).toFixed(1)}%)`);
  console.log(`German (DE) Success: ${deSuccesses}/5 (${((deSuccesses / 5) * 100).toFixed(1)}%)`);
  console.log(`Combined Multilingual (EN + DE): ${enSuccesses + deSuccesses}/10 (${(((enSuccesses + deSuccesses) / 10) * 100).toFixed(1)}%)`);

  console.log("\nDetailed Outcomes:");
  for (const r of results) {
    const mark = r.status === "success" ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.testId.padEnd(30)} | Phrases: ${r.generatedArabicPhrases.length} | Retrieved: ${r.expectedQuoteRetrieved ? "YES" : "NO"} | Gate: ${r.passedTitleGate ? "PASS" : "FAIL"}${r.failureCause ? ` | Reason: ${r.failureCause} (${r.failureDetails})` : ""}`);
  }
}

if (process.argv[1]?.includes("eval-multilingual-scholar-retrieval")) {
  main().catch((err) => {
    console.error("Evaluation script encountered fatal error:", err);
    process.exit(1);
  });
}
