import type { AIProvider, JsonSchema } from "@/lib/ai/types";
import { UNDERSTAND_SYSTEM } from "./core";
import { LIBRARY_PLAN_RULES, POINT_PLAN_PROPERTIES } from "./library-flow";
import { SHARED_QUESTION_RULES } from "./question-contract";
import { ANSWER_FACETS, QUESTION_TYPES, parseQuestionFrame, questionFrameMismatch, questionFrameRejection } from "./retrieval";

const words: JsonSchema = { type: "array", maxItems: 6, items: { type: "string", maxLength: 120 } };
export async function understandPatientQuestion(question: string, history: string[], writer: AIProvider, signal: AbortSignal) {
  let failure = "invalid_question_frame";
  let unreadable = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await writer.generateJson({
      system: `${UNDERSTAND_SYSTEM}\n${SHARED_QUESTION_RULES}\n${LIBRARY_PLAN_RULES}`,
      prompt: JSON.stringify({ visitor_text: question, previous_user_messages: history, ...(attempt ? { correction: failure } : {}) }),
      signal, thinking: "low", maxOutputTokens: 2000, structuredOutput: true,
      ...(attempt && unreadable ? { malformedResponseRetry: true } : {}),
      schema: { type: "object", properties: {
        language: { type: "string", enum: ["ar", "en", "de"] },
        kind: { type: "string", enum: ["question", "personal", "greeting", "off_topic", "harmful"] },
        question_type: { type: "string", enum: [...QUESTION_TYPES] }, subjects: words, qualifiers: words,
        requested_points: { type: "array", maxItems: 4, items: { type: "object", properties: {
          text: { type: "string", maxLength: 120, description: "Short plain English internal description, even for Arabic or German visitors; at most 16 words. Preserve the concern, do not answer it." }, facet: { type: "string", enum: [...ANSWER_FACETS] },
          ...POINT_PLAN_PROPERTIES, scope: { type: "string", enum: ["general", "case_specific"] },
        }, required: ["text", "facet", ...Object.keys(POINT_PLAN_PROPERTIES), "scope"] } },
        search_queries_en: words, search_queries_de: words, search_queries_ar: words,
        search_queries_quran_ar: words, search_queries_hadith_ar: words,
        // The shared planner/parser contract is labels only. Code assigns I1/I2 in order.
        interpretations: { type: "array", maxItems: 2, items: { type: "string", maxLength: 79 } },
        clarification_needed: { type: "boolean" }, checklist_status: { type: "string", enum: ["complete", "ambiguous", "too_complex"] },
      }, required: ["language", "kind", "question_type", "subjects", "qualifiers", "requested_points", "search_queries_en", "search_queries_de", "search_queries_ar", "search_queries_quran_ar", "search_queries_hadith_ar", "interpretations", "clarification_needed", "checklist_status"] },
    });
    const frame = parseQuestionFrame(raw);
    if (!frame) { unreadable = raw == null; failure = questionFrameRejection(raw); continue; }
    const mismatch = questionFrameMismatch(question, frame);
    if (!mismatch) return frame;
    failure = mismatch;
  }
  return null;
}
