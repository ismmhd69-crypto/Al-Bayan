import { recordLocalAskEvent } from "@/lib/ask/local-trace";
import { randomUUID, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ask } from "@/lib/ask/pipeline";
import { privateResearchOwner, privateResearch } from "@/lib/ask/private-research";
import { askSimplePipeline } from "@/lib/ask/settings";
import { askRich, askStreaming, askClaimAudit, askTiered, askLibraryFlow, localAskUnhurried } from "@/lib/ask/settings";
import { diagnosticLogger } from "@/lib/ask/diagnostics";
import { askEnabled, takeSlot, visitorKey, withSlot } from "@/lib/ask/limits";
import { sameOrigin } from "@/lib/same-origin";
import { isLocale } from "@/lib/i18n";
import { parseUserHistory, MAX_ASK_BODY_BYTES } from "@/lib/ask/conversation";
import { withAskRequest } from "@/lib/ask/trace-context";
import { RICH_ORDER, type RichCallbacks, type RichEvent, type RichSection, type RichGroup } from "@/lib/ask/rich-answer";
import { askTimeout } from "@/lib/ask/timing";
import { withResearchCancellation, withResearchRuntime } from "@/lib/ask/research-runtime";
import { emptyPublication, reducePublication, type PublicationEvent } from "@/lib/ask/publication";
import { abortable } from "@/lib/ask/abort";
import { researchFailure } from "@/lib/ask/research-failure";
import { withModelTransport } from "@/lib/ai/transport";
import { CONTINUATION_LIMITS, createContinuationSession, claimContinuationSession, continuationAvailable, continuationTransport, finishContinuationSession, readContinuationSession, reconcileContinuationReceipts, ResearchSessionStop, type ContinuationSession } from "@/lib/ask/continuation-session";

export const maxDuration = 60;
export async function POST(request: Request) {
  const started = Date.now(), requestId = randomUUID();
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Ask-Request-Id": requestId };
  // Fixed codes and numbers only (lib/ask/diagnostics.ts). No question, prompt or source text.
  const log = diagnosticLogger(process.env.ASK_DEBUG === "true", { requestId, revision: process.env.VERCEL_GIT_COMMIT_SHA, writerChain: "unknown", verifierChain: "unknown",
    claimAudit: askClaimAudit(), tiered: askTiered(), lean: process.env.ASK_LEAN === "true", libraryFlow: askLibraryFlow(), rich: true }, line => console.info(line));
  const reply = (status: string, code = 200) => NextResponse.json({ status }, { status: code, headers });
  if (!sameOrigin(request)) return reply("forbidden", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply("bad_request", 415);
  if (!askEnabled() || !askRich()) return reply("not_ready", 404);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_ASK_BODY_BYTES) return reply("too_long", 413);
  let body: Record<string, unknown>;
  try { const text = await request.text(); if (new TextEncoder().encode(text).length > MAX_ASK_BODY_BYTES) return reply("too_long", 413); body = JSON.parse(text); }
  catch { return reply("bad_request", 400); }
  if (!body || typeof body.lang !== "string" || !isLocale(body.lang)) return reply("bad_request", 400);
  // Stop and status never start research, so they never use a visitor's request allowance and are
  // never refused because the site is busy. They still require the owner's session below.
  const control = body.continue_token !== undefined && (body.action === "stop" || body.action === "status");
  if (!control) {
    const slot = takeSlot(visitorKey(request.headers.get("x-forwarded-for")));
    if (slot !== "ok") return reply("rate_limited", 429);
  }
  const stable = body.stream_version === 3;
  const progressive = stable || body.stream_version === 2;
  const identity = privateResearchOwner(request.headers.get("cookie"));
  const simple = stable && body.lang !== "de" && askSimplePipeline();
  if (simple) headers["X-Ask-Pipeline"] = "simple-v1";
  if (simple) headers["Set-Cookie"] = identity.cookie + (new URL(request.url).protocol === "https:" ? "; Secure" : "");
  let session: ContinuationSession | undefined, token: string | undefined;
  if (body.continue_token !== undefined) {
    if (!progressive || typeof body.continue_token !== "string") return reply("bad_request", 400);
    token = body.continue_token;
    try { const prior = readContinuationSession(token, body.lang); if (prior.protocol !== (stable ? 3 : 2) || prior.owner && prior.owner !== identity.owner) return reply("research_expired", 409); }
    catch { return reply("research_expired", 409); }
    if (body.action === "stop") {
      const current = readContinuationSession(token, body.lang);
      current.cancelled = true; current.stop?.();
      return reply("research_cancelled");
    }
    if (body.action === "status") {
      try {
        const current = readContinuationSession(token, body.lang);
        if (process.env.OPENROUTER_API_KEY) await reconcileContinuationReceipts(current, process.env.OPENROUTER_API_KEY);
        const pending = [...current.attempts.values()].some(a => a.state === "reserved");
        // A finished, approved simple answer can be reused by asking the same question again,
        // which rechecks every original first. The answer itself is never returned from here.
        const approved = !current.active && current.complete && !!current.checkpoint.simple?.approved;
        return NextResponse.json({ status: "research_status", continuation: { token, remaining: Math.max(0, CONTINUATION_LIMITS.continuations + 1 - current.runs), expires: current.expires,
          available: !current.active && continuationAvailable(current), ...(approved ? { approved: true } : {}), ...(current.held || pending ? { reason: "billing_uncertain" } : current.active ? { reason: "busy" } : current.cancelled ? { reason: "cancelled" } : !continuationAvailable(current) ? { reason: "limit" } : {}) } }, { headers });
      } catch (error) { return reply(error instanceof ResearchSessionStop ? `research_${error.code}` : "research_expired", 409); }
    }
    try { session = claimContinuationSession(token, body.lang); }
    catch (error) { return reply(error instanceof ResearchSessionStop ? `research_${error.code}` : "research_expired", 409); }
  } else {
    if (typeof body.question !== "string" || !body.question.trim()) return reply("bad_request", 400);
    if (body.question.length > 500) return reply("too_long", 413);
    const history = parseUserHistory(body.previous_user_messages); if (!history) return reply("bad_request", 400);
    if (progressive) try {
      const created = simple ? privateResearch(identity.owner, body.question.trim(), body.lang, history)
        : createContinuationSession(body.question.trim(), body.lang, history, undefined, stable ? 3 : 2);
      token = created.token;
      // A reuse request only replays an approved answer after rechecking its sources. It never starts or resumes paid research.
      if (body.reuse_only === true && !("mode" in created && created.mode === "approved")) return reply("research_expired", 409);
      if ("mode" in created && created.mode === "busy") return NextResponse.json({ status: "research_busy", continuation: {
        token, remaining: Math.max(0, CONTINUATION_LIMITS.continuations + 1 - created.session.runs), expires: created.session.expires,
        available: false, reason: "busy" } }, { status: 409, headers });
      session = claimContinuationSession(token, body.lang, undefined, "mode" in created && (created.mode === "approved" || created.mode === "negative"));
    } catch (error) { return reply(error instanceof ResearchSessionStop ? `research_${error.code}` : "research_limit", 429); }
  }
  const history = session?.history ?? parseUserHistory(body.previous_user_messages)!;
  const question = session?.question ?? (body.question as string).trim(), lang = body.lang;
  const continuation = () => session && token ? { token, remaining: Math.max(0, CONTINUATION_LIMITS.continuations + 1 - session.runs), expires: session.expires, available: continuationAvailable(session),
    ...(session.held || [...session.attempts.values()].some(a => a.state === "reserved" && a.callerStopped) ? { reason: "billing_uncertain" as const } : session.cancelled ? { reason: "cancelled" as const } : !continuationAvailable(session) ? { reason: "limit" as const } : {}) } : undefined;
  const cancel = new AbortController(), parent = AbortSignal.any([request.signal, cancel.signal]);
  if (session) session.stop = () => cancel.abort(new Error("answer_stopped"));
  const signal = stable ? parent : askTimeout(parent, progressive ? CONTINUATION_LIMITS.runMs : 55_000, "stream_route");
  let delivered: RichSection[] = [], withdrawn = false;
  const incomplete = (error?: unknown) => ({ status: "incomplete", language: lang, withdraw: withdrawn, sections: delivered,
    ...(error ? { failureKind: researchFailure(error) } : {}) });
  const executeWork = (callbacks: RichCallbacks) => withResearchCancellation(signal, () => ask(question, lang, undefined, history, { rich: {
    progressive,
    stable,
    onIntegrity: callbacks.onIntegrity,
    onGroupStatus: callbacks.onGroupStatus,
    onCard: callbacks.onCard,
    onCardWithdraw: callbacks.onCardWithdraw,
    onProgress: callbacks.onProgress,
    onSection: (section, snapshot) => {
      const existing = stable && delivered.find(s => s.group === section.group && s.outcome === "ready");
      if (existing && JSON.stringify(existing) !== JSON.stringify(section)) throw Error("stable_publication_replacement_forbidden");
      delivered = progressive ? [...delivered.filter(s => s.group !== section.group && (section.group === "summary" || s.group !== "summary")), section].sort((a, b) => RICH_ORDER.indexOf(a.group) - RICH_ORDER.indexOf(b.group)) : [...delivered, section]; callbacks.onSection?.(section, snapshot);
    },
    onWithdraw: group => {
      if (stable) throw Error("stable_publication_requires_targeted_integrity_notice");
      if (progressive && group) delivered = delivered.filter(s => s.group !== group && s.group !== "summary"); else { delivered = []; withdrawn = true; }
      callbacks.onWithdraw?.(group);
    },
  }, signal, ...(session ? { checkpoint: session.checkpoint } : {}) }));
  const execute = (callbacks: RichCallbacks) => stable ? withResearchRuntime(localAskUnhurried() ? Infinity : CONTINUATION_LIMITS.runMs, () => executeWork(callbacks)) : executeWork(callbacks);
  const run = (callbacks: RichCallbacks) => withAskRequest(requestId, () => withSlot(async () => {
    try {
      const pass = () => abortable(session ? withModelTransport(continuationTransport(session), () => execute(callbacks)) : execute(callbacks), signal);
      let result = await pass();
      // A first search that leaves an evidenced gap is not the end of research.
      // One new-query round stays inside this answer and its unchanged cumulative
      // spending/send limits. Never resume ambiguous billing or failed checking.
      if (!stable && session && result.status === "incomplete" && result.failureKind === "question_coverage"
        && session.checkpoint.needsEvidence && session.checkpoint.retry === 0
        && continuationAvailable(session) && ![...session.attempts.values()].some(a => a.state === "reserved")) {
        signal.throwIfAborted(); session.checkpoint.retry = 1;
        callbacks.onProgress?.("searching");
        result = await pass();
      }
      if (session) {
        delete session.stop; finishContinuationSession(session, result.status !== "incomplete");
        log("answer", "research_accounting", Date.now() - started, { actual_dispatches: session.calls, actual_usd: session.actualUsd,
          receipt_pending: session.held || [...session.attempts.values()].some(a => a.state === "reserved"), recovery_used: session.checkpoint.simple?.recoveryUsed ?? false,
          correction_used: session.checkpoint.simple?.correctionUsed ?? false, reused_approval: session.cacheOnly ?? false, status: result.status, duration_ms: Date.now() - started });
        if(session.simple) recordLocalAskEvent("simple_research_accounting", { version:1, actual_dispatches:session.calls,
          actual_usd:session.actualUsd, receipt_pending:session.held || [...session.attempts.values()].some(a=>a.state==="reserved"),
          recovery_used:session.checkpoint.simple?.recoveryUsed ?? false, correction_used:session.checkpoint.simple?.correctionUsed ?? false,
          reused_approval:session.cacheOnly ?? false, status:result.status, elapsed_ms:Date.now()-started });
      }
      return result;
    } catch (error) { if (session) { delete session.stop; finishContinuationSession(session, false); } throw error; }
  }), started);
  if (!askStreaming()) {
    try { const result = await run({}); return NextResponse.json({ ...result, ...(progressive && result.status === "incomplete" ? { continuation: continuation() } : {}) }, { headers }); } catch { return progressive || delivered.length || withdrawn ? NextResponse.json({ ...incomplete(), ...(progressive ? { continuation: continuation() } : {}) }, { headers }) : reply(signal.aborted ? "busy" : "error", 503); }
    finally { cancel.abort(); }
  }
  let sequence = 0, ended = false, partial = false;
  const revisions: Partial<Record<RichGroup, number>> = {};
  const cardRevisions: Record<string, number> = {};
  const cardRevision = (id: string) => cardRevisions[id] = (cardRevisions[id] ?? 0) + 1;
  const revision = (group: RichGroup) => revisions[group] = (revisions[group] ?? 0) + 1;
  const encoder = new TextEncoder();
  let publication = emptyPublication();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: Omit<RichEvent, "request_id" | "sequence"> | Record<string, unknown>) => {
        if (ended || request.signal.aborted || cancel.signal.aborted) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...event, ...(progressive ? { version: stable ? 3 : 2 } : {}), request_id: requestId, sequence: ++sequence })}\n\n`)); }
        catch { cancel.abort(); ended = true; }
      };
      const publishStable = (event: PublicationEvent) => {
        const next = reducePublication(publication, event);
        if (next === publication) return;
        publication = next; send(event);
      };
      if (progressive && continuation()) send({ type: "continuation", continuation: continuation() });
      void run({ onGroupStatus: (group, status) => { if (stable) publishStable({ type: "group_status", group, status }); },
        onIntegrity: notice => { if (stable) publishStable({ type: "integrity_notice", notice }); },
        onCard: card => { if (progressive && !stable) { partial = true; send({ type: "source_card", card, revision: cardRevision(card.id) }); } },
        onCardWithdraw: id => { if (progressive && !stable) send({ type: "withdraw_card", id, revision: cardRevision(id) }); },
        onProgress: stage => send({ type: "progress", stage }), onSection: (section, snapshot) => {
          partial ||= section.outcome === "ready";
          if (stable) {
            const evidence_snapshot = snapshot ?? createHash("sha256").update(JSON.stringify(section)).digest("hex");
            publishStable(section.outcome === "ready" ? { type: "section_committed", section, evidence_snapshot, commit_id: createHash("sha256").update(JSON.stringify({ section, evidence_snapshot })).digest("hex") }
              : { type: "group_status", group: section.group, status: section.outcome === "no_direct_evidence" || section.omitted ? "empty" : "blocked", section });
          } else send(progressive ? { type: "section_update", section, revision: revision(section.group), evidence_snapshot: snapshot ?? createHash("sha256").update(JSON.stringify(section)).digest("hex") } : { type: "section", section });
        }, onWithdraw: group => { if (stable) throw Error("stable_publication_requires_targeted_integrity_notice"); send(progressive && group ? { type: "withdraw_group", group, revision: revision(group) } : { type: "withdraw" }); } })
        .then(result => { if (progressive && continuation()) send({ type: "continuation", continuation: continuation() }); send({ type: "terminal", result }); })
        .catch((error) => { if (progressive && continuation()) send({ type: "continuation", continuation: continuation() }); send({ type: "terminal", result: progressive || partial || delivered.length || withdrawn ? incomplete(signal.aborted ? signal.reason : error) : { status: signal.aborted ? "busy" : "error" } }); })
        .finally(() => { if (!ended) { ended = true; try { controller.close(); } catch { /* reader cancelled */ } } cancel.abort(); });
    },
    cancel() { ended = true; cancel.abort(); },
  });
  return new Response(stream, { headers: { ...headers, "Content-Type": "text/event-stream; charset=utf-8", "X-Accel-Buffering": "no", "X-Ask-Request-Id": requestId } });
}
