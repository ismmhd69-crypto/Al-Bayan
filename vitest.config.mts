import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    // Tests that switch on development mode must never write into, or rotate,
    // the owner's real private traces in work/local-ask-traces.
    env: { ASK_LOCAL_TRACE_DIR: join(tmpdir(), "bayan-test-ask-traces") },
  },
});
