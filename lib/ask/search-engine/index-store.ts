import { mkdir, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { passageProblem, sameSpace, textHash, validVector, validateIndex, type SearchIndex, type SearchPassage, type SourcePermissions, type VectorSpace } from "./contract";

export type SourceEmbedder = {
  space: VectorSpace;
  /** Exact originals only. Never silently truncate, translate, or combine passages. */
  embedOriginals: (originals: string[], signal: AbortSignal) => Promise<number[][]>;
};
export async function buildSearchIndex(passages: SearchPassage[], embedder: SourceEmbedder, generation: string, signal: AbortSignal, now = new Date()) {
  signal.throwIfAborted();
  if (new Set(passages.map(p => p.id)).size !== passages.length) throw new Error("duplicate_passage_identity");
  const excluded: { id: string; reason: string }[] = [];
  const eligible = passages.filter(p => {
    const problem = passageProblem(p, now, true);
    if (problem) excluded.push({ id: p.id, reason: problem });
    return !problem;
  });
  const built: SearchPassage[] = [];
  for (let start = 0; start < eligible.length; start += 16) {
    signal.throwIfAborted();
    const batch = eligible.slice(start, start + 16);
    const vectors = await embedder.embedOriginals(batch.map(p => p.original), signal);
    signal.throwIfAborted();
    if (!Array.isArray(vectors) || vectors.length !== batch.length || vectors.some(v => !validVector(v, embedder.space.dimensions))) throw new Error("embedding_batch_mismatch");
    built.push(...batch.map((p, i) => ({ ...p, vector: { space: { ...embedder.space }, values: vectors[i], textHash: textHash(p.original) } })));
  }
  const index: SearchIndex = { version: 1, generation, space: { ...embedder.space }, passages: built };
  validateIndex(index);
  return { index, excluded, input: passages.length, indexed: built.length };
}

type Pointer = { version: 2; generation: string; sha256: string; expiresAt: string; space: VectorSpace };
type StoredGeneration = { version: 1; index: SearchIndex; expiresAt: string };
export type CurrentSourceState = SourcePermissions | { permissions: SourcePermissions; parentOriginalHash: string; sourceFingerprint?: string };
const validGeneration = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9._-]{1,100}$/.test(s) && s !== "." && s !== "..";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** Private server-side index generations; never stores questions or approvals.
 * A pointer is replaced only after a complete immutable generation was written. */
export class PrivateSearchIndexStore {
  constructor(private readonly directory: string) {}

  async publish(index: SearchIndex, expiresAt: Date, now = new Date()) {
    return this.withMaintenanceLock(() => this.publishGeneration(structuredClone(index), expiresAt, now));
  }

  private async withMaintenanceLock<T>(work: () => Promise<T>): Promise<T> {
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".maintenance-lock");
    const fd = await open(lock, "wx", 0o600).catch((error: NodeJS.ErrnoException) => { if (error.code === "EEXIST") throw new Error("index_maintenance_busy"); throw error; });
    try { return await work(); } finally { await fd.close(); await unlink(lock); }
  }

  private async publishGeneration(index: SearchIndex, expiresAt: Date, now: Date) {
    validateIndex(index);
    if (!validGeneration(index.generation) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= now || expiresAt.getTime() - now.getTime() > 7 * 86_400_000) throw new Error("invalid_index_retention");
    if (index.passages.some(p => passageProblem(p, now, !!p.vector))) throw new Error("ineligible_index_publication");
    // A source's narrower retention/permission expiry always takes priority.
    if (index.passages.some(p => p.permissions.expiresAt && Date.parse(p.permissions.expiresAt) < expiresAt.getTime())) throw new Error("source_expires_before_index");
    await mkdir(this.directory, { recursive: true });
    const content = JSON.stringify({ version: 1, index, expiresAt: expiresAt.toISOString() } satisfies StoredGeneration), target = join(this.directory, `${index.generation}.json`);
    const fd = await open(target, "wx", 0o600);
    try { await fd.writeFile(content, "utf8"); await fd.sync(); } finally { await fd.close(); }
    const pointer: Pointer = { version: 2, generation: index.generation, sha256: hash(content), expiresAt: expiresAt.toISOString(), space: index.space };
    const temp = join(this.directory, `.pointer-${randomUUID()}.json`);
    try {
      await readFile(target); // The complete generation must be readable before exposing it.
      await writeFile(temp, JSON.stringify(pointer), { mode: 0o600, flag: "wx" });
      await rename(temp, join(this.directory, "current.json"));
    } catch (error) { await unlink(temp).catch(() => {}); throw error; }
  }

  async load(revalidate: (sources: string[]) => Promise<Map<string, CurrentSourceState>>, now?: Date): Promise<SearchIndex> {
    const readStarted = now ?? new Date();
    const pointer = JSON.parse(await readFile(join(this.directory, "current.json"), "utf8")) as Pointer;
    if (pointer.version !== 2 || !validGeneration(pointer.generation) || !/^[a-f0-9]{64}$/.test(pointer.sha256) || !Number.isFinite(Date.parse(pointer.expiresAt)) || Date.parse(pointer.expiresAt) <= readStarted.getTime()) throw new Error("index_unavailable_or_expired");
    const content = await readFile(join(this.directory, `${pointer.generation}.json`), "utf8");
    if (hash(content) !== pointer.sha256) throw new Error("index_file_mismatch");
    const stored = JSON.parse(content) as StoredGeneration;
    if (stored.version !== 1 || stored.expiresAt !== pointer.expiresAt) throw new Error("index_generation_mismatch");
    const index = stored.index; validateIndex(index);
    if (index.generation !== pointer.generation || !sameSpace(index.space, pointer.space)) throw new Error("index_generation_mismatch");
    const rights = await revalidate([...new Set(index.passages.map(p => p.sourceId))]);
    // Permissions may be freshly checked during the awaited lookup. Compare them
    // with the completion clock, not a stale timestamp captured before the request.
    const validationTime = now ?? new Date();
    if (Date.parse(pointer.expiresAt) <= validationTime.getTime()) throw new Error("index_unavailable_or_expired");
    // Never rely solely on the historical rights flags embedded in a snapshot.
    return { ...index, passages: index.passages.flatMap(p => {
      const current = rights.get(p.sourceId); if (!current) return [];
      if (p.parentOriginalHash && (!("permissions" in current) || current.parentOriginalHash !== p.parentOriginalHash)) return [];
      if (p.sourceFingerprint && (!("permissions" in current) || current.sourceFingerprint !== p.sourceFingerprint)) return [];
      if (p.verificationBasis === "stored_source_bytes" && !p.sourceFingerprint) return [];
      const revised = { ...p, permissions: "permissions" in current ? current.permissions : current };
      return passageProblem(revised, validationTime, !!p.vector) ? [] : [revised];
    }) };
  }

  /** Removes only this store's immutable JSON generations. No recursive deletes.
   * A scheduler must run this even when no visitor asks a question. */
  async prune(now = new Date(), withdrawnSourceIds: string[] = []) {
    return this.withMaintenanceLock(() => this.pruneGenerations(now, withdrawnSourceIds));
  }

  private async pruneGenerations(now: Date, withdrawnSourceIds: string[]) {
    const withdrawn = new Set(withdrawnSourceIds), removed: string[] = [];
    const names = await readdir(this.directory).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return []; throw error; });
    for (const name of names) {
      if (name === "current.json" || !name.endsWith(".json") || !validGeneration(name.slice(0, -5))) continue;
      const stored = JSON.parse(await readFile(join(this.directory, name), "utf8")) as StoredGeneration;
      if (stored.version !== 1 || !stored.index || !Number.isFinite(Date.parse(stored.expiresAt))) throw new Error("invalid_generation_cleanup_manifest");
      if (Date.parse(stored.expiresAt) > now.getTime() && !stored.index.passages.some(p => withdrawn.has(p.sourceId))) continue;
      await unlink(join(this.directory, name)); removed.push(stored.index.generation);
    }
    const pointerPath = join(this.directory, "current.json");
    try {
      const pointer = JSON.parse(await readFile(pointerPath, "utf8")) as Pointer;
      if (removed.includes(pointer.generation) || Date.parse(pointer.expiresAt) <= now.getTime()) await unlink(pointerPath);
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    return { removed };
  }
}
