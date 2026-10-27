// Yahrzeit calendar — all calculation happens in the browser with the Hebcal calendar library
// (vendor/hebcal-core.min.js, GPL). Nothing is sent anywhere; saved entries live in localStorage only.
(function () {
  const STORE = 'kasho-yahrzeits';
  const YEARS = 10;
  const MONTHS_EN = { 1: 'Nisan', 2: 'Iyar', 3: 'Sivan', 4: 'Tammuz', 5: 'Av', 6: 'Elul', 7: 'Tishrei', 8: 'Cheshvan', 9: 'Kislev', 10: 'Teves', 11: 'Shevat' };
  const MONTHS_HE = { 1: 'ניסן', 2: 'אייר', 3: 'סיון', 4: 'תמוז', 5: 'אב', 6: 'אלול', 7: 'תשרי', 8: 'חשון', 9: 'כסלו', 10: 'טבת', 11: 'שבט' };
  // Order shown in the month picker (Tishrei first). value -> [hebcal month, needs leap year?]
  const PICKER = [
    ['7', 7, null], ['8', 8, null], ['9', 9, null], ['10', 10, null], ['11', 11, null],
    ['adar', 12, false], ['adar1', 12, true], ['adar2', 13, true],
    ['1', 1, null], ['2', 2, null], ['3', 3, null], ['4', 4, null], ['5', 5, null], ['6', 6, null]
  ];
  const YI_DAYS = ['זונטאג', 'מאנטאג', 'דינסטאג', 'מיטוואך', 'דאנערשטאג', 'פרייטאג', 'שבת קודש'];
  const YI_MONTHS = ['יאנואר', 'פעברואר', 'מערץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אויגוסט', 'סעפטעמבער', 'אקטאבער', 'נאוועמבער', 'דעצעמבער'];
  const yi = () => document.documentElement.lang === 'yi';
  const $ = (id) => document.getElementById(id);
  let H = null;           // hebcal library
  let current = null;     // the entry being shown

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- Hebrew date helpers ----------
  function monthEn(mm, yy) {
    if (mm === 12) return H.HDate.isLeapYear(yy) ? 'Adar I' : 'Adar';
    if (mm === 13) return 'Adar II';
    return MONTHS_EN[mm];
  }
  function monthHe(mm, yy) {
    if (mm === 12) return H.HDate.isLeapYear(yy) ? 'אדר א׳' : 'אדר';
    if (mm === 13) return 'אדר ב׳';
    return MONTHS_HE[mm];
  }
  const gem = (n) => H.gematriya(n);
  function hebEn(hd, withYear) { return hd.getDate() + ' ' + monthEn(hd.getMonth(), hd.getFullYear()) + (withYear === false ? '' : ' ' + hd.getFullYear()); }
  function hebHe(hd, withYear) { return gem(hd.getDate()) + ' ' + monthHe(hd.getMonth(), hd.getFullYear()) + (withYear === false ? '' : ' ' + gem(hd.getFullYear())); }
  function hebLabel(hd, withYear) { return yi() ? hebHe(hd, withYear) : hebEn(hd, withYear); }

  function ymd(date) { return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoOf(date) { const p = ymd(date); return p.y + '-' + pad(p.m) + '-' + pad(p.d); }
  function compact(date) { const p = ymd(date); return '' + p.y + pad(p.m) + pad(p.d); }
  function addDays(date, n) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n); return d; }
  function civil(date, opts) {
    const o = opts || {};
    if (yi()) return (o.weekday === false ? '' : YI_DAYS[date.getDay()] + ', ') + date.getDate() + ' ' + YI_MONTHS[date.getMonth()] + (o.year === false ? '' : ' ' + date.getFullYear());
    return date.toLocaleDateString('en-US', { weekday: o.weekday === false ? undefined : (o.short ? 'short' : 'long'), month: o.short ? 'short' : 'long', day: 'numeric', year: o.year === false ? undefined : 'numeric' });
  }
  function civilEn(date) { return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function todayLocal() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  function heBdi(text) { const b = document.createElement('bdi'); b.setAttribute('lang', 'he'); b.setAttribute('dir', 'rtl'); b.className = 'yz-he'; b.textContent = text; return b; }

  // What to call the yearly date in one line.
  function eachYearLabel(deathHd, years) {
    const labels = [...new Set(years.map((y) => hebLabel(y.hd, false)))];
    const mm = deathHd.getMonth(), dd = deathHd.getDate(), dyLeap = H.HDate.isLeapYear(deathHd.getFullYear());
    if ((mm === 12 || mm === 13) && dd < 30) {
      const day = yi() ? gem(dd) : String(dd);
      if (mm === 12 && !dyLeap) return yi() ? day + ' אדר (אין א שנה מעוברת: אדר א׳ און אדר ב׳)' : day + ' Adar (in leap years: Adar I and Adar II)';
      if (mm === 12) return yi() ? day + ' אדר (אין א שנה מעוברת: אדר א׳)' : day + ' Adar (in leap years: Adar I)';
      return yi() ? day + ' אדר (אין א שנה מעוברת: אדר ב׳)' : day + ' Adar (in leap years: Adar II)';
    }
    if (labels.length === 1) return labels[0];
    return yi() ? labels.join(' / ') + ' (לויט דעם יאר, זעט אונטן)' : labels.join(' or ') + ' (depends on the year — see below)';
  }

  // ---------- The calculation ----------
  // deathHd: the Hebrew date of passing (after any sunset adjustment).
  function computeYears(deathHd) {
    const today = todayLocal();
    const todayHd = new H.HDate(today);
    let year = Math.max(todayHd.getFullYear(), deathHd.getFullYear() + 1);
    const out = [];
    while (out.length < YEARS && year < deathHd.getFullYear() + 400) {
      const y = H.HebrewCalendar.getYahrzeit(year, deathHd);
      if (y) {
        const date = y.greg();
        if (date >= today || out.length) {
          const entry = { hyear: year, hd: y, date, eve: addDays(date, -1), alt: null };
          // Passing in Adar of a regular year, and this is a leap year: the date falls in Adar I (Hebcal's
          // primary) and also in Adar II; customs differ, so both are given.
          if (deathHd.getMonth() === 12 && !H.HDate.isLeapYear(deathHd.getFullYear()) && H.HDate.isLeapYear(year) && y.getMonth() === 12) {
            const alt = new H.HDate(deathHd.getDate(), 13, year);
            entry.alt = { hd: alt, date: alt.greg(), eve: addDays(alt.greg(), -1) };
          }
          out.push(entry);
        }
      }
      year += 1;
    }
    return out;
  }

  function deathFromForm() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'greg') {
      const value = $('yzGreg').value;
      if (!value) return { error: yi() ? 'קלויבט די דאטום פון דער פטירה.' : 'Please choose the date of passing.' };
      const [y, m, d] = value.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (!y || isNaN(date.getTime()) || y < 1800) return { error: yi() ? 'די דאטום איז נישט גילטיג.' : 'That date doesn’t look right.' };
      if (date > todayLocal()) return { error: yi() ? 'די דאטום איז אין דער צוקונפט.' : 'That date is in the future.' };
      const after = document.querySelector('input[name="sunset"]:checked').value === 'after';
      let hd = new H.HDate(date);
      if (after) hd = hd.next();
      return { hd, greg: value, after, mode };
    }
    const dd = Number($('yzHDay').value);
    const pick = $('yzHMonth').value;
    const yy = Number($('yzHYear').value);
    if (!yy || yy < 5000 || yy > 6500) return { error: yi() ? 'שרייבט אריין דאס יאר אלס נומער, למשל 5784.' : 'Enter the Hebrew year as a number, e.g. 5784.' };
    const leap = H.HDate.isLeapYear(yy);
    const spec = PICKER.find((p) => p[0] === pick);
    if (!spec) return { error: yi() ? 'קלויבט א חודש.' : 'Please choose a month.' };
    const [, mm, needsLeap] = spec;
    if (needsLeap === true && !leap) return { error: yi() ? gem(yy) + ' (' + yy + ') איז נישט קיין שנה מעוברת — קלויבט „אדר“.' : yy + ' (' + gem(yy) + ') is not a leap year — choose “Adar”.' };
    if (needsLeap === false && leap) return { error: yi() ? gem(yy) + ' (' + yy + ') איז א שנה מעוברת — קלויבט אדר א׳ אדער אדר ב׳.' : yy + ' (' + gem(yy) + ') is a leap year — choose Adar I or Adar II.' };
    const days = H.HDate.daysInMonth(mm, yy);
    if (dd > days) return { error: yi() ? monthHe(mm, yy) + ' ' + gem(yy) + ' האט נאר ' + days + ' טעג.' : monthEn(mm, yy) + ' ' + yy + ' had only ' + days + ' days.' };
    const hd = new H.HDate(dd, mm, yy);
    if (hd.greg() > todayLocal()) return { error: yi() ? 'די דאטום איז אין דער צוקונפט.' : 'That date is in the future.' };
    return { hd, mode, hday: dd, hmonth: pick, hyear: yy };
  }

  // ---------- Rendering ----------
  function renderPreview() {
    const box = $('yzPreview');
    if (!H) { box.hidden = true; return; }
    const r = deathFromForm();
    if (r.error || !r.hd) { box.hidden = true; return; }
    box.hidden = false;
    const greg = r.hd.greg();
    box.replaceChildren();
    if (yi()) {
      box.append(el('span', null, 'טאג פון פטירה: '), heBdi(hebHe(r.hd)));
      box.append(el('span', 'yz-sub', ' (' + civil(greg) + ')' + (r.mode === 'greg' && r.after ? ' — נאך שקיעה, דעריבער דער קומענדיגער אידישער טאג' : '')));
    } else {
      box.append(el('span', null, 'Hebrew date of passing: '), el('strong', null, hebEn(r.hd)), document.createTextNode(' · '), heBdi(hebHe(r.hd)));
      box.append(el('span', 'yz-sub', r.mode === 'heb' ? ' (' + civil(greg) + ')' : (r.after ? ' — after sunset, so the next Hebrew day' : '')));
    }
  }

  function render(entry) {
    current = entry;
    const deathHd = new H.HDate(entry.hd.dd, entry.hd.mm, entry.hd.yy);
    const years = computeYears(deathHd);
    entry._years = years;
    $('yzIntro').hidden = true;
    const card = $('yzResult');
    card.hidden = false;
    $('yzResultName').textContent = entry.name || (yi() ? 'יארצייט' : 'Yahrzeit');
    if (/[\u0590-\u05FF]/.test(entry.name || '')) $('yzResultName').setAttribute('dir', 'rtl'); else $('yzResultName').removeAttribute('dir');
    const sum = $('yzSummary');
    sum.replaceChildren();
    sum.append(el('span', null, yi() ? 'טאג פון פטירה: ' : 'Passed away: '));
    if (yi()) sum.append(heBdi(hebHe(deathHd)));
    else { sum.append(el('span', 'yz-strong', hebEn(deathHd))); sum.append(document.createTextNode(' · ')); sum.append(heBdi(hebHe(deathHd))); }
    const gregNote = entry.greg ? civil(new Date(entry.greg + 'T12:00:00')) + (entry.after ? (yi() ? ', נאך שקיעה' : ', after sunset') : '') : civil(deathHd.greg());
    sum.append(el('span', 'yz-sub', ' (' + gregNote + ')'));
    const yahr = el('strong', 'yz-each', (yi() ? 'יארצייט יעדעס יאר: ' : 'Yahrzeit each year: ') + eachYearLabel(deathHd, years));
    sum.append(el('br'), yahr);

    const list = $('yzYears');
    list.replaceChildren(...years.map((y, i) => {
      const li = el('li', 'yz-year' + (i === 0 ? ' is-next' : ''));
      const main = el('div', 'yz-year-main');
      const dateLine = el('p', 'yz-date', civil(y.date));
      const hebLine = el('p', 'yz-hdate', hebLabel(y.hd));
      if (yi()) hebLine.setAttribute('lang', 'he');
      const eve = el('p', 'yz-eve', yi() ? 'הייבט זיך אן ' + civil(y.eve, { year: false }) + ' ביינאכט' : 'Begins ' + y.eve.toLocaleDateString('en-US', { weekday: 'long' }) + ' evening, ' + y.eve.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      main.append(hebLine, dateLine, eve);
      if (y.alt) {
        const alt = el('p', 'yz-alt', (yi() ? 'אויך ' : 'Also ') + hebLabel(y.alt.hd) + ' · ' + civil(y.alt.date, { short: true }) + (yi() ? ' (הייבט זיך אן ' + civil(y.alt.eve, { year: false }) + ' ביינאכט)' : ' (begins the evening before)'));
        main.append(alt);
      }
      const side = el('div', 'yz-year-side no-print');
      if (i === 0) side.append(el('span', 'yz-badge', yi() ? 'קומענדיג' : 'Next'));
      const g = el('a', 'yz-gcal'); g.href = googleLink(entry, y.hd, y.date); g.target = '_blank'; g.rel = 'noopener';
      g.textContent = yi() ? '+ Google קאלענדאר' : '+ Google Calendar';
      side.append(g);
      li.append(main, side);
      return li;
    }));
    const note = $('yzAdarNote');
    const hasAlt = years.some((y) => y.alt);
    note.hidden = !hasAlt;
    if (hasAlt) note.textContent = yi()
      ? 'די פטירה איז געווען אין אדר פון א פשוט׳ע יאר. אין א שנה מעוברת ווערן געוויזן אדר א׳ און אדר ב׳ — די מנהגים זענען פארשידן (אסאך האלטן ביידע). פרעגט אייער רב.'
      : 'The passing was in Adar of a regular year. In leap years both Adar I and Adar II are shown — customs differ (many keep both). Ask your Rav.';
    $('yzWhatsApp').href = 'https://wa.me/?text=' + encodeURIComponent(shareText(entry, deathHd, years));
    $('yzSavedMsg').hidden = true;
    updateSaveButton();
  }

  function siteBase() {
    if (/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) return location.origin + location.pathname.replace(/[^/]*$/, '');
    return 'https://david7578433-bit.github.io/khaso/';
  }
  function shareText(entry, deathHd, years) {
    const lines = [];
    lines.push('*' + (yi() ? 'יארצייט' : 'Yahrzeit') + (entry.name ? ' — ' + entry.name : '') + '*');
    lines.push(hebLabel(deathHd));
    lines.push('');
    years.slice(0, 5).forEach((y) => {
      lines.push(hebLabel(y.hd) + ' — ' + civil(y.date, { short: true }) + (yi() ? ' (הייבט זיך אן ביינאכט פריער)' : ' (begins the evening before)'));
      if (y.alt) lines.push('   + ' + hebLabel(y.alt.hd) + ' — ' + civil(y.alt.date, { short: true }));
    });
    lines.push('');
    lines.push((yi() ? 'יארצייט קאלענדאר: ' : 'Yahrzeit calendar: ') + siteBase() + 'yahrzeit.html');
    return lines.join('\n');
  }

  // ---------- Calendar export ----------
  function googleLink(entry, hd, date) {
    const title = (entry.name ? 'Yahrzeit: ' + entry.name : 'Yahrzeit') + ' (' + hebEn(hd, false) + ')';
    const details = 'Yahrzeit' + (entry.name ? ' of ' + entry.name : '') + ' — ' + hebEn(hd) + ' (' + hebHe(hd) + ').\nBegins at nightfall on the evening of ' + civilEn(addDays(date, -1)) + '.\n\n' + siteBase() + 'yahrzeit.html';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + compact(date) + '/' + compact(addDays(date, 1)) + '&details=' + encodeURIComponent(details);
  }
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    // Fold at 73 bytes (UTF-8 safe).
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 73) return line;
    const out = []; let cur = '';
    for (const ch of line) {
      if (enc.encode(cur + ch).length > (out.length ? 72 : 73)) { out.push(cur); cur = ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  function buildIcs(entry) {
    const years = entry._years || [];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const uidBase = 'yahrzeit-' + entry.hd.yy + '-' + entry.hd.mm + '-' + entry.hd.dd + '-' + hash(entry.name || '');
    const name = entry.name || '';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kasho Community//Yahrzeit Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + icsEscape('Yahrzeit' + (name ? ' – ' + name : ''))];
    const add = (hd, date, tag) => {
      const eve = addDays(date, -1);
      lines.push('BEGIN:VEVENT',
        'UID:' + uidBase + '-' + compact(date) + (tag ? '-' + tag : '') + '@kasho-community',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + compact(date),
        'DTEND;VALUE=DATE:' + compact(addDays(date, 1)),
        'SUMMARY:' + icsEscape((name ? 'Yahrzeit: ' + name : 'Yahrzeit') + ' (' + hebEn(hd, false) + ')'),
        'DESCRIPTION:' + icsEscape('Yahrzeit' + (name ? ' of ' + name : '') + ' — ' + hebEn(hd) + ' (' + hebHe(hd) + ').\nBegins at nightfall on the evening of ' + civilEn(eve) + '.\n\nFrom the Kasho community yahrzeit calendar: ' + siteBase() + 'yahrzeit.html'),
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape('Yahrzeit begins tonight' + (name ? ': ' + name : '')), 'TRIGGER:-PT7H', 'END:VALARM',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape('Yahrzeit today' + (name ? ': ' + name : '')), 'TRIGGER:PT8H', 'END:VALARM',
        'END:VEVENT');
    };
    years.forEach((y) => { add(y.hd, y.date, y.alt ? 'adar1' : ''); if (y.alt) add(y.alt.hd, y.alt.date, 'adar2'); });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function downloadIcs() {
    if (!current) return;
    const ics = buildIcs(current);
    const slug = (current.name || '').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 40);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'yahrzeit' + (slug ? '-' + slug : '') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---------- Saved list (this device only) ----------
  function loadSaved() { try { const v = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } }
  function storeSaved(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (_) { return false; } }
  function sameEntry(a, b) { return a && b && (a.name || '') === (b.name || '') && a.hd.dd === b.hd.dd && a.hd.mm === b.hd.mm && a.hd.yy === b.hd.yy; }
  function updateSaveButton() {
    const saved = current && loadSaved().some((e) => sameEntry(e, current));
    const btn = $('yzSave');
    btn.disabled = !!saved;
    btn.querySelectorAll('[data-lang="en"]').forEach((s) => { s.textContent = saved ? 'Saved on this phone ✓' : 'Save on this phone'; });
    btn.querySelectorAll('[data-lang="yi"]').forEach((s) => { s.textContent = saved ? 'אפגעהיטן ✓' : 'היט אפ אויף דעם טעלעפאן'; });
  }
  function saveCurrent() {
    if (!current) return;
    const list = loadSaved().filter((e) => !sameEntry(e, current));
    const { _years, ...clean } = current;
    clean.savedAt = new Date().toISOString();
    clean.id = clean.id || ('y' + Date.now().toString(36));
    list.unshift(clean);
    const ok = storeSaved(list);
    const msg = $('yzSavedMsg');
    msg.hidden = false;
    msg.textContent = ok
      ? (yi() ? 'אפגעהיטן — נאר אויף דעם טעלעפאן (אין דעם בראוזער).' : 'Saved — only on this phone, in this browser.')
      : (yi() ? 'מען קען נישט אפהיטן אין דעם בראוזער (פריוואטער מאדע?).' : 'This browser won’t let us save (private browsing?).');
    renderSaved();
    updateSaveButton();
  }
  function renderSaved() {
    const list = loadSaved();
    const card = $('yzSavedCard');
    card.hidden = !list.length;
    if (!H) return;
    $('yzSavedList').replaceChildren(...list.map((entry) => {
      const li = el('li', 'yz-saved-item');
      let next = null;
      try { next = computeYears(new H.HDate(entry.hd.dd, entry.hd.mm, entry.hd.yy))[0]; } catch (_) {}
      const info = el('div', 'yz-saved-info');
      const name = el('strong', null, entry.name || (yi() ? '(אן א נאמען)' : '(no name)'));
      if (/[\u0590-\u05FF]/.test(entry.name || '')) name.setAttribute('dir', 'rtl');
      info.append(name);
      if (next) info.append(el('span', null, (yi() ? 'קומענדיג: ' : 'Next: ') + hebLabel(next.hd) + ' · ' + civil(next.date, { short: true })));
      const actions = el('div', 'yz-saved-actions');
      const show = el('button', 'button button-ghost', yi() ? 'ווייזן' : 'Show'); show.type = 'button';
      show.addEventListener('click', () => { fillForm(entry); render(entry); $('yzResult').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      const del = el('button', 'yz-remove', yi() ? 'אויסמעקן' : 'Remove'); del.type = 'button';
      del.setAttribute('aria-label', (yi() ? 'אויסמעקן ' : 'Remove ') + (entry.name || ''));
      del.addEventListener('click', () => {
        if (!window.confirm(yi() ? 'אויסמעקן פון דער ליסטע אויף דעם טעלעפאן?' : 'Remove from the list on this phone?')) return;
        storeSaved(loadSaved().filter((e) => !sameEntry(e, entry)));
        renderSaved(); updateSaveButton();
      });
      actions.append(show, del);
      li.append(info, actions);
      return li;
    }));
  }
  function fillForm(entry) {
    $('yzName').value = entry.name || '';
    if (entry.mode === 'greg' && entry.greg) {
      $('yzModeGreg').checked = true; $('yzGreg').value = entry.greg;
      (entry.after ? $('yzAfter') : $('yzBefore')).checked = true;
    } else {
      $('yzModeHeb').checked = true;
      $('yzHYear').value = entry.hd.yy; updateMonthOptions();
      $('yzHDay').value = String(entry.hd.dd);
      $('yzHMonth').value = entry.hmonth || (entry.hd.mm === 13 ? 'adar2' : entry.hd.mm === 12 ? (H.HDate.isLeapYear(entry.hd.yy) ? 'adar1' : 'adar') : String(entry.hd.mm));
    }
    syncMode(); renderPreview();
  }

  // ---------- Form wiring ----------
  function updateMonthOptions() {
    const sel = $('yzHMonth');
    const prev = sel.value;
    const yy = Number($('yzHYear').value);
    const leap = H && yy > 5000 && yy < 6500 ? H.HDate.isLeapYear(yy) : null;
    sel.replaceChildren(...PICKER.filter((p) => leap === null || p[2] === null || p[2] === leap).map(([value, mm, needs]) => {
      const opt = document.createElement('option');
      opt.value = value;
      const en = value === 'adar' ? 'Adar' : value === 'adar1' ? 'Adar I' : value === 'adar2' ? 'Adar II' : MONTHS_EN[mm];
      const he = value === 'adar' ? 'אדר' : value === 'adar1' ? 'אדר א׳' : value === 'adar2' ? 'אדר ב׳' : MONTHS_HE[mm];
      opt.textContent = yi() ? he : en + ' · ' + he;
      if (leap === null && needs !== null) opt.textContent += yi() ? (needs ? ' (שנה מעוברת)' : ' (פשוט׳ע יאר)') : (needs ? ' (leap year)' : ' (regular year)');
      return opt;
    }));
    if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
    else if (prev === 'adar' && leap) sel.value = 'adar2';
    else if ((prev === 'adar1' || prev === 'adar2') && leap === false) sel.value = 'adar';
    $('yzHYearHe').textContent = H && yy > 5000 && yy < 6500 ? '= ' + gem(yy) + (leap ? (yi() ? ' · שנה מעוברת' : ' · leap year') : '') : '';
  }
  function fillDays() {
    const sel = $('yzHDay');
    const prev = sel.value || '1';
    sel.replaceChildren(...Array.from({ length: 30 }, (_, i) => {
      const opt = document.createElement('option');
      opt.value = String(i + 1);
      opt.textContent = H ? (yi() ? gem(i + 1) : (i + 1) + ' · ' + gem(i + 1)) : String(i + 1);
      return opt;
    }));
    sel.value = prev;
  }
  function syncMode() {
    const heb = $('yzModeHeb').checked;
    $('yzHebFields').hidden = !heb;
    $('yzGregFields').hidden = heb;
  }
  function placeholders() {
    document.querySelectorAll('[data-ph-en]').forEach((input) => { input.placeholder = yi() ? input.dataset.phYi : input.dataset.phEn; });
  }

  function onSubmit(event) {
    event.preventDefault();
    const err = $('yzError');
    if (!H) { err.hidden = false; err.textContent = yi() ? 'דער קאלענדאר לאדט נאך, פרובירט נאכאמאל.' : 'The calendar is still loading — please try again in a moment.'; return; }
    const r = deathFromForm();
    if (r.error) { err.hidden = false; err.textContent = r.error; return; }
    err.hidden = true;
    const entry = { name: $('yzName').value.trim().slice(0, 120), mode: r.mode, hd: { dd: r.hd.getDate(), mm: r.hd.getMonth(), yy: r.hd.getFullYear() } };
    if (r.mode === 'greg') { entry.greg = r.greg; entry.after = r.after; } else { entry.hmonth = r.hmonth; }
    render(entry);
    if (window.matchMedia('(max-width: 960px)').matches) $('yzResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    H = window.hebcal || null;
    const maxDate = isoOf(todayLocal());
    $('yzGreg').max = maxDate;
    fillDays();
    if (H) {
      const thisYear = new H.HDate(todayLocal()).getFullYear();
      $('yzHYear').placeholder = String(thisYear - 1);
      $('yzHYear').max = String(thisYear);
    }
    updateMonthOptions();
    syncMode(); placeholders();
    document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { syncMode(); renderPreview(); }));
    ['yzGreg', 'yzHDay', 'yzHMonth'].forEach((id) => $(id).addEventListener('change', renderPreview));
    document.querySelectorAll('input[name="sunset"]').forEach((r) => r.addEventListener('change', renderPreview));
    $('yzHYear').addEventListener('input', () => { updateMonthOptions(); renderPreview(); });
    $('yzForm').addEventListener('submit', onSubmit);
    $('yzIcs').addEventListener('click', downloadIcs);
    $('yzSave').addEventListener('click', saveCurrent);
    renderSaved();
    document.addEventListener('site-language-change', () => {
      placeholders(); fillDays(); updateMonthOptions(); renderPreview(); renderSaved();
      if (current) render(current);
    });
    window.KashoYahrzeit = { computeYears: (dd, mm, yy) => computeYears(new H.HDate(dd, mm, yy)), buildIcs: (e) => { const x = Object.assign({}, e); x._years = computeYears(new H.HDate(e.hd.dd, e.hd.mm, e.hd.yy)); return buildIcs(x); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
