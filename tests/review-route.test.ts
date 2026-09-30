import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/content", () => ({ setReviewDecision: vi.fn(async () => true) }));
vi.mock("@/lib/prepared", () => ({ preparedContentHash: vi.fn(() => "a".repeat(64)) }));
import { POST } from "@/app/api/review/route";

const previous = process.env.BAYAN_REVIEW_KEY;
const previousEnabled = process.env.BAYAN_REVIEW_ENABLED;
afterEach(() => {
  if (previous === undefined) delete process.env.BAYAN_REVIEW_KEY;
  else process.env.BAYAN_REVIEW_KEY = previous;
  if (previousEnabled === undefined) delete process.env.BAYAN_REVIEW_ENABLED;
  else process.env.BAYAN_REVIEW_ENABLED = previousEnabled;
});

describe("prepared review write protection", () => {
  it("is unavailable unless internal review is deliberately enabled", async () => {
    delete process.env.BAYAN_REVIEW_ENABLED;
    const response = await POST(new Request("https://bayan.test/api/review", { method: "POST" }));
    expect(response.status).toBe(404);
  });

  it("rejects a same-origin request without the private review key", async () => {
    process.env.BAYAN_REVIEW_KEY = "test-review-key-with-at-least-32-characters";
    process.env.BAYAN_REVIEW_ENABLED = "true";
    const response = await POST(new Request("https://bayan.test/api/review", {
      method: "POST",
      headers: { origin: "https://bayan.test", "content-type": "application/json" },
      body: JSON.stringify({ kind: "prepared", id: "five-pillars", status: "approved" }),
    }));
    expect(response.status).toBe(401);
  });

  it("accepts the private key gate before validating the body", async () => {
    process.env.BAYAN_REVIEW_KEY = "test-review-key-with-at-least-32-characters";
    process.env.BAYAN_REVIEW_ENABLED = "true";
    const response = await POST(new Request("https://bayan.test/api/review", {
      method: "POST",
      headers: { origin: "https://bayan.test", "content-type": "application/json", "x-bayan-review-key": "test-review-key-with-at-least-32-characters" },
      body: "{}",
    }));
    expect(response.status).toBe(400);
  });
});
