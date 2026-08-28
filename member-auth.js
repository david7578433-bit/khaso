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

// Returns { session, profile }.
// session is null when nobody is signed in.
// profile.approved is false until an admin approves the account on admin.html.
window.getMemberStatus = async function () {
  const { data: { session } } = await window.memberClient.auth.getSession();
  if (!session) return { session: null, profile: null };

  const { data: profile, error } = await window.memberClient
    .from('profiles')
    .select('id, display_name, approved')
    .eq('id', session.user.id)
    .single();

  if (error) return { session, profile: null };
  return { session, profile };
};
