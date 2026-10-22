import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { handleReport, validateReport, type ReportInput } from "@/app/api/report/route";

const url = "https://al-bayan.test/api/report";
const headers = { origin: "https://al-bayan.test", "content-type": "application/json" };
function request(body: unknown, extra: HeadersInit = {}) { return new Request(url, { method: "POST", headers: { ...headers, ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) }); }
function fakeStore() { const stored: ReportInput[] = []; return { stored, insert: async (item: ReportInput) => { stored.push(item); return {}; } }; }
const validLegacy = { lang: "en", reason: "unclear", source_ids: ["Q2:255", "HE66511"], comment: "Please review this." };
const validProblem = {
  lang: "ar",
  category: "content_mistake",
  comment: "يوجد خطأ في ترجمة الآية",
  page_url: "https://al-bayan.test/ar/fasting",
  source_ids: ["Q2:183", "SH49bc6ce2-1e8a-42cb-a906-bd38343d3c5a"],
};

describe("report validation", () => {
  it("rejects unknown reasons", () => expect(validateReport({ ...validLegacy, reason: "invented" })).toBeNull());
  it("rejects legacy long comments (> 500 chars)", () => expect(validateReport({ ...validLegacy, comment: "x".repeat(501) })).toBeNull());
  it("rejects unknown fields so they cannot be stored", async () => {
    const store = fakeStore(); const response = await handleReport(request({ ...validLegacy, question: "never store me" }), store);
    expect(response.status).toBe(400); expect(store.stored).toEqual([]);
  });
  it("rejects a wrong origin before storage", async () => {
    const store = fakeStore(); const response = await handleReport(request(validLegacy, { origin: "https://attacker.test" }), store);
    expect(response.status).toBe(403); expect(store.stored).toEqual([]);
  });
  it("rejects oversized bodies before storage", async () => {
    const store = fakeStore(); const response = await handleReport(request("x".repeat(4097)), store);
    expect(response.status).toBe(413); expect(store.stored).toEqual([]);
  });
  it("stores legacy report with allowed fields", async () => {
    const store = fakeStore(); const response = await handleReport(request(validLegacy), store);
    expect(response.status).toBe(201); expect(store.stored).toEqual([{ lang: "en", reason: "unclear", source_ids: ["Q2:255", "HE66511"], comment: "Please review this." }]);
  });

  describe("problem reports", () => {
    it("validates and accepts a complete problem report", () => {
      const validated = validateReport(validProblem);
      expect(validated).toEqual(validProblem);
    });

    it("rejects unknown categories", () => {
      expect(validateReport({ ...validProblem, category: "spam" })).toBeNull();
    });

    it("requires a non-empty comment", () => {
      expect(validateReport({ ...validProblem, comment: "" })).toBeNull();
      expect(validateReport({ ...validProblem, comment: "   " })).toBeNull();
    });

    it("rejects comments exceeding 1000 chars", () => {
      expect(validateReport({ ...validProblem, comment: "a".repeat(1001) })).toBeNull();
      expect(validateReport({ ...validProblem, comment: "a".repeat(1000) })).not.toBeNull();
    });

    it("rejects page_url exceeding 300 chars", () => {
      expect(validateReport({ ...validProblem, page_url: "https://" + "a".repeat(295) })).toBeNull();
    });

    it("rejects unknown fields in problem reports", async () => {
      const store = fakeStore();
      const response = await handleReport(request({ ...validProblem, extra_metadata: "blocked" }), store);
      expect(response.status).toBe(400);
      expect(store.stored).toEqual([]);
    });

    it("stores problem report via handleReport", async () => {
      const store = fakeStore();
      const response = await handleReport(request(validProblem), store);
      expect(response.status).toBe(201);
      expect(store.stored).toEqual([validProblem]);
    });
  });
});
