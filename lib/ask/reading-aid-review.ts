// Experimental compatibility control. Not imported by the active answer path.
import type { Claim } from "./checks";
import { isolatedMeaningReviewRequest } from "./meaning-review";
import { arabicReadingAid } from "./arabic-reading-aid";

export function readingAidReviewRequest(item: Claim, serialized: unknown, signal: AbortSignal) {
  const request = isolatedMeaningReviewRequest(item, serialized, signal);
  const input = JSON.parse(request.prompt);
  input.stage = "isolated_meaning_reading_aid_control_v1";
  for (const source of input.claims[0].originals) {
    source.machine_reading_aid = arabicReadingAid(source.arabic);
  }
  request.prompt = JSON.stringify(input);
  request.system += "\nEach exact Arabic original is accompanied by a deterministic machine_reading_aid with ordinary vowel/pause marks and elongation removed and alif-wasla rendered as alif. It adds no meaning. The exact arabic field remains the sole original authority. This aid is neither a second source nor independent support. Never fill missing words or assertions from familiarity.";
  return request;
}
