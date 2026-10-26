// Zmanim widget (home page and each beis medrash page) and the home page Shabbos card: today's zmanim for our three locations and this week's Shabbos times.
// Data comes straight from Hebcal's free public API (no key, no tracking); nothing is sent about the visitor.
(function () {
  const TZ = 'America/New_York';
  const PLACES = {
    williamsburg: { zip: '11211', en: 'Williamsburg', yi: 'וויליאמסבורג' },
    monsey: { zip: '10952', en: 'Monsey', yi: 'מאנסי' },
    kiryas_joel: { zip: '10950', en: 'Kiryas Joel', yi: 'קרית יואל' }
  };
  const ROWS = [
    ['alotHaShachar', 'Alos HaShachar', 'עלות השחר'],
    ['sunrise', 'Sunrise', 'הנץ החמה'],
    ['sofZmanShmaMGA', 'Latest Shema (MGA)', 'סוף זמן ק״ש (מג״א)'],
    ['sofZmanShma', 'Latest Shema (GRA)', 'סוף זמן ק״ש (גר״א)'],
    ['sofZmanTfilla', 'Latest Shacharis', 'סוף זמן תפילה'],
    ['chatzot', 'Chatzos', 'חצות'],
    ['minchaGedola', 'Mincha Gedola', 'מנחה גדולה'],
    ['plagHaMincha', 'Plag HaMincha', 'פלג המנחה'],
    ['sunset', 'Shkiah', 'שקיעה'],
    ['tzeit72min', 'Tzeis (72 min.)', 'צאת הכוכבים (72 מינוט)']
  ];
  const KEY = 'khaso_home_zmanim_location';
  const yi = () => document.documentElement.lang === 'yi';
  const cache = {};
  let current = 'williamsburg';
  let shabbos = null;

  function todayISO() {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach((part) => { p[part.type] = part.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function time(value) {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  async function getJSON(url, storeKey) {
    try { const hit = JSON.parse(sessionStorage.getItem(storeKey) || 'null'); if (hit) return hit; } catch (_) {}
    const response = await fetch(url);
    if (!response.ok) throw new Error('Hebcal ' + response.status);
    const data = await response.json();
    try { sessionStorage.setItem(storeKey, JSON.stringify(data)); } catch (_) {}
    return data;
  }

  function renderZmanim() {
    const list = document.getElementById('homeZmanim');
    const dateLine = document.getElementById('homeZmanimDate');
    if (!list) return;
    document.querySelectorAll('.loc-tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.key === current)));
    const data = cache[current];
    if (dateLine && window.KashoSite) dateLine.textContent = window.KashoSite.civilDate(yi() ? 'yi' : 'en');
    if (data === 'error') {
      list.replaceChildren(el('div', 'zman-error', yi() ? 'מען קען יעצט נישט לאדן די זמנים. פרובירט שפעטער.' : "Couldn't load today's zmanim. Please try again shortly."));
      return;
    }
    if (!data) { list.replaceChildren(el('div', 'zman-loading', yi() ? 'לאדט…' : 'Loading…')); return; }
    const now = Date.now();
    let nextMarked = false;
    const rows = ROWS.map(([key, en, he]) => {
      const value = data.times && data.times[key];
      const row = el('div', 'zman-row');
      const dt = el('dt', null, yi() ? he : en);
      const dd = el('dd', null, time(value));
      dd.setAttribute('dir', 'ltr');
      if (value) {
        const at = new Date(value).getTime();
        if (at < now) row.classList.add('is-past');
        else if (!nextMarked) { row.classList.add('is-next'); row.dataset.next = yi() ? 'קומט' : 'next'; dt.dataset.next = yi() ? 'קומט' : 'next'; nextMarked = true; }
      }
      row.append(dt, dd);
      return row;
    });
    list.replaceChildren(...rows);
  }

  async function loadZmanim(key, keepSaved) {
    current = key;
    if (!keepSaved) { try { localStorage.setItem(KEY, key); } catch (_) {} }
    renderZmanim();
    if (cache[key] && cache[key] !== 'error') return;
    const date = todayISO();
    try {
      cache[key] = await getJSON('https://www.hebcal.com/zmanim?cfg=json&zip=' + PLACES[key].zip + '&date=' + date, 'kasho-z-' + key + '-' + date);
    } catch (_) {
      cache[key] = 'error';
    }
    if (current === key) renderZmanim();
  }

  function renderShabbos() {
    const box = document.getElementById('shabbosBox');
    if (!box || !shabbos || !shabbos.rows.length) return;
    const title = document.getElementById('shabbosParsha');
    const label = shabbos.parshaEn
      ? (yi() ? 'שבת קודש ' + shabbos.parshaHe : 'Shabbos ' + shabbos.parshaEn.replace(/^Parashat\s+/, 'Parshas '))
      : (yi() ? 'שבת קודש' : 'This Shabbos');
    title.textContent = label;
    const body = document.getElementById('shabbosRows');
    body.replaceChildren(...shabbos.rows.map((row) => {
      const tr = el('tr');
      const th = el('td', null, yi() ? PLACES[row.key].yi : PLACES[row.key].en);
      const c = el('td', null, row.candles); c.setAttribute('dir', 'ltr');
      const h = el('td', null, row.havdalah); h.setAttribute('dir', 'ltr');
      tr.append(th, c, h);
      return tr;
    }));
    box.hidden = false;
  }

  async function loadShabbos() {
    const date = todayISO();
    const keys = Object.keys(PLACES);
    const results = await Promise.all(keys.map((key) =>
      getJSON('https://www.hebcal.com/shabbat?cfg=json&M=on&zip=' + PLACES[key].zip, 'kasho-s-' + key + '-' + date).catch(() => null)));
    const rows = [];
    let parshaEn = '', parshaHe = '';
    results.forEach((data, i) => {
      if (!data || !data.items) return;
      const candles = data.items.find((item) => item.category === 'candles');
      const havdalah = data.items.find((item) => item.category === 'havdalah');
      const parsha = data.items.find((item) => item.category === 'parashat');
      if (parsha && !parshaEn) { parshaEn = parsha.title; parshaHe = parsha.hebrew; }
      if (candles || havdalah) rows.push({ key: keys[i], candles: candles ? time(candles.date) : '—', havdalah: havdalah ? time(havdalah.date) : '—' });
    });
    shabbos = { rows, parshaEn, parshaHe };
    renderShabbos();
  }

  function init() {
    document.querySelectorAll('.loc-tab').forEach((tab) => {
      tab.addEventListener('click', () => loadZmanim(tab.dataset.key));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const tabs = Array.from(document.querySelectorAll('.loc-tab'));
        const forward = (event.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
        const next = tabs[(tabs.indexOf(tab) + (forward ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        loadZmanim(next.dataset.key);
      });
    });
    const list = document.getElementById('homeZmanim');
    if (!list) return;
    let saved = 'williamsburg';
    const fixed = list.dataset.fixed;
    if (fixed && PLACES[fixed]) saved = fixed;
    else { try { const value = localStorage.getItem(KEY); if (value && PLACES[value]) saved = value; } catch (_) {} }
    loadZmanim(saved, !!fixed);
    if (document.getElementById('shabbosBox')) loadShabbos();
    document.addEventListener('site-language-change', () => { renderZmanim(); renderShabbos(); });
    setInterval(renderZmanim, 60000);
  }

  // Wait for DOMContentLoaded so site.js (also deferred) has set up the language and date helpers.
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
