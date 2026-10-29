import { getChapter, getChapters, getChapterVerses } from "@/lib/quran/service";
import {
  getHadithCollections,
  getCollection,
  getCollectionBooks,
  getBook,
  getHadithByReference,
  getAdjacentHadiths,
} from "@/lib/hadith/service";

async function measure<T>(name: string, fn: () => Promise<T>): Promise<{ name: string; durationMs: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);
  return { name, durationMs, result };
}

async function run() {
  console.log("=== Profiling Server-Side Data Operations (Before Changes) ===");

  // 1. Quran operations
  console.log("\n--- Quran Routes ---");
  const q1 = await measure("Quran getChapters (114 chapters)", () => getChapters("en"));
  console.log(`1. getChapters: ${q1.durationMs}ms (${q1.result.length} chapters)`);

  const q2 = await measure("Quran getChapter 1 (Al-Fatihah)", () => getChapter(1, "en"));
  console.log(`2. getChapter(1): ${q2.durationMs}ms`);

  const q3 = await measure("Quran getChapterVerses 1 (page 1, 30 verses)", () => getChapterVerses(1, { page: 1, perPage: 30 }));
  console.log(`3. getChapterVerses(1): ${q3.durationMs}ms (${q3.result.verses.length} verses)`);

  const q4 = await measure("Quran getChapter 2 (Al-Baqarah)", () => getChapter(2, "en"));
  console.log(`4. getChapter(2): ${q4.durationMs}ms`);

  const q5 = await measure("Quran getChapterVerses 2 (page 1, 30 verses)", () => getChapterVerses(2, { page: 1, perPage: 30 }));
  console.log(`5. getChapterVerses(2): ${q5.durationMs}ms (${q5.result.verses.length} verses)`);

  // 2. Hadith operations
  console.log("\n--- Hadith Routes ---");
  const h1 = await measure("Hadith getHadithCollections", () => getHadithCollections());
  console.log(`1. getHadithCollections: ${h1.durationMs}ms (${h1.result.length} collections)`);

  const h2 = await measure("Hadith getCollection('muslim')", () => getCollection("muslim"));
  console.log(`2. getCollection('muslim'): ${h2.durationMs}ms`);

  const h3 = await measure("Hadith getCollectionBooks('muslim')", () => getCollectionBooks("muslim"));
  console.log(`3. getCollectionBooks('muslim'): ${h3.durationMs}ms (${h3.result.length} books)`);

  const h4 = await measure("Hadith getHadithByReference('bukhari', '1')", () => getHadithByReference("bukhari", "1"));
  console.log(`4. getHadithByReference('bukhari', '1'): ${h4.durationMs}ms (hadith #${h4.result?.hadithNumber})`);

  if (h4.result) {
    const h5 = await measure("Hadith getAdjacentHadiths('bukhari', hadith 1)", () => getAdjacentHadiths("bukhari", h4.result!));
    console.log(`5. getAdjacentHadiths('bukhari', hadith 1): ${h5.durationMs}ms (prev: ${h5.result.prev}, next: ${h5.result.next})`);
  }

  const h6 = await measure("Hadith getHadithByReference('muslim', '8a')", () => getHadithByReference("muslim", "8a"));
  console.log(`6. getHadithByReference('muslim', '8a'): ${h6.durationMs}ms (hadith #${h6.result?.hadithNumber})`);

  if (h6.result) {
    const h7 = await measure("Hadith getAdjacentHadiths('muslim', hadith 8a)", () => getAdjacentHadiths("muslim", h6.result!));
    console.log(`7. getAdjacentHadiths('muslim', hadith 8a): ${h7.durationMs}ms (prev: ${h7.result.prev}, next: ${h7.result.next})`);
  }
}

run().catch((err) => {
  console.error("Profiling failed:", err);
  process.exit(1);
});
