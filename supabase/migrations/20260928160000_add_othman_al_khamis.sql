-- Mo's decision (2026-09-28): Shaykh Othman al-Khamis is added as a full approved scholar
-- (videos and quotes). His official website (othmanalkhamees.com) links his YouTube channel.

insert into public.scholars (id, name_ar, name_en, name_de, website, approved, sort)
values (
  'othman-al-khamis',
  'عثمان بن محمد الخميس',
  'Shaykh Othman al-Khamis',
  'Scheich Othman al-Khamis',
  'https://othmanalkhamees.com',
  true,
  20
)
on conflict (id) do nothing;
