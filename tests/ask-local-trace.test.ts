import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync, utimesSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPrivateTrace, privateTraceData, recordLocalAskEvent, withLocalAskTrace } from "@/lib/ask/local-trace";
import { observedProvider } from "@/lib/ask/trace-context";
import { askDeadlineMs, localAskTraceEnabled, localAskUnhurried } from "@/lib/ask/settings";
import { askTimeout } from "@/lib/ask/timing";
import { explainTrace } from "@/scripts/read-ask-trace";

const directories: string[] = [];
function temporary() { const directory = mkdtempSync(join(tmpdir(), "bayan-local-trace-")); directories.push(directory); return directory; }
function local() { vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("ASK_LOCAL_TRACE", "true"); vi.stubEnv("ASK_LOCAL_UNHURRIED", "true"); }
afterEach(() => {
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs();
  for (const directory of directories.splice(0)) {
    // Verify every recursive-delete target before removing these test-only directories.
    const absolute = resolve(directory);
    if (!absolute.startsWith(resolve(tmpdir()) + sep + "bayan-local-trace-")) throw new Error("Unexpected test cleanup path");
    rmSync(absolute, { recursive: true, force: true });
  }
});
describe("private local full-process traces", () => {
  it("records exact drafts and checker feedback with separate request/call ids, without leaking secrets into console logs", async () => {
    local(); const directory = temporary(); vi.spyOn(process, "cwd").mockReturnValue(directory);
    const safeLog = vi.fn();
    const provider = observedProvider({ id: "fake/checker", generateJson: async () => ({ claim_assessments: [{ claim_id: "C4", reason_codes: ["unsupported_meaning"], explanation: "The cited passage does not state this asserted benefit." }] }) }, "checker", safeLog, Date.now(), () => "A8");
    await withLocalAskTrace("request-one", Date.now(), async () => {
      recordLocalAskEvent("pipeline_input", { question: "Invented private question", password: "do-not-record" });
      await provider.generateJson({ system: "You independently check Bayan explanations", prompt: JSON.stringify({ claims: [{ claim_id: "C4", claim: "Invented rejected sentence", source_ids: ["Q51:56"] }] }), schema: { type: "object", properties: {}, required: [] } });
    });
    const file = join(directory, "work", "local-ask-traces", "request-one.jsonl");
    const raw = readFileSync(file, "utf8"), rows = raw.trim().split("\n").map(line => JSON.parse(line));
    expect(raw).toContain("Invented rejected sentence"); expect(raw).toContain("The cited passage does not state"); expect(raw).not.toContain("do-not-record");
    expect(rows.every(row => row.request_id === "request-one")).toBe(true);
    expect(safeLog.mock.calls.flat().some(v => String(v).includes("Invented rejected sentence"))).toBe(false);
    expect(explainTrace(rows).join("\n")).toContain("Rejected C4: Invented rejected sentence");
    expect(JSON.parse(readFileSync(join(directory, "work", "local-ask-traces", "latest.json"), "utf8")).request_id).toBe("request-one");
  });
  it("keeps concurrent requests separate", async () => {
    local(); const directory = temporary(); vi.spyOn(process, "cwd").mockReturnValue(directory);
    await Promise.all(["first", "second"].map(id => withLocalAskTrace(id, Date.now(), async () => {
      await Promise.resolve(); recordLocalAskEvent("marker", { owner: id });
    })));
    for (const id of ["first", "second"]) {
      const lines = readFileSync(join(directory, "work", "local-ask-traces", `${id}.jsonl`), "utf8").trim().split("\n").map(v => JSON.parse(v));
      expect(lines.every(v => v.request_id === id)).toBe(true); expect(lines.find(v => v.event === "marker").data.owner).toBe(id);
    }
  });
  it.each(["production", "vercel", "disabled"])("does not create full traces in %s", async mode => {
    local(); const directory = temporary(); vi.spyOn(process, "cwd").mockReturnValue(directory);
    if (mode === "production") vi.stubEnv("NODE_ENV", "production");
    if (mode === "vercel") vi.stubEnv("VERCEL", "1");
    if (mode === "disabled") vi.stubEnv("ASK_LOCAL_TRACE", "false");
    expect(localAskTraceEnabled()).toBe(false);
    await withLocalAskTrace("blocked", Date.now(), async () => recordLocalAskEvent("question", { text: "Never write this" }));
    expect(existsSync(join(directory, "work"))).toBe(false);
  });
  it("redacts credentials recursively but preserves the actual question and failed explanation", () => {
    const result = JSON.stringify(privateTraceData({ question: "Why did the test fail?", nested: { api_key: "secret", headers: { authorization: "secret" }, text: "Bearer privatecredential and sk-or-v1-abcdefghijklmnopqrstuv" } }));
    expect(result).toContain("Why did the test fail?"); expect(result).not.toContain("privatecredential"); expect(result).not.toContain("abcdefghijklmnopqrstuv"); expect(result).not.toContain('"secret"');
  });
  it("rotates old files on new requests and stops detailed recording at the size cap", () => {
    const directory = temporary();
    writeFileSync(join(directory, "expired.jsonl"), "old"); utimesSync(join(directory, "expired.jsonl"), 0, 0);
    for (let i = 0; i < 27; i++) { const t = createPrivateTrace(directory, `request-${i}`, Date.now()); t.record("fixture", { i }); }
    expect(existsSync(join(directory, "expired.jsonl"))).toBe(false);
    expect(readdirSync(directory).filter(v => v.endsWith(".jsonl")).length).toBeLessThanOrEqual(25);
    const limited = createPrivateTrace(directory, "size-cap", Date.now());
    limited.record("large", Array(60).fill("x".repeat(100_000))); limited.record("should-not-append", {});
    expect(statSync(limited.file).size).toBeLessThan(5 * 1024 * 1024);
    expect(readFileSync(limited.file, "utf8")).toContain("trace_size_limit"); expect(readFileSync(limited.file, "utf8")).not.toContain("should-not-append");
  });
});
describe("unhurried local timing, production limits intact", () => {
  it("waits beyond both former cutoffs locally and still obeys Stop", async () => {
    local(); vi.useFakeTimers(); const stop = new AbortController();
    const signal = askTimeout(stop.signal, 10_000, "recovery");
    expect(signal).toBe(stop.signal);
    expect(askDeadlineMs()).toBe(Infinity); expect(localAskUnhurried()).toBe(true);
    await vi.advanceTimersByTimeAsync(120_000); expect(signal.aborted).toBe(false);
    stop.abort(); expect(signal.aborted).toBe(true);
  });
  it.each(["production", "vercel", "optout"])("preserves finite deadlines in %s", async mode => {
    local();
    if (mode === "production") vi.stubEnv("NODE_ENV", "production");
    if (mode === "vercel") vi.stubEnv("VERCEL", "1");
    if (mode === "optout") vi.stubEnv("ASK_LOCAL_UNHURRIED", "false");
    expect(askDeadlineMs("90000")).toBe(55_000);
    const signal = askTimeout(undefined, 100, "fixture"); await new Promise(r => setTimeout(r, 120)); expect(signal.aborted).toBe(true);
  });
});
