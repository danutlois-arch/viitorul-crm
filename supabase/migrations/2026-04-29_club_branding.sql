alter table public.clubs
add column if not exists theme_key text default 'royal-blue';

drop policy if exists "club admins update own club" on public.clubs;

create policy "club admins update own club"
on public.clubs for update
using (public.has_club_role(id, array['club_admin']::public.user_role[]))
with check (public.has_club_role(id, array['club_admin']::public.user_role[]));
