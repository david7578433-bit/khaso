// Rides board — uses the existing Supabase `rides` table exactly as community.html and admin.html do
// (columns: id, user_id, ride_type 'offer'|'request', from_location, to_location, depart_at, seats, contact,
// notes, created_at; join profiles(first_name,last_name,display_name)). The table's row-level security lets
// only signed-in, approved members read and post, so visitors see a "log in" note instead of the list.
(function () {
  const yi = () => document.documentElement.lang === 'yi';
  const $ = (id) => document.getElementById(id);
  let session = null, profile = null, rides = [], filter = 'all', state = 'loading';

  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function T(en, y) { return yi() ? y : en; }
  function when(iso) {
    const d = new Date(iso);
    if (yi() && window.KashoSite) {
      const K = window.KashoSite;
      return K.YI_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + K.YI_MONTHS[d.getMonth()] + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function renderState() {
    const box = $('ridesState');
    const show = (nodes) => { box.hidden = false; box.replaceChildren(...nodes); };
    $('ridesPost').hidden = state !== 'member';
    $('ridesListCard').hidden = state !== 'member';
    if (state === 'loading') { show([el('p', 'rides-loading', T('Checking your sign-in…', 'מען קוקט אייער לאגין…'))]); return; }
    if (state === 'member') { box.hidden = true; return; }
    const nodes = [];
    if (state === 'signedout') {
      nodes.push(el('h2', null, T('Log in to see and post rides', 'לאגט אריין צו זען און ארויפלייגן רייד')));
      nodes.push(el('p', null, T('The rides board is for approved Kasho members. Log in with your member account; new members can sign up on the same page, and an admin approves the account.',
        'דער רייד ברעט איז פאר באשטעטיגטע קאשוי מעמבערס. לאגט אריין מיט אייער מעמבער אקאונט; נייע מעמבערס קענען זיך איינשרייבן אויף דעם זעלבן זייטל, און אן אדמין באשטעטיגט דעם אקאונט.')));
      const a = el('a', 'button button-gold', T('Log in', 'לאגין')); a.href = 'login.html';
      nodes.push(a);
    } else if (state === 'pending') {
      nodes.push(el('h2', null, T('Your account is waiting for approval', 'אייער אקאונט ווארט אויף באשטעטיגונג')));
      nodes.push(el('p', null, T('Thanks for signing up. Once an admin approves your account, the rides board opens for you here.', 'א דאנק פארן איינשרייבן. ווען אן אדמין באשטעטיגט אייער אקאונט, וועט זיך דער רייד ברעט עפענען פאר אייך דא.')));
    } else {
      nodes.push(el('h2', null, T('Member features are temporarily offline', 'מעמבער פונקציעס זענען צייטווייליג נישט פארבונדן')));
      nodes.push(el('p', null, T('We couldn’t reach the member database just now. Please try again in a little while.', 'מען האט יעצט נישט געקענט דערגרייכן די מעמבער דאטא. פרובירט שפעטער נאכאמאל.')));
      const b = el('button', 'button', T('Try again', 'פרובירט נאכאמאל')); b.type = 'button'; b.addEventListener('click', start);
      nodes.push(b);
    }
    show(nodes);
  }

  function renderList() {
    const list = $('ridesList');
    document.querySelectorAll('.rides-filter [data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    const items = rides.filter((r) => filter === 'all' || r.ride_type === filter);
    if (!items.length) { list.replaceChildren(el('p', 'rides-empty', T('No upcoming rides posted yet. Be the first!', 'נאך קיין רייד נישט ארויפגעלייגט. זייט די ערשטע!'))); return; }
    list.replaceChildren(...items.map((ride) => {
      const p = ride.profiles || {};
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.display_name || T('Member', 'מעמבער');
      const card = el('article', 'ride-card ride-' + (ride.ride_type === 'offer' ? 'offer' : 'request'));
      card.append(el('span', 'ride-tag', ride.ride_type === 'offer' ? T('Offering a ride', 'באט אן א רייד') : T('Needs a ride', 'דארף א רייד')));
      const route = el('h3', 'ride-route');
      route.append(el('span', null, ride.from_location), el('span', 'ride-arrow', yi() ? ' ← ' : ' → '), el('span', null, ride.to_location));
      card.append(route);
      card.append(el('p', 'ride-when', when(ride.depart_at) + ' · ' + name));
      if (ride.seats) card.append(el('p', 'ride-meta', T('Seats: ', 'ערטער: ') + ride.seats));
      if (ride.contact) {
        const c = el('p', 'ride-meta');
        const digits = String(ride.contact).replace(/[^\d+]/g, '');
        if (digits.length >= 7) { const a = el('a', null, ride.contact); a.href = 'tel:' + digits; a.dir = 'ltr'; c.append(document.createTextNode(T('Contact: ', 'קאנטאקט: ')), a); }
        else c.textContent = T('Contact: ', 'קאנטאקט: ') + ride.contact;
        card.append(c);
      }
      if (ride.notes) card.append(el('p', 'ride-notes', ride.notes));
      if (session && ride.user_id === session.user.id) {
        const del = el('button', 'yz-remove', T('Remove', 'אויסמעקן')); del.type = 'button';
        del.addEventListener('click', async () => {
          if (!confirm(T('Remove this ride?', 'אויסמעקן דעם רייד?'))) return;
          const result = await window.memberClient.from('rides').delete().eq('id', ride.id).eq('user_id', session.user.id);
          if (result.error) $('rideStatus').textContent = result.error.message; else loadRides();
        });
        card.append(del);
      }
      return card;
    }));
  }

  async function loadRides() {
    const result = await window.memberClient.from('rides')
      .select('id, user_id, ride_type, from_location, to_location, depart_at, seats, contact, notes, created_at, profiles(first_name,last_name,display_name)')
      .gte('depart_at', new Date().toISOString()).order('depart_at');
    if (result.error) { $('ridesList').replaceChildren(el('p', 'rides-empty', T('Rides could not be loaded: ', 'מען האט נישט געקענט לאדן: ') + result.error.message)); return; }
    rides = result.data || [];
    renderList();
  }

  async function start() {
    state = 'loading'; renderState();
    if (!window.memberClient || !window.getMemberStatus) { state = 'offline'; renderState(); return; }
    try {
      const status = await window.getMemberStatus();
      session = status.session; profile = status.profile;
      if (!session) state = 'signedout';
      else if (!profile || !profile.approved) state = profile ? 'pending' : 'offline';
      else state = 'member';
    } catch (_) { state = 'offline'; }
    renderState();
    if (state === 'member') loadRides();
  }

  function initForm() {
    const time = $('rideTime');
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    time.min = now.toISOString().slice(0, 16);
    $('rideForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!session) return;
      const status = $('rideStatus');
      const from = $('rideFrom').value.trim(), to = $('rideTo').value.trim(), at = $('rideTime').value;
      if (!from || !to || !at) { status.textContent = T('Please fill in from, to and the date & time.', 'ביטע פילט אויס פון, קיין, און טאג און צייט.'); return; }
      status.textContent = T('Posting…', 'מען לייגט ארויף…');
      const payload = {
        user_id: session.user.id,
        ride_type: document.querySelector('input[name="rideType"]:checked').value,
        from_location: from, to_location: to,
        depart_at: new Date(at).toISOString(),
        seats: $('rideSeats').value ? Number($('rideSeats').value) : null,
        contact: $('rideContact').value.trim() || null,
        notes: $('rideNotes').value.trim() || null
      };
      const result = await window.memberClient.from('rides').insert(payload);
      if (result.error) status.textContent = T('Could not post the ride: ', 'מען האט נישט געקענט ארויפלייגן: ') + result.error.message;
      else { event.target.reset(); status.textContent = T('Ride posted ✓', 'ארויפגעלייגט ✓'); loadRides(); }
    });
    document.querySelectorAll('.rides-filter [data-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; renderList(); }));
  }

  function init() {
    initForm();
    start();
    document.addEventListener('site-language-change', () => { renderState(); if (state === 'member') renderList(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
