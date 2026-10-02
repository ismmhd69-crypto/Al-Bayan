// Which hadith source Ask uses. One source at a time, never both:
//   HADITH_SOURCE=library     the stored Sahih al-Bukhari / Sahih Muslim hadith in our own database
//   HADITH_SOURCE=hadeethenc  the old live HadeethEnc path (kept as a fallback)
//   anything else / unset     hadith off
export type HadithMode = "library" | "hadeethenc" | "off";

export function hadithMode(value: string | undefined = process.env.HADITH_SOURCE): HadithMode {
  return value === "library" || value === "hadeethenc" ? value : "off";
}
