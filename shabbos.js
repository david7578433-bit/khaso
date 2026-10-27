// Weekly Shabbos page: parsha, Hebrew date, candle lighting / havdalah / Rabbeinu Tam for our three
// locations, Shabbos zmanim (Hebcal's free public API, no key, nothing about the visitor is sent),
// and the Divrei Torah of the week from data/shabbos.json (edited by the site admins).
(function () {
  const TZ = 'America/New_York';
  const PLACES = [
    { key: 'williamsburg', zip: '11211', en: 'Williamsburg', yi: 'וויליאמסבורג' },
    { key: 'monsey', zip: '10952', en: 'Monsey', yi: 'מאנסי' },
    { key: 'kiryas_joel', zip: '10950', en: 'Kiryas Joel', yi: 'קרית יואל' }
  ];
  const FRI_ROWS = [
    ['plagHaMincha', 'Plag HaMincha (Friday)', 'פלג המנחה (ערב שבת)'],
    ['sunset', 'Shkiah (Friday)', 'שקיעה (ערב שבת)']
  ];
  const SAT_ROWS = [
    ['alotHaShachar', 'Alos HaShachar', 'עלות השחר'],
    ['sunrise', 'Sunrise', 'הנץ החמה'],
    ['sofZmanShmaMGA', 'Latest Shema (MGA)', 'סוף זמן ק״ש (מג״א)'],
    ['sofZmanShma', 'Latest Shema (GRA)', 'סוף זמן ק״ש (גר״א)'],
    ['sofZmanTfilla', 'Latest Shacharis (GRA)', 'סוף זמן תפילה (גר״א)'],
    ['chatzot', 'Chatzos', 'חצות'],
    ['minchaGedola', 'Mincha Gedola', 'מנחה גדולה'],
    ['plagHaMincha', 'Plag HaMincha', 'פלג המנחה'],
    ['sunset', 'Shkiah', 'שקיעה'],
    ['tzeit72min', 'Tzeis (72 min.)', 'צאת הכוכבים (72 מינוט)']
  ];
  const yi = () => document.documentElement.lang === 'yi';
  const $ = (id) => document.getElementById(id);
  const state = { weeks: [], zFri: [], zSat: [], parshaEn: '', parshaHe: '', fri: '', sat: '', heDate: '', specials: [], torah: null, torahError: false };

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function fmt(value) {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  }
  function todayISO() {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function civil(iso, withDay) {
    const d = new Date(iso + 'T12:00:00Z');
    if (yi() && window.KashoSite) {
      const K = window.KashoSite;
      return (withDay ? K.YI_DAYS[d.getUTCDay()] + ', ' : '') + d.getUTCDate() + ' ' + K.YI_MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    }
    return d.toLocaleDateString('en-US', { weekday: withDay ? 'long' : undefined, month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  async function getJSON(url, key) {
    try { const hit = JSON.parse(sessionStorage.getItem(key) || 'null'); if (hit) return hit; } catch (_) {}
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
    return data;
  }
  function parshaName(en) { return (en || '').replace(/^Parashat\s+/, 'Parshas '); }

  // ---------- Banner ----------
  function renderBanner() {
    const he = state.parshaHe ? state.parshaHe.replace(/^פרשת\s*/, 'פרשת ') : '';
    $('sbParshaHe').textContent = he ? 'שבת קודש ' + he : 'שבת קודש';
    $('sbParshaEn').textContent = state.parshaEn ? 'Shabbos ' + parshaName(state.parshaEn) : '';
    $('sbDateHe').textContent = state.heDate || '';
    $('sbDateGreg').textContent = state.sat ? civil(state.sat, false) : '';
    document.querySelector('.sb-dot').hidden = !(state.heDate && state.sat);
    const chips = $('sbSpecial');
    chips.replaceChildren(...state.specials.map((s) => el('li', 'sb-chip', yi() ? (s.hebrew || s.title) : s.title)));
    chips.hidden = !state.specials.length;
    $('sbFriLabel').textContent = state.fri ? ' · ' + (yi() ? 'ערב שבת ' : 'Fri. ') + civil(state.fri, false).replace(/,? \d{4}$/, '') : '';
    $('sbWhatsApp').href = 'https://wa.me/?text=' + encodeURIComponent(whatsappText());
  }

  function siteBase() {
    if (/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) return location.origin + location.pathname.replace(/[^/]*$/, '');
    return 'https://david7578433-bit.github.io/khaso/';
  }
  function whatsappText() {
    const lines = [];
    if (yi()) lines.push('*שבת קודש' + (state.parshaHe ? ' ' + state.parshaHe : '') + '*');
    else lines.push('*Shabbos' + (state.parshaEn ? ' ' + parshaName(state.parshaEn) : '') + '*');
    if (state.heDate || state.sat) lines.push([state.heDate, state.sat ? civil(state.sat, false) : ''].filter(Boolean).join(' · '));
    lines.push('');
    PLACES.forEach((p, i) => {
      const w = state.weeks[i];
      if (!w) return;
      const tam = state.zSat[i] && state.zSat[i].times ? fmt(state.zSat[i].times.tzeit72min) : '—';
      lines.push(yi()
        ? p.yi + ': ליכט צינדן ' + w.candles + ' · הבדלה ' + w.havdalah + ' · ר״ת ' + tam
        : p.en + ': candles ' + w.candles + ' · havdalah ' + w.havdalah + ' · R"T ' + tam);
    });
    lines.push('');
    lines.push((yi() ? 'זמני שבת און דברי תורה: ' : 'Shabbos zmanim & Divrei Torah: ') + siteBase() + 'shabbos.html');
    return lines.join('\n');
  }

  // ---------- Tables ----------
  function renderTimes() {
    const body = $('sbTimesBody');
    if (!state.weeks.length) return;
    if (state.weeks.every((w) => !w)) {
      body.replaceChildren(errorRow(4));
      return;
    }
    body.replaceChildren(...PLACES.map((p, i) => {
      const w = state.weeks[i] || { candles: '—', havdalah: '—' };
      const tr = el('tr');
      const th = el('th', null, yi() ? p.yi : p.en); th.scope = 'row';
      const tam = state.zSat[i] && state.zSat[i].times ? fmt(state.zSat[i].times.tzeit72min) : '—';
      const c = el('td', 'sb-strong', w.candles), h = el('td', null, w.havdalah), t = el('td', null, tam);
      [c, h, t].forEach((td) => td.setAttribute('dir', 'ltr'));
      tr.append(th, c, h, t);
      return tr;
    }));
  }
  function errorRow(cols) {
    const tr = el('tr'); const td = el('td', 'sb-loading', yi() ? 'מען קען יעצט נישט לאדן די זמנים. פרובירט שפעטער.' : "Couldn't load this week's times. Please try again shortly.");
    td.colSpan = cols; tr.append(td); return tr;
  }
  function renderZmanim() {
    const body = $('sbZmanimBody');
    if (!state.zSat.length) return;
    if (state.zSat.every((z) => !z) && state.zFri.every((z) => !z)) { body.replaceChildren(errorRow(4)); return; }
    const rows = [];
    const group = (label) => { const tr = el('tr', 'sb-group'); const td = el('th', null, label); td.colSpan = 4; td.scope = 'colgroup'; tr.append(td); return tr; };
    const make = (list, key, en, he) => {
      const tr = el('tr'); const th = el('th', null, yi() ? he : en); th.scope = 'row'; tr.append(th);
      PLACES.forEach((_, i) => { const td = el('td', null, fmt(list[i] && list[i].times && list[i].times[key])); td.setAttribute('dir', 'ltr'); tr.append(td); });
      return tr;
    };
    rows.push(group(yi() ? 'ערב שבת קודש' + (state.fri ? ' · ' + civil(state.fri, false) : '') : 'Erev Shabbos' + (state.fri ? ' · ' + civil(state.fri, false) : '')));
    FRI_ROWS.forEach(([k, en, he]) => rows.push(make(state.zFri, k, en.replace(' (Friday)', ''), he.replace(' (ערב שבת)', ''))));
    rows.push(group(yi() ? 'שבת קודש' + (state.sat ? ' · ' + civil(state.sat, false) : '') : 'Shabbos' + (state.sat ? ' · ' + civil(state.sat, false) : '')));
    SAT_ROWS.forEach(([k, en, he]) => rows.push(make(state.zSat, k, en, he)));
    body.replaceChildren(...rows);
  }

  // ---------- Divrei Torah ----------
  function pick(item, field) {
    const en = item[field] || '', y = item[field + '_yi'] || '';
    return yi() ? (y || en) : (en || y);
  }
  function safeLink(url) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w./-]+$/.test(u) && !u.includes('..')) return u;
    return '';
  }
  let torahLoaded = false;
  function renderTorah() {
    const box = $('sbTorahBody');
    if (!torahLoaded) return;
    const items = state.torah && Array.isArray(state.torah.items) ? state.torah.items.filter((it) => it && (it.title || it.title_yi)) : [];
    if (!items.length) {
      const empty = el('div', 'sb-empty');
      empty.innerHTML = '<svg class="sb-empty-orn" viewBox="0 0 120 24" aria-hidden="true"><path d="M2 12h44M74 12h44" stroke="currentColor" stroke-width="1.4"/><path d="M60 3l9 9-9 9-9-9z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M60 8l4 4-4 4-4-4z" fill="currentColor"/></svg>';
      empty.append(el('p', 'sb-empty-title', yi() ? 'קומט די וואך' : 'Coming this week'));
      empty.append(el('p', 'sb-empty-text', yi()
        ? 'די דברי תורה און דער שיעור פון דער וואך וועלן ווערן ארויפגעלייגט דא.'
        : 'The Divrei Torah and the shiur of the week will be posted here.'));
      box.replaceChildren(empty);
      return;
    }
    const nodes = items.map((item) => {
      const art = el('article', 'sb-torah-item');
      const title = pick(item, 'title');
      const h = el('h3', null, title);
      if (/[\u0590-\u05FF]/.test(title)) h.setAttribute('dir', 'rtl');
      art.append(h);
      const by = pick(item, 'by');
      if (by) art.append(el('p', 'sb-torah-by', by));
      const text = pick(item, 'text');
      if (text) {
        const wrap = el('div', 'sb-torah-text');
        if (/[\u0590-\u05FF]/.test(text) && !/[A-Za-z]{4,}/.test(text.slice(0, 80))) wrap.setAttribute('dir', 'rtl');
        String(text).split(/\n\s*\n/).forEach((para) => wrap.append(el('p', null, para.trim())));
        art.append(wrap);
      }
      const links = el('div', 'sb-torah-links');
      const pdf = safeLink(item.pdf), audio = safeLink(item.audio);
      if (audio) {
        if (/\.(mp3|m4a|aac|ogg|oga|wav|opus)(\?|$)/i.test(audio)) {
          const player = el('audio'); player.controls = true; player.preload = 'none'; player.src = audio; player.className = 'sb-audio';
          art.append(player);
        }
        const a = el('a', 'button button-ghost'); a.href = audio; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = yi() ? '🎧 הערט דעם שיעור' : '🎧 Listen to the shiur'; links.append(a);
      }
      if (pdf) {
        const a = el('a', 'button'); a.href = pdf; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = yi() ? '📄 לייענט / דרוקט (PDF)' : '📄 Read / print (PDF)'; links.append(a);
      }
      if (links.childNodes.length) art.append(links);
      return art;
    });
    if (state.torah.parsha) nodes.unshift(el('p', 'sb-torah-parsha', state.torah.parsha));
    box.replaceChildren(...nodes);
  }

  function renderAll() { renderBanner(); renderTimes(); renderZmanim(); renderTorah(); }

  // ---------- Load ----------
  async function loadTorah() {
    try {
      const response = await fetch('data/shabbos.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      state.torah = await response.json();
    } catch (_) { state.torah = null; }
    torahLoaded = true;
    renderTorah();
  }

  async function loadWeek() {
    const today = todayISO();
    const weeks = await Promise.all(PLACES.map((p) =>
      getJSON('https://www.hebcal.com/shabbat?cfg=json&M=on&b=18&zip=' + p.zip, 'kasho-sb-' + p.key + '-' + today).catch(() => null)));
    state.weeks = weeks.map((data) => {
      if (!data || !data.items) return null;
      const candles = data.items.find((i) => i.category === 'candles');
      const havdalah = data.items.find((i) => i.category === 'havdalah');
      return { candles: candles ? fmt(candles.date) : '—', havdalah: havdalah ? fmt(havdalah.date) : '—', data, candlesDate: candles && candles.date, havdalahDate: havdalah && havdalah.date };
    });
    const first = state.weeks.find(Boolean);
    if (first) {
      const items = first.data.items;
      const parsha = items.find((i) => i.category === 'parashat');
      if (parsha) { state.parshaEn = parsha.title; state.parshaHe = parsha.hebrew; }
      // The Shabbos date: the parsha's date, else the day of havdalah, else the coming Saturday.
      let sat = parsha ? String(parsha.date).slice(0, 10) : (first.havdalahDate ? String(first.havdalahDate).slice(0, 10) : '');
      if (!sat) { const d = new Date(today + 'T12:00:00Z'); sat = addDays(today, (6 - d.getUTCDay() + 7) % 7); }
      state.sat = sat;
      state.fri = addDays(sat, -1);
      const seen = new Set();
      state.specials = items.filter((i) => ['holiday', 'roshchodesh', 'mevarchim'].includes(i.category) && i.title && !seen.has(i.title) && seen.add(i.title))
        .map((i) => ({ title: i.title, hebrew: i.hebrew }));
      if (!parsha) {
        const hol = items.find((i) => i.category === 'holiday' && String(i.date).slice(0, 10) === sat);
        if (hol) { state.parshaEn = hol.title; state.parshaHe = hol.hebrew; }
      }
    } else {
      const d = new Date(today + 'T12:00:00Z');
      state.sat = addDays(today, (6 - d.getUTCDay() + 7) % 7);
      state.fri = addDays(state.sat, -1);
    }
    renderBanner(); renderTimes();

    const [y, m, dd] = state.sat.split('-').map(Number);
    const conv = getJSON('https://www.hebcal.com/converter?cfg=json&g2h=1&gy=' + y + '&gm=' + m + '&gd=' + dd, 'kasho-conv-' + state.sat)
      .then((c) => { if (c && c.heDateParts) state.heDate = c.heDateParts.d + ' ' + c.heDateParts.m + ' ' + c.heDateParts.y; })
      .catch(() => { try { state.heDate = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(state.sat + 'T12:00:00Z')); } catch (_) {} });
    const zf = Promise.all(PLACES.map((p) => getJSON('https://www.hebcal.com/zmanim?cfg=json&zip=' + p.zip + '&date=' + state.fri, 'kasho-z-' + p.key + '-' + state.fri).catch(() => null)));
    const zs = Promise.all(PLACES.map((p) => getJSON('https://www.hebcal.com/zmanim?cfg=json&zip=' + p.zip + '&date=' + state.sat, 'kasho-z-' + p.key + '-' + state.sat).catch(() => null)));
    const [, fri, sat] = await Promise.all([conv, zf, zs]);
    state.zFri = fri; state.zSat = sat;
    renderAll();
  }

  function init() {
    loadTorah();
    loadWeek();
    document.addEventListener('site-language-change', renderAll);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
