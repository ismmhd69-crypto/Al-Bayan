import type { ResearchJobStore } from "@/lib/ask/search-engine/job-store";
import { parseUserHistory } from "@/lib/ask/conversation";
type Page = Awaited<ReturnType<ResearchJobStore["exportAccount"]>>;
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const date = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
export async function exportResearchRequests(token: string, send: Transport = (url, init) => fetch(url, init)) {
  const jobs: Page["jobs"] = [], seen = new Set<string>(); let after: string | undefined, asOf: string | undefined;
  for (let n = 0; n < 50; n++) {
    const response = await send("/api/account/research/export", { method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...(after ? { after } : {}), ...(asOf ? { asOf } : {}) }) });
    if (!response.ok) throw new Error("research_export_unavailable");
    const page = await response.json();
    if (page?.version === 1 && page.status === "not_enabled" && n === 0) return { status: "not_enabled" as const, jobs: [] };
    if (!page || page.version !== 1 || page.status !== "export" || page.scope !== "account_retained_user_requests" || !date(page.asOf)
      || asOf && Date.parse(page.asOf) !== Date.parse(asOf) || !Array.isArray(page.jobs) || page.jobs.length > 10
      || !(page.next === null || typeof page.next === "string" && UUID.test(page.next))) throw new Error("invalid_research_export");
    asOf = page.asOf;
    let previous = after ?? "";
    for (const row of page.jobs) {
      if (!row || typeof row.id !== "string" || !UUID.test(row.id) || seen.has(row.id) || row.id <= previous
        || !["en", "ar", "de"].includes(row.language) || !["queued", "running", "complete", "incomplete", "cancelled", "failed", "reconciliation_required", "expired"].includes(row.state)
        || typeof row.question !== "string" || !row.question.trim() || row.question.length > 500 || !parseUserHistory(row.previousUserMessages)
        || !date(row.createdAt) || !date(row.expiresAt)) throw new Error("invalid_research_export");
      previous = row.id; seen.add(row.id); jobs.push({ id: row.id, state: row.state, language: row.language, createdAt: row.createdAt, expiresAt: row.expiresAt,
        question: row.question, previousUserMessages: row.previousUserMessages });
    }
    if (page.next === null) return { status: "included" as const, scope: "retained_user_requests_only" as const, asOf, jobs };
    if (!page.jobs.length || page.next !== page.jobs.at(-1).id || page.next <= (after ?? "")) throw new Error("invalid_research_export");
    after = page.next;
  }
  throw new Error("research_export_page_limit");
}
