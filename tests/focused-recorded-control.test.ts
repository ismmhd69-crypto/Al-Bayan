import { expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
vi.mock("server-only", () => ({}));
import { recordedFocusedControl } from "../scripts/probe-ask-focused-recorded";
import { sourceSupportRequest } from "../lib/ask/focused-checks";

it.skipIf(!existsSync("work/local-ask-traces/2c2b118f-d7be-459d-83ae-95a6adad2f98.jsonl"))("uses the actual focused support builder and exact local saved claims, citations, originals and restrictions", () => {
  const c = recordedFocusedControl(), input = JSON.parse(c.request.prompt);
  expect(c.request).toEqual(sourceSupportRequest(c.items, c.pack, "ar"));
  expect(input.claims).toHaveLength(4);
  for (const [i, claim] of input.claims.entries()) {
    expect(claim.claim).toBe(c.control.items[i].text);
    expect(claim.source_ids).toEqual(c.control.items[i].refs);
    expect(claim.supporting_excerpts.map((s: any) => s.original)).toEqual(claim.source_ids.map((id: string) => c.control.serialized.passages.find((p: any) => p.id === id).arabic));
    expect(claim.restrictive_context.passages.map((s: any) => s.original)).toEqual(claim.source_ids.flatMap((id: string) => c.control.serialized.passages.find((p: any) => p.id === id).surrounding_context ?? []).map((p: any) => p.arabic));
  }
  expect(c.request.maxOutputTokens).toBe(1820);
  expect(c.request.prompt).not.toContain("expectedSupported");
  expect(c.request.prompt).not.toContain("prior_claim_reviews");
});
