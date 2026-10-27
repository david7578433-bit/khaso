-- =====================================================================
-- Kasho · COMMUNITY DESIGNS  (Design Studio → public gallery)
-- Run once in the Supabase SQL Editor. Safe to run again (idempotent).
--
-- Every design someone makes in the Design Studio is saved here as
-- "pending". It shows in the public "Community Designs" gallery 3 days
-- after it was made, unless an admin rejects it on admin.html.
-- Nothing personal is stored: no names, phone numbers or addresses —
-- only the design itself, a small preview picture, a title and the
-- simcha type. Needs public.is_site_admin() from community-upgrade.sql.
-- =====================================================================


-- #####################################################################
-- ###  THE ONE SWITCH  ################################################
-- #####################################################################
--
--   MODE A (default)  "Auto-publish after 3 days unless rejected"
--       → keep:   select false
--
--   MODE B            "Only designs an admin APPROVED go public"
--       → change: select false   to   select true
--
--   Then run just this one statement again (or the whole file).
--   Also flip REQUIRE_APPROVAL in community-designs.js so the site
--   shows the same thing (the database enforces it either way).
--
create or replace function public.community_designs_require_approval()
returns boolean
language sql
immutable
as $$
  select false   -- <<<<<<<<<<  false = MODE A,  true = MODE B
$$;
-- #####################################################################


-- Stop with a clear message if the admin check this file relies on is missing.
do $$
begin
  if to_regprocedure('public.is_site_admin()') is null then
    raise exception 'public.is_site_admin() is missing. Run community-upgrade.sql first.';
  end if;
end
$$;


-- 1. The table ---------------------------------------------------------
create table if not exists public.community_designs (
  id           uuid        primary key default gen_random_uuid(),
  design       jsonb       not null,
  thumb        text,
  title        text,
  simcha_type  text,
  site         text        not null default 'kasho',
  created_at   timestamptz not null default now(),
  publish_at   timestamptz not null default (now() + interval '3 days'),
  status       text        not null default 'pending',
  reviewed_at  timestamptz
);

-- Checks (dropped and re-added so re-running the file keeps them current).
alter table public.community_designs drop constraint if exists community_designs_site_check;
alter table public.community_designs add  constraint community_designs_site_check
  check (site in ('kasho', 'public'));

alter table public.community_designs drop constraint if exists community_designs_status_check;
alter table public.community_designs add  constraint community_designs_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.community_designs drop constraint if exists community_designs_design_size;
alter table public.community_designs add  constraint community_designs_design_size
  check (jsonb_typeof(design) = 'object' and octet_length(design::text) < 40000);

alter table public.community_designs drop constraint if exists community_designs_thumb_size;
alter table public.community_designs add  constraint community_designs_thumb_size
  check (thumb is null or (length(thumb) < 80000 and thumb like 'data:image/%'));

alter table public.community_designs drop constraint if exists community_designs_title_size;
alter table public.community_designs add  constraint community_designs_title_size
  check (title is null or length(title) < 120);

alter table public.community_designs drop constraint if exists community_designs_type_size;
alter table public.community_designs add  constraint community_designs_type_size
  check (simcha_type is null or length(simcha_type) < 60);

create index if not exists community_designs_publish_idx on public.community_designs (publish_at desc);
create index if not exists community_designs_created_idx on public.community_designs (created_at desc);
create index if not exists community_designs_status_idx  on public.community_designs (status);


-- 2. New rows: server sets the clock and status; simple rate limit -----
-- Visitors cannot backdate a design, mark it approved, or flood the table.
create or replace function public.community_designs_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_hour constant integer := 30;   -- all visitors together, per hour
  recent integer;
begin
  select count(*) into recent
  from public.community_designs
  where created_at > now() - interval '1 hour';

  if recent >= max_per_hour then
    raise exception 'Too many new designs right now. Please try again later.'
      using errcode = 'P0001';
  end if;

  new.id          := gen_random_uuid();
  new.created_at  := now();
  new.publish_at  := now() + interval '3 days';
  new.status      := 'pending';
  new.reviewed_at := null;
  return new;
end;
$$;

drop trigger if exists community_designs_before_insert on public.community_designs;
create trigger community_designs_before_insert
before insert on public.community_designs
for each row execute function public.community_designs_before_insert();


-- 3. Admin review: stamp reviewed_at whenever the status changes --------
create or replace function public.community_designs_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists community_designs_before_update on public.community_designs;
create trigger community_designs_before_update
before update on public.community_designs
for each row execute function public.community_designs_before_update();

-- Trigger functions are called by PostgreSQL, never directly by a visitor.
revoke execute on function public.community_designs_before_insert() from public, anon, authenticated;
revoke execute on function public.community_designs_before_update() from public, anon, authenticated;
-- The switch is read inside the public policy, so visitors need to call it.
grant execute on function public.community_designs_require_approval() to anon, authenticated;


-- 4. Row level security ------------------------------------------------
alter table public.community_designs enable row level security;

revoke all on table public.community_designs from anon, authenticated;
grant select, insert on table public.community_designs to anon, authenticated;
grant update (status, reviewed_at) on table public.community_designs to authenticated;
grant delete on table public.community_designs to authenticated;

drop policy if exists "Anyone can share a design"          on public.community_designs;
drop policy if exists "Public can read published designs"  on public.community_designs;
drop policy if exists "Admins read all designs"            on public.community_designs;
drop policy if exists "Admins review designs"              on public.community_designs;
drop policy if exists "Admins delete designs"              on public.community_designs;

create policy "Anyone can share a design"
on public.community_designs for insert
to anon, authenticated
with check (status = 'pending' and reviewed_at is null);

-- Uses THE ONE SWITCH at the top of this file.
create policy "Public can read published designs"
on public.community_designs for select
to anon, authenticated
using (
  publish_at <= now()
  and case
        when public.community_designs_require_approval() then status = 'approved'   -- MODE B
        else status <> 'rejected'                                                    -- MODE A
      end
);

create policy "Admins read all designs"
on public.community_designs for select
to authenticated
using (public.is_site_admin());

create policy "Admins review designs"
on public.community_designs for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

create policy "Admins delete designs"
on public.community_designs for delete
to authenticated
using (public.is_site_admin());
