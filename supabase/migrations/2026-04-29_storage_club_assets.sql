insert into storage.buckets (id, name, public)
values ('club-assets', 'club-assets', true)
on conflict (id) do nothing;
