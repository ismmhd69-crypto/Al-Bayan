// Prepared answers to common questions (Gemini research, quotes checked by scripts/verify-quotes.ts,
// approved on the review tab). Add a line when a new answer file is added.
import type { PreparedFile } from "@/lib/prepared";

import a_celebrating_mawlid from "./celebrating-mawlid.json";
import a_congregational_prayer_men from "./congregational-prayer-men.json";
import a_dhikr_after_prayer from "./dhikr-after-prayer.json";
import a_divorce_basics from "./divorce-basics.json";
import a_fasting_sick_traveller from "./fasting-sick-traveller.json";
import a_friday_prayer from "./friday-prayer.json";
import a_greeting_non_muslims_holidays from "./greeting-non-muslims-holidays.json";
import a_halal_meat_people_of_the_book from "./halal-meat-people-of-the-book.json";
import a_how_to_become_muslim from "./how-to-become-muslim.json";
import a_how_to_pray_witr from "./how-to-pray-witr.json";
import a_how_to_pray from "./how-to-pray.json";
import a_how_to_repent from "./how-to-repent.json";
import a_how_to_wudu from "./how-to-wudu.json";
import a_is_hijab_obligatory from "./is-hijab-obligatory.json";
import a_is_interest_haram from "./is-interest-haram.json";
import a_is_music_haram from "./is-music-haram.json";
import a_is_smoking_haram from "./is-smoking-haram.json";
import a_marriage_muslim_woman_non_muslim from "./marriage-muslim-woman-non-muslim.json";
import a_missed_prayer from "./missed-prayer.json";
import a_pillars_of_iman from "./pillars-of-iman.json";
import a_praying_traveller from "./praying-traveller.json";
import a_rights_of_parents from "./rights-of-parents.json";
import a_steps_of_hajj from "./steps-of-hajj.json";
import a_visiting_graves_asking_dead from "./visiting-graves-asking-dead.json";
import a_what_breaks_the_fast from "./what-breaks-the-fast.json";
import a_what_breaks_wudu from "./what-breaks-wudu.json";
import a_what_is_shirk from "./what-is-shirk.json";
import a_zakat_al_fitr from "./zakat-al-fitr.json";
import a_zakat_gold from "./zakat-gold.json";
import a_zakat_savings from "./zakat-savings.json";

export const PREPARED_ANSWERS: Record<string, PreparedFile> = {
  "celebrating-mawlid": a_celebrating_mawlid as unknown as PreparedFile,
  "congregational-prayer-men": a_congregational_prayer_men as unknown as PreparedFile,
  "dhikr-after-prayer": a_dhikr_after_prayer as unknown as PreparedFile,
  "divorce-basics": a_divorce_basics as unknown as PreparedFile,
  "fasting-sick-traveller": a_fasting_sick_traveller as unknown as PreparedFile,
  "friday-prayer": a_friday_prayer as unknown as PreparedFile,
  "greeting-non-muslims-holidays": a_greeting_non_muslims_holidays as unknown as PreparedFile,
  "halal-meat-people-of-the-book": a_halal_meat_people_of_the_book as unknown as PreparedFile,
  "how-to-become-muslim": a_how_to_become_muslim as unknown as PreparedFile,
  "how-to-pray-witr": a_how_to_pray_witr as unknown as PreparedFile,
  "how-to-pray": a_how_to_pray as unknown as PreparedFile,
  "how-to-repent": a_how_to_repent as unknown as PreparedFile,
  "how-to-wudu": a_how_to_wudu as unknown as PreparedFile,
  "is-hijab-obligatory": a_is_hijab_obligatory as unknown as PreparedFile,
  "is-interest-haram": a_is_interest_haram as unknown as PreparedFile,
  "is-music-haram": a_is_music_haram as unknown as PreparedFile,
  "is-smoking-haram": a_is_smoking_haram as unknown as PreparedFile,
  "marriage-muslim-woman-non-muslim": a_marriage_muslim_woman_non_muslim as unknown as PreparedFile,
  "missed-prayer": a_missed_prayer as unknown as PreparedFile,
  "pillars-of-iman": a_pillars_of_iman as unknown as PreparedFile,
  "praying-traveller": a_praying_traveller as unknown as PreparedFile,
  "rights-of-parents": a_rights_of_parents as unknown as PreparedFile,
  "steps-of-hajj": a_steps_of_hajj as unknown as PreparedFile,
  "visiting-graves-asking-dead": a_visiting_graves_asking_dead as unknown as PreparedFile,
  "what-breaks-the-fast": a_what_breaks_the_fast as unknown as PreparedFile,
  "what-breaks-wudu": a_what_breaks_wudu as unknown as PreparedFile,
  "what-is-shirk": a_what_is_shirk as unknown as PreparedFile,
  "zakat-al-fitr": a_zakat_al_fitr as unknown as PreparedFile,
  "zakat-gold": a_zakat_gold as unknown as PreparedFile,
  "zakat-savings": a_zakat_savings as unknown as PreparedFile,
};
