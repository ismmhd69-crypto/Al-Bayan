// Prepared answers to common questions (Gemini research, quotes checked by scripts/verify-quotes.ts,
// approved by Mo on the review tab). Add a line when a new answer file is added.
import type { PreparedFile } from "@/lib/prepared";

import a_how_to_become_muslim from "./how-to-become-muslim.json";
import a_how_to_pray from "./how-to-pray.json";
import a_how_to_repent from "./how-to-repent.json";
import a_how_to_wudu from "./how-to-wudu.json";
import a_is_interest_haram from "./is-interest-haram.json";
import a_is_music_haram from "./is-music-haram.json";
import a_marriage_muslim_woman_non_muslim from "./marriage-muslim-woman-non-muslim.json";
import a_what_breaks_the_fast from "./what-breaks-the-fast.json";
import a_zakat_gold from "./zakat-gold.json";
import a_zakat_savings from "./zakat-savings.json";

export const PREPARED_ANSWERS: Record<string, PreparedFile> = {
  "how-to-become-muslim": a_how_to_become_muslim as unknown as PreparedFile,
  "how-to-pray": a_how_to_pray as unknown as PreparedFile,
  "how-to-repent": a_how_to_repent as unknown as PreparedFile,
  "how-to-wudu": a_how_to_wudu as unknown as PreparedFile,
  "is-interest-haram": a_is_interest_haram as unknown as PreparedFile,
  "is-music-haram": a_is_music_haram as unknown as PreparedFile,
  "marriage-muslim-woman-non-muslim": a_marriage_muslim_woman_non_muslim as unknown as PreparedFile,
  "what-breaks-the-fast": a_what_breaks_the_fast as unknown as PreparedFile,
  "zakat-gold": a_zakat_gold as unknown as PreparedFile,
  "zakat-savings": a_zakat_savings as unknown as PreparedFile,
};
