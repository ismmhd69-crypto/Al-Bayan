-- The video search also returns the channel, so pages name the channel a video comes from
-- (a foundation channel may show other speakers than its scholar).

begin;

drop function public.search_approved_videos(text, int);

create function public.search_approved_videos(query_text text, match_count int default 6)
returns table (
  id uuid,
  youtube_id text,
  channel_id text,
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
  select v.id, v.youtube_id, v.channel_id, v.scholar_id, v.title, v.language, v.duration_seconds,
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
