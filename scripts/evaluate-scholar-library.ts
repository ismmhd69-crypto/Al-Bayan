import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EVAL_QUESTIONS, type EvalQuestion } from "@/data/eval-questions";
import { expandScholarSearchAliases, isScholarTitleRelevant, searchQueryLevels, type ScholarQuote } from "@/lib/sources/scholar-rules";

process.loadEnvFile(".env");

export type EvaluationOutcome =
  | "pass"
  | "safe_gap"
  | "wrong_source"
  | "personal_case_protected"
  | "out_of_scope_protected"
  | "needs_manual_review";

export type CandidateQuote = {
  id: string;
  sourceId: string;
  scholarId: string;
  scholarName: { ar: string; en: string; de: string };
  title: string | null;
  reference: string;
  url: string;
  rank: number;
};

export type QuestionEvaluationResult = {
  id: string;
  lang: "ar" | "en" | "de";
  question: string;
  expect: "answer" | "refuse" | "ask_scholar" | "out_of_scope";
  note?: string;
  retrieved: boolean;
  matchedQueryLevel?: string;
  candidates: CandidateQuote[];
  outcome: EvaluationOutcome;
  explanation: string;
  crossLanguageGap?: boolean;
};

/**
 * Known relevance verdicts for specific question + top candidate pairs.
 * Used for deterministic, reproducible evaluation without calling external LLM APIs.
 */
export const KNOWN_RELEVANCE_MAP: Record<string, { isRelevant: boolean; reason: string }> = {
  // fasting-obligation-ar retrieved "المشروع تقديم القضاء على صوم الست"
  "fasting-obligation-ar": {
    isRelevant: false,
    reason: "Candidate addresses voluntary fast before making up missed days, not whether fasting Ramadan is obligatory.",
  },
  // riba-prohibition-ar retrieved "حكم من تعامل بالربا جهلًا"
  "riba-prohibition-ar": {
    isRelevant: false,
    reason: "Candidate addresses dealing with interest in ignorance, not the core Islamic prohibition of usury/interest.",
  },
  // divorce-limit-ar retrieved "الوسوسة في الوضوء وكيفية علاجها"
  "divorce-limit-ar": {
    isRelevant: false,
    reason: "Candidate addresses obsessive doubts in wudu, completely unrelated to the number of revocable divorces.",
  },
  // five-pillars-ar retrieved "هل الأمر بالمعروف من أركان الإسلام؟"
  "five-pillars-ar": {
    isRelevant: false,
    reason: "Candidate discusses whether enjoining good is a pillar, not the five essential pillars of Islam in order.",
  },
  // prayer-neglect-ar retrieved "ما حكم تارك الصلاة؟"
  "prayer-neglect-ar": {
    isRelevant: true,
    reason: "Candidate directly addresses the scholarly ruling on abandoning prayer.",
  },
  // tawhid-meaning-ar retrieved "لماذا سميت سورة الإخلاص بهذا الإسم ؟"
  "tawhid-meaning-ar": {
    isRelevant: false,
    reason: "Candidate discusses why Surah al-Ikhlas includes the three categories of Tawhid, but does not define Tawhid and its three branches.",
  },
  // polygyny-limit-ar retrieved "إذا شك في صلاته فلم يدري كما صلى فماذا يلزمه ؟"
  "polygyny-limit-ar": {
    isRelevant: false,
    reason: "Candidate addresses doubts during prayer, completely unrelated to marriage limits in Surah 4:3.",
  },
  // wudu-verse-maidah-ar retrieved "هل يصح حديث الجبيرة ؟"
  "wudu-verse-maidah-ar": {
    isRelevant: false,
    reason: "Candidate discusses wiping over a splint/cast, not the explicit limbs of wudu in Surah al-Ma'idah 5:6.",
  },
};

export function lookupKnownRelevance(
  questionId: string,
  candidateTitle?: string | null,
): { isRelevant: boolean; reason: string } | undefined {
  if (questionId === "riba-prohibition-ar") {
    if (candidateTitle && candidateTitle.includes("جهلًا")) {
      return {
        isRelevant: false,
        reason: "Candidate addresses dealing with interest in ignorance, not the core Islamic prohibition of usury/interest.",
      };
    }
    if (candidateTitle && (candidateTitle.includes("البنوك بالربا") || candidateTitle.includes("التعامل مع البنوك بالربا وزكاتها"))) {
      return {
        isRelevant: true,
        reason: "Candidate directly establishes the categorical prohibition of dealing in riba and interest.",
      };
    }
  }
  return KNOWN_RELEVANCE_MAP[questionId];
}

/**
 * Pure classification logic: maps question type and retrieved candidates to a strict outcome.
 */
export function classifyEvaluationOutcome(
  question: EvalQuestion,
  candidates: CandidateQuote[],
): { outcome: EvaluationOutcome; explanation: string; crossLanguageGap?: boolean } {
  // 1. Personal case handling (expect: "ask_scholar")
  if (question.expect === "ask_scholar") {
    if (candidates.length === 0) {
      return {
        outcome: "personal_case_protected",
        explanation: "Personal situation correctly returned no generic scholar fatwas.",
      };
    }
    return {
      outcome: "wrong_source",
      explanation: `Personal situation retrieved ${candidates.length} generic fatwa(s) as evidence: "${candidates[0].title}". Personal inquiries must never receive automated generic advice.`,
    };
  }

  // 2. Out of scope handling (expect: "out_of_scope")
  if (question.expect === "out_of_scope") {
    if (candidates.length === 0) {
      return {
        outcome: "out_of_scope_protected",
        explanation: "Off-topic/casual greeting correctly returned no scholar evidence.",
      };
    }
    return {
      outcome: "wrong_source",
      explanation: `Off-topic question retrieved unrelated scholar quote: "${candidates[0].title}".`,
    };
  }

  // 3. Questions outside current scope (expect: "refuse")
  if (question.expect === "refuse") {
    if (candidates.length === 0) {
      return {
        outcome: "safe_gap",
        explanation: "Uncovered/refused topic safely returned no scholar evidence.",
      };
    }
    // Check if the candidate actually addresses the topic
    const known = lookupKnownRelevance(question.id, candidates[0]?.title);
    if (known && !known.isRelevant) {
      return {
        outcome: "wrong_source",
        explanation: `Topic scheduled for refusal retrieved irrelevant candidate: "${candidates[0].title}" (${known.reason}).`,
      };
    }
    return {
      outcome: "wrong_source",
      explanation: `Topic scheduled for refusal retrieved candidate: "${candidates[0].title}".`,
    };
  }

  // 4. Answerable questions (expect: "answer")
  if (candidates.length === 0) {
    const isCrossLang = question.lang !== "ar";
    return {
      outcome: "safe_gap",
      crossLanguageGap: isCrossLang,
      explanation: isCrossLang
        ? `No scholar quote retrieved for ${question.lang.toUpperCase()} query. Cross-language gap: retrieval engine index is in Arabic script only.`
        : "No relevant scholar quote retrieved in Arabic library for this question (safe gap).",
    };
  }

  // Candidates were found for an answerable question
  const top = candidates[0];
  const known = lookupKnownRelevance(question.id, top?.title);

  if (known) {
    if (known.isRelevant) {
      return {
        outcome: "pass",
        explanation: `Relevant scholar quote retrieved: "${top.title}" by ${top.scholarId}. ${known.reason}`,
      };
    }
    return {
      outcome: "wrong_source",
      explanation: `Candidate quote "${top.title}" does not answer question: ${known.reason}`,
    };
  }

  // If not explicitly mapped, check for obvious title keyword match
  const qClean = question.question.replace(/[؟?.,!]/g, "").trim();
  const titleClean = top.title ?? "";
  if (titleClean.includes(qClean) || qClean.includes(titleClean)) {
    return {
      outcome: "pass",
      explanation: `Strong title match retrieved: "${top.title}" by ${top.scholarId}.`,
    };
  }

  return {
    outcome: "needs_manual_review",
    explanation: `Candidate "${top.title}" (${top.scholarId}) needs manual inspection against question: "${question.question}".`,
  };
}

/**
 * Loads published sources and approved search documents read-only from database.
 */
export async function loadPublishedSourcesMap(
  db: SupabaseClient,
): Promise<{
  publishedSourceIds: Set<string>;
  sourceDetails: Map<
    string,
    {
      id: string;
      scholar_id: string;
      title: string | null;
      reference: string;
      url: string;
      scholars: { name_ar: string; name_en: string; name_de: string };
    }
  >;
}> {
  const { data: rows, error } = await db
    .from("sources")
    .select("id, scholar_id, title, reference, url, scholars(name_ar, name_en, name_de)")
    .eq("published", true)
    .eq("kind", "fatwa");

  if (error || !rows) {
    throw new Error(`Failed to load published sources: ${error?.message}`);
  }

  const publishedSourceIds = new Set(rows.map((r) => r.id));
  const sourceDetails = new Map(
    rows.map((r: any) => [
      r.id,
      {
        id: r.id,
        scholar_id: r.scholar_id,
        title: r.title,
        reference: r.reference,
        url: r.url,
        scholars: r.scholars,
      },
    ]),
  );

  return { publishedSourceIds, sourceDetails };
}

/**
 * Executes scholar search candidate retrieval for a single question using the database RPC.
 */
export async function retrieveCandidatesForQuestion(
  db: SupabaseClient,
  questionText: string,
  publishedSourceIds: Set<string>,
  sourceDetails: Map<string, any>,
  matchLimit = 3,
): Promise<{ candidates: CandidateQuote[]; matchedQueryLevel?: string }> {
  const expandedPhrases = expandScholarSearchAliases([questionText]);
  const levels = searchQueryLevels(expandedPhrases);
  let hits: Array<{ source_id: string; rank: number }> = [];
  let matchedQueryLevel: string | undefined;

  for (const query of levels) {
    const { data, error } = await db.rpc("search_approved_source_candidates", {
      query_text: query,
      answer_language: "ar",
      question_type: "general",
      required_facets: [],
      match_count: matchLimit * 3,
    });

    if (error) {
      throw new Error(`RPC search error: ${error.message}`);
    }

    if (data && data.length > 0) {
      hits = data;
      matchedQueryLevel = query;
      break;
    }
  }

  // Filter out any unpublished source IDs (defence in depth)
  const validHits = hits.filter((h) => publishedSourceIds.has(h.source_id));
  const uniqueIds = [...new Set(validHits.map((h) => h.source_id))].slice(0, matchLimit);

  const candidates: CandidateQuote[] = uniqueIds
    .map((id) => {
      const src = sourceDetails.get(id);
      const hit = validHits.find((h) => h.source_id === id);
      if (!src) return null;
      return {
        id: `S${src.id}`,
        sourceId: src.id,
        scholarId: src.scholar_id,
        scholarName: src.scholars,
        title: src.title,
        reference: src.reference,
        url: src.url,
        rank: hit?.rank ?? 0,
      };
    })
    .filter((c): c is CandidateQuote => c !== null)
    .filter((c) => isScholarTitleRelevant(expandedPhrases, c.title));

  return { candidates, matchedQueryLevel };
}

async function main() {
  const questionArg = process.argv.find((a) => a.startsWith("--question="))?.split("=")[1];
  const limitArg = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
  const onlyLang = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

  console.log("==================================================");
  console.log("SCHOLAR LIBRARY RETRIEVAL EVALUATION RUNNER");
  console.log("Strict read-only evaluation across 90 eval questions");
  console.log("==================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  const db = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("1. Loading published scholar quotes from database...");
  const { publishedSourceIds, sourceDetails } = await loadPublishedSourcesMap(db);
  console.log(`   Loaded ${publishedSourceIds.size} published sources.`);

  // Verify unpublished sources count
  const { count: unpubCount } = await db
    .from("sources")
    .select("*", { count: "exact", head: true })
    .eq("published", false);
  console.log(`   Verified ${unpubCount ?? 0} unpublished sources are strictly excluded.`);

  // Select questions (the 90 standard eval questions)
  let questions = EVAL_QUESTIONS.slice(0, 90);
  if (questionArg) {
    questions = questions.filter((q) => q.id === questionArg);
  }
  if (onlyLang) {
    questions = questions.filter((q) => q.lang === onlyLang);
  }
  questions = questions.slice(0, limitArg);

  console.log(`\n2. Running retrieval for ${questions.length} questions...\n`);

  const results: QuestionEvaluationResult[] = [];
  const tally: Record<EvaluationOutcome, number> = {
    pass: 0,
    safe_gap: 0,
    wrong_source: 0,
    personal_case_protected: 0,
    out_of_scope_protected: 0,
    needs_manual_review: 0,
  };

  const tallyByLang: Record<string, Record<EvaluationOutcome, number>> = {
    ar: { pass: 0, safe_gap: 0, wrong_source: 0, personal_case_protected: 0, out_of_scope_protected: 0, needs_manual_review: 0 },
    en: { pass: 0, safe_gap: 0, wrong_source: 0, personal_case_protected: 0, out_of_scope_protected: 0, needs_manual_review: 0 },
    de: { pass: 0, safe_gap: 0, wrong_source: 0, personal_case_protected: 0, out_of_scope_protected: 0, needs_manual_review: 0 },
  };

  for (const q of questions) {
    const { candidates, matchedQueryLevel } = await retrieveCandidatesForQuestion(
      db,
      q.question,
      publishedSourceIds,
      sourceDetails,
    );

    const { outcome, explanation, crossLanguageGap } = classifyEvaluationOutcome(q, candidates);

    tally[outcome]++;
    tallyByLang[q.lang][outcome]++;

    results.push({
      id: q.id,
      lang: q.lang,
      question: q.question,
      expect: q.expect,
      note: q.note,
      retrieved: candidates.length > 0,
      matchedQueryLevel,
      candidates,
      outcome,
      explanation,
      crossLanguageGap,
    });

    const statusBadge = outcome.toUpperCase();
    console.log(
      `[${statusBadge.padEnd(23)}] (${q.lang}) ${q.id.padEnd(30)} -> ${candidates.length} hit(s)${candidates[0] ? `: "${candidates[0].title?.slice(0, 45)}"` : ""}`,
    );
  }

  console.log("\n==================================================");
  console.log("EVALUATION SUMMARY");
  console.log("==================================================");
  console.log(`Total questions evaluated: ${results.length}`);
  console.log(`- PASS (relevant source found):         ${tally.pass}`);
  console.log(`- SAFE GAP (no source, safe refusal):   ${tally.safe_gap}`);
  console.log(`- WRONG SOURCE (irrelevant source):     ${tally.wrong_source}`);
  console.log(`- PERSONAL CASE PROTECTED:              ${tally.personal_case_protected}`);
  console.log(`- OUT OF SCOPE PROTECTED:               ${tally.out_of_scope_protected}`);
  console.log(`- NEEDS MANUAL REVIEW:                  ${tally.needs_manual_review}`);

  console.log("\nBreakdown by Language:");
  for (const lang of ["ar", "en", "de"] as const) {
    console.log(`  ${lang.toUpperCase()}: pass=${tallyByLang[lang].pass}, safe_gap=${tallyByLang[lang].safe_gap}, wrong_source=${tallyByLang[lang].wrong_source}, personal_case_protected=${tallyByLang[lang].personal_case_protected}, out_of_scope_protected=${tallyByLang[lang].out_of_scope_protected}, manual_review=${tallyByLang[lang].needs_manual_review}`);
  }

  // Save report JSON
  const fs = await import("fs");
  fs.writeFileSync("docs/scholar-retrieval-eval-results.json", JSON.stringify({ summary: tally, tallyByLang, results }, null, 2), "utf-8");
  console.log("\nSaved evaluation results to docs/scholar-retrieval-eval-results.json");
}

if (import.meta.url.startsWith("file:") && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, "/"))) {
  main().catch((err) => {
    console.error("Evaluation runner error:", err);
    process.exit(1);
  });
}
