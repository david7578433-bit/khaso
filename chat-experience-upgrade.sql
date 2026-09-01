-- Kasho Chat: favorites, custom sounds, private presence, and scheduled messages.
-- Safe to run more than once.

alter table public.chat_preferences
  add column if not exists favorite boolean not null default false,
  add column if not exists notification_sound text not null default 'chime';

alter table public.chat_preferences drop constraint if exists chat_preferences_notification_sound_check;
alter table public.chat_preferences add constraint chat_preferences_notification_sound_check
  check (notification_sound in ('chime','bell','pop','none'));

alter table public.member_presence
  add column if not exists show_online boolean not null default true;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'member_presence' and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.member_presence', policy_row.policyname);
  end loop;
end $$;

create policy "Members see permitted presence"
on public.member_presence for select to authenticated
using (
  user_id = auth.uid()
  or (show_online = true and public.is_approved_member())
);

create table if not exists public.scheduled_private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  reply_to_id uuid references public.private_messages(id) on delete set null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint scheduled_private_messages_different_members check (sender_id <> recipient_id)
);

create index if not exists scheduled_private_messages_due_idx
  on public.scheduled_private_messages(scheduled_for) where sent_at is null;

alter table public.scheduled_private_messages enable row level security;
drop policy if exists "Members manage own scheduled messages" on public.scheduled_private_messages;
create policy "Members manage own scheduled messages"
on public.scheduled_private_messages for all to authenticated
using (sender_id = auth.uid())
with check (
  sender_id = auth.uid()
  and public.is_approved_member()
  and exists (
    select 1 from public.profiles p
    where p.id = recipient_id and p.approved = true and p.directory_approved = true
  )
);

create or replace function public.send_due_scheduled_private_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare sent_count integer := 0;
begin
  if not public.is_approved_member() then return 0; end if;

  with due as (
    select s.id,s.sender_id,s.recipient_id,s.body,s.reply_to_id
    from public.scheduled_private_messages s
    where s.sent_at is null and s.scheduled_for <= now()
      and exists (
        select 1 from public.profiles p
        where p.id = s.recipient_id and p.approved = true and p.directory_approved = true
      )
      and not exists (
        select 1 from public.chat_blocks b
        where (b.blocker_id=s.sender_id and b.blocked_id=s.recipient_id)
           or (b.blocker_id=s.recipient_id and b.blocked_id=s.sender_id)
      )
    order by s.scheduled_for
    for update skip locked
    limit 100
  ), inserted as (
    insert into public.private_messages(sender_id,recipient_id,body,reply_to_id)
    select sender_id,recipient_id,body,reply_to_id from due
    returning id,sender_id,recipient_id,body,reply_to_id
  ), delivered as (
    update public.scheduled_private_messages s
    set sent_at = now()
    from due d
    where s.id=d.id
    returning s.id
  )
  select count(*) into sent_count from delivered;

  return sent_count;
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
  values (new.recipient_id,'New private message',sender_name || ': ' || left(new.body,160),'ages.html?view=private&with=' || new.sender_id::text);
  return new;
end;
$$;

revoke all on public.scheduled_private_messages from anon;
grant select,insert,update,delete on public.scheduled_private_messages to authenticated;
revoke all on function public.send_due_scheduled_private_messages() from public;
grant execute on function public.send_due_scheduled_private_messages() to authenticated;
