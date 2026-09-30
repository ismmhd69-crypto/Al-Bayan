import { loadEnvConfig } from "@next/env";
import type { ReviewKind } from "../lib/content";
import type { PreparedFile } from "../lib/prepared";
import {
  PREPARED_EXPECTED_LIST_LENGTHS,
  PREPARED_EXPECTED_SOURCES,
  PREPARED_FORBIDDEN_SOURCES,
  PREPARED_REQUIRED_TEXT,
} from "../data/prepared-answer-expectations";

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
  auditIssues: string[];
};

const normalized = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function contentIssues(id: string, file: PreparedFile, cited: Set<string>): string[] {
  const issues: string[] = [];
  const expected = PREPARED_EXPECTED_SOURCES[id];
  if (!expected) issues.push("missing_expectation");
  else {
    const actual = [...cited].sort();
    const wanted = [...expected].sort();
    if (actual.join("|") !== wanted.join("|")) issues.push(`source_baseline:${actual.join(",")}`);
  }
  for (const sourceId of PREPARED_FORBIDDEN_SOURCES[id] ?? []) {
    if (cited.has(sourceId)) issues.push(`misleading_source:${sourceId}`);
  }
  const declared = file.sources.map((source) => source.id);
  if (new Set(declared).size !== declared.length) issues.push("duplicate_declared_source");
  for (const sourceId of declared) if (!cited.has(sourceId)) issues.push(`unused_source:${sourceId}`);
  for (const sourceId of cited) if (!declared.includes(sourceId)) issues.push(`undeclared_source:${sourceId}`);

  for (const language of ["ar", "en", "de"] as const) {
    const answer = file.answers[language];
    if (!answer) {
      issues.push(`missing_language:${language}`);
      continue;
    }
    const items = [
      ...answer.direct_answer,
      ...(answer.list ?? []),
      ...answer.explanation.flatMap((section) => section.sentences),
    ];
    if (items.some((item) => !/^R[1-4]$/.test(item.requirement_id ?? ""))) issues.push(`implicit_requirement:${language}`);
    const seen = new Set<string>();
    for (const item of items) {
      const value = normalized(item.text);
      if (seen.has(value)) issues.push(`duplicate_claim:${language}`);
      seen.add(value);
    }
    const expectedList = PREPARED_EXPECTED_LIST_LENGTHS[id];
    if (expectedList !== undefined && (answer.list?.length ?? 0) !== expectedList) issues.push(`list_length:${language}`);
    const fullText = normalized([...answer.direct_answer, ...(answer.list ?? [])].map((item) => item.text).join(" "));
    for (const phrase of PREPARED_REQUIRED_TEXT[id]?.[language] ?? []) {
      if (!fullText.includes(normalized(phrase))) issues.push(`missing_text:${language}:${phrase}`);
    }
  }
  return [...new Set(issues)];
}

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
      auditIssues: contentIssues(id, file, cited),
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
  const auditPassing = rows.filter((row) => row.auditIssues.length === 0);
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    totals: {
      files: rows.length,
      common: rows.filter((row) => row.kind === "prepared").length,
      topics: rows.filter((row) => row.kind === "topic").length,
      passAllLanguages: passing.length,
      failAnyLanguage: rows.length - passing.length,
      passContentAudit: auditPassing.length,
      failContentAudit: rows.length - auditPassing.length,
      matchingApprovals: rows.filter((row) => row.approvalMatches).length,
    },
    rows,
  }, null, 2));
  if (process.argv.includes("--strict") && (passing.length !== rows.length || auditPassing.length !== rows.length)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "prepared dry run failed");
  process.exitCode = 1;
});
