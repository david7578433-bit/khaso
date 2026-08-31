// Shared helper for pages that need a signed-in, approved member.
// Include it AFTER the Supabase library tag, like this:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="member-auth.js"></script>

const MEMBER_SUPABASE_URL = 'https://dzlxyglrefyzebjrlgtl.supabase.co';
const MEMBER_SUPABASE_KEY = 'sb_publishable_Lz7HJgOFTKNAkjlQIhplFQ_4bIAZ3La';

window.memberClient = window.supabase.createClient(MEMBER_SUPABASE_URL, MEMBER_SUPABASE_KEY);

// Sends the visitor to Google, then back to redirectPath on this site once signed in.
window.signInWithGoogle = async function (redirectPath) {
  const redirectTo = new URL(redirectPath || window.location.pathname, window.location.href).href;
  await window.memberClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
};

window.signOutMember = async function () {
  await window.memberClient.auth.signOut();
  window.location.reload();
};

// Members who don't have a real email can sign up with just a username and
// password. Supabase Auth always needs an email under the hood, so we make
// a stable fake one from the username. This never needs to be a real inbox.
window.usernameToAuthEmail = function (username) {
  const clean = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return clean + '@khaso-noemail.com';
};

window.signUpWithUsername = async function (username, password) {
  const email = window.usernameToAuthEmail(username);
  return window.memberClient.auth.signUp({ email, password });
};

window.signInWithUsername = async function (username, password) {
  const email = window.usernameToAuthEmail(username);
  return window.memberClient.auth.signInWithPassword({ email, password });
};

// True if this signed-in session was created through the username/password
// option rather than Google (based on the fake email domain we generate above).
window.isUsernameAccount = function (session) {
  return !!(session && session.user && session.user.email && session.user.email.endsWith('@khaso-noemail.com'));
};

// Returns { session, profile }.
// session is null when nobody is signed in.
// profile.approved is false until an admin approves the account on admin.html.
window.getMemberStatus = async function () {
  const { data: { session } } = await window.memberClient.auth.getSession();
  if (!session) return { session: null, profile: null };

  const { data: profile, error } = await window.memberClient
    .from('profiles')
    .select('id, display_name, approved, first_name, last_name, phone_number, city, email, username, jewish_year, role, suspended_until, avatar_url, avatar_path, show_phone, show_email, show_city, show_avatar, directory_approved')
    .eq('id', session.user.id)
    .single();

  if (error) return { session, profile: null };
  return { session, profile };
};

// A profile only counts as "complete" once it has the fields every member
// must provide (name + phone + city). Email is required too, except for
// members who checked "I don't have an email".
window.isProfileComplete = function (profile) {
  if (!profile) return false;
  return !!(profile.first_name && profile.last_name && profile.phone_number && profile.city);
};
