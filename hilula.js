// Shabbos Hilula Kadisha 5787 page: poster lightbox, add-to-calendar (.ics + Google), share (phone share sheet / copy link).
// Times are fixed for Shabbos Parshas Ki Sisa, 20 Adar I 5787 (Fri Feb 26 – Sat Feb 27, 2027), from Hebcal.com
// (candles 18 min before sunset, havdalah at tzeis 8.5°). February is EST (UTC−5), so the UTC stamps below are exact.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const PAGE_URL = 'https://david7578433-bit.github.io/khaso/hilula.html';
  const TIMES = {
    williamsburg: { en: 'Williamsburg', yi: 'וויליאמסבורג', candles: '5:25 PM', havdalah: '6:25 PM', start: '20270226T222500Z', end: '20270227T232500Z' },
    monsey: { en: 'Monsey', yi: 'מאנסי', candles: '5:25 PM', havdalah: '6:26 PM', start: '20270226T222500Z', end: '20270227T232600Z' },
    kiryas_joel: { en: 'Kiryas Joel', yi: 'קרית יואל', candles: '5:25 PM', havdalah: '6:26 PM', start: '20270226T222500Z', end: '20270227T232600Z' }
  };
  const TITLE = 'Shabbos Hilula Kadisha · שבת הילולא קדישא — Parshas Ki Sisa';
  let loc = 'williamsburg';
  try { const saved = localStorage.getItem('hilulaLoc'); if (saved && TIMES[saved]) loc = saved; } catch (_) {}

  function details(t) {
    return 'שבת הילולא קדישא · פרשת כי תשא · כ׳ אדר א׳ תשפ״ז\n' +
      'Shabbos Hilula Kadisha · Parshas Ki Sisa · 20 Adar I 5787\n' +
      'Candle lighting ' + t.candles + ' · Havdalah ' + t.havdalah + ' (' + t.en + ', times by Hebcal.com)\n' + PAGE_URL;
  }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function fold(line) {
    // RFC 5545: fold lines longer than 75 octets.
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out = []; let cur = '', curLen = 0;
    for (const ch of line) {
      const n = new TextEncoder().encode(ch).length;
      if (curLen + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; curLen = 0; }
      cur += ch; curLen += n;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  function ics(t) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kasho Community//Shabbos Hilula 5787//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:hilula-5787-' + loc + '@david7578433-bit.github.io', 'DTSTAMP:' + stamp,
      'DTSTART:' + t.start, 'DTEND:' + t.end, 'SUMMARY:' + esc(TITLE), 'DESCRIPTION:' + esc(details(t)), 'URL:' + PAGE_URL,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT2H', 'DESCRIPTION:' + esc(TITLE), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'];
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function google(t) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(TITLE) +
      '&dates=' + t.start + '/' + t.end + '&details=' + encodeURIComponent(details(t)) + '&ctz=America/New_York';
  }
  const SHARE_TEXT = 'שבת הילולא קדישא · Shabbos Hilula Kadisha\nפרשת כי תשא · כ׳ אדר א׳ תשפ״ז\nהתאחדות כלל תלמידי וחסידי קאשוי';

  let icsUrl = null;
  function update() {
    const t = TIMES[loc];
    if (icsUrl) URL.revokeObjectURL(icsUrl);
    icsUrl = URL.createObjectURL(new Blob([ics(t)], { type: 'text/calendar;charset=utf-8' }));
    const a = $('hlIcs'); if (a) { a.href = icsUrl; a.download = 'shabbos-hilula-5787-' + loc.replace('_', '-') + '.ics'; }
    const g = $('hlGoogle'); if (g) g.href = google(t);
    document.querySelectorAll('.hl-loc').forEach((b) => b.setAttribute('aria-pressed', b.dataset.loc === loc ? 'true' : 'false'));
  }
  document.querySelectorAll('.hl-loc').forEach((b) => b.addEventListener('click', () => {
    loc = b.dataset.loc; try { localStorage.setItem('hilulaLoc', loc); } catch (_) {}
    update();
  }));
  const sh = $('hlShare');
  if (sh) sh.addEventListener('click', () => { if (window.KashoShare) window.KashoShare.share({ title: TITLE, text: SHARE_TEXT, url: PAGE_URL }); });
  const cp = $('hlCopy');
  if (cp) cp.addEventListener('click', () => { if (window.KashoShare) window.KashoShare.copyWithNote(PAGE_URL, 'Link copied.', 'דער לינק איז קאפירט.'); });
  update();

  // Lightbox: the link still opens the full image where <dialog> is missing.
  const dlg = $('hlLightbox'), link = $('hlPosterLink');
  if (dlg && link && typeof dlg.showModal === 'function') {
    link.addEventListener('click', (e) => { e.preventDefault(); dlg.showModal(); document.documentElement.classList.add('hl-noscroll'); });
    dlg.addEventListener('close', () => document.documentElement.classList.remove('hl-noscroll'));
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.tagName === 'IMG') dlg.close(); });
    const c = $('hlClose'); if (c) c.addEventListener('click', () => dlg.close());
  }
})();
