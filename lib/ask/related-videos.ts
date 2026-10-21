import { isValidVideo } from "./answer-v2";
import type { VideoSuggestion } from "@/lib/sources/youtube-rules";
import { abortable } from "./abort";

/** Metadata-only learning suggestions. No timestamps or transcript/evidence claim. */
export type RelatedVideos = { version: 1; basis: "title_only"; items: VideoSuggestion[] };
export function validRelatedVideos(value: unknown): value is RelatedVideos {
  const v = value as RelatedVideos | null;
  return !!v && Object.keys(v).sort().join(",") === "basis,items,version"
    && v.version === 1 && v.basis === "title_only" && Array.isArray(v.items)
    && v.items.length > 0 && v.items.length <= 2 && v.items.every(isValidVideo)
    && new Set(v.items.map(item => item.youtubeId)).size === v.items.length
    && new Set(v.items.map(item => item.title.trim())).size === v.items.length;
}
export type VideoRefresh = (items: VideoSuggestion[], signal: AbortSignal) => Promise<VideoSuggestion[]>;
/** Optional attachments must never withdraw an otherwise checked written answer. */
export async function refreshRelatedVideos(value: unknown, load?: VideoRefresh, signal?: AbortSignal): Promise<RelatedVideos | undefined> {
  if (!validRelatedVideos(value) || !load) return undefined;
  const bounded = signal ? AbortSignal.any([signal, AbortSignal.timeout(2000)]) : AbortSignal.timeout(2000);
  try {
    const current = await abortable(load(value.items, bounded), bounded);
    const same = (a: VideoSuggestion, b: VideoSuggestion) => a.youtubeId === b.youtubeId && a.channelId === b.channelId
      && a.title === b.title && a.minutes === b.minutes && a.language === b.language;
    const items = value.items.filter(item => current.some(v => isValidVideo(v) && same(item, v)));
    return items.length ? { version: 1, basis: "title_only", items } : undefined;
  } catch { return undefined; }
}
