// Researched topic answers (Gemini drafts, reviewed and approved by Mo on the local review page).
// Generated list: add a line when a new answer file is added.
import type { PreparedFile } from "@/lib/prepared";

import doubt from "./doubt.json";
import evolution from "./evolution.json";
import faith_reason from "./faith-reason.json";
import hadith_late from "./hadith-late.json";
import inheritance from "./inheritance.json";
import never_heard from "./never-heard.json";
import purpose from "./purpose.json";
import quran_preserved from "./quran-preserved.json";
import suffering from "./suffering.json";
import sword from "./sword.json";
import who_created from "./who-created.json";
import women_spiritual from "./women-spiritual.json";

export const TOPIC_ANSWERS: Record<string, PreparedFile> = {
  "doubt": doubt as unknown as PreparedFile,
  "evolution": evolution as unknown as PreparedFile,
  "faith-reason": faith_reason as unknown as PreparedFile,
  "hadith-late": hadith_late as unknown as PreparedFile,
  "inheritance": inheritance as unknown as PreparedFile,
  "never-heard": never_heard as unknown as PreparedFile,
  "purpose": purpose as unknown as PreparedFile,
  "quran-preserved": quran_preserved as unknown as PreparedFile,
  "suffering": suffering as unknown as PreparedFile,
  "sword": sword as unknown as PreparedFile,
  "who-created": who_created as unknown as PreparedFile,
  "women-spiritual": women_spiritual as unknown as PreparedFile,
};
