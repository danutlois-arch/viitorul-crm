create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_name text,
  actor_role public.user_role,
  area text not null,
  action text not null,
  entity_label text,
  details text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "club members read activity logs"
on public.activity_logs for select
using (public.has_club_access(club_id));

create policy "club admins manage activity logs"
on public.activity_logs for all
using (
  public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[])
);
