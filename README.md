# Kasho (Kashau) Community website

Community site for Kasho (Williamsburg, Monsey, Kiryas Joel): zmanim, Shabbos times, botei medrash, simchas, yahrzeits,
phone book, rides, news, members area, Simcha Invitations maker and admin.

- Live: https://david7578433-bit.github.io/khaso/
- Branch `main` is the live site. Branch `v6-form` (added Nov 4, 2026) holds Simcha Invitations v6 (the step-by-step form)
  that is only a preview so far. It is not live; merge it into `main` when David says OK.

## How it works

- Plain HTML/CSS/JS, no build step. Hosted free on GitHub Pages (Settings > Pages > `main` / root).
- Members, chat, community designs, rides and settings use a free Supabase project (the URL and the public "publishable/anon"
  key are in `member-auth.js`, `site.js`, `community-designs.js`; those are meant to be public).
  The database setup is in the `*.sql` files (root and `docs/`), and `supabase/functions/notify-admin` is a Supabase Edge Function.
  Secret keys (service role) are NOT in this repo and must never be put here; they stay in the Supabase dashboard.
- `.github/workflows/supabase-keepalive.yml` pings Supabase daily so the free project does not pause; `site-check.yml` checks the pages.
- `scripts/build-standalone.py` builds the separate Simcha Invitations site (repo `simcha-invitations`) from this one.

## Run it without Tab

    python3 -m http.server 8000     # then open http://localhost:8000

To host it elsewhere, upload the whole folder to any static host (Netlify, Cloudflare Pages). The Supabase part keeps working
as long as the Supabase project exists (log in at supabase.com with the account that owns it).
