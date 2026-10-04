import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AskSpendStop } from "./ask-spend-guard";

export function sharedAskLedgerPath(): string {
  // A worktree must use the original checkout's ledger, never its copied tracked snapshot.
  const common = execFileSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim();
  const path = resolve(common, "..", "docs", "ask-repair-runs", "spend.json");
  if (!existsSync(path)) throw new AskSpendStop("original shared ledger is missing; no paid calls allowed");
  const ledger = JSON.parse(readFileSync(path, "utf8"));
  if (ledger.cap !== 1.5 || !Array.isArray(ledger.entries)) throw new AskSpendStop("shared spending ledger is invalid");
  return path;
}

export function applyAskTestProfile(libraryFlow: boolean) {
  for (const name of ["AI_MODELS", "AI_MODEL", "AI_FALLBACK_MODEL", "AI_VERIFIER_MODELS", "AI_VERIFIER_MODEL", "AI_VERIFIER_FALLBACK_MODEL", "AI_PROVIDER", "AI_VERIFIER_PROVIDER"]) delete process.env[name];
  Object.assign(process.env, {
    QURAN_API_ENV: "production", QURAN_CHAPTERS: "", HADITH_SOURCE: "library",
    ASK_CLAIM_AUDIT: "false", ASK_TIERED: "false", ASK_LEAN: "false", ASK_LIBRARY_FLOW: String(libraryFlow),
    OPENROUTER_REASONING: "low", OPENROUTER_PRIVACY: "zdr", PREPARED_PUBLISHING_ENABLED: "true",
    SCHOLAR_QUOTES: "on", SCHOLARS_LIVE: "on",
  });
}
