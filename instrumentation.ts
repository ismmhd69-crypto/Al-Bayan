// Runs once when a server instance starts (Next.js instrumentation hook).
// With hadith switched on, start downloading HadeethEnc's title lists in the background, so the
// first visitor's question does not wait for them. Not awaited: the server starts immediately.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.HADITH_SOURCE !== "hadeethenc") return;
  const { warmHadithCatalogues } = await import("./lib/sources/hadith");
  warmHadithCatalogues();
}
