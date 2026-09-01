-- Kasho security hardening: reduce access to privileged database functions.
-- Safe to run more than once.

-- Trigger functions are called by PostgreSQL, never directly by a website user.
revoke execute on function public.approve_chat_attachment() from public, anon, authenticated;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_content_approval() from public, anon, authenticated;
revoke execute on function public.notify_photo_status() from public, anon, authenticated;
revoke execute on function public.notify_private_message() from public, anon, authenticated;
revoke execute on function public.send_due_scheduled_private_messages() from public, anon, authenticated;

-- These helpers and RPCs are for signed-in members only.
revoke execute on function public.create_today_yahrzeit_reminders(text, integer, integer) from public, anon;
revoke execute on function public.is_approved_member() from public, anon;
revoke execute on function public.is_approved_member(uuid) from public, anon;
revoke execute on function public.is_site_admin() from public, anon;
revoke execute on function public.is_site_owner() from public, anon;
revoke execute on function public.list_chat_members() from public, anon;
revoke execute on function public.mark_private_messages_read(uuid) from public, anon;
revoke execute on function public.notify_mention(uuid, text, text, text) from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;
revoke execute on function public.set_member_directory(uuid, boolean) from public, anon;
revoke execute on function public.set_member_role(uuid, text) from public, anon;
revoke execute on function public.suspend_member(uuid, timestamp with time zone) from public, anon;
revoke execute on function public.update_member_contact(uuid, text, text, text) from public, anon;

grant execute on function public.create_today_yahrzeit_reminders(text, integer, integer) to authenticated;
grant execute on function public.is_approved_member() to authenticated;
grant execute on function public.is_approved_member(uuid) to authenticated;
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.is_site_owner() to authenticated;
grant execute on function public.list_chat_members() to authenticated;
grant execute on function public.mark_private_messages_read(uuid) to authenticated;
grant execute on function public.notify_mention(uuid, text, text, text) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
grant execute on function public.set_member_directory(uuid, boolean) to authenticated;
grant execute on function public.set_member_role(uuid, text) to authenticated;
grant execute on function public.suspend_member(uuid, timestamp with time zone) to authenticated;
grant execute on function public.update_member_contact(uuid, text, text, text) to authenticated;

-- Only approved members may read member-only community information.
drop policy if exists "Public reads visible yahrzeits" on public.yahrzeits;
drop policy if exists "Approved members read visible yahrzeits" on public.yahrzeits;
create policy "Approved members read visible yahrzeits" on public.yahrzeits for select to authenticated
  using (public_visible and public.is_approved_member());
revoke all on public.yahrzeits from anon;
grant select on public.yahrzeits to authenticated;

drop policy if exists "Members read active forms" on public.community_forms;
drop policy if exists "Approved members read active forms" on public.community_forms;
create policy "Approved members read active forms" on public.community_forms for select to authenticated
  using (active and public.is_approved_member());

drop policy if exists "Members read approved jobs" on public.jobs;
drop policy if exists "Approved members read approved jobs" on public.jobs;
create policy "Approved members read approved jobs" on public.jobs for select to authenticated
  using (approved and (expires_at is null or expires_at > now()) and public.is_approved_member());
drop policy if exists "Members submit jobs" on public.jobs;
drop policy if exists "Approved members submit jobs" on public.jobs;
create policy "Approved members submit jobs" on public.jobs for insert to authenticated
  with check (created_by = auth.uid() and public.is_approved_member());

-- Scheduled messages must respect the recipient's directory privacy setting.
drop policy if exists "Members manage own scheduled messages" on public.scheduled_private_messages;
create policy "Members manage own scheduled messages" on public.scheduled_private_messages for all to authenticated
  using (sender_id = auth.uid())
  with check (
    sender_id = auth.uid()
    and public.is_approved_member()
    and exists (
      select 1 from public.profiles p
      where p.id = recipient_id and p.approved = true and p.directory_approved = true
    )
  );

-- Members may edit or delete only messages that they sent.
alter table public.private_messages add column if not exists edited_at timestamptz;
drop policy if exists "Senders edit private messages" on public.private_messages;
drop policy if exists "Senders delete private messages" on public.private_messages;
create policy "Senders edit private messages" on public.private_messages for update to authenticated
  using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy "Senders delete private messages" on public.private_messages for delete to authenticated
  using (sender_id = auth.uid());
grant select, insert, delete on public.private_messages to authenticated;
grant update(body, edited_at) on public.private_messages to authenticated;
