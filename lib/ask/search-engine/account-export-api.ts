import { sameOrigin } from "@/lib/same-origin";
import type { ResearchJobStore } from "./job-store";
import { abortable } from "../abort";

export type AccountResearchExportDeps = {
  enabled: boolean; verifyUser: (token: string) => Promise<string | null>;
  exportPage: ResearchJobStore["exportAccount"];
};
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization, Cookie" } });
export async function handleAccountResearchExport(request: Request, deps: AccountResearchExportDeps) {
  if (!sameOrigin(request)) return reply({ status: "forbidden" }, 403);
  const token = request.headers.get("authorization")?.match(/^Bearer (\S{20,4000})$/)?.[1];
  if (!token) return reply({ status: "unauthorized" }, 401);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ status: "bad_request" }, 415);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
  try {
    const reader = request.body?.getReader(); let text = "";
    if (reader) try {
      const decoder = new TextDecoder(); let bytes = 0;
      while (true) { const part = await abortable(reader.read(), signal); if (part.done) break;
        bytes += part.value.byteLength; if (bytes > 500) return reply({ status: "bad_request" }, 413);
        text += decoder.decode(part.value, { stream: true }); }
      text += decoder.decode();
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    let body: { after?: string; asOf?: string };
    try { body = JSON.parse(text); } catch { return reply({ status: "bad_request" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => !["after", "asOf"].includes(k))
      || body.after !== undefined && (typeof body.after !== "string" || !UUID.test(body.after))
      || body.asOf !== undefined && (typeof body.asOf !== "string" || !Number.isFinite(Date.parse(body.asOf)))) return reply({ status: "bad_request" }, 400);
    const user = await abortable(deps.verifyUser(token), signal);
    if (!user || !UUID.test(user)) return reply({ status: "unauthorized" }, 401);
    if (!deps.enabled) return reply({ version: 1, status: "not_enabled" });
    const page = await abortable(deps.exportPage(user, body.after?.toLowerCase(), body.asOf), signal);
    return reply({ version: 1, status: "export", scope: "account_retained_user_requests", ...page });
  } catch { return reply({ status: "research_export_unavailable" }, 503); }
}
