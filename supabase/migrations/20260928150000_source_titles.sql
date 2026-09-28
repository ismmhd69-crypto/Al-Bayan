-- Scholar quote library, step 2: each source may carry its title (for a fatwa: the question or heading
-- exactly as the original page gives it), shown above the quote so a short excerpt keeps its context.

alter table public.sources add column title text check (title is null or char_length(title) <= 300);
