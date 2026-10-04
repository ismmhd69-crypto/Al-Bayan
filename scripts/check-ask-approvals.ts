// Read-only diagnostic. Never calls a model and never writes review decisions.
process.loadEnvFile(".env");
try { process.loadEnvFile(".env.local"); } catch { /* optional */ }
async function main() {
  const [{ getReviewDecisions, getTopics }, { TOPIC_ANSWERS }, { PREPARED_ANSWERS }, { preparedContentHash }] = await Promise.all([
    import("@/lib/content"), import("@/data/topic-answers"), import("@/data/prepared-answers"), import("@/lib/prepared-v2"),
  ]);
  for (const [kind, files] of [["topic", TOPIC_ANSWERS], ["prepared", PREPARED_ANSWERS]] as const) {
    const reviews = await getReviewDecisions(kind);
    const rows = Object.entries(files).map(([id, file]) => ({ id, approved: reviews[id]?.status === "approved",
      hashMatches: reviews[id]?.contentHash === preparedContentHash(file) }));
    console.log(JSON.stringify({ kind, files: rows.length, approvedMatching: rows.filter((r) => r.approved && r.hashMatches).length,
      unavailable: rows.filter((r) => !r.approved || !r.hashMatches) }));
  }
  console.log(JSON.stringify({ topicQuestions: (await getTopics("en")).map(({ id, question }) => ({ id, question })) }));
}
main().catch(() => { console.error("read-only approval diagnostic failed"); process.exitCode = 1; });
