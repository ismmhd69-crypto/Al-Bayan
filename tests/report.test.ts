import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { handleReport, validateReport, type ReportInput } from "@/app/api/report/route";

const url = "https://al-bayan.test/api/report";
const headers = { origin: "https://al-bayan.test", "content-type": "application/json" };
function request(body: unknown, extra: HeadersInit = {}) { return new Request(url, { method: "POST", headers: { ...headers, ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) }); }
function fakeStore() { const stored: ReportInput[] = []; return { stored, insert: async (item: ReportInput) => { stored.push(item); return {}; } }; }
const valid = { lang: "en", reason: "unclear", source_ids: ["Q2:255", "HE66511"], comment: "Please review this." };

describe("report validation", () => {
  it("rejects unknown reasons", () => expect(validateReport({ ...valid, reason: "invented" })).toBeNull());
  it("rejects long comments", () => expect(validateReport({ ...valid, comment: "x".repeat(501) })).toBeNull());
  it("rejects unknown fields so they cannot be stored", async () => {
    const store = fakeStore(); const response = await handleReport(request({ ...valid, question: "never store me" }), store);
    expect(response.status).toBe(400); expect(store.stored).toEqual([]);
  });
  it("rejects a wrong origin before storage", async () => {
    const store = fakeStore(); const response = await handleReport(request(valid, { origin: "https://attacker.test" }), store);
    expect(response.status).toBe(403); expect(store.stored).toEqual([]);
  });
  it("rejects oversized bodies before storage", async () => {
    const store = fakeStore(); const response = await handleReport(request("x".repeat(2049)), store);
    expect(response.status).toBe(413); expect(store.stored).toEqual([]);
  });
  it("stores only the allowed fields", async () => {
    const store = fakeStore(); const response = await handleReport(request(valid), store);
    expect(response.status).toBe(201); expect(store.stored).toEqual([{ lang: "en", reason: "unclear", source_ids: ["Q2:255", "HE66511"], comment: "Please review this." }]);
  });
});
