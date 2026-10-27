-- Kasho site · OPTIONAL: let visitors who are not logged in see upcoming rides  (NOT run — only if Guest wants it)
--
-- How it works today (next-community-features.sql): public.rides has row-level security and only signed-in,
-- approved members can read ("Members read rides" … using public.is_approved_member()). The new rides.html page
-- follows that rule: visitors see a "Log in to see and post rides" note; approved members see and post rides.
-- Posting already requires an approved member (policy "Members add own rides") — keep it that way.
--
-- If you want everyone to SEE upcoming rides (but not the poster's phone number), run this. It exposes only
-- the route, time, seats and notes; contact and user_id stay members-only. rides.html would then need a small
-- change to read from public.rides_public for signed-out visitors (ask Tab).

create or replace view public.rides_public
with (security_invoker = false) as
  select id, ride_type, from_location, to_location, depart_at, seats, notes, created_at
  from public.rides
  where depart_at > now();

revoke all on public.rides_public from anon, authenticated;
grant select on public.rides_public to anon, authenticated;
