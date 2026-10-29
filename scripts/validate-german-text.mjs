const AR = /[\u0600-\u06ff]/;
const strip = (s) => s.replace(/[ً-ٰٟـ‏‎]/g, "");
const arDigits = (s) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export function validateGerman(source, deText) {
  const errs = [];
  if (!deText || !deText.trim()) {
    errs.push('Translation is empty');
    return errs;
  }
  const t = deText.trim();
  if (AR.test(t)) {
    errs.push('Contains Arabic script');
  }
  if (/\[quran|\]\{|\{\s*‏|\[\/?quran/i.test(t)) {
    errs.push('Leftover quran tag');
  }
  const orig = source.text_original || source.arabic || '';
  const nums = arDigits(orig).match(/\d+/g) ?? [];
  for (const n of nums) {
    if (!new RegExp("(^|[^0-9])" + n + "([^0-9]|$)").test(t)) {
      errs.push(`Number ${n} missing in translation`);
    }
  }
  const ratio = t.length / Math.max(1, strip(orig).length);
  if (ratio < 0.5 || ratio > 4.0) {
    errs.push(`Length ratio ${ratio.toFixed(2)} outside bounds (0.5 - 4.0)`);
  }
  // Ascii umlauts check
  if (/\b[a-z]*(?:ae|oe|ue)[a-z]*\b/i.test(t) && !/[äöüß]/i.test(t) && t.length > 60) {
    errs.push('No umlauts found with possible ascii replacements');
  }
  return errs;
}
