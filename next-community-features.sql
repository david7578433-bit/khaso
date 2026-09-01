-- Khaso: online members, polls, and ride sharing.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.member_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text,
  current_page text,
  last_seen_at timestamptz not null default now()
);

create or replace function public.normalize_member_presence()
returns trigger language plpgsql set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists normalize_member_presence_row on public.member_presence;
create trigger normalize_member_presence_row
before insert or update on public.member_presence
for each row execute function public.normalize_member_presence();

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  active boolean not null default true,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint polls_options_array check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 10)
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ride_type text not null check (ride_type in ('request','offer')),
  from_location text not null,
  to_location text not null,
  depart_at timestamptz not null,
  seats integer check (seats is null or seats between 1 and 20),
  contact text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.member_presence enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.rides enable row level security;

drop policy if exists "Members update own presence" on public.member_presence;
drop policy if exists "Members change own presence" on public.member_presence;
drop policy if exists "Members see own presence" on public.member_presence;
drop policy if exists "Admins see all presence" on public.member_presence;
create policy "Members update own presence" on public.member_presence for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_member());
create policy "Members change own presence" on public.member_presence for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved_member());
create policy "Members see own presence" on public.member_presence for select to authenticated
  using (user_id = auth.uid());
create policy "Admins see all presence" on public.member_presence for select to authenticated
  using (public.is_site_admin());

drop policy if exists "Members read polls" on public.polls;
drop policy if exists "Admins manage polls" on public.polls;
create policy "Members read polls" on public.polls for select to authenticated
  using (public.is_approved_member());
create policy "Admins manage polls" on public.polls for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Members read poll votes" on public.poll_votes;
drop policy if exists "Members add own poll vote" on public.poll_votes;
drop policy if exists "Members change own poll vote" on public.poll_votes;
drop policy if exists "Members remove own poll vote" on public.poll_votes;
create policy "Members read poll votes" on public.poll_votes for select to authenticated
  using (public.is_approved_member());
create policy "Members add own poll vote" on public.poll_votes for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_approved_member()
    and exists (
      select 1 from public.polls p
      where p.id = poll_votes.poll_id and p.active = true
        and (p.closes_at is null or p.closes_at > now())
        and poll_votes.option_index < jsonb_array_length(p.options)
    )
  );
create policy "Members change own poll vote" on public.poll_votes for update to authenticated
  using (user_id = auth.uid()) with check (
    user_id = auth.uid() and public.is_approved_member()
    and exists (
      select 1 from public.polls p
      where p.id = poll_votes.poll_id and p.active = true
        and (p.closes_at is null or p.closes_at > now())
        and poll_votes.option_index < jsonb_array_length(p.options)
    )
  );
create policy "Members remove own poll vote" on public.poll_votes for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "Members read rides" on public.rides;
drop policy if exists "Members add own rides" on public.rides;
drop policy if exists "Members change own rides" on public.rides;
drop policy if exists "Members delete own rides" on public.rides;
drop policy if exists "Admins manage rides" on public.rides;
create policy "Members read rides" on public.rides for select to authenticated
  using (public.is_approved_member());
create policy "Members add own rides" on public.rides for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_member());
create policy "Members change own rides" on public.rides for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Members delete own rides" on public.rides for delete to authenticated
  using (user_id = auth.uid());
create policy "Admins manage rides" on public.rides for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

grant all on public.member_presence, public.polls, public.poll_votes, public.rides to authenticated;
