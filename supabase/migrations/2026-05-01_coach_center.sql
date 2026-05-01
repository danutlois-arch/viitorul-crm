alter table public.club_memberships
add column if not exists assigned_team_id uuid references public.teams (id) on delete set null;

alter table public.attendance_records
add column if not exists coach_rating numeric(3,1);

insert into public.competitions (label)
values ('Liga 3 PlayOff')
on conflict (label) do nothing;
