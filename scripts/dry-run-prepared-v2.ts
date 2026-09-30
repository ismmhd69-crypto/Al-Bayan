import { loadEnvConfig } from "@next/env";
import type { ReviewKind } from "../lib/content";
import type { PreparedFile } from "../lib/prepared";

loadEnvConfig(process.cwd());

type Row = {
  kind: ReviewKind;
  id: string;
  contentHash: string;
  storedStatus: PreparedFile["status"];
  decisionStatus: string;
  approvalMatches: boolean;
  languages: Record<string, "pass" | string>;
  citedSources: number;
  declaredSources: number;
};

async function decisions(kind: ReviewKind) {
  const { getReviewDecisions } = await import("../lib/content");
  try { return await getReviewDecisions(kind); } catch { return {}; }
}

async function inspect(kind: ReviewKind, files: Record<string, PreparedFile>): Promise<Row[]> {
  const { locales } = await import("../lib/i18n");
  const { loadPrepared, preparedContentHash } = await import("../lib/prepared");
  const review = await decisions(kind);
  const rows: Row[] = [];
  for (const [id, file] of Object.entries(files)) {
    const contentHash = preparedContentHash(file);
    const languages: Row["languages"] = {};
    for (const language of locales) {
      let reason = "source_load_failed";
      const answer = await loadPrepared(file, language, { allowDraft: true, onFailure: (value) => { reason = value; } });
      languages[language] = answer?.v2 ? "pass" : reason;
    }
    const cited = new Set(Object.values(file.answers).flatMap((answer) => [
      ...answer.direct_answer,
      ...(answer.list ?? []),
      ...(answer.explanation ?? []).flatMap((section) => section.sentences),
    ]).flatMap((sentence) => sentence.source_ids));
    rows.push({
      kind,
      id,
      contentHash,
      storedStatus: file.status,
      decisionStatus: review[id]?.status ?? "draft",
      approvalMatches: review[id]?.status === "approved" && review[id]?.contentHash === contentHash,
      languages,
      citedSources: cited.size,
      declaredSources: file.sources.length,
    });
  }
  return rows;
}

async function main() {
  const [{ PREPARED_ANSWERS }, { TOPIC_ANSWERS }] = await Promise.all([
    import("../data/prepared-answers"),
    import("../data/topic-answers"),
  ]);
  const rows = [
    ...await inspect("prepared", PREPARED_ANSWERS),
    ...await inspect("topic", TOPIC_ANSWERS),
  ];
  const passing = rows.filter((row) => Object.values(row.languages).every((result) => result === "pass"));
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    totals: {
      files: rows.length,
      common: rows.filter((row) => row.kind === "prepared").length,
      topics: rows.filter((row) => row.kind === "topic").length,
      passAllLanguages: passing.length,
      failAnyLanguage: rows.length - passing.length,
      matchingApprovals: rows.filter((row) => row.approvalMatches).length,
    },
    rows,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "prepared dry run failed");
  process.exitCode = 1;
});
