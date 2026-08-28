-- Run once in Supabase SQL Editor.
-- Visitors may read announcements. Only the existing admin user may change them.

alter table public.announcements enable row level security;

revoke all on table public.announcements from anon, authenticated;
grant select on table public.announcements to anon, authenticated;
grant insert, update, delete on table public.announcements to authenticated;

drop policy if exists "Public can read announcements" on public.announcements;
drop policy if exists "Admin can insert announcements" on public.announcements;
drop policy if exists "Admin can update announcements" on public.announcements;
drop policy if exists "Admin can delete announcements" on public.announcements;

create policy "Public can read announcements"
on public.announcements for select
to anon, authenticated
using (true);

create policy "Admin can insert announcements"
on public.announcements for insert
to authenticated
with check ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);

create policy "Admin can update announcements"
on public.announcements for update
to authenticated
using ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid)
with check ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);

create policy "Admin can delete announcements"
on public.announcements for delete
to authenticated
using ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);
