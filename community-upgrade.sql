-- Khaso community feature foundation.
-- Run in Supabase SQL Editor after supabase-security.sql.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'admin', 'owner'));
alter table public.profiles add column if not exists suspended_until timestamptz;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists show_phone boolean not null default false;
alter table public.profiles add column if not exists show_email boolean not null default false;
alter table public.profiles add column if not exists show_city boolean not null default true;
alter table public.profiles add column if not exists show_avatar boolean not null default true;
alter table public.profiles add column if not exists directory_approved boolean not null default false;
alter table public.profiles add column if not exists profile_changes_pending jsonb;

update public.profiles
set role = 'owner'
where id = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_site_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and approved = true
  );
$$;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.site_settings(key, value) values
  ('maintenance', '{"enabled":false,"message":"We will be back soon."}'::jsonb),
  ('testing_mode', '{"enabled":true}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'other',
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text,
  address text,
  map_url text,
  public_visible boolean not null default true,
  scheduled_publish_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.yahrzeits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hebrew_date text not null,
  notes text,
  public_visible boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.member_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  browser_notifications boolean not null default true,
  email_notifications boolean not null default false,
  sms_notifications boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  muted_topic_ids bigint[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  post_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table if not exists public.post_reads (
  post_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.posts add column if not exists reply_to_id bigint;
alter table public.posts add column if not exists pinned boolean not null default false;
alter table public.posts add column if not exists locked boolean not null default false;
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists purge_after timestamptz;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id),
  post_id bigint,
  reported_user_id uuid references auth.users(id),
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id),
  body text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.submission_contacts (
  id uuid primary key default gen_random_uuid(),
  submission_id bigint,
  submission_title text,
  submission_category text,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.submission_contacts alter column submission_id drop not null;
alter table public.submission_contacts add column if not exists submission_title text;
alter table public.submission_contacts add column if not exists submission_category text;

create table if not exists public.community_forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  contact text,
  location text,
  expires_at timestamptz,
  approved boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal numeric,
  donation_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_id uuid references public.events(id) on delete set null,
  approved boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.gallery_photos add column if not exists album_id uuid references public.albums(id) on delete set null;
alter table public.photo_uploads add column if not exists purpose text not null default 'gallery';

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  submission_id bigint not null,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.submissions add column if not exists event_type text;
alter table public.submissions add column if not exists event_date timestamptz;
alter table public.submissions add column if not exists location_name text;
alter table public.submissions add column if not exists address text;
alter table public.submissions add column if not exists map_url text;
alter table public.submissions add column if not exists notification_email text;
alter table public.submissions add column if not exists comments_enabled boolean not null default false;
alter table public.submissions add column if not exists scheduled_publish_at timestamptz;
alter table public.submissions add column if not exists expires_at timestamptz;
alter table public.submissions add column if not exists archived_at timestamptz;
alter table public.submissions add column if not exists submitter_id uuid references auth.users(id);

drop policy if exists "Public can read approved submissions" on public.submissions;
create policy "Public can read approved submissions"
on public.submissions for select
to anon, authenticated
using (
  approved = true
  and archived_at is null
  and coalesce(scheduled_publish_at, now()) <= now()
  and (expires_at is null or expires_at > now())
);

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_status (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  details text
);

alter table public.site_settings enable row level security;
alter table public.events enable row level security;
alter table public.yahrzeits enable row level security;
alter table public.notifications enable row level security;
alter table public.member_settings enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_reads enable row level security;
alter table public.reports enable row level security;
alter table public.suggestions enable row level security;
alter table public.submission_contacts enable row level security;
alter table public.community_forms enable row level security;
alter table public.jobs enable row level security;
alter table public.campaigns enable row level security;
alter table public.albums enable row level security;
alter table public.comments enable row level security;
alter table public.admin_activity enable row level security;
alter table public.backup_status enable row level security;

-- Keep this migration safe to run again while the site is being tested.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'site_settings','events','yahrzeits','notifications','member_settings',
        'post_reactions','post_reads','reports','suggestions','community_forms',
        'submission_contacts','jobs','campaigns','albums','comments','admin_activity','backup_status'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

create policy "Everyone reads site settings" on public.site_settings for select using (true);
create policy "Owner changes site settings" on public.site_settings for all to authenticated using (public.is_site_owner()) with check (public.is_site_owner());

create policy "Public reads visible events" on public.events for select using (public_visible and coalesce(scheduled_publish_at, now()) <= now() and (expires_at is null or expires_at > now()));
create policy "Admins manage events" on public.events for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Approved members read visible yahrzeits" on public.yahrzeits for select to authenticated
  using (public_visible and public.is_approved_member());
create policy "Admins manage yahrzeits" on public.yahrzeits for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Members read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Members mark own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins create notifications" on public.notifications for insert to authenticated with check (public.is_site_admin());

create policy "Members manage own settings" on public.member_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Approved members read reactions" on public.post_reactions for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and approved));
create policy "Members manage own reactions" on public.post_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Members manage own reads" on public.post_reads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Members create reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Admins manage reports" on public.reports for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Members create suggestions" on public.suggestions for insert to authenticated with check (sender_id = auth.uid());
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'suggestions'
      and policyname = 'Visitors create suggestions'
  ) then
    execute 'create policy "Visitors create suggestions" on public.suggestions for insert to anon with check (sender_id is null)';
  end if;
end;
$$;
create policy "Admins manage suggestions" on public.suggestions for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Anyone adds a submission contact" on public.submission_contacts for insert to anon, authenticated with check (true);
create policy "Admins read submission contacts" on public.submission_contacts for select to authenticated using (public.is_site_admin());
create policy "Admins delete submission contacts" on public.submission_contacts for delete to authenticated using (public.is_site_admin());

create policy "Approved members read active forms" on public.community_forms for select to authenticated
  using (active and public.is_approved_member());
create policy "Admins manage forms" on public.community_forms for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Approved members read approved jobs" on public.jobs for select to authenticated
  using (approved and (expires_at is null or expires_at > now()) and public.is_approved_member());
create policy "Approved members submit jobs" on public.jobs for insert to authenticated
  with check (created_by = auth.uid() and public.is_approved_member());
create policy "Admins manage jobs" on public.jobs for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Public reads active campaigns" on public.campaigns for select using (active);
create policy "Admins manage campaigns" on public.campaigns for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Approved members read albums" on public.albums for select to authenticated using (approved);
create policy "Admins manage albums" on public.albums for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Approved members read comments" on public.comments for select to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and approved));
create policy "Members create own comments" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "Members delete own comments" on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Admins manage comments" on public.comments for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Admins read activity" on public.admin_activity for select to authenticated using (public.is_site_admin());
create policy "Admins create activity" on public.admin_activity for insert to authenticated with check (public.is_site_admin());
create policy "Admins read backup status" on public.backup_status for select to authenticated using (public.is_site_admin());

drop policy if exists "Admins moderate posts" on public.posts;
create policy "Admins moderate posts" on public.posts for update to authenticated
using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Approved directory is visible to members" on public.profiles;
create policy "Approved directory is visible to members" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_site_admin()
  or (
    directory_approved = true
    and approved = true
    and public.is_approved_member()
  )
);

create or replace function public.notify_mention(
  target_user uuid,
  notification_title text,
  notification_body text,
  notification_link text default 'ages.html'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and approved
  ) then
    raise exception 'Approved membership required';
  end if;

  if target_user = auth.uid() or not exists (
    select 1 from public.profiles where id = target_user and approved
  ) then
    return;
  end if;

  insert into public.notifications(user_id, title, body, link)
  values (target_user, left(notification_title, 160), left(notification_body, 500), notification_link);
end;
$$;

grant execute on function public.notify_mention(uuid, text, text, text) to authenticated;

create or replace function public.set_member_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_owner() then raise exception 'Owner permission required'; end if;
  if new_role not in ('member','admin') then raise exception 'Invalid role'; end if;
  update public.profiles set role = new_role where id = target_user and role <> 'owner';
  insert into public.admin_activity(admin_id,action,target_type,target_id,details)
  values(auth.uid(),'change_role','profile',target_user::text,jsonb_build_object('role',new_role));
end;
$$;

create or replace function public.set_member_directory(target_user uuid, is_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'Admin permission required'; end if;
  update public.profiles set directory_approved = is_approved where id = target_user;
end;
$$;

create or replace function public.suspend_member(target_user uuid, until_time timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'Admin permission required'; end if;
  update public.profiles set suspended_until = until_time where id = target_user and role <> 'owner';
  insert into public.admin_activity(admin_id,action,target_type,target_id,details)
  values(auth.uid(),'suspend','profile',target_user::text,jsonb_build_object('until',until_time));
end;
$$;

grant execute on function public.set_member_role(uuid, text) to authenticated;
grant execute on function public.set_member_directory(uuid, boolean) to authenticated;
grant execute on function public.suspend_member(uuid, timestamptz) to authenticated;

-- Save signup details immediately when Auth creates a profile. This prevents
-- names and phone numbers being lost if the browser closes before step two.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, display_name, first_name, last_name, phone_number, city, username, jewish_year
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'email', new.email),
    coalesce(
      nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')), ''),
      new.raw_user_meta_data->>'full_name',
      new.email
    ),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'jewish_year'
  )
  on conflict (id) do update set
    first_name = coalesce(excluded.first_name, profiles.first_name),
    last_name = coalesce(excluded.last_name, profiles.last_name),
    phone_number = coalesce(excluded.phone_number, profiles.phone_number),
    city = coalesce(excluded.city, profiles.city),
    username = coalesce(excluded.username, profiles.username),
    jewish_year = coalesce(excluded.jewish_year, profiles.jewish_year);
  return new;
end;
$$;

create or replace function public.update_member_contact(
  target_user uuid,
  new_first_name text,
  new_last_name text,
  new_phone_number text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then raise exception 'Admin permission required'; end if;
  update public.profiles
  set first_name = nullif(trim(new_first_name), ''),
      last_name = nullif(trim(new_last_name), ''),
      phone_number = nullif(trim(new_phone_number), ''),
      display_name = coalesce(
        nullif(trim(concat_ws(' ', new_first_name, new_last_name)), ''),
        display_name
      )
  where id = target_user;
  if not found then raise exception 'Member not found'; end if;
  insert into public.admin_activity(admin_id,action,target_type,target_id,details)
  values(auth.uid(),'update_member_contact','profile',target_user::text,'{}'::jsonb);
end;
$$;

create or replace function public.remove_member(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_site_admin() then raise exception 'Admin permission required'; end if;
  if target_user is null or target_user = auth.uid() then
    raise exception 'You cannot remove your own account';
  end if;

  select role into target_role from public.profiles where id = target_user;
  if not found then raise exception 'Member not found'; end if;
  if target_role = 'owner' then raise exception 'The owner account cannot be removed'; end if;
  if target_role = 'admin' and not public.is_site_owner() then
    raise exception 'Only the owner can remove another admin';
  end if;

  update public.admin_activity set admin_id = null where admin_id = target_user;
  update public.albums set created_by = null where created_by = target_user;
  update public.campaigns set created_by = null where created_by = target_user;
  update public.community_forms set created_by = null where created_by = target_user;
  update public.events set created_by = null where created_by = target_user;
  update public.jobs set created_by = null where created_by = target_user;
  update public.reports set reported_user_id = null where reported_user_id = target_user;
  update public.reports set resolved_by = null where resolved_by = target_user;
  update public.site_settings set updated_by = null where updated_by = target_user;
  update public.submissions set submitter_id = null where submitter_id = target_user;
  update public.suggestions set sender_id = null where sender_id = target_user;
  update public.yahrzeits set created_by = null where created_by = target_user;
  delete from public.comments where author_id = target_user;
  delete from public.reports where reporter_id = target_user;

  insert into public.admin_activity(admin_id,action,target_type,target_id,details)
  values(auth.uid(),'remove_member','profile',target_user::text,jsonb_build_object('previous_role',target_role));

  delete from auth.users where id = target_user;
  if not found then raise exception 'Authentication account not found'; end if;
end;
$$;

grant execute on function public.update_member_contact(uuid, text, text, text) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;

create or replace function public.notify_content_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approved = true and coalesce(old.approved, false) = false then
    insert into public.notifications(user_id, title, body, link)
    select id,
      case when new.category = 'simcha' then 'New Simcha' else 'New News' end,
      new.title,
      case when new.category = 'simcha' then 'simchas.html' else 'news.html' end
    from public.profiles
    where approved = true;

    if new.submitter_id is not null then
      insert into public.notifications(user_id, title, body, link)
      values (new.submitter_id, 'Submission approved', new.title, case when new.category = 'simcha' then 'simchas.html' else 'news.html' end);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_approval_notification on public.submissions;
create trigger submissions_approval_notification
after update of approved on public.submissions
for each row execute function public.notify_content_approval();

create or replace function public.notify_photo_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.uploader_id is not null then
    insert into public.notifications(user_id, title, body, link)
    values (
      new.uploader_id,
      case when new.status = 'approved' then 'Photo approved' else 'Photo update' end,
      coalesce(new.caption, 'Your uploaded file') || ' is now ' || new.status || '.',
      'pictures.html'
    );
    if new.status = 'approved' and new.purpose = 'profile' then
      update public.profiles set avatar_path = new.storage_path where id = new.uploader_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists photo_status_notification on public.photo_uploads;
create trigger photo_status_notification
after update of status on public.photo_uploads
for each row execute function public.notify_photo_status();

grant select on public.site_settings, public.events, public.campaigns to anon, authenticated;
revoke all on public.yahrzeits from anon;
grant select on public.yahrzeits to authenticated;
grant all on public.notifications, public.member_settings, public.post_reactions, public.post_reads, public.reports, public.suggestions, public.submission_contacts, public.community_forms, public.jobs, public.albums, public.comments, public.admin_activity to authenticated;
grant insert on public.suggestions, public.submission_contacts to anon;
grant select on public.backup_status to authenticated;
