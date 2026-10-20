import type { Locale } from "@/lib/i18n";
import type { Answer } from "@/lib/ask/core";
import { emptyRichState, reduceRichEvent, validRichSection, type RichEvent, type RichSource } from "@/lib/ask/rich-answer";
import type { ResearchJobView } from "./job-store";

export type SourceFreshness = "valid" | "changed" | "unavailable";
export type JobFreshnessDeps = {
  evidence(source: RichSource, language: Locale, signal: AbortSignal): Promise<SourceFreshness>;
  prepared(answer: Answer, signal: AbortSignal): Promise<SourceFreshness>;
};
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
};

/** No model calls. Before every reconnect read, check the FULL history, not just new events.
 * Changing an original while preserving an old explanation is unsafe, even if both look valid. */
export async function verifyResearchJob(view: ResearchJobView, deps: JobFreshnessDeps, signal: AbortSignal): Promise<SourceFreshness> {
  try {
    signal.throwIfAborted();
    let state = emptyRichState();
    const sources = new Map<string, RichSource>();
    let prepared: Answer | undefined;
    for (const row of view.events) {
      const event = row.payload as RichEvent;
      if (event?.request_id !== view.id || event.sequence !== row.sequence) return "changed";
      state = reduceRichEvent(state, event);
      if (event.type === "section") {
        if (!validRichSection(event.section, view.language)) return "changed";
        for (const source of event.section.sources) {
          const earlier = sources.get(source.id);
          if (earlier && canonical(earlier.evidence) !== canonical(source.evidence)) return "changed";
          if (earlier?.displayTranslation?.status === "ready" && source.displayTranslation?.status === "ready"
            && canonical(earlier.displayTranslation) !== canonical(source.displayTranslation)) return "changed";
          // Display translations are checked too; retain the ready one when summary copies omit it.
          if (!earlier || source.displayTranslation?.status === "ready") sources.set(source.id, source);
        }
      }
      if (event.type === "terminal") {
        const result = event.result as { status?: string; answer?: Answer | { language?: string } };
        if (result?.status === "answer") prepared = result.answer as Answer;
        if (["answer", "rich_answer"].includes(result?.status ?? "") && result.answer?.language !== view.language) return "changed";
      }
    }
    if (state.sequence !== view.sequence || (view.state === "complete" && (!state.terminal || !["answer", "rich_answer"].includes((state.result as { status?: string })?.status ?? "")))) return "changed";
    if (sources.size > 20 || (prepared && sources.size)) return "changed";
    const results = await Promise.all([
      ...[...sources.values()].map(source => deps.evidence(source, view.language, signal)),
      ...(prepared ? [deps.prepared(prepared, signal)] : []),
    ]);
    signal.throwIfAborted();
    return results.includes("changed") ? "changed" : results.includes("unavailable") ? "unavailable" : "valid";
  } catch { return "unavailable"; }
}
