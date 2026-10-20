import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, relative } from "node:path";
import { buildSearchIndex, PrivateSearchIndexStore } from "@/lib/ask/search-engine/index-store";
import { textHash, type SearchPassage } from "@/lib/ask/search-engine/contract";

const now = new Date("2026-10-20T10:00:00Z"), expiry = new Date("2026-10-21T10:00:00Z");
const space = { model: "invented-test-only", revision: "1", dimensions: 2 };
function passage(): SearchPassage {
  const original = "Invented fixture passage.";
  return { id: "P1", sourceId: "S1", parentId: "D1", family: "scholar", language: "ar", original, originalHash: textHash(original), originalVerified: true,
    title: "Invented fixture", reference: "REF1", canonicalUrl: "https://example.org/source", span: { start: 0, end: original.length }, context: { before: "", after: "", complete: true },
    permissions: { published: true, search: true, ai: true, embeddings: true, record: "fixture-only", verifiedAt: "2026-10-01T10:00:00Z", expiresAt: null, revoked: false }, attribution: { scholarId: "fixture" } };
}
const directories: string[] = [];
async function store() { const dir = await mkdtemp(join(tmpdir(), "bayan-search-index-")); directories.push(dir); return { dir, store: new PrivateSearchIndexStore(dir) }; }
afterEach(async () => {
  for (const dir of directories.splice(0)) {
    const path = resolve(dir), rel = relative(resolve(tmpdir()), path);
    if (!rel.startsWith("bayan-search-index-") || rel.includes("..") || rel.includes("/") || rel.includes("\\")) throw new Error("unsafe_test_cleanup");
    await rm(path, { recursive: true, force: true });
  }
});
const build = (rows = [passage()]) => buildSearchIndex(rows, { space, embedOriginals: async originals => originals.map(() => [1, 0]) }, "test-generation", new AbortController().signal, now);

describe("private index building and atomic publication", () => {
  it("does not send disallowed original text to an embedding provider", async () => {
    const p = passage(); p.permissions.embeddings = false;
    const provider = vi.fn(async () => [[1, 0]]);
    const result = await buildSearchIndex([p], { space, embedOriginals: provider }, "test", new AbortController().signal, now);
    expect(provider).not.toHaveBeenCalled(); expect(result.excluded).toEqual([{ id: "P1", reason: "embedding_permission_missing" }]);
  });
  it("stores exact originals and validates provider dimensions", async () => {
    const p = passage(), result = await build([p]);
    expect(result.index.passages[0].original).toBe(p.original);
    expect(result.index.passages[0].vector?.textHash).toBe(textHash(p.original));
    await expect(buildSearchIndex([p], { space, embedOriginals: async () => [[1, 0, 2]] }, "test", new AbortController().signal, now)).rejects.toThrow("embedding_batch_mismatch");
  });
  it("rechecks current rights at every load and filters revocations", async () => {
    const { store: s } = await store(), built = await build(); await s.publish(built.index, expiry, now);
    const rights = vi.fn(async () => new Map([["S1", passage().permissions]]));
    expect((await s.load(rights, now)).passages).toHaveLength(1);
    expect(rights).toHaveBeenCalledWith(["S1"]);
    expect((await s.load(async () => new Map([["S1", { ...passage().permissions, revoked: true }]]), now)).passages).toHaveLength(0);
  });
  it("accepts a fresh permission check that finishes after loading began", async () => {
    const { store: s } = await store(), built = await build(), actualNow = new Date();
    built.index.passages[0].permissions.verifiedAt = new Date(actualNow.getTime() - 1000).toISOString();
    await s.publish(built.index, new Date(actualNow.getTime() + 3_600_000), actualNow);
    const result = await s.load(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return new Map([["S1", { ...passage().permissions, verifiedAt: new Date().toISOString() }]]);
    });
    expect(result.passages).toHaveLength(1);
  });
  it("keeps an existing generation immutable and detects tampering", async () => {
    const { store: s, dir } = await store(), built = await build(); await s.publish(built.index, expiry, now);
    const pointer = await readFile(join(dir, "current.json"), "utf8");
    await expect(s.publish(built.index, expiry, now)).rejects.toThrow();
    expect(await readFile(join(dir, "current.json"), "utf8")).toBe(pointer);
    await writeFile(join(dir, "test-generation.json"), "{}");
    await expect(s.load(async () => new Map(), now)).rejects.toThrow("index_file_mismatch");
  });
  it("rejects expired index generations before exposing stored text", async () => {
    const { store: s } = await store(), built = await build(); await s.publish(built.index, expiry, now);
    const rights = vi.fn(async () => new Map());
    await expect(s.load(rights, new Date("2026-10-22T10:00:00Z"))).rejects.toThrow("index_unavailable_or_expired");
    expect(rights).not.toHaveBeenCalled();
  });
  it("physically removes expired and withdrawn generations without deleting unrelated files", async () => {
    const { store: s, dir } = await store(), built = await build(); await s.publish(built.index, expiry, now);
    await writeFile(join(dir, "notes.txt"), "not an index");
    expect(await s.prune(new Date("2026-10-22T10:00:00Z"))).toEqual({ removed: ["test-generation"] });
    expect(await readdir(dir)).toEqual(["notes.txt"]);
    const next = { ...built.index, generation: "next-generation" }; await s.publish(next, expiry, now);
    expect(await s.prune(now, ["S1"])).toEqual({ removed: ["next-generation"] });
    expect(await readdir(dir)).toEqual(["notes.txt"]);
  });
  it("requires a current full-parent hash for exported passages", async () => {
    const { store: s } = await store(), built = await build();
    built.index.passages[0].parentOriginalHash = textHash(built.index.passages[0].original);
    built.index.passages[0].span.start = 0; built.index.passages[0].context.before = ""; built.index.passages[0].context.after = "";
    await s.publish(built.index, expiry, now);
    expect((await s.load(async () => new Map([["S1", { permissions: passage().permissions, parentOriginalHash: textHash("changed") }]]), now)).passages).toHaveLength(0);
  });
  it("never publishes beyond a source's permission expiry or the prototype retention cap", async () => {
    const { store: s } = await store(), p = passage(); p.permissions.expiresAt = "2026-10-20T11:00:00Z";
    await expect(s.publish((await build([p])).index, expiry, now)).rejects.toThrow("source_expires_before_index");
    await expect(s.publish((await build()).index, new Date("2026-11-20T10:00:00Z"), now)).rejects.toThrow("invalid_index_retention");
  });
});
