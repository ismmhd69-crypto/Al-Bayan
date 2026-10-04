import fs from "fs";
import { HadithExportItem } from "./export-hadith-for-marking";
import { HadithMark } from "./validate-hadith-marks";

// U+200F straight double quote U+200F
export const QUOTE_MARK = "\u200F\"\u200F";

// Clean diacritics for pattern checking
export function stripHarakat(text: string): string {
  return text.replace(/[\u064B-\u0652\u0670\u0640\u06DF-\u06E8]/g, "");
}

// Check if text is a continuation / bare reference hadith
export function checkReferenceOnly(text: string): boolean {
  const clean = stripHarakat(text).trim();
  // Very short hadiths that just point back
  if (clean.length < 180) {
    if (/^(?:وَمِثْلَهُ|مِثْلَهُ|بِمِثْلِهِ|نَحْوَهُ|بِنَحْوِهِ|بِمَعْنَاهُ)$/.test(clean)) return true;
    if (/بِمِثْلِ حَدِيثِ|بِنَحْوِ حَدِيثِ|بِمَعْنَى حَدِيثِ|بِهَذَا الإِسْنَادِ مِثْلَهُ|بِهَذَا الإِسْنَادِ نَحْوَهُ|نَحْوَ حَدِيثِهِ|مِثْلَ حَدِيثِهِ/.test(clean)) {
      return true;
    }
    if (/عَنِ النَّبِيِّ صلى الله عليه وسلم بِمِثْلِهِ|عَنِ النَّبِيِّ صلى الله عليه وسلم بِنَحْوِهِ|عَنِ النَّبِيِّ صلى الله عليه وسلم نَحْوَهُ|عَنِ النَّبِيِّ صلى الله عليه وسلم مِثْلَهُ/.test(clean)) {
      return true;
    }
  }
  return false;
}
