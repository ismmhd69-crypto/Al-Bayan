// Local PostgreSQL + real pgvector operators, invented originals and vectors.
// No .env, remote data, model calls, permission changes or production migration.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import { storedSourcePassages, type StoredSearchSource } from "../lib/ask/search-engine/source-passages";
import { persistentSearchIndex, type IndexRpc } from "../lib/ask/search-engine/persistent-index";
import { SOURCE_LOOKUP_REVISION, searchTokens } from "../lib/ask/search-engine/hybrid";
import type { SearchIndex } from "../lib/ask/search-engine/contract";
import { retrieveFromPersistentCorpus } from "../lib/ask/search-engine/persistent-corpus";
import type { QuestionFrame } from "../lib/ask/retrieval";

async function main() {
  const root = resolve("work/private-ask-evaluation");
  await mkdir(root, { recursive: true });
  const { PGlite } = await import(pathToFileURL(join(root, "sql-runtime/node_modules/@electric-sql/pglite/dist/index.js")).href);
  const { vector } = await import(pathToFileURL(join(root, "sql-runtime/node_modules/@electric-sql/pglite-pgvector/dist/index.js")).href);
  const directory = await mkdtemp(join(root, "persistent-index-check-"));
  const db = new PGlite(directory, { extensions: { vector } });
  const migration = await readFile("supabase/migrations/20261021101848_ask_persistent_search_index.sql", "utf8");
  const stateSql = await readFile("supabase/migrations/20261020141728_ask_index_source_state.sql", "utf8");
  const checks: string[] = [];
  const check = async (name: string, work: () => Promise<void>) => { console.info(`Checking: ${name}`); await work(); checks.push(name); };
  const rpc: IndexRpc = async (operation, body, signal) => {
    signal.throwIfAborted(); await db.exec("set role service_role");
    try { return (await db.query("select public.ask_search_index($1,$2::jsonb) result", [operation, JSON.stringify(body)])).rows[0].result; }
    finally { await db.exec("reset role"); }
  };
  const store = persistentSearchIndex(rpc), signal = new AbortController().signal;
  const rights = randomUUID();
  const space = { model: "invented-offline-model", revision: "invented-revision", dimensions: 3, recipe: "a".repeat(64) };
  const expiresAt = new Date(Date.now() + 3600000);
  const source = (text: string, ref: string): StoredSearchSource => ({ id: randomUUID(), kind: "hadith", language: "ar", title: "Invented fixture", reference: ref,
    text_original: text, url: "https://example.org/invented", scholar_id: null, grade: "sahih", grader: "invented", collection: "invented", numbering: ref,
    rights_id: rights, rights_status: "granted", search_index_allowed: true, ai_processing_allowed: true, max_quote_chars: null, expires_at: null,
    published: true, approved_search_document: true });
  const first = source('هذا نص تجريبي عن العفو والحقوق. ليس حديثا حقيقيا. [quran sura="27" aya_start="80" aya_end="80"]{آية مخترعة للاختبار}', "invented-1");
  const second = source("هذا نص تجريبي مختلف للسفر. ليس حديثا حقيقيا.", "invented-2");
  const index: SearchIndex = { version: 1, generation: "fixture-v1", space, passages: [first, second].map((s, i) => {
    const p = storedSourcePassages(s).passages[0]; assert.ok(p);
    return { ...p, permissions: { ...p.permissions, embeddings: true }, vector: { space, values: i ? [0, 1, 0] : [1, 0, 0], textHash: p.originalHash } };
  }) };
  const concern = { id: "concern-1", text: "Meaning absent from words", phrases: ["unmatched"], exactReferences: [], vector: { space, values: [1, 0, 0] } };
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema editorial; grant usage on schema editorial to service_role;
      create table editorial.source_rights(id uuid primary key,status text,search_index_allowed boolean,ai_processing_allowed boolean,expires_at date,max_quote_chars integer);
      create table public.scholars(id text primary key,name_ar text,name_en text,name_de text,approved boolean);
      create table public.sources(id uuid primary key,kind text,language text,reference text,text_original text,url text,scholar_id text,grade text,grader text,collection text,numbering text,title text,rights_id uuid,published boolean);
      create table public.source_search_documents(source_id uuid,approved boolean,lang text);
      grant select on editorial.source_rights,public.sources,public.scholars,public.source_search_documents to service_role;`);
    await db.exec(stateSql); await db.exec(migration);
    await db.query("insert into editorial.source_rights values($1,'granted',true,true,null,null)", [rights]);
    for (const s of [first, second]) {
      await db.query("insert into public.sources values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)", [s.id, s.kind, s.language, s.reference, s.text_original, s.url, s.scholar_id, s.grade, s.grader, s.collection, s.numbering, s.title, rights, true]);
      await db.query("insert into public.source_search_documents values($1,true,'ar')", [s.id]);
    }
    await check("visitor isolation and no implied embedding approval", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        try {
          await assert.rejects(db.query("select public.ask_search_index('manifest','{}')"), /permission denied/);
          await assert.rejects(db.query("select * from editorial.ask_index_passages"), /permission denied/);
        } finally { await db.exec("reset role"); }
      }
      await assert.rejects(store.publish(index, expiresAt, signal), /index_embedding_permission_or_space/);
      assert.deepEqual(await rpc("manifest", {}, signal), { status: "not_ready" });
    });
    // Explicit invented receipt. This is not permission for any real source.
    await db.query("insert into editorial.ask_index_embedding_rights values($1,true,'invented reviewer',$2,now(),now()+interval '2 hours')", [rights, "b".repeat(64)]);
    index.generation = "fixture-v2";
    await check("complete generation publication and real cosine discovery without word overlap", async () => {
      await store.publish(index, expiresAt, signal);
      const pinned = await store.manifest(signal);
      const found = await store.search(pinned, concern, "hadith", signal);
      assert.equal(found.hits[0].passage.sourceId, first.id);
      assert.deepEqual(found.hits[0].methods, ["semantic"]);
      assert.equal(found.hits[0].passage.original, first.text_original);
      assert.equal(found.hits[0].passage.vector, undefined);
    });
    await check("exact and normalized Arabic lexical channels fuse with semantic", async () => {
      const found = await store.search(await store.manifest(signal), { ...concern, phrases: ["العفو"], exactReferences: [first.reference] }, "hadith", signal);
      assert.deepEqual(new Set(found.hits[0].methods), new Set(["exact", "lexical", "semantic"]));
      assert.equal((await store.search(await store.manifest(signal), { ...concern, vector: undefined, phrases: ["العَفْو"] }, "hadith", signal)).hits[0].passage.sourceId, first.id);
    });
    await check("persisted lookup excludes formatting metadata and rejects stale lookup revisions",async()=>{
      const found=await store.search(await store.manifest(signal),{...concern,vector:undefined,phrases:["quran sura"]},"hadith",signal);
      assert.equal(found.hits.length,0);
      await assert.rejects(rpc("begin",{generation:"fixture-old-normalizer",space,lookup_revision:"old",expected_count:1,expires_at:expiresAt.toISOString()},signal),/invalid_index_space/);
      assert.equal((await store.manifest(signal)).generation,index.generation);
    });
    await check("immutable published generation and dimension/recipe rejection", async () => {
      await assert.rejects(rpc("append", { generation: index.generation, space, passages: [index.passages[0]] }, signal), /invalid_index_append/);
      await assert.rejects(store.search(await store.manifest(signal), { ...concern, vector: { space: { ...space, recipe: "c".repeat(64) }, values: [1, 0, 0] } }, "hadith", signal), /invalid_query/);
      await assert.rejects(rpc("search", { generation: index.generation, space, family: "hadith", phrases: [], references: [], vector: [1, 0] }, signal), /query_vector_mismatch/);
    });
    await check("actual concern retrieval uses one generation and query batch through PostgreSQL", async () => {
      const frame: QuestionFrame = { language: "de", kind: "question", questionType: "general", subjects: ["fixture"], requiredFacets: ["general"], qualifiers: [], searchQueries: {},
        requirements: [{ id: "R1", text: "First invented concern", facet: "general", searchQueries: { de: ["unmatched"] } },
          { id: "R2", text: "Second invented concern", facet: "general", searchQueries: { en: ["unmatched"] } }] };
      let batches=0;
      const found=await retrieveFromPersistentCorpus(frame,rpc,{signal,embedder:{space,embedQueries:async () => {batches++; return [[1,0,0],[0,1,0]];}}});
      assert.equal(batches,1); assert.equal(found.generation,index.generation);
      assert.equal(found.hits.length,2); assert.equal(found.unrepresentedConcernIds.length,0);
      assert.equal(found.audits.length,4); assert.equal(found.semantic,"used");
    });
    await check("current source changes exclude before method limits", async () => {
      const pinned = await store.manifest(signal);
      await db.query("update public.sources set text_original='changed original' where id=$1", [first.id]);
      const found = await store.search(pinned, concern, "hadith", signal);
      assert.equal(found.eligible, 1); assert.equal(found.hits.some(h => h.passage.sourceId === first.id), false);
      await db.query("update public.sources set text_original=$2 where id=$1", [first.id, first.text_original]);
      await db.query("update public.sources set grader='changed attribution' where id=$1", [first.id]);
      assert.equal((await store.search(pinned, concern, "hadith", signal)).eligible, 1);
      await db.query("update public.sources set grader=$2 where id=$1", [first.id, first.grader]);
    });
    await check("embedding revocation retains permitted lexical search but prunes stored vectors", async () => {
      await db.query("update editorial.ask_index_embedding_rights set allowed=false where rights_id=$1", [rights]);
      const found = await store.search(await store.manifest(signal), { ...concern, phrases: ["العفو"] }, "hadith", signal);
      assert.equal(found.semanticEligible, 0); assert.deepEqual(found.hits[0].methods, ["lexical"]);
      await store.prune(signal);
      assert.equal((await db.query("select count(*)::int count from editorial.ask_index_passages where embedding is not null")).rows[0].count, 0);
    });
    await check("withdrawn sources and approvals physically prune indexed text", async () => {
      await db.query("update public.sources set published=false where id=$1", [first.id]);
      await db.query("update public.source_search_documents set approved=false where source_id=$1", [second.id]);
      assert.equal((await store.search(await store.manifest(signal), concern, "hadith", signal)).eligible, 0);
      await store.prune(signal);
      assert.equal((await db.query("select count(*)::int count from editorial.ask_index_passages")).rows[0].count, 0);
      await db.exec("update public.sources set published=true; update public.source_search_documents set approved=true");
    });
    await check("failed staging never replaces the active generation; altered payload rolls back", async () => {
      const lexical: SearchIndex = { ...index, generation: "fixture-lexical", passages: index.passages.map(({ vector: _v, ...p }) => ({ ...p, permissions: { ...p.permissions, embeddings: false } })) };
      await store.publish(lexical, expiresAt, signal);
      await rpc("begin", { generation: "fixture-bad", space, lookup_revision: SOURCE_LOOKUP_REVISION, expected_count: 2, expires_at: expiresAt.toISOString() }, signal);
      const payloads = lexical.passages.map(p => ({ ...p, lexicalText: searchTokens(p.original).join(" ") }));
      payloads[1].reference = "wrong-attribution";
      await assert.rejects(rpc("append", { generation: "fixture-bad", space, passages: payloads }, signal), /index_source_mismatch/);
      assert.equal((await db.query("select count(*)::int count from editorial.ask_index_passages where generation='fixture-bad'")).rows[0].count, 0);
      await assert.rejects(rpc("publish", { generation: "fixture-bad" }, signal), /index_publication_incomplete/);
      assert.equal((await store.manifest(signal)).generation, lexical.generation);
    });
    await check("scholar approval, exact names and source-specific context remain current", async () => {
      const scholarId="ibn-baz";
      const row: StoredSearchSource={...first,id:randomUUID(),kind:"fatwa",scholar_id:scholarId,scholar_name_ar:"اسم تجريبي",scholar_name_en:"Invented Name",scholar_name_de:"Beispielname",
        reference:"Invented fatwa",title:"Invented scholarly fixture",text_original:"هذا مثال تجريبي مخترع لا يمثل فتوى حقيقية ولا كلام أي عالم.",url:"https://example.org/invented-fatwa",grade:null,grader:null,collection:null,numbering:null};
      await db.query("insert into public.scholars values($1,$2,$3,$4,true)",[scholarId,row.scholar_name_ar,row.scholar_name_en,row.scholar_name_de]);
      await db.query("insert into public.sources values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",[row.id,row.kind,row.language,row.reference,row.text_original,row.url,row.scholar_id,null,null,null,null,row.title,rights,true]);
      await db.query("insert into public.source_search_documents values($1,true,'ar')",[row.id]);
      const scholarIndex:SearchIndex={version:1,generation:"fixture-scholar",space,passages:storedSourcePassages(row).passages};
      await store.publish(scholarIndex,expiresAt,signal);
      const pinned=await store.manifest(signal);
      const query={...concern,vector:undefined,phrases:["تجريبي"]};
      let found=await store.search(pinned,query,"scholar",signal);
      assert.equal(found.hits.length,1); assert.equal(found.hits[0].passage.context.complete,false);
      assert.equal(found.hits[0].passage.attribution.scholarName?.de,"Beispielname");
      await db.query("update public.scholars set approved=false where id=$1",[scholarId]);
      assert.equal((await store.search(pinned,query,"scholar",signal)).eligible,0);
      await db.query("update public.scholars set approved=true,name_de='changed name' where id=$1",[scholarId]);
      assert.equal((await store.search(pinned,query,"scholar",signal)).eligible,0);
      await db.query("update public.scholars set name_de=$2 where id=$1",[scholarId,row.scholar_name_de]);
      await db.query("update editorial.source_rights set ai_processing_allowed=false where id=$1",[rights]);
      assert.equal((await store.search(pinned,query,"scholar",signal)).eligible,0);
      await db.query("update editorial.source_rights set ai_processing_allowed=true where id=$1",[rights]);
    });
    await check("explicit withdrawal removes pointer and fences pinned reads", async () => {
      const pinned = await store.manifest(signal);
      await store.withdraw(pinned.generation, signal);
      await assert.rejects(store.search(pinned, concern, "hadith", signal), /index_generation_unavailable/);
      await assert.rejects(store.manifest(signal), /not_ready/);
      await store.prune(signal);
      assert.equal((await db.query("select count(*)::int count from editorial.ask_index_generations where state='withdrawn'")).rows[0].count, 0);
    });
    await check("cancellation makes no storage request", async () => {
      const cancelled = new AbortController(); cancelled.abort();
      await assert.rejects(store.manifest(cancelled.signal), /abort/i);
    });
    await check("expired generation fences reads and pruning removes its text", async () => {
      const lexical: SearchIndex={...index,generation:"fixture-expiry",passages:index.passages.map(({vector:_v,...p})=>({...p,permissions:{...p.permissions,embeddings:false}}))};
      await store.publish(lexical,expiresAt,signal);
      const pinned=await store.manifest(signal);
      await db.exec("update editorial.ask_index_generations set created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' where id='fixture-expiry'");
      await assert.rejects(store.search(pinned,concern,"hadith",signal),/index_generation_unavailable/);
      await store.prune(signal);
      assert.equal((await db.query("select count(*)::int count from editorial.ask_index_passages where generation='fixture-expiry'")).rows[0].count,0);
    });
    await writeFile(join(root, "persistent-index-verification.json"), JSON.stringify({ checkedAt: new Date().toISOString(), checks,
      passed: true, mode: "local_postgresql_real_pgvector_invented_content", migrationHash: createHash("sha256").update(migration).digest("hex"),
      remoteWrites: false, modelCalls: 0, realReligiousAccuracy: "not_assessed", annScaleAcceptance: "not_assessed" }, null, 2));
    console.info(`Passed ${checks.length} local PostgreSQL/pgvector scenario groups.`);
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
