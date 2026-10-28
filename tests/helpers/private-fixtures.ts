import { existsSync } from "node:fs";

/** Private saved traces are copied here so the rotating local trace folder can never
 * delete them. The folder is git-ignored with the rest of work/private-ask-evaluation. */
export const FROZEN_TRACE_DIR = "work/private-ask-evaluation/frozen-traces";
const LEGACY_TRACE_DIR = "work/local-ask-traces";

/** Acceptance runs set ASK_REQUIRE_PRIVATE_FIXTURES=true: a missing private input then
 * fails the test file loudly instead of skipping. Ordinary runs skip with a visible reason. */
export const requirePrivateFixtures = () => process.env.ASK_REQUIRE_PRIVATE_FIXTURES === "true";

export type PrivateFixture = { available: boolean; path: string; note: string };

export function privateFile(path: string, label = path): PrivateFixture {
  const available = existsSync(path);
  if (!available && requirePrivateFixtures()) throw new Error(`Required private fixture missing: ${label}`);
  return { available, path, note: available ? "" : ` [skipped: private fixture ${label} is missing]` };
}

/** A saved request trace by id: the frozen copy first, then the old rotating folder. */
export function privateTrace(requestId: string): PrivateFixture {
  const frozen = `${FROZEN_TRACE_DIR}/${requestId}.jsonl`;
  if (existsSync(frozen)) return { available: true, path: frozen, note: "" };
  return privateFile(`${LEGACY_TRACE_DIR}/${requestId}.jsonl`, `trace ${requestId}`);
}
