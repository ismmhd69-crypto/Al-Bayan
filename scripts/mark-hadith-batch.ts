import fs from "node:fs";
import path from "node:path";
import { fetchAllScopeHadith, getCompletedIds, HadithExportItem } from "./export-hadith-for-marking";
import { HadithMark, validateSingleMark } from "./validate-hadith-marks";

// Continuation and reference-only patterns
const CONTINUATION_PATTERNS = [
  /^(?:وَمِثْلَهُ|مِثْلَهُ|بِمِثْلِهِ|نَحْوَهُ|بِنَحْوِهِ|بِمَعْنَاهُ)/,
  /بِمِثْلِ حَدِيثِ/,
  /بِنَحْوِ حَدِيثِ/,
  /بِمَعْنَى حَدِيثِ/,
  /بِهَذَا الإِسْنَادِ مِثْلَهُ/,
  /بِهَذَا الإِسْنَادِ نَحْوَهُ/,
  /نَحْوَ حَدِيثِهِ/,
  /مِثْلَ حَدِيثِهِ/,
  /عَنْ أَبِي هُرَيْرَةَ، مِثْلَهُ/,
  /عَنْ عَائِشَةَ، مِثْلَهُ/,
  /عَنِ النَّبِيِّ صلى الله عليه وسلم بِمِثْلِهِ/,
  /عَنِ النَّبِيِّ صلى الله عليه وسلم بِنَحْوِهِ/,
];

function isReferenceOnly(text: string): boolean {
  // If the entire text or its tail after the chain is just a reference to another hadith without a standalone matn
  const norm = text.replace(/[\u064B-\u0652\u0670\u0640]/g, "").trim();
  if (/بِمِثْلِ حَدِيثِ|بِنَحْوِ حَدِيثِ|بِمَعْنَى حَدِيثِ|بِهَذَا الإِسْنَادِ مِثْلَهُ|بِهَذَا الإِسْنَادِ نَحْوَهُ/.test(norm)) {
    // Check if there are virtually no quoted words or long text
    const words = norm.split(/\s+/);
    if (words.length < 25) return true;
  }
  return false;
}

export function detectMatnStart(text: string): { start: string | null; kind: HadithMark["kind"] } {
  // We inspect text_original
  // Multiple chains? e.g., separated by " ح " or " حَدَّثَنَا ... ح وَحَدَّثَنَا"
  // Let's locate the last chain segment.
  return { start: null, kind: "unclear" };
}
