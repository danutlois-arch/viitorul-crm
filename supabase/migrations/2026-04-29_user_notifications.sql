create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default false,
  payment_reminders boolean not null default true,
  match_reminders boolean not null default true,
  suspension_reminders boolean not null default true,
  attendance_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  notification_key text not null,
  title text not null,
  description text,
  tone text not null check (tone in ('danger', 'warning', 'info', 'success')),
  href text,
  category text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

alter table public.user_notification_preferences enable row level security;
alter table public.notification_inbox enable row level security;

create policy "users manage own notification preferences"
on public.user_notification_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users read own inbox"
on public.notification_inbox for select
using (user_id = auth.uid());

create policy "users manage own inbox"
on public.notification_inbox for all
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.has_club_access(club_id));
