import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PassageRecord } from "./passage-record";
import type { FollowUpContext } from "./follow-up";

type ParentRef = { v: 1; tid: string; lang: "ar" | "en"; exp: number; sentences: string; sources: PassageRecord[] };
const sentenceHash = (sentences: string[]) => createHash("sha256").update(JSON.stringify(sentences.map(s => s.normalize("NFC")))).digest("hex");
const digest = /^[a-f0-9]{64}$/;
const validRecord = (r: PassageRecord) => r && ["quran", "hadith", "scholar"].includes(r.kind) && typeof r.id === "string"
  && /^(?:Q\d{1,3}:\d{1,3}|SH[a-f0-9-]{36}|S[a-f0-9-]{36})$/i.test(r.id) && digest.test(r.original)
  && (r.translation === undefined || digest.test(r.translation)) && (r.context === undefined || r.kind === "quran" && digest.test(r.context));
export function signParentReference(sentences: string[], sources: PassageRecord[], lang: "ar" | "en", now = Date.now()) {
  const secret = process.env.ASK_FOLLOW_UP_SECRET;
  if (!secret || !sentences.length || sentences.length > 8 || sentences.some(s => !s || s.length > 600)
    || !sources.length || sources.length > 8 || !sources.every(validRecord)) return undefined;
  const payload: ParentRef = { v: 1, tid: randomUUID(), lang, exp: now + 24 * 60 * 60_000, sentences: sentenceHash(sentences), sources };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}
/** Reopened saved chats: a reference the server signed earlier, for these exact sentences, gets a
 * fresh 24 hours. Expiry is the only check skipped. The signature, sentence hash, language and
 * record shape are all verified, and every use still reloads the sources and compares their hashes. */
export function renewParentReference(ref: unknown, sentences: string[], lang: "ar" | "en", now = Date.now()): string | undefined {
  try {
    const secret = process.env.ASK_FOLLOW_UP_SECRET;
    if (!secret || typeof ref !== "string" || ref.length > 8192 || !sentences.length || sentences.length > 8 || sentences.some(s => typeof s !== "string" || !s || s.length > 600)) return undefined;
    const [encoded, signature, extra] = ref.split(".");
    if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return undefined;
    const expected = createHmac("sha256", secret).update(encoded).digest(), actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
    const p = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ParentRef;
    if (p.v !== 1 || typeof p.tid !== "string" || p.lang !== lang || p.sentences !== sentenceHash(sentences) || !Array.isArray(p.sources)
      || !p.sources.length || p.sources.length > 8 || !p.sources.every(validRecord) || new Set(p.sources.map(s => s.id)).size !== p.sources.length) return undefined;
    const renewed = Buffer.from(JSON.stringify({ ...p, exp: now + 24 * 60 * 60_000 } satisfies ParentRef)).toString("base64url");
    return `${renewed}.${createHmac("sha256", secret).update(renewed).digest("base64url")}`;
  } catch { return undefined; }
}
export function verifyParentReference(input: unknown, lang: "ar" | "en", now = Date.now()): Pick<FollowUpContext, "parent" | "parentUnavailable" | "parentRecords"> {
  if (input === undefined) return { parentUnavailable: false };
  const unavailable = { parentUnavailable: true };
  try {
    const raw = input as { ref: string; sentences: string[] }, secret = process.env.ASK_FOLLOW_UP_SECRET;
    if (!secret || typeof raw?.ref !== "string" || raw.ref.length > 8192 || !Array.isArray(raw.sentences) || !raw.sentences.length
      || raw.sentences.length > 8 || raw.sentences.some(s => typeof s !== "string" || !s || s.length > 600)) return unavailable;
    const [encoded, signature, extra] = raw.ref.split(".");
    if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return unavailable;
    const expected = createHmac("sha256", secret).update(encoded).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return unavailable;
    const p = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ParentRef;
    if (p.v !== 1 || typeof p.tid !== "string" || p.lang !== lang || !Number.isSafeInteger(p.exp) || p.exp <= now
      || p.sentences !== sentenceHash(raw.sentences) || !Array.isArray(p.sources) || !p.sources.length || p.sources.length > 8
      || !p.sources.every(validRecord) || new Set(p.sources.map(s => s.id)).size !== p.sources.length) return unavailable;
    return { parentUnavailable: false, parent: { displayed_sentences: raw.sentences.map(s => s.normalize("NFC")),
      sources: p.sources.map(s => ({ id: s.id, kind: s.kind, label: s.id })) }, parentRecords: p.sources };
  } catch { return unavailable; }
}
