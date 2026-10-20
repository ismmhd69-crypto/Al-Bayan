import manifest from "../tests/fixtures/ask-shared-cases.json";
import type { Locale } from "../lib/i18n";
export const FROZEN_SHARED_HASH = "2313e9a9ce7a8c879f504969e9ca4c2cdb1d545ab3d61fb980920b90edc5df3b";
export const sharedQuestionCases = manifest.cases.flatMap(c => (["en", "ar", "de"] as const).map(lang => ({
  id: `${c.id}-${lang}`, lang, question: c.questions[lang], category: c.category, kind: c.kind,
  facets: c.facets, concerns: c.concerns, referenceHints: c.referenceHints, live: c.liveLanguage === lang,
})));
export function sharedLiveCases(): { id: string; lang: Locale; question: string; previous_user_messages?: string[]; referenceHints: boolean }[] {
  return sharedQuestionCases.filter(c => c.live);
}
