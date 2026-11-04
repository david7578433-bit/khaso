/* Simcha Invitations — v6 "Step by step" form (Nov 2026).
   A guided, per-simcha form: who the simcha is for, the families, grandparents, date, place, times, last details.
   It writes the card through the quick editor's own fields (fP, fS, fH1 …), so the card, the link, the draft and
   "Quick edit" all keep working exactly as before; after the steps everything can still be changed freely in Quick edit.
   Our own design and wording. */
(function () {
  'use strict';
  const form = document.querySelector('#invEditor .inv-form');
  const host = document.getElementById('invGuide');
  const modeBar = document.getElementById('invMode');
  if (!form || !host || !modeBar) return;

  const KEY = 'invGuideV6', MODE = 'invModeV6';
  const $ = (id) => document.getElementById(id);
  const ui = () => (document.documentElement.lang === 'yi' ? 'yi' : 'en');
  const card = () => { const r = form.querySelector('[name="cardLang"]:checked'); return r && r.value === 'en' ? 'en' : 'yi'; };
  const type = () => ($('fType') && $('fType').value) || 'general';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const L = (en, yi) => '<span data-lang="en"' + (ui() === 'en' ? '' : ' hidden') + '>' + en + '</span><span data-lang="yi"' + (ui() === 'yi' ? '' : ' hidden') + '>' + yi + '</span>';

  let G = {}; try { G = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { G = {}; }
  if (!Array.isArray(G.ev)) G.ev = [];
  let step = 0;
  const saveG = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (_) {} };

  // ------------------------------------------------------------ what each simcha asks
  const TWO = ['chasuna', 'vort', 'lchaim'];
  const kind = (t) => (TWO.includes(t) ? 'two' : t === 'shevabrachos' ? 'sheva' : 'one');
  const GIRL = ['kiddush'];
  // who the simcha is for (one-family simchas): label + example + whether the name is optional
  const WHO = {
    barmitzvah: { en: 'The bar mitzvah bochur’s name', yi: 'נאמען פונעם בר מצוה בחור', ex: ['חיים ברוך', 'Chaim Boruch'] },
    upsherin: { en: 'The child’s name', yi: 'נאמען פונעם קינד', ex: ['משה יצחק', 'Moshe Yitzchok'] },
    bavarfan: { en: 'The chosson’s name', yi: 'נאמען פונעם חתן', ex: ['יואל אהרן', 'Yoel Aharon'] },
    siyum: { en: 'The mesayem (who makes the siyum)', yi: 'דער מסיים', ex: ['ר׳ יעקב יוסף', 'R’ Yaakov Yosef'] },
    kiddush: { en: 'The baby girl’s name (optional)', yi: 'נאמען פונעם מיידעלע (אויב מ׳וויל)', ex: ['שרה רבקה', 'Sara Rivka'], opt: 1 },
    bris: { en: 'Name line (optional — the name is given at the bris)', yi: 'נאמען שורה (אויב מ׳וויל)', ex: ['', ''], opt: 1 }
  };
  const whoOf = (t) => WHO[t] || { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)', ex: ['', ''], opt: 1 };
  // times: [key, Yiddish label, English label, main?]
  const TIMES = {
    chasuna: [['kp', 'קבלת פנים', 'Kabbalas Panim', 1], ['ch', 'חופה', 'Chuppah'], ['se', 'סעודה', 'Seudah']],
    vort: [['fr', 'משעה', 'From', 1], ['to', 'עד שעה', 'Until']],
    lchaim: [['fr', 'משעה', 'From', 1], ['to', 'עד שעה', 'Until']],
    bavarfan: [['sh', 'שחרית', 'Shachris'], ['ki', 'קידוש', 'Kiddush', 1]],
    barmitzvah: [['se', 'סעודה', 'Seudah', 1], ['mi', 'מנחה', 'Mincha']],
    bris: [['sh', 'שחרית', 'Shachris'], ['br', 'ברית מילה', 'Bris', 1], ['se', 'סעודה', 'Seudah']],
    pidyonhaben: [['ph', 'פדיון הבן', 'Pidyon Haben', 1], ['mi', 'מנחה', 'Mincha']],
    shevabrachos: [['se', 'סעודה', 'Seudah', 1]],
    kiddush: [['ki', 'קידוש', 'Kiddush', 1]],
    upsherin: [['up', 'חלאקה', 'Upsherin', 1]],
    siyum: [['si', 'סיום', 'Siyum', 1]]
  };
  const timesOf = (t) => TIMES[t] || [['tm', 'שעה', 'Time', 1]];
  // quick-add events
  const EVENTS = {
    bris: [['שלום זכר', 'Shalom Zachor'], ['וואך נאכט', 'Vach Nacht']],
    chasuna: [['באווארפן', 'Aufruf']],
    barmitzvah: [['הנחת תפילין', 'Tefillin'], ['עלי׳ לתורה', 'Aliyah']],
    shevabrachos: [['סעודת ליל שב״ק', 'Friday night seudah'], ['סעודת שב״ק', 'Shabbos day seudah'], ['שלש סעודות', 'Shalosh Seudos']]
  };

  // ------------------------------------------------------------ the fields
  // f(id, en label, yi label, [yi example, en example], opts)
  const f = (id, en, yi, ex, o) => Object.assign({ id, en, yi, ex: ex || ['', ''] }, o || {});
  const family = (p, who) => [
    f(p + 'Fa', who === 'k' ? 'Kallah’s father — first name' : who === 'c' ? 'Chosson’s father — first name' : 'Father — first name', who === 'k' ? 'דער כלה׳ס טאטע — ערשטער נאמען' : who === 'c' ? 'דעם חתנ׳ס טאטע — ערשטער נאמען' : 'דער טאטע — ערשטער נאמען', who === 'k' ? ['אברהם', 'Avraham'] : ['משה ברוך', 'Moshe Boruch']),
    f(p + 'Mo', 'Mother — first name (optional)', 'די מאמע — ערשטער נאמען (אויב מ׳וויל)', who === 'k' ? ['חנה', 'Chana'] : ['רחל', 'Rochel'], { hint: ['Leave empty to write “ורעיתו” (and his wife)', 'לאזט ליידיג פאר “ורעיתו”'] }),
    f(p + 'Sur', 'Family name', 'פאמיליע נאמען', who === 'k' ? ['שטיין', 'Stein'] : ['ווייס', 'Weiss'])
  ];
  const grand = (p, en, yi) => ({ group: [en, yi], fields: [
    f(p + 'G1', 'Father’s father (Zeidy) — full name', 'דעם טאטנ׳ס טאטע (זיידע) — פולער נאמען', ['שמואל דוד ווייס', 'Mr. & Mrs. Shmuel Dovid Weiss'], { z: 1 }),
    f(p + 'G2', 'Mother’s father (Zeidy) — full name', 'דער מאמע׳ס טאטע (זיידע) — פולער נאמען', ['שלמה געלבשטיין', 'Mr. & Mrs. Shlomo Gelbstein'], { z: 1 })
  ] });
  const hon = (boy) => f(boy ? 'honB' : 'honG', boy ? 'Add “נ״י” after the name' : 'Add “תחי׳” after the name', boy ? 'צולייגן “נ״י” נאכ׳ן נאמען' : 'צולייגן “תחי׳” נאכ׳ן נאמען', null, { check: 1, def: 1, yiOnly: 1 });

  function steps() {
    const t = type(), k = kind(t), S = [];
    if (k === 'two') {
      S.push({ id: 'c', en: 'The chosson & his family', yi: 'דער חתן און זיין משפחה', fields: [f('cName', 'Chosson’s first name', 'דעם חתנ׳ס ערשטער נאמען', ['אברהם', 'Avraham']), hon(1)].concat(family('c', 'c')) });
      S.push({ id: 'k', en: 'The kallah & her family', yi: 'די כלה און איר משפחה', fields: [f('kName', 'Kallah’s first name', 'דער כלה׳ס ערשטער נאמען', ['רחל רייזא', 'Rochel Raizy']), hon(0)].concat(family('k', 'k')).concat([
        f('under', 'Also write “son of / daughter of” under the names', 'אויך שרייבן “בן ר׳ / בת ר׳” אונטער די נעמען', null, { check: 1, def: 0 })]) });
      S.push({ id: 'g', en: 'Grandparents', yi: 'זיידעס און באבעס', opt: 1, groups: [grand('c', 'Chosson’s side', 'פונעם חתנ׳ס זייט'), grand('k', 'Kallah’s side', 'פון דער כלה׳ס זייט')] });
    } else if (k === 'sheva') {
      S.push({ id: 'c', en: 'The chosson & kallah', yi: 'דער חתן און די כלה', fields: [
        f('cName', 'Chosson’s first name', 'דעם חתנ׳ס ערשטער נאמען', ['יוסף', 'Yosef']), f('cFa', 'Chosson’s father — first name', 'דעם חתנ׳ס טאטע — ערשטער נאמען', ['משה ברוך', 'Moshe Boruch']), f('cSur', 'Chosson’s family name', 'דעם חתנ׳ס פאמיליע נאמען', ['שטערנבערג', 'Sternberg']),
        f('kName', 'Kallah’s first name', 'דער כלה׳ס ערשטער נאמען', ['לאה', 'Leah']), f('kFa', 'Kallah’s father — first name', 'דער כלה׳ס טאטע — ערשטער נאמען', ['אברהם', 'Avraham']), f('kSur', 'Kallah’s family name', 'דער כלה׳ס פאמיליע נאמען', ['גרינפעלד', 'Greenfeld']),
        f('under', 'Write “son of / daughter of” under the names', 'שרייבן “בן ר׳ / בת ר׳” אונטער די נעמען', null, { check: 1, def: 1 }), hon(1), hon(0)] });
      S.push({ id: 'h', en: 'Who is hosting', yi: 'ווער איז מכבד', fields: [f('hosts', 'Hosts, as it should appear', 'די מכבדים, ווי עס זאל שטיין', ['ר׳ יואל פריעדמאן ורעיתו', 'Mr. & Mrs. Yoel Friedman'], { area: 1, hint: ['One line per family', 'יעדע משפחה אויף א באזונדערע שורה'] })] });
    } else {
      const w = whoOf(t), boy = !GIRL.includes(t);
      const fl = [f('pName', w.en, w.yi, w.ex, { opt: w.opt })];
      if (t === 'siyum') fl.push(f('mas', 'Which masechta', 'וועלכע מסכת', ['ברכות', 'Brachos']));
      if (!w.opt || t === 'kiddush') fl.push(hon(boy));
      fl.push(f('under', 'Also write “son of / daughter of” under the name', 'אויך שרייבן “בן ר׳ / בת ר׳” אונטער׳ן נאמען', null, { check: 1, def: 0 }));
      S.push({ id: 'p', en: 'Whose simcha', yi: 'וועמענס שמחה', fields: fl });
      S.push({ id: 'h', en: 'Who is making the simcha', yi: 'ווער מאכט די שמחה', fields: family('a', 'a') });
      S.push({ id: 'g', en: 'Grandparents', yi: 'זיידעס און באבעס', opt: 1, groups: [grand('a', '', '')] });
    }
    S.push({ id: 'd', en: 'The date', yi: 'דער דאטום', date: 1 });
    S.push({ id: 'w', en: 'The place', yi: 'דער ארט', fields: [
      f('hall', 'Hall / shul / home', 'זאל / ביהמ״ד / שטוב', ['אולם קאנטינענטעל', 'Continental Hall']),
      f('addr', 'Street address', 'אדרעס', ['206 Keap Street', '206 Keap Street'], { ltr: 1 }),
      f('city', 'City (optional)', 'שטאט (אויב מ׳וויל)', ['Brooklyn, NY', 'Brooklyn, NY'], { ltr: 1 })] });
    S.push({ id: 't', en: 'Times', yi: 'צייטן', times: 1 });
    S.push({ id: 'x', en: 'Last details', yi: 'לעצטע פרטים', fields: [
      f('l1', 'Extra line (optional)', 'נאך א שורה (אויב מ׳וויל)', ['ובעזהשי״ת ביום שמחתכם ישמח לבנו גם אנו', 'Dinner will be served'], { area: 1 }),
      f('l2', 'Another extra line (optional)', 'נאך א שורה (אויב מ׳וויל)', ['', 'Parking behind the hall'], { area: 1 }),
      f('rsvp', 'Phone for replies (optional)', 'טעלעפאן פאר ענטפערס (אויב מ׳וויל)', ['845-555-0123', '845-555-0123'], { ltr: 1, tel: 1, hint: ['Guests get “RSVP” buttons; the number is shown to everyone with the link.', 'געסט באקומען “ענטפער” קנעפלעך; דער נומער ווערט געוויזן פאר יעדן מיט׳ן לינק.'] })] });
    return S;
  }

  // ------------------------------------------------------------ building the card text
  const v = (k) => String(G[k] || '').trim();
  const chk = (k, def) => (G[k] === undefined ? !!def : !!G[k]);
  function fmtTime(hhmm, lang) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ''); if (!m) return '';
    const h = +m[1], s = (h % 12 || 12) + ':' + m[2];
    return lang === 'yi' ? s : s + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function parents(p, lang) {
    const fa = v(p + 'Fa'), mo = v(p + 'Mo'), sur = v(p + 'Sur');
    if (!fa && !sur) return '';
    if (lang === 'yi') return mo ? 'ר׳ ' + fa + ' ומרת ' + mo + ' ' + sur : 'ר׳ ' + [fa, sur].filter(Boolean).join(' ') + ' ורעיתו';
    return mo ? fa + ' & ' + mo + ' ' + sur : 'Mr. & Mrs. ' + [fa, sur].filter(Boolean).join(' ');
  }
  function grandLine(p, lang, sep) {
    const out = [];
    [['G1', 'בן ר׳ '], ['G2', 'חתן ר׳ ']].forEach(([g, pre]) => {
      const n = v(p + g); if (!n) return;
      const z = chk(p + g + 'z', 0);
      if (lang === 'yi') out.push(pre + n + (z ? ' ז״ל' : ' הי״ו'));
      else out.push(n + (z ? ' z”l' : ''));
    });
    if (!out.length) return '';
    return lang === 'yi' ? out.join(sep) : 'Grandparents: ' + out.join(sep);
  }
  function honor(name, boy, lang) {
    if (!name) return '';
    if (lang !== 'yi' || !chk(boy ? 'honB' : 'honG', 1)) return name;
    return name + (boy ? ' נ״י' : ' תחי׳');
  }
  function sonOf(p, boy, lang) {
    const fa = v(p + 'Fa'), sur = v(p + 'Sur'); if (!fa) return '';
    if (lang === 'yi') return (boy ? 'בן ר׳ ' : 'בת ר׳ ') + fa + (sur ? ' ' + sur : '') + ' הי״ו';
    const mo = v(p + 'Mo');
    return (boy ? 'son of ' : 'daughter of ') + (mo ? fa + ' & ' + mo + ' ' + sur : 'Mr. & Mrs. ' + fa + (sur ? ' ' + sur : ''));
  }
  function compose() {
    const t = type(), k = kind(t), lang = card(), out = {};
    const two = k !== 'one';
    if (two) {
      out.fP = honor(v('cName'), 1, lang); out.fS = honor(v('kName'), 0, lang);
      const under = chk('under', k === 'sheva' ? 1 : 0);
      out.fPf = under && v('cName') ? sonOf('c', 1, lang) : ''; out.fSf = under && v('kName') ? sonOf('k', 0, lang) : '';
      if (k === 'two') {
        out.fH1 = parents('c', lang); out.fH2 = parents('k', lang);
        const both = out.fH1 && out.fH2;
        out.fG1 = grandLine('c', lang, both ? '\n' : ' · '); out.fG2 = grandLine('k', lang, both ? '\n' : ' · ');
      } else { out.fH1 = v('hosts'); out.fH2 = ''; out.fG1 = ''; out.fG2 = ''; }
    } else {
      out.fP = honor(v('pName'), !GIRL.includes(t), lang);
      out.fPf = chk('under', 0) && v('pName') ? sonOf('a', !GIRL.includes(t), lang) : '';
      out.fH1 = parents('a', lang); out.fG1 = grandLine('a', lang, ' · ');
      out.fS = ''; out.fSf = ''; out.fH2 = ''; out.fG2 = '';
      if (t === 'siyum') out.fM = v('mas');
    }
    out.fVenue = v('hall');
    out.fAddr = [v('addr'), v('city')].filter(Boolean).join(', ');
    // times: one time → the card's big time line; several → a line each in the note
    const T = timesOf(t).map(([key, y, e, main]) => ({ y, e, main, val: v('t_' + key) })).filter((x) => x.val);
    const lines = [];
    if (T.length === 1) out.fTime = T[0].val;
    else {
      out.fTime = '';
      const parts = T.map((x) => (lang === 'yi' ? x.y + ' ' + (/^(משעה|עד שעה)$/.test(x.y) ? '' : 'בשעה ') + fmtTime(x.val, 'yi') : x.e + ' ' + fmtTime(x.val, 'en')).replace(/\s+/g, ' '));
      for (let i = 0; i < parts.length; i += 2) lines.push(parts.slice(i, i + 2).join(lang === 'yi' ? '   •   ' : '  •  '));
    }
    G.ev.forEach((e) => {
      const bits = [e.when, e.place, fmtTime(e.time, lang)].map((s) => String(s || '').trim()).filter(Boolean);
      if (!String(e.name || '').trim() && !bits.length) return;
      lines.push((e.name ? e.name.trim() + (bits.length ? ': ' : '') : '') + bits.join(' · '));
    });
    ['l1', 'l2'].forEach((x) => { if (v(x)) lines.push(v(x)); });
    out.fNote = lines.join('\n');
    out.fRsvp = v('rsvp');
    return out;
  }
  function anyAnswer() { return Object.keys(G).some((k) => k !== 'ev' && !/^(hon|under)/.test(k) && !/z$/.test(k) && String(G[k] || '').trim()) || G.ev.some((e) => Object.values(e).some((x) => String(x || '').trim())); }

  let wt = null;
  function write() {
    clearTimeout(wt);
    wt = setTimeout(() => {
      if (!anyAnswer()) return;
      const o = compose();
      Object.keys(o).forEach((id) => {
        const el = $(id); if (!el || el.value === o[id]) return;
        el.value = o[id]; el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const dt = v('date');
      if ($('fDate') && $('fDate').value !== dt) { $('fDate').value = dt; $('fDate').dispatchEvent(new Event('input', { bubbles: true })); }
      const ps = $('fParsha'); const want = chk('ps', 1);
      if (ps && G.date && ps.checked !== want) { ps.checked = want; ps.dispatchEvent(new Event('change', { bubbles: true })); }
      if ($('fHd') && $('fHd').value !== v('hd')) { $('fHd').value = v('hd'); $('fHd').dispatchEvent(new Event('input', { bubbles: true })); }
      paintHd();
    }, 120);
  }

  // ------------------------------------------------------------ drawing the form
  const lbl = (fd) => L(esc(fd.en), esc(fd.yi));
  function input(fd) {
    const lang = card(), ex = fd.ex[lang === 'yi' ? 0 : 1] || fd.ex[1] || fd.ex[0];
    if (fd.check) {
      if (fd.yiOnly && lang !== 'yi') return '';
      return '<label class="ig-check"><input type="checkbox" data-g="' + fd.id + '"' + (chk(fd.id, fd.def) ? ' checked' : '') + '> <span>' + lbl(fd) + '</span></label>';
    }
    const attrs = ' id="ig_' + fd.id + '" data-g="' + fd.id + '" autocomplete="off" ' + (fd.ltr ? 'dir="ltr"' : 'dir="auto"') + (ex ? ' placeholder="' + esc((lang === 'yi' && !fd.ltr ? 'למשל: ' : 'e.g. ') + ex) + '"' : '');
    const box = fd.area ? '<textarea rows="2"' + attrs + '>' + esc(G[fd.id] || '') + '</textarea>' : '<input type="' + (fd.tel ? 'tel" inputmode="tel' : 'text') + '"' + attrs + ' value="' + esc(G[fd.id] || '') + '">';
    let z = '';
    if (fd.z) z = '<label class="ig-z"><input type="checkbox" data-g="' + fd.id + 'z"' + (chk(fd.id + 'z', 0) ? ' checked' : '') + '> ' + L('passed away (z”l)', 'נפטר (ז״ל)') + '</label>';
    const hint = fd.hint ? '<p class="ig-hint">' + L(esc(fd.hint[0]), esc(fd.hint[1])) + '</p>' : '';
    return '<div class="ig-field"><label class="ig-label" for="ig_' + fd.id + '">' + lbl(fd) + '</label>' + box + z + hint + '</div>';
  }
  function timesHtml() {
    const t = type();
    let h = '<div class="ig-times">' + timesOf(t).map(([key, y, e]) => '<div class="ig-field ig-time"><label class="ig-label" for="ig_t_' + key + '">' + L(esc(e), esc(y)) + '</label><input type="time" id="ig_t_' + key + '" data-g="t_' + key + '" value="' + esc(G['t_' + key] || '') + '"></div>').join('') + '</div>';
    h += '<p class="ig-hint">' + L('One time shows big on the card; two or more show as a neat line.', 'איין צייט ווערט געוויזן גרויס; צוויי אדער מער ווערן א שיינע שורה.') + '</p>';
    h += '<div class="ig-events"><p class="ig-sub">' + L('More events (optional)', 'נאך אינייניגן (אויב מ׳וויל)') + '</p>';
    G.ev.forEach((e, i) => {
      const ex = card() === 'yi' ? ['שלום זכר', 'ליל שב״ק פרשת וירא', 'בביתנו'] : ['Shalom Zachor', 'Friday night', 'At our home'];
      h += '<div class="ig-event" data-i="' + i + '">' +
        '<input type="text" dir="auto" data-e="name" placeholder="' + esc(ex[0]) + '" value="' + esc(e.name || '') + '" aria-label="Event">' +
        '<input type="text" dir="auto" data-e="when" placeholder="' + esc(ex[1]) + '" value="' + esc(e.when || '') + '" aria-label="When">' +
        '<input type="text" dir="auto" data-e="place" placeholder="' + esc(ex[2]) + '" value="' + esc(e.place || '') + '" aria-label="Where">' +
        '<input type="time" data-e="time" value="' + esc(e.time || '') + '" aria-label="Time">' +
        '<button type="button" class="ig-x" data-del="' + i + '" aria-label="Remove">×</button></div>';
    });
    h += '<div class="ig-addrow">' + (EVENTS[t] || []).map(([y, e]) => '<button type="button" class="ig-add" data-add="' + esc(card() === 'yi' ? y : e) + '">+ ' + L(esc(e), esc(y)) + '</button>').join('') +
      '<button type="button" class="ig-add" data-add="">+ ' + L('Another event', 'נאך אן איניין') + '</button></div></div>';
    return h;
  }
  function dateHtml() {
    return '<div class="ig-field"><label class="ig-label" for="ig_date">' + L('Date of the simcha', 'דער דאטום פון דער שמחה') + '</label><input type="date" id="ig_date" data-g="date" value="' + esc(G.date || '') + '"></div>' +
      '<p class="ig-hd" id="igHd" aria-live="polite"></p>' +
      '<label class="ig-check"><input type="checkbox" data-g="ps"' + (chk('ps', 1) ? ' checked' : '') + '> <span>' + L('Show the day and parsha (e.g. “יום ג׳ לסדר וירא”)', 'ווייזן דעם טאג און פרשה (למשל “יום ג׳ לסדר וירא”)') + '</span></label>' +
      '<details class="ig-more"' + (v('hd') ? ' open' : '') + '><summary>' + L('Change the Hebrew date by hand', 'טוישן דעם אידישן דאטום אליין') + '</summary>' +
      '<div class="ig-field"><input type="text" dir="auto" data-g="hd" id="ig_hd" value="' + esc(G.hd || '') + '" placeholder="' + esc(card() === 'yi' ? 'למשל: י״א חשון תשפ״ז' : 'e.g. 11 Cheshvan 5787') + '"></div></details>';
  }
  function paintHd() {
    const el = document.getElementById('igHd'); if (!el) return;
    const src = $('hdAuto');
    const sp = src && (src.querySelector('[data-lang="' + ui() + '"]') || src);
    el.textContent = G.date && sp ? sp.textContent : '';
  }
  function render() {
    const S = steps(); if (step >= S.length) step = S.length - 1; if (step < 0) step = 0;
    const s = S[step];
    let body = '';
    if (s.fields) body = s.fields.map(input).join('');
    if (s.groups) body = s.groups.map((g) => (g.group[0] ? '<p class="ig-sub">' + L(esc(g.group[0]), esc(g.group[1])) + '</p>' : '') + g.fields.map(input).join('')).join('');
    if (s.date) body = dateHtml();
    if (s.times) body = timesHtml();
    const dots = S.map((x, i) => '<button type="button" class="ig-dot' + (i === step ? ' is-on' : '') + (i < step ? ' is-done' : '') + '" data-go="' + i + '" aria-label="' + esc(x.en) + '"' + (i === step ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span></button>').join('');
    const last = step === S.length - 1;
    host.innerHTML =
      '<div class="ig-card">' +
      '<div class="ig-top"><div class="ig-dots">' + dots + '</div>' +
      '<p class="ig-count">' + L('Step ' + (step + 1) + ' of ' + S.length, 'שריט ' + (step + 1) + ' פון ' + S.length) + '</p>' +
      '<h3 class="ig-title">' + L(esc(s.en), esc(s.yi)) + (s.opt ? ' <em class="ig-opt">' + L('optional', 'אויב מ׳וויל') + '</em>' : '') + '</h3></div>' +
      (step === 0 ? '<p class="ig-intro">' + L('Fill in what you know — every box shows an example. The card builds itself as you type, and you can still change any word later in “Quick edit”.', 'פילט אויס וואס איר ווייסט — יעדע קעסטל ווייזט א ביישפיל. די קארטל בויט זיך אליין בשעת׳ן שרייבן, און שפעטער קען מען נאך אלעס טוישן אין “שנעל טוישן”.') + '</p>' : '') +
      '<div class="ig-body">' + body + '</div>' +
      '<div class="ig-nav">' +
      (step > 0 ? '<button type="button" class="ig-back" data-go="' + (step - 1) + '">' + L('← Back', '→ צוריק') + '</button>' : '<span></span>') +
      (s.opt ? '<button type="button" class="ig-skip" data-go="' + (step + 1) + '">' + L('Skip', 'איבערשפרינגען') + '</button>' : '') +
      (last ? '<button type="button" class="ig-next ig-done" data-done="1">' + L('Done — see my invitation', 'פארטיג — ווייזט מיין הזמנה') + '</button>'
        : '<button type="button" class="ig-next" data-go="' + (step + 1) + '">' + L('Next', 'ווייטער') + ' <span aria-hidden="true">' + (ui() === 'yi' ? '←' : '→') + '</span></button>') +
      '</div>' +
      '<a class="ig-peek" href="#invPreview">' + L('See the card', 'זעט די קארטל') + '</a>' +
      '</div>';
    paintHd();
  }

  // ------------------------------------------------------------ events
  host.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.g) { G[el.dataset.g] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value; }
    else if (el.dataset.e) { const i = +el.closest('.ig-event').dataset.i; G.ev[i][el.dataset.e] = el.value; }
    else return;
    e.stopPropagation(); saveG(); write();
  });
  host.addEventListener('change', (e) => { const el = e.target; if (el.dataset.g || el.dataset.e) { e.stopPropagation(); if (el.type === 'checkbox') { G[el.dataset.g] = el.checked ? 1 : 0; saveG(); write(); } } });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('button, a'); if (!b) return;
    if (b.dataset.go !== undefined) { step = +b.dataset.go; render(); host.scrollIntoView({ block: 'start', behavior: 'smooth' }); const first = host.querySelector('.ig-body input:not([type=checkbox]), .ig-body textarea'); if (first && matchMedia('(min-width: 861px)').matches) first.focus({ preventScroll: true }); }
    else if (b.dataset.add !== undefined) { G.ev.push({ name: b.dataset.add, when: '', place: '', time: '' }); saveG(); render(); write(); }
    else if (b.dataset.del !== undefined) { G.ev.splice(+b.dataset.del, 1); saveG(); render(); write(); }
    else if (b.dataset.done) { write(); const p = $('invPreview'); if (p) setTimeout(() => p.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200); }
  });

  // mode: Step by step (default for new people) / Quick edit
  function setMode(m) {
    const guide = m !== 'quick';
    form.classList.toggle('is-guide', guide);
    host.hidden = !guide;
    modeBar.querySelectorAll('[data-mode]').forEach((b) => { const on = (b.dataset.mode === 'guide') === guide; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    try { localStorage.setItem(MODE, guide ? 'guide' : 'quick'); } catch (_) {}
    if (guide) render();
  }
  form.querySelectorAll(':scope > fieldset.inv-group, :scope > details.inv-group').forEach((g, i) => { if (i > 0) g.dataset.quick = '1'; });
  modeBar.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });

  // the quick editor's own controls: simcha type / card language change the steps; "Clear all" clears the steps too
  form.addEventListener('change', (e) => {
    if (e.target.id === 'fType' || e.target.name === 'cardLang') { if (e.target.id === 'fType') step = 0; if (!host.hidden) render(); write(); }
  });
  const clr = $('btnClear'); if (clr) clr.addEventListener('click', () => { G = { ev: [] }; saveG(); step = 0; if (!host.hidden) render(); });
  // the extra quick-edit rows follow their neighbours (kallah rows only for two-person simchas)
  function mirror() {
    const pair = [['rowS', 'rowSf'], ['rowH2', 'rowG2']];
    pair.forEach(([a, b]) => { const A = $(a), B = $(b); if (A && B) B.hidden = A.hidden; });
  }
  ['rowS', 'rowH2'].forEach((id) => { const el = $(id); if (el && window.MutationObserver) new MutationObserver(mirror).observe(el, { attributes: true, attributeFilter: ['hidden'] }); });
  mirror();
  // site language switch: re-draw so the labels follow
  if (window.MutationObserver) new MutationObserver(() => { if (!host.hidden) render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  let start = 'guide'; try { start = localStorage.getItem(MODE) || 'guide'; } catch (_) {}
  setMode(start);
})();
