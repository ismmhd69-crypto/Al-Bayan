import { vi } from "vitest";

// Tests have no question-count database. Route tests admit every question by default; the quota's own
// tests (tests/ask-quota.test.ts) load the real module with vi.importActual and drive it with stubs.
vi.mock("@/lib/ask/quota", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ask/quota")>("@/lib/ask/quota");
  return { ...actual, admitQuestion: vi.fn(async () => ({ status: "ok" as const })) };
});
