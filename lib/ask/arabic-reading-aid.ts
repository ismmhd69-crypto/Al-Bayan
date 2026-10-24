/** Machine-reading compatibility aid only. Never store, display, quote, or use
 * this as citation proof. Keep the exact original alongside it. Deliberately
 * preserve hamza, dagger alif and small letters: dropping them changes letters. */
export function arabicReadingAid(original: string): string {
  return original.normalize("NFC")
    .replace(/\u0671/gu, "ا")
    .replace(/[\u0640\u064b-\u0652\u06d6-\u06dc\u06df]/gu, "");
}
