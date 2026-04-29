create table if not exists public.user_reminder_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  active boolean not null default false,
  frequency text not null check (frequency in ('daily', 'weekdays', 'weekly')),
  channel text not null check (channel in ('email')),
  hour_local smallint not null default 9 check (hour_local between 0 and 23),
  minute_local smallint not null default 0 check (minute_local between 0 and 59),
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, channel)
);

create table if not exists public.reminder_run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  club_id uuid not null references public.clubs (id) on delete cascade,
  schedule_id uuid references public.user_reminder_schedules (id) on delete set null,
  trigger_type text not null check (trigger_type in ('manual', 'scheduled')),
  status text not null check (status in ('sent', 'failed')),
  message text,
  created_at timestamptz not null default now()
);

alter table public.user_reminder_schedules enable row level security;
alter table public.reminder_run_logs enable row level security;

create policy "users manage own reminder schedules"
on public.user_reminder_schedules for all
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.has_club_access(club_id));

create policy "users read own reminder runs"
on public.reminder_run_logs for select
using (user_id = auth.uid() or public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));

create policy "club admins manage reminder runs"
on public.reminder_run_logs for all
using (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]))
with check (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));
