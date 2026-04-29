do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'contribution_type'
  ) then
    create type public.contribution_type as enum ('donatie', 'sponsorizare');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'contribution_status'
  ) then
    create type public.contribution_status as enum ('draft', 'pending', 'paid', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'contribution_provider'
  ) then
    create type public.contribution_provider as enum ('stripe', 'manual');
  end if;
end $$;

create table if not exists public.funding_contributions (
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

alter table public.funding_contributions enable row level security;

drop policy if exists "club members read funding contributions" on public.funding_contributions;
create policy "club members read funding contributions"
on public.funding_contributions for select
using (public.has_club_access(club_id));

drop policy if exists "finance roles manage funding contributions" on public.funding_contributions;
create policy "finance roles manage funding contributions"
on public.funding_contributions for all
using (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
)
with check (
  public.has_club_role(club_id, array['club_admin', 'team_manager']::public.user_role[])
);

create index if not exists funding_contributions_club_id_idx
on public.funding_contributions (club_id);

create index if not exists funding_contributions_status_idx
on public.funding_contributions (status);

create index if not exists funding_contributions_external_checkout_id_idx
on public.funding_contributions (external_checkout_id);
