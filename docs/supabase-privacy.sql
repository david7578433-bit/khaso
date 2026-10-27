-- Kasho site · privacy fix for public.submissions  (prepared 2026-10-27 — NOT run; paste into Supabase → SQL editor)
--
-- Today the public (anon) role can read every column of approved submissions, including the
-- submitter's contact details. Checked live with the public key on 2026-10-27:
--   GET /rest/v1/submissions?select=*  →  returns submitter_contact (an email address) and notification_email.
-- The website's public pages (index, news, simchas) already ask only for named columns and never for these two,
-- so this change does not break them. admin.html runs as a signed-in admin (role "authenticated") and keeps
-- full access. editorial.html only INSERTs (no read-back), and INSERT rights are not touched here.
--
-- Column-level privileges: take away anon's table-wide SELECT, then grant SELECT on every column except the two.
-- (The row-level security policy "Public can read approved submissions" stays exactly as it is.)

begin;

revoke select on table public.submissions from anon;

grant select (
  id,
  category,
  title,
  body,
  submitter_name,
  approved,
  created_at,
  event_type,
  event_date,
  location_name,
  address,
  map_url,
  comments_enabled,
  scheduled_publish_at,
  expires_at,
  archived_at,
  submitter_id
) on table public.submissions to anon;

commit;

-- Check afterwards (as anon, e.g. in the browser console on the site, or with curl and the publishable key):
--   /rest/v1/submissions?select=submitter_contact&limit=1   → should now fail with code 42501 (permission denied)
--   /rest/v1/submissions?select=title,body&limit=1          → still works
--
-- Notes
-- * If a new column is added to submissions later, anon will NOT see it until it is added to the grant above.
-- * A query with select=* from the anon role will now fail (Postgres refuses * when some columns are not granted);
--   the site does not do that on public pages.
-- * Signed-in non-admin members (role "authenticated") can still read these columns through the same public policy.
--   Closing that too needs either a separate admin-only view/function for contact details or moving them to their
--   own table (submission_contacts already exists in community-upgrade.sql) — a bigger change, left for later.
-- * submitter_id (the sender's user id) stays readable; remove it from the list above if you prefer to hide it too.
