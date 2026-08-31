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

-- Anyone may send a news or simcha submission, but only the admin may read it.
alter table public.submissions enable row level security;

revoke all on table public.submissions from anon, authenticated;
grant insert on table public.submissions to anon, authenticated;
grant select, update, delete on table public.submissions to authenticated;
grant select on table public.submissions to anon;

drop policy if exists "Public can submit" on public.submissions;
drop policy if exists "Public can read approved submissions" on public.submissions;
drop policy if exists "Admin can read submissions" on public.submissions;
drop policy if exists "Admin can update submissions" on public.submissions;
drop policy if exists "Admin can delete submissions" on public.submissions;

create policy "Public can submit"
on public.submissions for insert
to anon, authenticated
with check (true);

create policy "Public can read approved submissions"
on public.submissions for select
to anon, authenticated
using (approved = true);

create policy "Admin can read submissions"
on public.submissions for select
to authenticated
using ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);

create policy "Admin can update submissions"
on public.submissions for update
to authenticated
using ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid)
with check ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);

create policy "Admin can delete submissions"
on public.submissions for delete
to authenticated
using ((select auth.uid()) = '0d8195b9-bd2d-445c-aba6-5a043cee47de'::uuid);

-- Remove personal details already stored in earlier submissions.
update public.submissions
set submitter_name = 'Anonymous', submitter_contact = '';

-- Members may change or remove only their own discussion messages.
grant update, delete on table public.posts to authenticated;

drop policy if exists "Members can edit own posts" on public.posts;
drop policy if exists "Members can delete own posts" on public.posts;

create policy "Members can edit own posts"
on public.posts for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "Members can delete own posts"
on public.posts for delete
to authenticated
using ((select auth.uid()) = author_id);
