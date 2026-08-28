// Supabase Edge Function: notify-admin
//
// What this does: whenever someone uploads a picture for approval, or sends a
// message to the admin, this function sends the admin an email so they don't
// have to keep checking the admin page.
//
// This file is NOT live yet — it needs to be deployed and connected to a
// Resend account first. See EMAIL-SETUP-FOR-TOMORROW.md for the exact steps.

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'david7578433@gmail.com';
// Resend requires the "from" address to be on a domain you've verified with
// them. Until a real domain is verified, Resend's shared testing address
// (onboarding@resend.dev) works for sending to your own admin email.
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Only POST is supported', { status: 405 });
  }

  if (!RESEND_API_KEY) {
    return new Response('RESEND_API_KEY is not set', { status: 500 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response('Invalid JSON body', { status: 400 });
  }

  // Supabase Database Webhooks send { type, table, record, old_record }.
  const table = payload.table;
  const record = payload.record || {};

  let subject = 'New activity on ברכת שמים קאשוי';
  let text = 'Something new needs your attention on the admin page.';

  if (table === 'photo_uploads') {
    subject = 'New picture waiting for approval';
    text = `A new picture was uploaded for the "${record.category || 'unknown'}" category and is waiting for your approval.\n\nCaption: ${record.caption || '(none)'}\n\nGo to the admin page to review it.`;
  } else if (table === 'admin_messages') {
    subject = 'New message from a member';
    text = `A member sent you a message:\n\n${record.body || ''}\n\nGo to the admin page to read it.`;
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text
    })
  });

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text();
    return new Response('Resend error: ' + errorBody, { status: 502 });
  }

  return new Response('OK', { status: 200 });
});
