import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ask/limits", () => ({ askEnabled: () => true }));
import { POST } from "@/app/api/ask/jobs/route";
afterEach(() => vi.unstubAllEnvs());
it("keeps the unfinished durable path off without requiring storage or source credentials", async () => {
  vi.stubEnv("ASK_DURABLE_ENABLED", "false");
  const res = await POST(
    new Request("https://bayan.test/api/ask/jobs", {
      method: "POST",
      headers: {
        origin: "https://bayan.test",
        "content-type": "application/json",
      },
      body: "{}",
    }),
  );
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ status: "not_ready" });
});
