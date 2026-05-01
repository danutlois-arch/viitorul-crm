create extension if not exists "pgcrypto";

create type public.user_role as enum (
  'super_admin',
  'club_admin',
  'sporting_director',
  'coach',
  'team_manager',
  'parent',
  'player'
);

create type public.subscription_status as enum ('trial', 'active', 'past_due', 'cancelled');
create type public.player_status as enum ('activ', 'accidentat', 'suspendat', 'transferat', 'retras');
create type public.payment_status as enum ('platit', 'partial', 'restant', 'scutit');
create type public.payment_method as enum ('cash', 'transfer_bancar', 'card');
create type public.contribution_type as enum ('donatie', 'sponsorizare');
create type public.contribution_status as enum ('draft', 'pending', 'paid', 'cancelled');
create type public.contribution_provider as enum ('stripe', 'manual');
create type public.match_status as enum ('programat', 'jucat', 'amanat', 'anulat');
create type public.venue_type as enum ('acasa', 'deplasare');
create type public.attendance_type as enum ('antrenament', 'recuperare', 'sedinta_video', 'sala');
create type public.attendance_status as enum ('prezent', 'absent_motivat', 'absent_nemotivat', 'accidentat');
create type public.preferred_foot as enum ('drept', 'stang', 'ambele');
create type public.suspension_reason as enum ('cartonas_rosu', 'cumul_galbene', 'decizie_comisie', 'disciplinar');
create type public.suspension_status as enum ('activa', 'expirata');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cui text unique not null,
  city text not null,
  county text not null,
  logo_url text,
  theme_key text default 'royal-blue',
  email text not null,
  phone text,
  address text,
  website text,
  social_media jsonb not null default '[]'::jsonb,
  subscription_status public.subscription_status not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete set null,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  assigned_team_id uuid references public.teams (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (club_id, user_id, role)
);

create table public.team_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null unique
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  category_id uuid not null references public.team_categories (id),
  competition_id uuid not null references public.competitions (id),
  season text not null,
  head_coach text,
  assistant_coach text,
  team_manager text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  position text not null,
  preferred_foot public.preferred_foot not null default 'drept',
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  player_phone text,
  player_email text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  federation_registration_number text,
  status public.player_status not null default 'activ',
  medical_notes text,
  coach_notes text,
  profile_image_url text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null,
  due_amount numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  status public.payment_status not null default 'restant',
  paid_at date,
  payment_method public.payment_method,
  notes text,
  created_at timestamptz not null default now()
);

create table public.funding_contributions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  contributor_name text not null,
  contributor_email text,
  contributor_phone text,
  contribution_type public.contribution_type not null,
  amount numeric(10,2) not null default 0,
  status public.contribution_status not null default 'draft',
  source text not null check (source in ('online', 'manual')),
  provider public.contribution_provider not null default 'manual',
  checkout_url text,
  external_checkout_id text,
  sponsor_company text,
  notes text,
  paid_at date,
  created_at timestamptz not null default now()
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  session_date date not null,
  session_hour time not null,
  location text,
  session_type public.attendance_type not null,
  created_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  status public.attendance_status not null,
  coach_rating numeric(3,1),
  notes text,
  unique (attendance_session_id, player_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  competition_id uuid references public.competitions (id),
  round_label text,
  opponent text not null,
  venue_type public.venue_type not null,
  match_date date not null,
  match_hour time not null,
  location text,
  team_score smallint,
  opponent_score smallint,
  status public.match_status not null default 'programat',
  notes text,
  created_at timestamptz not null default now()
);

create table public.match_squads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  called_up boolean not null default false,
  present boolean not null default false,
  starter boolean not null default false,
  minutes_played smallint not null default 0,
  unique (match_id, player_id)
);

create table public.player_statistics (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  starter boolean not null default false,
  minutes_played smallint not null default 0,
  goals smallint not null default 0,
  assists smallint not null default 0,
  yellow_cards smallint not null default 0,
  red_cards smallint not null default 0,
  penalty_scored smallint not null default 0,
  penalty_missed smallint not null default 0,
  own_goals smallint not null default 0,
  entered_minute smallint,
  exited_minute smallint,
  coach_rating numeric(3,1),
  notes text,
  unique (match_id, player_id)
);

create table public.suspensions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  reason public.suspension_reason not null,
  suspension_rounds smallint not null,
  remaining_rounds smallint not null,
  start_date date not null,
  status public.suspension_status not null default 'activa',
  created_at timestamptz not null default now()
);

create table public.activity_logs (
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

create table public.user_notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default false,
  payment_reminders boolean not null default true,
  match_reminders boolean not null default true,
  suspension_reminders boolean not null default true,
  attendance_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notification_inbox (
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

create table public.email_dispatches (
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

create table public.user_reminder_schedules (
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

create table public.reminder_run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  club_id uuid not null references public.clubs (id) on delete cascade,
  schedule_id uuid references public.user_reminder_schedules (id) on delete set null,
  trigger_type text not null check (trigger_type in ('manual', 'scheduled')),
  status text not null check (status in ('sent', 'failed')),
  message text,
  created_at timestamptz not null default now()
);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.club_memberships membership
    where membership.user_id = auth.uid()
      and membership.role = 'super_admin'
  );
$$;

create or replace function public.has_club_access(target_club_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.club_memberships membership
      where membership.user_id = auth.uid()
        and membership.club_id = target_club_id
    );
$$;

create or replace function public.has_club_role(target_club_id uuid, allowed_roles public.user_role[])
returns boolean
language sql
stable
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.club_memberships membership
      where membership.user_id = auth.uid()
        and membership.club_id = target_club_id
        and membership.role = any (allowed_roles)
    );
$$;

alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.club_memberships enable row level security;
alter table public.team_categories enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.payments enable row level security;
alter table public.funding_contributions enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.matches enable row level security;
alter table public.match_squads enable row level security;
alter table public.player_statistics enable row level security;
alter table public.suspensions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.notification_inbox enable row level security;
alter table public.email_dispatches enable row level security;
alter table public.user_reminder_schedules enable row level security;
alter table public.reminder_run_logs enable row level security;

create policy "members can read their club"
on public.clubs for select
using (public.has_club_access(id));

create policy "super admins manage clubs"
on public.clubs for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "club admins update own club"
on public.clubs for update
using (public.has_club_role(id, array['club_admin']::public.user_role[]))
with check (public.has_club_role(id, array['club_admin']::public.user_role[]));

create policy "users read own profile"
on public.profiles for select
using (id = auth.uid() or public.is_super_admin());

create policy "super admins manage profiles"
on public.profiles for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "users read memberships in their clubs"
on public.club_memberships for select
using (public.has_club_access(club_id));

create policy "club admins manage memberships"
on public.club_memberships for all
using (public.has_club_role(club_id, array['club_admin']::public.user_role[]))
with check (public.has_club_role(club_id, array['club_admin']::public.user_role[]));

create policy "team categories are readable"
on public.team_categories for select
using (true);

create policy "competitions are readable"
on public.competitions for select
using (true);

create policy "club members read teams"
on public.teams for select
using (public.has_club_access(club_id));

create policy "management roles manage teams"
on public.teams for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'team_manager']::public.user_role[])
);

create policy "club members read players"
on public.players for select
using (public.has_club_access(club_id));

create policy "staff manage players"
on public.players for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read payments"
on public.payments for select
using (public.has_club_access(club_id));

create policy "finance roles manage payments"
on public.payments for all
using (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
);

create policy "club members read funding contributions"
on public.funding_contributions for select
using (public.has_club_access(club_id));

create policy "finance roles manage funding contributions"
on public.funding_contributions for all
using (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
);

create policy "club members read attendance sessions"
on public.attendance_sessions for select
using (public.has_club_access(club_id));

create policy "staff manage attendance sessions"
on public.attendance_sessions for all
using (
  public.has_club_role(club_id, array['club_admin', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read attendance records"
on public.attendance_records for select
using (public.has_club_access(club_id));

create policy "staff manage attendance records"
on public.attendance_records for all
using (
  public.has_club_role(club_id, array['club_admin', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read matches"
on public.matches for select
using (public.has_club_access(club_id));

create policy "staff manage matches"
on public.matches for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read match squads"
on public.match_squads for select
using (public.has_club_access(club_id));

create policy "staff manage match squads"
on public.match_squads for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read player statistics"
on public.player_statistics for select
using (public.has_club_access(club_id));

create policy "staff manage player statistics"
on public.player_statistics for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
);

create policy "club members read suspensions"
on public.suspensions for select
using (public.has_club_access(club_id));

create policy "staff manage suspensions"
on public.suspensions for all
using (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'sporting_director', 'coach', 'team_manager']::public.user_role[])
);

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

create policy "club admins read email dispatches"
on public.email_dispatches for select
using (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));

create policy "club admins manage email dispatches"
on public.email_dispatches for all
using (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]))
with check (public.has_club_role(club_id, array['super_admin', 'club_admin']::public.user_role[]));

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

insert into public.team_categories (label)
values
  ('Seniori'),
  ('U19'),
  ('U17'),
  ('U16'),
  ('U15'),
  ('U14'),
  ('U13'),
  ('U12'),
  ('U11'),
  ('U10'),
  ('U9'),
  ('U8'),
  ('U7'),
  ('U6')
on conflict (label) do nothing;

insert into public.competitions (label)
values
  ('SuperLiga'),
  ('Liga 2'),
  ('Liga 3'),
  ('Liga 3 PlayOff'),
  ('Liga 4'),
  ('Liga 5 / Judetean'),
  ('Liga de Tineret'),
  ('Liga Elitelor U17'),
  ('Liga Elitelor U16'),
  ('Liga Elitelor U15'),
  ('Liga Elitelor U14'),
  ('Liga Elitelor U13'),
  ('Campionat National U19'),
  ('Campionat National U17'),
  ('Campionat National U16'),
  ('Campionat National U15'),
  ('AJF'),
  ('Amical')
on conflict (label) do nothing;

insert into public.clubs (
  id,
  name,
  cui,
  city,
  county,
  email,
  phone,
  address,
  website,
  social_media,
  subscription_status
)
values (
  'a1111111-1111-1111-1111-111111111111',
  'FC Viitorul Onești',
  'RO12345678',
  'Onești',
  'Bacău',
  'office@fcviitorulonesti.ro',
  '+40 744 111 222',
  'Str. Stadionului 12, Onești',
  'https://fcviitorulonesti.ro',
  '["facebook.com/fcviitorulonesti","instagram.com/fcviitorulonesti"]'::jsonb,
  'active'
)
on conflict (id) do nothing;

insert into public.teams (
  id,
  club_id,
  name,
  category_id,
  competition_id,
  season,
  head_coach,
  assistant_coach,
  team_manager
)
select
  seed.id,
  'a1111111-1111-1111-1111-111111111111'::uuid,
  seed.name,
  category.id,
  competition.id,
  '2025/2026',
  seed.head_coach,
  seed.assistant_coach,
  seed.team_manager
from (
  values
    ('b1111111-1111-1111-1111-111111111111'::uuid, 'FC Viitorul Onești Seniori', 'Seniori', 'Liga 4', 'Mihai Stoica', 'Paul Cristea', 'Andrei Enache'),
    ('b2222222-1111-1111-1111-111111111111'::uuid, 'FC Viitorul Onești U17', 'U17', 'Liga Elitelor U17', 'Adrian Neagu', 'Ionuț Barbu', 'Mara Nistor')
) as seed(id, name, category_label, competition_label, head_coach, assistant_coach, team_manager)
join public.team_categories category on category.label = seed.category_label
join public.competitions competition on competition.label = seed.competition_label
on conflict (id) do nothing;
