import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ rows: [] as unknown[], fail: false, eq: vi.fn(), ids: vi.fn(), abort: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (table: string) => {
  if (table !== "videos") throw new Error("unexpected_table");
  const query = { select: () => query, eq: (...args: unknown[]) => { fake.eq(...args); return query; },
    in: (...args: unknown[]) => { fake.ids(...args); return query; }, limit: () => query,
    abortSignal: (signal: AbortSignal) => { fake.abort(signal); return Promise.resolve({ data: fake.rows, error: fake.fail ? {} : null }); } };
  return query;
} }) }));
import { currentVideos } from "@/lib/sources/videos";
import { APPROVED_CHANNELS } from "@/lib/sources/youtube-channels";
const clip = { youtubeId: "abcdefghijk", channelId: APPROVED_CHANNELS[0].channelId, title: "Invented learning clip", language: "en" as const, minutes: 3 };
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://bayan.invalid"); vi.stubEnv("SUPABASE_SECRET_KEY", "invented");
  vi.stubEnv("ASK_RICH_VIDEOS", "true"); vi.stubEnv("VIDEOS", "on");
  fake.rows = [{ youtube_id: clip.youtubeId, channel_id: clip.channelId, title: clip.title, duration_seconds: 180, language: "en" }];
  fake.fail = false; vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());
describe("current stored clip approval", () => {
  it("reads only approved requested IDs and forwards cancellation", async () => {
    const signal = new AbortController().signal;
    expect(await currentVideos([clip], signal)).toEqual([clip]);
    expect(fake.eq).toHaveBeenCalledWith("approved", true);
    expect(fake.ids).toHaveBeenCalledWith("youtube_id", [clip.youtubeId]);
    expect(fake.abort).toHaveBeenCalledWith(signal);
  });
  it("rejects revoked channels and respects the independent rollback", async () => {
    fake.rows = [{ ...(fake.rows[0] as object), channel_id: "not-approved" }];
    expect(await currentVideos([clip], new AbortController().signal)).toEqual([]);
    vi.stubEnv("ASK_RICH_VIDEOS", "false"); vi.clearAllMocks();
    expect(await currentVideos([clip], new AbortController().signal)).toEqual([]);
    expect(fake.ids).not.toHaveBeenCalled();
  });
  it("reports a database outage instead of treating it as a current approval", async () => {
    fake.fail = true;
    await expect(currentVideos([clip], new AbortController().signal)).rejects.toThrow("video_refresh_failed");
  });
});
