// Tests for the automatic video checks. Made-up videos.
import { describe, expect, it } from "vitest";
import { checkVideo, durationSeconds, type YouTubeVideo } from "@/lib/sources/youtube-rules";
import { APPROVED_CHANNELS } from "@/lib/sources/youtube-channels";

const ibnBaz = APPROVED_CHANNELS[0];
const khamis = APPROVED_CHANNELS.find((c) => c.scholarId === "othman-al-khamis")!;

const video = (over: Partial<YouTubeVideo> = {}): YouTubeVideo => ({
  id: "abcdefghijk",
  snippet: {
    channelId: ibnBaz.channelId,
    title: "حكم صلاة الجماعة",
    publishedAt: "2020-01-01T00:00:00Z",
    liveBroadcastContent: "none",
  },
  contentDetails: { duration: "PT5M30S" },
  status: { privacyStatus: "public", embeddable: true, uploadStatus: "processed" },
  ...over,
});

describe("durationSeconds", () => {
  it("reads YouTube durations", () => {
    expect(durationSeconds("PT5M30S")).toBe(330);
    expect(durationSeconds("PT1H")).toBe(3600);
    expect(durationSeconds("P1DT1S")).toBe(86401);
    expect(durationSeconds("PT45S")).toBe(45);
  });
  it("refuses unreadable values", () => {
    expect(durationSeconds(undefined)).toBeNull();
    expect(durationSeconds("P")).toBeNull();
    expect(durationSeconds("5 minutes")).toBeNull();
  });
});

describe("checkVideo", () => {
  it("accepts a normal video from an approved channel, approved and with its scholar", () => {
    const r = checkVideo(video(), ibnBaz);
    expect("row" in r && r.row).toMatchObject({
      youtube_id: "abcdefghijk",
      channel_id: ibnBaz.channelId,
      scholar_id: "ibn-baz",
      title: "حكم صلاة الجماعة",
      duration_seconds: 330,
      language: "ar",
      approved: true,
    });
    expect("row" in r && r.row.search_text).toContain("صلاه");
  });

  it("maps each channel to its scholar", () => {
    const r = checkVideo(video({ snippet: { ...video().snippet, channelId: khamis.channelId } }), khamis);
    expect("row" in r && r.row.scholar_id).toBe("othman-al-khamis");
  });

  it("refuses a video whose own channel is not the approved one, even if listed there", () => {
    expect(checkVideo(video({ snippet: { ...video().snippet, channelId: "UCsomeoneelse0000000000" } }), ibnBaz)).toEqual({ skip: "not from the approved channel" });
    // From another approved channel than the list it came from
    expect("skip" in checkVideo(video({ snippet: { ...video().snippet, channelId: khamis.channelId } }), ibnBaz)).toBe(true);
  });

  it("refuses private, unlisted, not embeddable, live and age-restricted videos", () => {
    expect(checkVideo(video({ status: { privacyStatus: "unlisted", embeddable: true } }), ibnBaz)).toEqual({ skip: "not public" });
    expect(checkVideo(video({ status: { privacyStatus: "public", embeddable: false } }), ibnBaz)).toEqual({ skip: "not embeddable" });
    expect(checkVideo(video({ snippet: { ...video().snippet, liveBroadcastContent: "upcoming" } }), ibnBaz)).toEqual({ skip: "live or upcoming" });
    expect(checkVideo(video({ contentDetails: { duration: "PT5M", contentRating: { ytRating: "ytAgeRestricted" } } }), ibnBaz)).toEqual({ skip: "age restricted" });
  });

  it("refuses Shorts, very long recordings and titles without Arabic words", () => {
    expect(checkVideo(video({ contentDetails: { duration: "PT59S" } }), ibnBaz)).toEqual({ skip: "too short" });
    expect(checkVideo(video({ contentDetails: { duration: "PT40M1S" } }), ibnBaz)).toEqual({ skip: "too long" });
    expect(checkVideo(video({ snippet: { ...video().snippet, title: "Live 2020 #1" } }), ibnBaz)).toEqual({ skip: "no Arabic title" });
  });

  it("uses the audio language when YouTube gives English or German", () => {
    const r = checkVideo(video({ snippet: { ...video().snippet, defaultAudioLanguage: "en-US" } }), ibnBaz);
    expect("row" in r && r.row.language).toBe("en");
  });
});
