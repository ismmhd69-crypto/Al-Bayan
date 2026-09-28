import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toSearchQuery } from "./scholar-rules";
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

// The first `n` words of a phrase that toSearchQuery would keep (at least 2 words must remain).
function shorten(phrase: string, n: number): string {
  if (!Number.isFinite(n)) return phrase;
  const kept = toSearchQuery([phrase]).split(" ").filter(Boolean);
  return kept.length >= 2 ? kept.slice(0, n).join(" ") : "";
}

type VideoHit = { youtube_id: string; channel_id: string | null; title: string; duration_seconds: number | null };

export async function searchVideos(phrases: string[], limit = 2): Promise<VideoSuggestion[]> {
  const supabase = db();
  if (!supabase) return [];
  // Every word of a phrase must be in the title. Ask's phrases are often longer than video titles,
  // so if the full phrases find nothing, try their first 3 words, then their first 2 (never one
  // word alone, which would match loosely related videos).
  let hits: VideoHit[] = [];
  const tried = new Set<string>();
  for (const words of [Infinity, 3, 2]) {
    const query = toSearchQuery(phrases.map((p) => shorten(p, words)));
    if (!query || tried.has(query)) continue;
    tried.add(query);
    const { data, error } = await supabase.rpc("search_approved_videos", { query_text: query, match_count: limit * 3 });
    if (error) throw new Error(`video search failed: ${error.message}`);
    hits = (data as VideoHit[] | null) ?? [];
    if (hits.length > 0) break;
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
    }));
}
