import { randomUUID } from "node:crypto";
import { sameOrigin } from "@/lib/same-origin";
import { parseUserHistory, MAX_ASK_BODY_BYTES } from "@/lib/ask/conversation";
import { isLocale } from "@/lib/i18n";
import { abortable } from "@/lib/ask/abort";
import { RESEARCH_COOKIE, researchOwners } from "./job-owner";
import { ResearchStorageError, type ResearchJobStore } from "./job-store";
import { verifyResearchJob, type JobFreshnessDeps } from "./job-freshness";
import { refreshRelatedVideos } from "@/lib/ask/related-videos";
import type { RichAnswer } from "@/lib/ask/rich-answer";

export type ResearchAction = "session" | "start" | "read" | "cancel" | "find";
export type JobApiDeps = {
  owners: ReturnType<typeof researchOwners>;
  store: Pick<
    ResearchJobStore,
    "enqueue" | "read" | "cancel" | "find" | "cancelSubmission"
  >;
  freshness: JobFreshnessDeps;
  verifyUser(token: string): Promise<string | null>;
  engineRevision: string;
  maxCostUsd: number;
  streaming?: boolean;
};
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
  "Content-Type": "application/json",
};
const reply = (body: object, code = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status: code,
    headers: { ...headers, ...extra },
  });
function cookie(request: Request) {
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.startsWith(`${RESEARCH_COOKIE}=`));
  return matches.length === 1
    ? matches[0].slice(RESEARCH_COOKIE.length + 1)
    : undefined;
}
async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_ASK_BODY_BYTES)
    throw new Error("too_long");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("bad_request");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > MAX_ASK_BODY_BYTES) {
        await reader.cancel();
        throw new Error("too_long");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("bad_request");
  return value;
}

/** Thin HTTP contract. Reads never call a model; only start may enqueue, with an idempotency key.
 * Losing a browser connection does not cancel the stored job. Stop uses its own owned action. */
export async function handleResearchJob(
  request: Request,
  action: ResearchAction,
  deps: JobApiDeps,
): Promise<Response> {
  if (!sameOrigin(request)) return reply({ status: "forbidden" }, 403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return reply({ status: "bad_request" }, 415);
  let body: Record<string, unknown>;
  try {
    body = await bodyJson(request);
  } catch (error) {
    const tooLong = error instanceof Error && error.message === "too_long";
    return reply(
      { status: tooLong ? "too_long" : "bad_request" },
      tooLong ? 413 : 400,
    );
  }
  try {
    let owner: string | null = null,
      minted: string | undefined, accountId: string | undefined;
    const authorization = request.headers.get("authorization");
    if (authorization) {
      if (!/^Bearer [^\s]{1,4096}$/.test(authorization))
        return reply({ status: "unauthorized" }, 401);
      const user = await deps.verifyUser(authorization.slice(7));
      if (!user) return reply({ status: "unauthorized" }, 401);
      owner = deps.owners.user(user);
      accountId = user;
    } else {
      owner = deps.owners.anonymous(cookie(request));
      if (!owner && action === "session") {
        minted = deps.owners.mint();
        owner = deps.owners.anonymous(minted);
      }
    }
    // Bootstrap must finish BEFORE any paid submission, so a lost enqueue response can be
    // recovered with the same signed cookie and key rather than a new anonymous owner.
    if (!owner) return reply({ status: "session_required" }, 401);
    const scope = deps.owners.scope(owner);
    if (action === "session") {
      const secure =
        new URL(request.url).protocol === "https:" ||
        process.env.NODE_ENV === "production";
      return reply(
        { version: 1, status: "ready", scope },
        200,
        minted
          ? {
              "Set-Cookie": `${RESEARCH_COOKIE}=${minted}; Path=/api/ask/jobs; HttpOnly; SameSite=Strict; Max-Age=86400${secure ? "; Secure" : ""}`,
            }
          : {},
      );
    }
    if (request.headers.get("x-bayan-research-scope") !== scope)
      return reply({ status: "scope_changed" }, 409);
    if (action === "start") {
      const key = request.headers.get("idempotency-key");
      if (
        !key ||
        !UUID.test(key) ||
        typeof body.question !== "string" ||
        !body.question.trim() ||
        body.question.length > 500 ||
        typeof body.lang !== "string" ||
        !isLocale(body.lang)
      )
        return reply({ status: "bad_request" }, 400);
      const history = parseUserHistory(body.previous_user_messages);
      if (!history) return reply({ status: "bad_request" }, 400);
      const input = {
        version: 1 as const,
        question: body.question.trim(),
        lang: body.lang,
        previous_user_messages: history,
        engineRevision: deps.engineRevision,
      };
      const job = await deps.store.enqueue({
        id: randomUUID(),
        owner,
        ...(accountId ? { accountId } : {}),
        rate: deps.owners.rate(request.headers.get("x-forwarded-for")),
        dedupe: deps.owners.dedupe(owner, key),
        requestHash: deps.owners.request(input),
        request: input,
        maxCostUsd: deps.maxCostUsd,
      });
      return reply({ version: 1, status: "job", ...job, scope }, 202);
    }
    if (action === "find") {
      if (typeof body.key !== "string" || !UUID.test(body.key))
        return reply({ status: "bad_request" }, 400);
      const job = await deps.store.find(
        owner,
        deps.owners.dedupe(owner, body.key),
      );
      // Only the verified owner receives their original question. No answer/source material is
      // returned until the separate read path revalidates it. Lookup never enqueues or pays.
      return reply({ version: 1, status: "job", ...job, scope });
    }
    if (action === "cancel" && typeof body.key === "string") {
      if (
        !UUID.test(body.key) ||
        typeof body.lang !== "string" ||
        !isLocale(body.lang)
      )
        return reply({ status: "bad_request" }, 400);
      const job = await deps.store.cancelSubmission(
        owner,
        deps.owners.rate(request.headers.get("x-forwarded-for")),
        deps.owners.dedupe(owner, body.key),
        body.lang,
        accountId,
      );
      return reply({ version: 1, status: "job", ...job, scope });
    }
    if (typeof body.id !== "string" || !UUID.test(body.id))
      return reply({ status: "bad_request" }, 400);
    if (action === "cancel") {
      const view = await deps.store.cancel(body.id, owner);
      // Never return unvalidated stored sections on the cancellation path.
      return reply({
        version: 1,
        status: "job",
        id: view.id,
        state: view.state,
        scope,
        sequence: view.sequence,
      });
    }
    const after = body.after ?? 0;
    if (!Number.isInteger(after) || Number(after) < 0 || Number(after) > 512)
      return reply({ status: "bad_request" }, 400);
    const view = await deps.store.read(body.id, owner, 0);
    if (Number(after) > view.sequence)
      return reply({ status: "bad_request" }, 400);
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(20_000),
    ]);
    const freshness = await abortable(
      verifyResearchJob(view, deps.freshness, signal),
      signal,
    );
    if (freshness !== "valid") {
      if (freshness === "changed")
        await deps.store.cancel(body.id, owner).catch(() => {});
      return reply(
        {
          status:
            freshness === "changed"
              ? "sources_changed"
              : "source_refresh_failed",
          withdraw: true,
          scope,
        },
        freshness === "changed" ? 409 : 503,
      );
    }
    // Optional learning clips are revalidated independently of the written evidence.
    for (const row of view.events) {
      const event = row.payload as { type?: string; result?: { status?: string; answer?: RichAnswer } };
      if (event.type === "terminal" && event.result?.status === "rich_answer" && event.result.answer?.version === 4 && event.result.answer.videos) {
        const fresh = await refreshRelatedVideos(event.result.answer.videos, deps.freshness.refreshVideos, signal);
        if (fresh) event.result.answer.videos = fresh; else delete event.result.answer.videos;
      }
    }
    const deliver =
      deps.streaming !== false || !["queued", "running"].includes(view.state);
    return reply({
      version: 1,
      status: "job",
      id: view.id,
      state: view.state,
      language: view.language,
      sequence: deliver ? view.sequence : Number(after),
      scope,
      expiresAt: view.expiresAt,
      events: deliver
        ? view.events
            .filter((e) => e.sequence > Number(after))
            .map((e) => e.payload)
        : [],
    });
  } catch (error) {
    if (error instanceof ResearchStorageError) {
      const code = error.code;
      return reply(
        { status: code },
        code === "not_found"
          ? 404
          : code === "expired"
            ? 410
            : code === "rate_limited"
              ? 429
              : code === "idempotency_conflict"
                ? 409
                : 503,
      );
    }
    return reply({ status: "research_unavailable" }, 503);
  }
}
