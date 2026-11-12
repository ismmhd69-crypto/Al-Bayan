import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { stripAnswer } from "@/lib/chat/answer-store";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { checkedPassages } from "@/lib/ask/checked-passages";
import { pack, richAnswer } from "./fixtures/rich";

it.each([true, false])("stores hashes without Quran/hadith text and detects current source changes=%s", async changed => {
  const answer = structuredClone(richAnswer);
  answer.parentReference = "must-not-survive-saved-chat";
  const records = checkedPassages(pack, new Map(), new Set());
  answer.checkedHashes = Object.fromEntries(records.map(r => [r.id, r]));
  const stored = stripAnswer(answer);
  // Plan version 5.1, saved-chat continuation: the stored copy keeps the reference string, but it is
  // never trusted as stored. An unsigned one, as here, still never survives reopening (asserted below).
  expect(stored.parentReference).toBe("must-not-survive-saved-chat");
  expect(stored.checkedHashes).toEqual(answer.checkedHashes);
  const q = pack.passages[0].source, h = pack.passages[1].source, s = pack.passages[2].source;
  if (q.kind !== "quran" || h.kind !== "hadith" || s.kind !== "scholar") throw Error("fixture");
  expect(JSON.stringify(stored)).not.toContain(q.verse.arabic);
  expect(JSON.stringify(stored)).not.toContain(h.hadith.arabic);
  const getScholar = vi.fn(async () => ({ ...s.quote, arabic: s.quote.arabic + (changed ? " جديد" : "") }));
  const hydrated = await hydrateAnswer(stored, { getVerse: async () => ({ ...q.verse, arabic: q.verse.arabic + (changed ? " جديد" : "") }),
    getHadith: async () => h.hadith, getScholar, neighbours: async () => [] });
  expect(hydrated.ok).toBe(true);
  if (!hydrated.ok || hydrated.answer.version === 2) return;
  const rich = hydrated.answer;
  expect(rich).not.toHaveProperty("parentReference");
  expect(rich.checkedHashes).toEqual(answer.checkedHashes);
  const hashed = rich.sections.flatMap(group => group.sources).filter(source => !!rich.checkedHashes?.[source.id]);
  const unhashed = rich.sections.flatMap(group => group.sources).filter(source => !rich.checkedHashes?.[source.id]);
  expect(hashed.length).toBeGreaterThan(0); expect(hashed.every(source => source.sourceUpdated === changed)).toBe(true);
  expect(unhashed.length).toBeGreaterThan(0); expect(unhashed.every(source => source.sourceUpdated === undefined)).toBe(true);
  expect(getScholar).toHaveBeenCalledTimes(1);
});
