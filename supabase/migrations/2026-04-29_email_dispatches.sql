create table if not exists public.email_dispatches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  recipient_email text not null,
  subject text not null,
  provider text not null,
  provider_message_id text,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.email_dispatches enable row level security;

create policy "club admins read email dispatches"
on public.email_dispatches for select
using (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));

create policy "club admins manage email dispatches"
on public.email_dispatches for all
using (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]))
with check (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));
