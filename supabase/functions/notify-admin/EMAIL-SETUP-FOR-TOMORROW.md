# Setting up admin email notifications

This makes the admin get an email whenever a picture is uploaded for approval,
or a member sends a message through the "Message the Admin" form. The code
for this is already written and sitting in the repo at
`supabase/functions/notify-admin/index.ts` — it just isn't connected yet.
This needs a few manual steps in the Supabase Dashboard and a free email
service called Resend. None of this can be done from the website editor, so
it has to be done by hand, once.

## 1. Create a free Resend account and API key

1. Go to https://resend.com and sign up (free tier is enough for this).
2. Once signed in, go to **API Keys** and create a new key.
3. Copy the key — it starts with `re_`. You'll paste it into Supabase in step 3.

(Optional, can be done later: verify your own domain in Resend so emails come
from an address like `admin@yourdomain.com` instead of Resend's shared testing
address. Not required to get started.)

## 2. Deploy the Edge Function to Supabase

This part needs the Supabase CLI, which runs from a computer's terminal (not
from the Supabase website). If this feels too technical, it's fine to ask
someone with coding experience to do just this one step — everything else on
the site was built without needing this.

```
npm install -g supabase
supabase login
supabase link --project-ref dzlxyglrefyzebjrlgtl
supabase functions deploy notify-admin
```

## 3. Set the secret keys the function needs

In the Supabase Dashboard: **Project Settings → Edge Functions → Secrets**
(or via CLI), add:

- `RESEND_API_KEY` — the key from step 1
- `ADMIN_EMAIL` — the email that should receive notifications (defaults to
  david7578433@gmail.com if not set)

Via CLI:
```
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set ADMIN_EMAIL=david7578433@gmail.com
```

## 4. Connect the database to the function (Database Webhooks)

In the Supabase Dashboard, go to **Database → Webhooks → Create a new webhook**,
and create TWO webhooks:

**Webhook 1 — new picture uploads**
- Table: `photo_uploads`
- Events: `INSERT`
- Type: HTTP Request → your deployed function's URL (shown after step 2, looks
  like `https://dzlxyglrefyzebjrlgtl.supabase.co/functions/v1/notify-admin`)
- Method: POST

**Webhook 2 — new messages to admin**
- Table: `admin_messages`
- Events: `INSERT`
- Type: HTTP Request → same function URL as above
- Method: POST

(Webhook 2 only works once `admin-messages.sql` has been run — see the main
to-do list.)

## 5. Test it

Upload a test picture, or send a test "Message the Admin" from the Ages page,
and check that an email arrives. If it doesn't, the **Logs** tab under
**Edge Functions** in the Supabase Dashboard will show what went wrong (most
likely cause: a typo in the secret key, or the webhook URL).

---

If any of this feels like too much, it's completely fine to skip email
notifications — the admin page already shows pending pictures and messages
whenever it's opened, this just adds a reminder on top.
