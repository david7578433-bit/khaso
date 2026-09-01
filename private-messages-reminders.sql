-- Khaso: private member messages and annual Yahrzeit reminders.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint private_messages_different_members check (sender_id <> recipient_id)
);

create index if not exists private_messages_sender_created_idx on public.private_messages(sender_id, created_at desc);
create index if not exists private_messages_recipient_created_idx on public.private_messages(recipient_id, created_at desc);

alter table public.private_messages enable row level security;
drop policy if exists "Participants read private messages" on public.private_messages;
drop policy if exists "Members send private messages" on public.private_messages;
create policy "Participants read private messages" on public.private_messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "Members send private messages" on public.private_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_approved_member()
    and exists (
      select 1 from public.profiles p
      where p.id = recipient_id and p.approved = true and p.directory_approved = true
    )
  );

create or replace function public.mark_private_messages_read(other_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare changed integer;
begin
  update public.private_messages
  set read_at = coalesce(read_at, now())
  where recipient_id = auth.uid() and sender_id = other_user and read_at is null;
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create or replace function public.notify_private_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare sender_name text;
begin
  select coalesce(nullif(trim(concat_ws(' ', first_name, last_name)), ''), display_name, 'A member')
  into sender_name from public.profiles where id = new.sender_id;
  insert into public.notifications(user_id,title,body,link)
  values (new.recipient_id,'New private message',sender_name || ': ' || left(new.body,160),'messages.html?with=' || new.sender_id::text);
  return new;
end;
$$;

drop trigger if exists private_message_notification on public.private_messages;
create trigger private_message_notification
after insert on public.private_messages
for each row execute function public.notify_private_message();

alter table public.yahrzeits add column if not exists reminder_month text;
alter table public.yahrzeits add column if not exists reminder_day integer;
alter table public.yahrzeits drop constraint if exists yahrzeits_reminder_day_check;
alter table public.yahrzeits add constraint yahrzeits_reminder_day_check
  check (reminder_day is null or reminder_day between 1 and 30);

create table if not exists public.yahrzeit_reminder_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  yahrzeit_id uuid not null references public.yahrzeits(id) on delete cascade,
  hebrew_year integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id,yahrzeit_id,hebrew_year)
);
alter table public.yahrzeit_reminder_deliveries enable row level security;
drop policy if exists "Members read own reminder deliveries" on public.yahrzeit_reminder_deliveries;
create policy "Members read own reminder deliveries" on public.yahrzeit_reminder_deliveries for select to authenticated
  using (user_id = auth.uid());

create or replace function public.create_today_yahrzeit_reminders(
  today_month text,
  today_day integer,
  today_year integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare added integer;
begin
  if not public.is_approved_member() then return 0; end if;

  with matching as (
    select y.id,y.name,y.hebrew_date
    from public.yahrzeits y
    where y.public_visible = true
      and lower(trim(y.reminder_month)) = lower(trim(today_month))
      and y.reminder_day = today_day
  ), delivered as (
    insert into public.yahrzeit_reminder_deliveries(user_id,yahrzeit_id,hebrew_year)
    select auth.uid(),m.id,today_year from matching m
    on conflict do nothing
    returning yahrzeit_id
  )
  insert into public.notifications(user_id,title,body,link)
  select auth.uid(),'Yahrzeit reminder',m.name || ' · ' || m.hebrew_date,'community.html'
  from matching m join delivered d on d.yahrzeit_id = m.id;

  get diagnostics added = row_count;
  return added;
end;
$$;

revoke all on public.private_messages from anon;
grant select,insert on public.private_messages to authenticated;
grant select on public.yahrzeit_reminder_deliveries to authenticated;
revoke all on function public.mark_private_messages_read(uuid) from public;
revoke all on function public.create_today_yahrzeit_reminders(text,integer,integer) from public;
grant execute on function public.mark_private_messages_read(uuid) to authenticated;
grant execute on function public.create_today_yahrzeit_reminders(text,integer,integer) to authenticated;

