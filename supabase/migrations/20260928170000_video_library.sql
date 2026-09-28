-- Video library (Mo's decisions, 2026-09-28): videos come only from the 5 approved YouTube channels
-- (lib/sources/youtube-channels.ts), and channel approval is enough for a video to show once it passes
-- the automatic checks in scripts/sync-videos.ts. Mo can hide a single video by setting approved = false;
-- the sync never changes a video it already stored, so a hidden video stays hidden.

begin;

alter table public.videos
  add column channel_id text,
  add column duration_seconds int check (duration_seconds > 0),
  add column published_at timestamptz,
  add column search_text text not null default '' check (length(search_text) <= 600),
  add column search_vector tsvector generated always as (to_tsvector('simple', search_text)) stored;

-- Defence in depth: a visible video must come from an approved channel, whatever code wrote it.
alter table public.videos add constraint approved_video_from_approved_channel check (
  not approved or channel_id in (
    'UCiiJRwQ0MUaQo8ZZuf18pPw', -- Ibn Baz official site channel
    'UCwMocSKEbLav6SZvwzTvDbQ', -- al-Albani legacy portal
    'UCWjCSGhmSGu0VLf2mPFS0Kg', -- Othman al-Khamis
    'UCtF3YygTiodnYSw8vD3UJtQ', -- Ibn Uthaymeen foundation
    'UCYZkmbBbVMWxB1gyioTPLIA'  -- Ibn Baz Charitable Foundation
  )
);

create index videos_search_idx on public.videos using gin (search_vector) where approved;
create index videos_channel_idx on public.videos (channel_id);

-- Title search for Ask and topic pages. A candidate finder only: code decides what to show.
create or replace function public.search_approved_videos(query_text text, match_count int default 6)
returns table (
  id uuid,
  youtube_id text,
  scholar_id text,
  title text,
  language text,
  duration_seconds int,
  rank real
)
language sql
stable
set search_path = ''
as $$
  select v.id, v.youtube_id, v.scholar_id, v.title, v.language, v.duration_seconds,
         ts_rank_cd(v.search_vector, websearch_to_tsquery('simple', query_text)) as rank
  from public.videos v
  where v.approved
    and v.search_vector @@ websearch_to_tsquery('simple', query_text)
  order by rank desc, v.published_at desc nulls last
  limit least(greatest(match_count, 1), 20)
$$;

revoke all on function public.search_approved_videos(text, int) from public, anon, authenticated;
grant execute on function public.search_approved_videos(text, int) to service_role;

commit;
