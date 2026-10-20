import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { isTimeoutFailure } from "@/lib/ask/abort";
beforeEach(() => { vi.resetModules(); vi.stubEnv("QURAN_FOUNDATION_CLIENT_ID", "fake"); vi.stubEnv("QURAN_FOUNDATION_CLIENT_SECRET", "fake"); vi.stubEnv("QURAN_API_ENV", "production"); vi.stubEnv("QURAN_CHAPTERS", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Quran query failures stay separate from successful evidence candidates", () => {
  it("recognises a fetch connection timeout without mislabelling visitor cancellation", () => {
    expect(isTimeoutFailure(new TypeError("fetch failed", { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } }))).toBe(true);
    expect(isTimeoutFailure(new DOMException("stopped", "AbortError"))).toBe(false);
  });
  function transport() {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("oauth2/token")) return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (decodeURIComponent(url).includes("slow-query")) throw new DOMException("timed out", "TimeoutError");
      return Response.json({ result: { verses: [{ key: "2:183", result_type: "ayah" }] } });
    }));
  }
  it("preserves successful queries while reporting the failed query", async () => {
    transport(); const { searchQuran } = await import("@/lib/sources/quran"); const failure = vi.fn();
    expect(await searchQuran(["working-query", "slow-query"], 8, undefined, failure)).toEqual(["2:183"]);
    expect(failure).toHaveBeenCalledWith("timeout");
  });
  it("still reports a timeout when every query fails", async () => {
    transport(); const { searchQuran } = await import("@/lib/sources/quran"); const failure = vi.fn();
    await expect(searchQuran(["slow-query"], 8, undefined, failure)).rejects.toMatchObject({ name: "TimeoutError" });
  });
  it("preserves the legacy all-or-nothing source behaviour outside the opt-in path", async () => {
    transport(); const { searchQuran } = await import("@/lib/sources/quran");
    await expect(searchQuran(["working-query", "slow-query"], 8)).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
