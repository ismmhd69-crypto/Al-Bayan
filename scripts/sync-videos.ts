// Copies the video lists of the approved YouTube channels (lib/sources/youtube-channels.ts) into
// public.videos. Run by Claude or Mo on a computer, never by visitors:
//
//   npx tsx scripts/sync-videos.ts            (all channels)
//   npx tsx scripts/sync-videos.ts --dry-run  (fetch and print, write nothing)
//   add --limit=N to read at most N pages (50 videos each) per channel
//   add --new-only to stop each channel at the first page of already stored videos (daily top-up)
//
// Mo's decision (2026-09-28): channel approval is enough, so videos that pass the checks in
// lib/sources/youtube-rules.ts are stored as approved. Videos already stored are never changed,
// so a video Mo hid (approved = false) stays hidden. Only titles, ids and lengths are stored,
// never the videos themselves.
//
// Quota: reading upload lists and video details costs 1 unit per 50 videos (YouTube's daily limit is
// 10,000). The run stops before QUOTA_BUDGET; running it again continues where it stopped: pages of
// already stored videos cost 1 unit each and need no details.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { APPROVED_CHANNELS, type ApprovedChannel } from "@/lib/sources/youtube-channels";
import { checkVideo, type VideoRow, type YouTubeVideo } from "@/lib/sources/youtube-rules";

process.loadEnvFile(".env");

const DRY_RUN = process.argv.includes("--dry-run");
const NEW_ONLY = process.argv.includes("--new-only");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const QUOTA_BUDGET = 8000;
const API = "https://www.googleapis.com/youtube/v3";

let unitsUsed = 0;

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY must be set in .env");
  unitsUsed++;
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) {
    // Never print the URL: it contains the key.
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`YouTube ${path} failed (${res.status}): ${body?.error?.message ?? "no details"}`);
  }
  return (await res.json()) as T;
}

/** All youtube ids already stored for a channel (approved or hidden). */
async function knownIds(db: SupabaseClient, channelId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("videos").select("youtube_id").eq("channel_id", channelId).range(from, from + 999);
    if (error) throw new Error(`could not read stored videos: ${error.message}`);
    for (const r of data ?? []) ids.add(r.youtube_id);
    if (!data || data.length < 1000) return ids;
  }
}

async function syncChannel(db: SupabaseClient, channel: ApprovedChannel) {
  const uploads = "UU" + channel.channelId.slice(2); // YouTube's upload list for a channel
  const known = await knownIds(db, channel.channelId);
  const skips = new Map<string, number>();
  let stored = 0, pages = 0, pageToken = "";

  while (pages < LIMIT && unitsUsed < QUOTA_BUDGET) {
    const page = await yt<{ items?: { contentDetails?: { videoId?: string } }[]; nextPageToken?: string }>("playlistItems", {
      part: "contentDetails",
      playlistId: uploads,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    pages++;
    const ids = (page.items ?? []).map((i) => i.contentDetails?.videoId).filter((id): id is string => !!id);
    const fresh = ids.filter((id) => !known.has(id));
    if (NEW_ONLY && ids.length > 0 && fresh.length === 0) break; // reached videos stored in an earlier run

    if (fresh.length > 0) {
      const details = await yt<{ items?: YouTubeVideo[] }>("videos", {
        part: "snippet,contentDetails,status",
        id: fresh.join(","),
        maxResults: "50",
      });
      const rows: VideoRow[] = [];
      for (const v of details.items ?? []) {
        const result = checkVideo(v, channel);
        if ("skip" in result) skips.set(result.skip, (skips.get(result.skip) ?? 0) + 1);
        else rows.push(result.row);
      }
      if (DRY_RUN) {
        for (const r of rows.slice(0, 3)) console.log(`  ${Math.round(r.duration_seconds / 60)} min | ${r.title} | https://youtu.be/${r.youtube_id}`);
      } else if (rows.length > 0) {
        const { error } = await db.from("videos").upsert(rows, { onConflict: "youtube_id", ignoreDuplicates: true });
        if (error) throw new Error(`could not store videos: ${error.message}`);
      }
      stored += rows.length;
      for (const id of fresh) known.add(id);
    }
    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }
  const why = [...skips].map(([k, n]) => `${k} ${n}`).join(", ") || "none";
  console.log(`${channel.handle}: ${DRY_RUN ? "would store" : "stored"} ${stored} from ${pages} pages; skipped: ${why}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  for (const channel of APPROVED_CHANNELS) {
    if (unitsUsed >= QUOTA_BUDGET) {
      console.log(`Stopped at ${unitsUsed} YouTube units; run again tomorrow to continue.`);
      break;
    }
    await syncChannel(db, channel);
  }
  console.log(`\nDone. YouTube units used: ${unitsUsed}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
