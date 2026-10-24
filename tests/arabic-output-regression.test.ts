import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { extractJsonObject } from "@/lib/ai/nvidia";
import rejected from "./fixtures/arabic-malformed-writer.json";

it("rejects the entire two recorded Arabic drafts with broken Unicode escapes", () => {
  expect(rejected.responses).toHaveLength(2);
  for (const response of rejected.responses) {
    expect(() => JSON.parse(response)).toThrow();
    expect(extractJsonObject(response)).toBeNull();
    // Neither a valid-looking child nor plausible Arabic wording grants approval.
  }
});

it("accepts valid literal and valid escaped Arabic without rewriting religious wording", () => {
  const literal = { status: "answer", text: "صياغة عربية تجريبية" };
  expect(extractJsonObject(JSON.stringify(literal))).toEqual(literal);
  expect(extractJsonObject('{"text":"\\u0639\\u0631\\u0628\\u064a"}')).toEqual({ text: "عربي" });
});
