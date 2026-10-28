import { randomBytes } from "node:crypto";
import { researchOwners } from "./search-engine/job-owner";
import { createContinuationSession, engineIdentity, readContinuationSession, ResearchSessionStop } from "./continuation-session";
/** A versioned private record is the question/checkpoint, approval state and its
 * original cumulative dispatch/receipt ledger together, never a separate resettable budget. */
export type ResearchRecord = import("./continuation-session").ContinuationSession & { researchVersion:1; owner:string; simple:true };

import type { Locale } from "@/lib/i18n";

const owners = researchOwners(randomBytes(32).toString("base64"));
export const PRIVATE_RESEARCH_COOKIE = "bayan_ask_session_v1";
export const normalizedResearchText = (text: string) => text.normalize("NFC").replace(/\s+/gu, " ").trim();
type RecordIndex = { token: string; owner: string; language: Locale; expires: number; version: 1 };
const records = new Map<string, RecordIndex>();

export function privateResearchOwner(cookieHeader: string | null) {
  const existing = cookieHeader?.split(";").map(s => s.trim()).find(s => s.startsWith(`${PRIVATE_RESEARCH_COOKIE}=`))?.slice(PRIVATE_RESEARCH_COOKIE.length + 1);
  const cookie = existing && owners.anonymous(existing) ? existing : owners.mint();
  return { owner: owners.anonymous(cookie)!, cookie: `${PRIVATE_RESEARCH_COOKIE}=${cookie}; HttpOnly; SameSite=Lax; Path=/` };
}

/** Process-local owner-only index. No raw questions or source text in keys/logs. */
export function privateResearch(owner: string, question: string, language: Locale, history: string[], now = Date.now()) {
  for (const [key, record] of records) {
    try {
      const session = readContinuationSession(record.token, record.language, now);
      record.expires = session.expires;
      if (session.active || session.expires > now) continue;
    } catch { /* An idle expired or incompatible record cannot be reused. */ }
    records.delete(key);
  }
  const key = owners.request({ version: 1, owner, question: normalizedResearchText(question), language,
    history: history.map(normalizedResearchText), policy: engineIdentity() });
  const prior = records.get(key);
  if (prior) {
    try {
      const session = readContinuationSession(prior.token, language, now);
      if (session.owner !== owner) throw new ResearchSessionStop("expired");
      if (session.held || [...session.attempts.values()].some(a => a.state === "reserved" && a.callerStopped)) throw new ResearchSessionStop("billing_uncertain");
      if (session.active) return { token: prior.token, session, mode: "busy" as const };
      if ([...session.attempts.values()].some(a => a.state === "reserved")) throw new ResearchSessionStop("billing_uncertain");
      if (!session.cancelled) return { token: prior.token, session, mode: session.complete && session.checkpoint.simple?.approved ? "approved" as const : session.complete || session.checkpoint.simple?.terminalNegative ? "negative" as const : "resume" as const };
    } catch (error) { if (error instanceof ResearchSessionStop && error.code === "billing_uncertain") throw error; }
    records.delete(key);
  }
  if (records.size >= 16) throw new ResearchSessionStop("limit");
  const created = createContinuationSession(question, language, history, now, 3, { owner, simple: true });
  records.set(key, { token: created.token, owner, language, expires: now + 20 * 60_000, version: 1 });
  return { ...created, mode: "new" as const };
}
