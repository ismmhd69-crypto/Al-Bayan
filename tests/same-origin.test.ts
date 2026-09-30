// The one "only our own pages" check used by every API route.
import { describe, expect, it } from "vitest";
import { sameOrigin } from "@/lib/same-origin";

const req = (headers: Record<string, string>, url = "http://localhost:3000/api/ask") => new Request(url, { method: "POST", headers });

describe("sameOrigin", () => {
  it("accepts a page on the same host (local)", () => {
    expect(sameOrigin(req({ origin: "http://localhost:3000" }))).toBe(true);
  });

  it("accepts the public address when the server sees another one (behind Netlify)", () => {
    const behindProxy = "https://internal-function.example/api/ask";
    // the browser says it is the same origin
    expect(sameOrigin(req({ origin: "https://bayan.example", "sec-fetch-site": "same-origin" }, behindProxy))).toBe(true);
    // older browsers: the forwarded host names the public address
    expect(sameOrigin(req({ origin: "https://bayan.example", "x-forwarded-host": "bayan.example" }, behindProxy))).toBe(true);
    expect(sameOrigin(req({ origin: "https://bayan.example", host: "bayan.example" }, behindProxy))).toBe(true);
  });

  it("refuses other sites, missing or odd origins", () => {
    expect(sameOrigin(req({ origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(req({ origin: "https://evil.example", "x-forwarded-host": "evil.example", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(sameOrigin(req({ origin: "https://bayan.example", "sec-fetch-site": "same-site" }, "https://other.example/api/ask"))).toBe(false);
    expect(sameOrigin(req({}))).toBe(false);
    expect(sameOrigin(req({ origin: "null" }))).toBe(false);
    expect(sameOrigin(req({ origin: "localhost:3000" }))).toBe(false);
  });

  it("does not let a cross-site browser request through by matching headers alone", () => {
    expect(sameOrigin(req({ origin: "http://localhost:3000", "sec-fetch-site": "cross-site" }))).toBe(false);
  });
});
