-- Review decisions also for prepared answers to common questions (data/prepared-answers), not only topics.
alter table public.prepared_reviews drop constraint prepared_reviews_kind_check;
alter table public.prepared_reviews add constraint prepared_reviews_kind_check check (kind in ('topic', 'prepared'));
