// Source id helpers shared by the package chooser and the AnswerV2 validator. No imports, so any
// module can use them without creating an import cycle.
//
// Internal ids: "Q2:255" (verse), "HE4196" (HadeethEnc hadith), "SH<uuid>" (stored library hadith),
// "S<uuid>" (scholar quote).

export const QURAN_ID = /^Q(\d{1,3}):(\d{1,3})$/;
export const HADITH_HE_ID = /^HE(\d+)$/;
export const HADITH_LIBRARY_ID = /^SH([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
/** Any hadith id: live HadeethEnc ("HE123") or stored library ("SH<uuid>"). */
export const isHadithId = (id: string) => HADITH_HE_ID.test(id) || HADITH_LIBRARY_ID.test(id);

/** [surah, verse] of an internal verse id, or null for any other id. */
export function versePosition(id: string): [number, number] | null {
  const match = id.match(QURAN_ID);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** Display form of an internal id: verses lose their "Q" ("Q2:255" to "2:255") in the view only. */
export const displaySourceId = (id: string) => (QURAN_ID.test(id) ? id.slice(1) : id);

/** Stable card id for consecutive verse ids ("Q2:183", "Q2:184") -> "quran-2-183-184". */
export function quranCardId(ids: readonly string[]): string {
  const parts = ids.map(versePosition);
  if (parts.length === 0 || parts.some((part) => !part)) return "";
  const [first, last] = [parts[0]!, parts[parts.length - 1]!];
  return parts.length === 1 ? `quran-${first[0]}-${first[1]}` : `quran-${first[0]}-${first[1]}-${last[1]}`;
}

/** Numeric Quran order first (so 2:3 comes before 2:255), then other ids by text. */
export function compareSourceIds(a: string, b: string): number {
  const [x, y] = [versePosition(a), versePosition(b)];
  if (x && y) return x[0] - y[0] || x[1] - y[1];
  if (x) return -1;
  if (y) return 1;
  return a.localeCompare(b);
}

/** Splits verse ids into runs of consecutive verses in one surah, each run in numeric order. */
export function consecutiveRuns(ids: readonly string[]): string[][] {
  const sorted = [...new Set(ids)].filter((id) => versePosition(id)).sort(compareSourceIds);
  const runs: string[][] = [];
  for (const id of sorted) {
    const run = runs[runs.length - 1];
    const [s, v] = versePosition(id)!;
    const previous = run ? versePosition(run[run.length - 1])! : null;
    if (previous && previous[0] === s && previous[1] + 1 === v) run.push(id);
    else runs.push([id]);
  }
  return runs;
}
