import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { searchQueryLevels } from "./scholar-rules";
import { approvedChannelIds } from "./youtube-channels";
import type { VideoSuggestion } from "./youtube-rules";

// Finds videos from the approved YouTube channels whose titles match the question's Arabic phrases
// (library filled by scripts/sync-videos.ts). Server only: the search function is not public.

let client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

type VideoHit = {
  youtube_id: string;
  channel_id: string | null;
  title: string;
  language: "ar" | "en" | "de" | null;
  duration_seconds: number | null;
};

export async function searchVideos(phrases: string[], limit = 12): Promise<VideoSuggestion[]> {
  const supabase = db();
  if (!supabase) return [];
  // Every word of a phrase must be in the title; Ask's phrases are often longer than video titles,
  // so looser levels are tried when the strict search finds nothing (see searchQueryLevels).
  const hits: VideoHit[] = [];
  for (const query of searchQueryLevels(phrases)) {
    const { data, error } = await supabase.rpc("search_approved_videos", { query_text: query, match_count: limit * 3 });
    if (error) throw new Error(`video search failed: ${error.message}`);
    for (const hit of (data as VideoHit[] | null) ?? []) {
      if (!hits.some((existing) => existing.youtube_id === hit.youtube_id)) hits.push(hit);
      if (hits.length >= limit) break;
    }
    if (hits.length >= limit) break;
  }
  const seen = new Set<string>();
  return hits
    .filter((v) => v.channel_id && approvedChannelIds.has(v.channel_id))
    // One title once: channels often upload the same clip twice.
    .filter((v) => !seen.has(v.title) && !!seen.add(v.title))
    .slice(0, limit)
    .map((v) => ({
      youtubeId: v.youtube_id,
      channelId: v.channel_id!,
      title: v.title,
      minutes: Math.max(1, Math.round((v.duration_seconds ?? 60) / 60)),
      language: v.language === "en" || v.language === "de" ? v.language : "ar",
    }));
}
