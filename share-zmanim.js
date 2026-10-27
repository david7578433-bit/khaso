// "Share today's zmanim": draws a card image (Hebrew + English date, parsha, the day's zmanim for the
// chosen place, the Kasho logo and the site address) and shares it with the Web Share API, or offers
// a download plus a WhatsApp text message. Everything happens in the browser; nothing is uploaded.
(function () {
  const CANON = 'https://david7578433-bit.github.io/khaso/';
  const ROWS = [
    ['alotHaShachar', 'Alos HaShachar', 'עלות השחר'],
    ['sunrise', 'Sunrise', 'הנץ החמה'],
    ['sofZmanShmaMGA', 'Latest Shema (MGA)', 'סוף זמן ק״ש מג״א'],
    ['sofZmanShma', 'Latest Shema (GRA)', 'סוף זמן ק״ש גר״א'],
    ['sofZmanTfilla', 'Latest Shacharis', 'סוף זמן תפילה'],
    ['chatzot', 'Chatzos', 'חצות'],
    ['minchaGedola', 'Mincha Gedola', 'מנחה גדולה'],
    ['plagHaMincha', 'Plag HaMincha', 'פלג המנחה'],
    ['sunset', 'Shkiah', 'שקיעה'],
    ['tzeit72min', 'Tzeis (72 min.)', 'צאת הכוכבים (72 מינוט)']
  ];
  const yi = () => document.documentElement.lang === 'yi';
  const T = (en, y) => (yi() ? y : en);

  function siteBase() {
    if (/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) {
      return location.origin + location.pathname.replace(/[^/]*$/, '');
    }
    return CANON;
  }
  function prettyBase() { return siteBase().replace(/^https?:\/\//, '').replace(/\/$/, ''); }

  function fmtTime(value, timeZone) {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString('en-US', { timeZone: timeZone || 'America/New_York', hour: 'numeric', minute: '2-digit' });
  }
  function civil(dateISO, lang) {
    const d = new Date(dateISO + 'T12:00:00Z');
    if (lang === 'yi' && window.KashoSite) {
      const K = window.KashoSite;
      return K.YI_DAYS[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + K.YI_MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    }
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  async function hebrewInfo(dateISO) {
    const info = { he: '', en: '', parshaEn: '', parshaHe: '' };
    const [y, m, d] = dateISO.split('-').map(Number);
    try {
      if (window.KashoSite && window.KashoSite.loadToday) {
        const t = window.KashoSite.nyDateParts();
        if (t.y === y && t.m === m && t.d === d) {
          const today = await window.KashoSite.loadToday();
          if (today) {
            info.he = today.hebrew || ''; info.en = today.hebrewEn || '';
            info.parshaEn = today.parshaEn || ''; info.parshaHe = today.parshaHe || '';
          }
        }
      }
    } catch (_) {}
    if (!info.he) {
      try {
        const conv = await fetch('https://www.hebcal.com/converter?cfg=json&g2h=1&gy=' + y + '&gm=' + m + '&gd=' + d).then((r) => (r.ok ? r.json() : null));
        if (conv && conv.heDateParts) info.he = conv.heDateParts.d + ' ' + conv.heDateParts.m + ' ' + conv.heDateParts.y;
        if (conv) info.en = conv.hd + ' ' + conv.hm + ' ' + conv.hy;
      } catch (_) {}
    }
    if (!info.he) {
      try { info.he = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(dateISO + 'T12:00:00Z')); } catch (_) {}
    }
    return info;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const loads = [
      '700 60px "Frank Ruhl Libre"', '800 60px "Frank Ruhl Libre"', '500 40px "Frank Ruhl Libre"',
      '400 30px "Heebo"', '500 30px "Heebo"', '600 30px "Heebo"', '700 30px "Heebo"'
    ].flatMap((f) => [document.fonts.load(f, 'Aa1'), document.fonts.load(f, 'אבג')]);
    try { await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]); } catch (_) {}
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function diamond(ctx, cx, cy, s, color) {
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function ornamentLine(ctx, cx, y, half, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 18, y); ctx.moveTo(cx + 18, y); ctx.lineTo(cx + half, y); ctx.stroke();
    diamond(ctx, cx, y, 8, color); diamond(ctx, cx - half - 8, y, 4, color); diamond(ctx, cx + half + 8, y, 4, color);
    ctx.restore();
  }
  function fitText(ctx, text, font, maxW, startSize) {
    let size = startSize;
    do { ctx.font = font.replace('{s}', size); size -= 2; } while (ctx.measureText(text).width > maxW && size > 14);
  }

  async function drawCard(state) {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const lang = yi() ? 'yi' : 'en';
    const [heb, logo] = await Promise.all([hebrewInfo(state.date), loadImage('logo.png'), ensureFonts()]);
    const NAVY = '#1b2d3e', NAVY2 = '#2a4660', GOLD = '#a8875a', GOLD2 = '#c9a874', CREAM = '#fbf8f2', INK = '#1f2d3a', MUTED = '#5d6b78';

    // Background: deep navy with a soft glow, then a cream panel framed in bronze.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, NAVY2); bg.addColorStop(1, NAVY);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900);
    glow.addColorStop(0, 'rgba(201,168,116,.22)'); glow.addColorStop(1, 'rgba(201,168,116,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    const PX = 44, PY = 44, PW = W - 88, PH = H - 88 - 96;
    roundRect(ctx, PX, PY, PW, PH, 30); ctx.fillStyle = CREAM; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = GOLD; roundRect(ctx, PX + 16, PY + 16, PW - 32, PH - 32, 20); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = GOLD2; roundRect(ctx, PX + 25, PY + 25, PW - 50, PH - 50, 15); ctx.stroke();
    [[PX + 16, PY + 16], [PX + PW - 16, PY + 16], [PX + 16, PY + PH - 16], [PX + PW - 16, PY + PH - 16]].forEach(([x, y]) => diamond(ctx, x, y, 9, GOLD));

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    let y = PY + 58;
    if (logo) {
      const lh = 150, lw = logo.width * lh / logo.height;
      ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
      y += lh + 66;
    } else { y += 80; }

    // Title (Hebrew) and English kicker
    ctx.fillStyle = NAVY; ctx.direction = 'rtl';
    ctx.font = '800 66px "Frank Ruhl Libre", serif';
    ctx.fillText('זמני היום', W / 2, y);
    ctx.direction = 'ltr';
    y += 44;
    ctx.fillStyle = GOLD; ctx.font = '600 25px "Heebo", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
    const place = (state.placeEn || '').toUpperCase();
    ctx.fillText("TODAY'S ZMANIM" + (place ? ' · ' + place : ''), W / 2, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    y += 26;
    ornamentLine(ctx, W / 2, y, 200, GOLD2);

    // Dates block
    y += 56;
    ctx.fillStyle = NAVY; ctx.direction = 'rtl';
    fitText(ctx, heb.he, '700 {s}px "Frank Ruhl Libre", serif', PW - 140, 46);
    ctx.fillText(heb.he || '', W / 2, y);
    ctx.direction = 'ltr';
    y += 42;
    ctx.fillStyle = INK; ctx.font = '500 28px "Heebo", sans-serif';
    ctx.fillText(civil(state.date, 'en'), W / 2, y);
    const bits = lang === 'yi'
      ? [heb.parshaHe || '', state.placeYi || ''].filter(Boolean)
      : [heb.parshaEn ? heb.parshaEn.replace(/^Parashat\s+/, 'Parshas ') : '', heb.parshaHe || ''].filter(Boolean);
    if (bits.length) {
      y += 38;
      ctx.fillStyle = MUTED; ctx.font = '500 25px "Heebo", sans-serif';
      ctx.direction = lang === 'yi' ? 'rtl' : 'ltr';
      ctx.fillText(bits.join('  ·  '), W / 2, y);
      ctx.direction = 'ltr';
    }

    // Zmanim table
    y += 40;
    const tx = PX + 70, tw = PW - 140, rowH = 59;
    ROWS.forEach(([key, en, he], i) => {
      const top = y + i * rowH;
      if (i % 2 === 0) { roundRect(ctx, tx - 14, top, tw + 28, rowH - 6, 12); ctx.fillStyle = 'rgba(168,135,90,.10)'; ctx.fill(); }
      const base = top + rowH / 2 + 8;
      const value = fmtTime(state.times && state.times[key], state.timeZone);
      ctx.fillStyle = INK;
      if (lang === 'yi') {
        ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.font = '600 30px "Heebo", sans-serif';
        ctx.fillText(he, tx + tw, base);
        ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.font = '700 31px "Heebo", sans-serif'; ctx.fillStyle = NAVY;
        ctx.fillText(value, tx, base);
      } else {
        ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.font = '600 29px "Heebo", sans-serif';
        ctx.fillText(en, tx, base);
        ctx.fillStyle = MUTED; ctx.font = '500 22px "Heebo", sans-serif'; ctx.direction = 'rtl'; ctx.textAlign = 'center';
        ctx.fillText(he, tx + tw * 0.60, base - 2);
        ctx.direction = 'ltr'; ctx.textAlign = 'right'; ctx.font = '700 31px "Heebo", sans-serif'; ctx.fillStyle = NAVY;
        ctx.fillText(value, tx + tw, base);
      }
    });
    ctx.textAlign = 'center'; ctx.direction = 'ltr';
    y += ROWS.length * rowH + 22;
    ctx.fillStyle = MUTED; ctx.font = '400 20px "Heebo", sans-serif';
    ctx.fillText('Times: Hebcal.com', W / 2, Math.min(y, PY + PH - 34));

    // Footer band: name + address
    const fy = H - 96;
    ctx.fillStyle = '#f1dfbf'; ctx.direction = 'rtl'; ctx.font = '700 32px "Frank Ruhl Libre", serif';
    ctx.fillText('ברכת שמים קאשוי', W / 2, fy + 28);
    ctx.direction = 'ltr'; ctx.fillStyle = GOLD2; ctx.font = '500 25px "Heebo", sans-serif';
    ctx.fillText(prettyBase(), W / 2, fy + 66);

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  }

  function shareText(state, heb) {
    const lines = [];
    const lang = yi() ? 'yi' : 'en';
    lines.push(lang === 'yi' ? '*זמני היום · ' + (state.placeYi || state.placeEn) + '*' : "*Today's Zmanim · " + state.placeEn + '*');
    lines.push(civil(state.date, lang) + (heb && heb.he ? ' · ' + heb.he : ''));
    if (heb && (heb.parshaEn || heb.parshaHe)) lines.push(lang === 'yi' ? (heb.parshaHe || '') : heb.parshaEn.replace(/^Parashat\s+/, 'Parshas '));
    lines.push('');
    ROWS.forEach(([key, en, he]) => lines.push((lang === 'yi' ? he : en) + ' — ' + fmtTime(state.times && state.times[key], state.timeZone)));
    lines.push('');
    lines.push((lang === 'yi' ? 'מער זמנים: ' : 'More zmanim: ') + siteBase() + 'zmanim.html');
    return lines.join('\n');
  }

  // ---------- Dialog ----------
  let dialog = null;
  let current = null; // { file, url, text }

  function L(en, y) {
    const lang = yi() ? 'yi' : 'en';
    return '<span data-lang="en"' + (lang === 'en' ? '' : ' hidden') + '>' + en + '</span><span data-lang="yi"' + (lang === 'yi' ? '' : ' hidden') + '>' + y + '</span>';
  }

  function buildDialog() {
    dialog = document.createElement('div');
    dialog.className = 'zshare';
    dialog.innerHTML =
      '<div class="zshare-backdrop" data-close></div>' +
      '<div class="zshare-panel" role="dialog" aria-modal="true" aria-labelledby="zshareTitle">' +
      '<button type="button" class="zshare-close" data-close aria-label="Close">×</button>' +
      '<h2 id="zshareTitle">' + L("Share today's zmanim", 'שיקט די היינטיגע זמנים') + '</h2>' +
      '<div class="zshare-preview"><div class="zshare-loading">' + L('Preparing the card…', 'מען גרייט צו דעם קארטל…') + '</div><img alt="" hidden></div>' +
      '<div class="zshare-actions">' +
      '<button type="button" class="button button-gold zshare-native" hidden>' + L('Share image', 'שיקט דאס בילד') + '</button>' +
      '<a class="button zshare-wa" target="_blank" rel="noopener">' + L('Send on WhatsApp', 'שיקט אויף וואטסאפ') + '</a>' +
      '<a class="button button-ghost zshare-download" download>' + L('Download image', 'דאונלאוד דאס בילד') + '</a>' +
      '<button type="button" class="button button-ghost zshare-copy">' + L('Copy text', 'קאפירט טעקסט') + '</button>' +
      '</div>' +
      '<p class="zshare-hint" data-hint>' + L('Tip: download the image, then attach it in WhatsApp. The WhatsApp button sends the times as text with the site link.', 'טיפ: דאונלאוד דאס בילד און שיקט עס אין וואטסאפ. דער וואטסאפ קנעפל שיקט די זמנים אלס טעקסט מיט דעם לינק.') + '</p>' +
      '</div>';
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeDialog));
    dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });
    dialog.querySelector('.zshare-native').addEventListener('click', async () => {
      if (!current) return;
      try {
        await navigator.share({ files: [current.file], title: T("Today's zmanim", 'זמני היום'), text: T("Today's zmanim — ", 'זמני היום — ') + siteBase() + 'zmanim.html' });
      } catch (_) {}
    });
    dialog.querySelector('.zshare-copy').addEventListener('click', async (event) => {
      if (!current) return;
      const button = event.currentTarget;
      try { await navigator.clipboard.writeText(current.text); }
      catch (_) {
        const area = document.createElement('textarea'); area.value = current.text; document.body.appendChild(area); area.select();
        try { document.execCommand('copy'); } catch (__) {}
        area.remove();
      }
      const old = button.innerHTML; button.innerHTML = L('Copied ✓', 'קאפירט ✓');
      setTimeout(() => { button.innerHTML = old; }, 1800);
    });
  }

  function closeDialog() {
    if (!dialog) return;
    dialog.classList.remove('is-open');
    document.documentElement.classList.remove('zshare-lock');
    if (dialog._opener) { try { dialog._opener.focus(); } catch (_) {} }
  }

  async function open(opener) {
    const state = window.KashoZmanimState;
    if (!state || !state.times) return;
    if (!dialog) buildDialog();
    dialog._opener = opener || null;
    const img = dialog.querySelector('.zshare-preview img');
    const loading = dialog.querySelector('.zshare-loading');
    img.hidden = true; loading.hidden = false;
    dialog.querySelectorAll('.zshare-actions > *').forEach((b) => b.setAttribute('aria-disabled', 'true'));
    dialog.classList.add('is-open');
    document.documentElement.classList.add('zshare-lock');
    dialog.querySelector('.zshare-close').focus();

    const [blob, heb] = await Promise.all([drawCard(state), hebrewInfo(state.date)]);
    if (current && current.url) URL.revokeObjectURL(current.url);
    const name = 'kasho-zmanim-' + state.date + '-' + (state.key || 'location') + '.png';
    const file = new File([blob], name, { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const text = shareText(state, heb);
    current = { file, url, text };

    img.src = url; img.alt = T("Today's zmanim card for ", 'זמנים קארטל פאר ') + (yi() ? (state.placeYi || state.placeEn) : state.placeEn);
    img.hidden = false; loading.hidden = true;
    const dl = dialog.querySelector('.zshare-download'); dl.href = url; dl.setAttribute('download', name);
    dialog.querySelector('.zshare-wa').href = 'https://wa.me/?text=' + encodeURIComponent(text);
    const canShareFiles = !!(navigator.canShare && navigator.share && (() => { try { return navigator.canShare({ files: [file] }); } catch (_) { return false; } })());
    dialog.querySelector('.zshare-native').hidden = !canShareFiles;
    dialog.querySelector('[data-hint]').hidden = canShareFiles;
    dialog.querySelectorAll('.zshare-actions > *').forEach((b) => b.removeAttribute('aria-disabled'));
    if (canShareFiles) dialog.querySelector('.zshare-native').focus();
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-share-zmanim]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger);
  });
  document.addEventListener('kasho-zmanim-ready', () => {
    document.querySelectorAll('[data-share-zmanim]').forEach((b) => { b.disabled = !(window.KashoZmanimState && window.KashoZmanimState.times); });
  });

  window.KashoShareZmanim = { open, drawCard, shareText };
})();
