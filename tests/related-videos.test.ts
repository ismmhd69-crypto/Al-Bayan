import { describe, expect, it, vi } from "vitest";
import { refreshRelatedVideos, validRelatedVideos, type RelatedVideos } from "@/lib/ask/related-videos";
import { validRichAnswer, reduceRichEvent, emptyRichState } from "@/lib/ask/rich-answer";
import { APPROVED_CHANNELS } from "@/lib/sources/youtube-channels";
import { runRichAnswer } from "@/lib/ask/rich-engine";
import { hydrateAnswer } from "@/lib/chat/hydrate";
import { stripAnswer } from "@/lib/chat/answer-store";
import { dependencies, pack, sections } from "./fixtures/rich";
vi.mock("server-only", () => ({}));
export const clips: RelatedVideos = { version: 1, basis: "title_only", items: [{ youtubeId: "abcdefghijk", channelId: APPROVED_CHANNELS[0].channelId, title: "An invented learning clip", minutes: 3, language: "en" }] };

describe("metadata-only rich learning attachments", () => {
  it("rejects fabricated channels, duplicates, evidence claims and timestamp fields", () => {
    expect(validRelatedVideos(clips)).toBe(true);
    expect(validRelatedVideos({ ...clips, basis: "transcript_verified" })).toBe(false);
    expect(validRelatedVideos({ ...clips, evidence: true })).toBe(false);
    expect(validRelatedVideos({ ...clips, items: [...clips.items, ...clips.items] })).toBe(false);
    expect(validRelatedVideos({ ...clips, items: [{ ...clips.items[0], channelId: "unapproved" }] })).toBe(false);
    expect(validRelatedVideos({ ...clips, items: [{ ...clips.items[0], start: 30 }] })).toBe(false);
  });
  it("drops unavailable, changed or unrefreshed clips without inventing new relevance", async () => {
    expect(await refreshRelatedVideos(clips)).toBeUndefined();
    expect(await refreshRelatedVideos(clips, async () => [])).toBeUndefined();
    expect(await refreshRelatedVideos(clips, async () => [{ ...clips.items[0], title: "Changed teaching" }])).toBeUndefined();
    expect(await refreshRelatedVideos(clips, async () => { throw new Error("outage"); })).toBeUndefined();
    expect(await refreshRelatedVideos(clips, async () => clips.items)).toEqual(clips);
  });
  it("does not wait forever for an optional lookup which ignores cancellation", async () => {
    const abort = new AbortController();
    const result = refreshRelatedVideos(clips, () => new Promise(() => {}), abort.signal);
    abort.abort(); expect(await result).toBeUndefined();
  });
  it("preserves v4 terminal attachments without changing section order or accepting them in v3", async () => {
    const result = await runRichAnswer(pack, "en", dependencies(), new AbortController().signal, "Explain care", {});
    expect(result.status).toBe("rich_answer"); if (result.status !== "rich_answer") return;
    result.answer.videos = clips;
    expect(validRichAnswer(result.answer)).toBe(true);
    expect(validRichAnswer({ ...result.answer, version: 3, guide: "study_evidence" })).toBe(false);
    let state = emptyRichState();
    for (const section of result.answer.sections) state = reduceRichEvent(state, { request_id: "request", sequence: state.sequence + 1, type: "section", section });
    expect(reduceRichEvent(state, { request_id: "request", sequence: 5, type: "terminal", result }).terminal).toBe(true);
  });
  it("rehydrates approved clips and drops revoked clips while keeping the written answer", async () => {
    const result = await runRichAnswer(pack, "en", dependencies(), new AbortController().signal, "Explain care", {});
    if (result.status !== "rich_answer") throw new Error("fixture_failed");
    result.answer.videos = clips;
    const getVerse = async () => pack.passages[0].source.kind === "quran" ? pack.passages[0].source.verse : undefined;
    const getHadith = async () => pack.passages[1].source.kind === "hadith" ? pack.passages[1].source.hadith : null;
    const saved = stripAnswer(result.answer);
    const good = await hydrateAnswer(saved, { getVerse, getHadith, refreshVideos: async () => clips.items });
    expect(good.ok && good.answer.version === 4 && good.answer.videos).toEqual(clips);
    const revoked = await hydrateAnswer(saved, { getVerse, getHadith, refreshVideos: async () => [] });
    expect(revoked.ok).toBe(true);
    expect(revoked.ok && revoked.answer.version === 4 && revoked.answer.videos).toBeUndefined();
    expect(sections.length).toBe(4);
  });
});
