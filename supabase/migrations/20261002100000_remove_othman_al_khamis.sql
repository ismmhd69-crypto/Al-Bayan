-- Mo's decision (2026-10-02): Shaykh Othman al-Khamis is removed from the library (fatwas and YouTube channel).
-- Child rows (search documents, translations, topic links) go with their parent through cascade.

begin;

delete from public.videos
where scholar_id = 'othman-al-khamis' or channel_id = 'UCWjCSGhmSGu0VLf2mPFS0Kg';

delete from public.sources where scholar_id = 'othman-al-khamis';

delete from editorial.source_rights where owner = 'othmanalkhamees.com';

delete from public.scholars where id = 'othman-al-khamis';

alter table public.videos drop constraint approved_video_from_approved_channel;
alter table public.videos add constraint approved_video_from_approved_channel check (
  not approved or channel_id in (
    'UCiiJRwQ0MUaQo8ZZuf18pPw', -- Ibn Baz official site channel
    'UCwMocSKEbLav6SZvwzTvDbQ', -- al-Albani legacy portal
    'UCtF3YygTiodnYSw8vD3UJtQ', -- Ibn Uthaymeen foundation
    'UCYZkmbBbVMWxB1gyioTPLIA'  -- Ibn Baz Charitable Foundation
  )
);

commit;
