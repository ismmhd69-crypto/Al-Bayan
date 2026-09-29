import { searchText } from "./scholar-excerpt";
import { APPROVED_CHANNELS, type ApprovedChannel } from "./youtube-channels";

// Automatic checks for videos from the approved channels (Mo, 2026-09-28: channel approval is enough,
// after these checks). Pure functions so they can be tested without YouTube.

export const MIN_SECONDS = 60; // shorter clips (Shorts) are usually cut without context
export const MAX_SECONDS = 40 * 60;

/** The parts of a YouTube Data API `videos.list` item that the checks read. */
export type YouTubeVideo = {
  id: string;
  snippet?: {
    channelId?: string;
    title?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    defaultAudioLanguage?: string;
  };
  contentDetails?: { duration?: string; contentRating?: { ytRating?: string } };
  status?: { privacyStatus?: string; embeddable?: boolean; uploadStatus?: string };
};

export type VideoRow = {
  youtube_id: string;
  channel_id: string;
  scholar_id: string;
  title: string;
  language: "ar" | "en" | "de";
  duration_seconds: number;
  published_at: string | null;
  search_text: string;
  approved: true;
  last_checked_at: string;
};

/** A related video shown under an answer (click to play). */
export type VideoSuggestion = {
  youtubeId: string;
  channelId: string;
  title: string;
  minutes: number;
  language: "ar" | "en" | "de";
};

/** ISO 8601 duration as YouTube gives it ("PT1H2M3S", "P1DT2H") in seconds; null if unreadable. */
export function durationSeconds(iso: string | undefined): number | null {
  const m = iso?.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m || iso === "P" || iso === "PT") return null;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

function languageOf(audio: string | undefined): VideoRow["language"] {
  if (audio?.startsWith("en")) return "en";
  if (audio?.startsWith("de")) return "de";
  return "ar";
}

/**
 * The row to store, or the reason the video is skipped. `expected` is the channel whose upload list
 * the video came from; the video's own channel must match it and be on the approved list.
 */
export function checkVideo(
  v: YouTubeVideo,
  expected: ApprovedChannel,
  now = new Date(),
): { row: VideoRow } | { skip: string } {
  const sn = v.snippet ?? {};
  const channel = APPROVED_CHANNELS.find((c) => c.channelId === sn.channelId);
  if (!channel || channel.channelId !== expected.channelId) return { skip: "not from the approved channel" };
  if (!/^[A-Za-z0-9_-]{11}$/.test(v.id)) return { skip: "bad video id" };
  if (v.status?.privacyStatus !== "public") return { skip: "not public" };
  if (v.status?.embeddable !== true) return { skip: "not embeddable" };
  if (v.status?.uploadStatus && v.status.uploadStatus !== "processed") return { skip: "not processed" };
  if ((sn.liveBroadcastContent ?? "none") !== "none") return { skip: "live or upcoming" };
  if (v.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") return { skip: "age restricted" };
  const seconds = durationSeconds(v.contentDetails?.duration);
  if (seconds === null) return { skip: "no length" };
  if (seconds < MIN_SECONDS) return { skip: "too short" };
  if (seconds > MAX_SECONDS) return { skip: "too long" };
  const title = (sn.title ?? "").trim();
  const search = searchText(title, "");
  if (!title || !search) return { skip: "no Arabic title" };
  return {
    row: {
      youtube_id: v.id,
      channel_id: channel.channelId,
      scholar_id: channel.scholarId,
      title,
      language: languageOf(sn.defaultAudioLanguage),
      duration_seconds: seconds,
      published_at: sn.publishedAt ?? null,
      search_text: search,
      approved: true,
      last_checked_at: now.toISOString(),
    },
  };
}
