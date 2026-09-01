-- Kasho security hardening: reduce access to privileged database functions.
-- Safe to run more than once.

-- Trigger functions are called by PostgreSQL, never directly by a website user.
revoke execute on function public.approve_chat_attachment() from public, anon, authenticated;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_content_approval() from public, anon, authenticated;
revoke execute on function public.notify_photo_status() from public, anon, authenticated;

-- These helpers and RPCs are for signed-in members only.
revoke execute on function public.create_today_yahrzeit_reminders(text, integer, integer) from public, anon;
revoke execute on function public.is_approved_member() from public, anon;
revoke execute on function public.is_approved_member(uuid) from public, anon;
revoke execute on function public.is_site_admin() from public, anon;
revoke execute on function public.is_site_owner() from public, anon;
revoke execute on function public.list_chat_members() from public, anon;
revoke execute on function public.mark_private_messages_read(uuid) from public, anon;
revoke execute on function public.notify_mention(uuid, text, text, text) from public, anon;

grant execute on function public.create_today_yahrzeit_reminders(text, integer, integer) to authenticated;
grant execute on function public.is_approved_member() to authenticated;
grant execute on function public.is_approved_member(uuid) to authenticated;
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.is_site_owner() to authenticated;
grant execute on function public.list_chat_members() to authenticated;
grant execute on function public.mark_private_messages_read(uuid) to authenticated;
grant execute on function public.notify_mention(uuid, text, text, text) to authenticated;
