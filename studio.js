/* Design Studio — free-form invitation designer on top of the Kasho invitations engine.
   A design is a small JSON object (background, frame, text blocks, ornaments) drawn on a 1500×2100 canvas.
   Designs auto-save to "My Designs" in this browser (localStorage); a design can be shared as an invite link (#s=…). */
(function () {
  'use strict';
  const K = window.KashoInvites; if (!K || !K.KIT) return;
  const X = K.KIT, W = X.W, H = X.H;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const lang = () => (document.documentElement.lang === 'yi' ? 'yi' : 'en');
  const L = (en, yi) => (lang() === 'yi' ? yi : en);
  const HE = /[\u0590-\u05FF]/;

  // ---------------------------------------------------------------- settings
  // Community gallery: designs shared from here are published by the database rules (see community-designs.sql).
  const SHARE_DEFAULT = true;
  const STORE = 'kasho-studio-designs-v1', CURRENT = 'kasho-studio-current-v1';
  // AI backgrounds: a free, keyless image service called straight from the visitor's browser (no keys of ours).
  const AI_ENDPOINT = 'https://image.pollinations.ai/prompt/';
  const AI_SUFFIX = ', elegant invitation background, empty blank card area in center, product photography, soft light, no people, no faces, no hands, no human figures, no text, no letters, no crosses, no religious symbols other than Jewish';
  const AI_BLOCK = /\b(people|person|persons|man|men|woman|women|girl|girls|boy|boys|lady|ladies|child|children|kid|kids|baby face|face|faces|portrait|body|bodies|skin|hand|hands|arm|arms|leg|legs|bride|groom|couple|human|humans|figure|figures|model|models|nude|naked|bikini|dress|kiss|sexy|cross|crosses|church|jesus|christmas|xmas|santa|easter|halloween|buddha|idol|statue|angel|angels|cupid|heart shaped lips)\b/i;
  const AI_THEMES = [
    ['Velvet & gold', 'סאמעט און גאלד', 'deep navy velvet fabric with gold silk ribbon and pearls, flat lay'],
    ['White roses', 'ווייסע רויזן', 'white roses and eucalyptus on white marble, flat lay'],
    ['Marble arch', 'מירמל בויגן', 'classical cream marble arch with columns and white flowers'],
    ['Teddy & balloons', 'בערל און באלאנען', 'soft blue sky with clouds, small hot air balloons and a plush teddy bear toy'],
    ['Tefillin bag on velvet', 'תפילין זעקל', 'black velvet with an embroidered navy velvet pouch with gold pattern and leather bound books'],
    ['Yerushalayim stone', 'ירושלים שטיין', 'golden Jerusalem limestone wall with olive branch, warm light'],
    ['Wine & kiddush cup', 'וויין און בעכער', 'silver kiddush cup with red wine and a dark wine bottle on white linen with roses'],
    ['Seforim', 'ספרים', 'stack of leather bound books with gilded edges on dark green leather desk'],
    ['Burgundy & gold', 'בורגונדי און גאלד', 'burgundy velvet curtain with gold tassels and candles'],
    ['Hydrangeas', 'הארטענזיעס', 'pale blue hydrangeas and white candles, airy and soft'],
    ['Gold baroque frame', 'גאלדענע ראם', 'ornate antique gold baroque frame on a dark wall'],
    ['Blush & silver', 'ראזע און זילבער', 'blush pink silk with silver ribbon and pink peonies']
  ];
  const FONTS = [
    ['Frank Ruhl Libre', 900, 'Frank Ruhl · Black'], ['Frank Ruhl Libre', 500, 'Frank Ruhl'], ['Suez One', 400, 'Suez One'], ['Secular One', 400, 'Secular One'],
    ['David Libre', 700, 'David'], ['Bellefair', 400, 'Bellefair'], ['Karantina', 700, 'Karantina'], ['Amatic SC', 700, 'Amatic'], ['Rubik', 800, 'Rubik Bold'],
    ['Rubik', 400, 'Rubik'], ['Bona Nova', 700, 'Bona Nova'], ['Noto Rashi Hebrew', 500, 'Rashi script'], ['Heebo', 400, 'Heebo'], ['Heebo', 800, 'Heebo Black'],
    ['Cinzel', 700, 'Cinzel (English)'], ['Cormorant Garamond', 500, 'Cormorant (English)'], ['Cormorant Garamond', 700, 'Cormorant Bold (English)']
  ];
  const EFFECTS = [['none', 'Plain', 'פשוט'], ['foil', 'Gold foil', 'גאלד פויל'], ['3d', '3D', 'דריי-די'], ['emboss', 'Embossed', 'אויסגעדריקט'], ['outline', 'Outline', 'קאנטור'], ['shadow', 'Shadow', 'שאטן'], ['glow', 'Glow', 'שיין']];
  const FOILS = [['gold', 'Gold', 'גאלד'], ['lightgold', 'Light gold', 'ליכטיג גאלד'], ['rose', 'Rose gold', 'ראזע גאלד'], ['silver', 'Silver', 'זילבער'], ['blue', 'Blue', 'בלוי']];
  const FRAMES = [['none', 'None', 'קיינס'], ['thin', 'Fine line', 'דינע ליניע'], ['double', 'Double', 'טאפלט'], ['corners', 'Corner scrolls', 'ווינקלען'], ['arch', 'Arch', 'בויגן'], ['oval', 'Oval', 'אוואל'], ['deco', 'Art deco', 'ארט דעקא'], ['panel', 'Card panel', 'קארטל']];
  const ORNAMENTS = [['flourish', '❦'], ['diamond', '◆'], ['deco', '◇'], ['leaf', '❧'], ['rosette', '✿'], ['sparkle', '✦'], ['star', '✡'], ['magen', '✡︎'], ['keser', '♛'], ['dot', '•']];
  const THEMES = [
    ['Navy & gold', 'בלוי און גאלד', { ink: '#22314f', accent: '#1b2a48', foil: 'gold', frame: '#b08d4a' }],
    ['Black & gold', 'שווארץ און גאלד', { ink: '#1d1d1d', accent: '#111111', foil: 'gold', frame: '#a8843f' }],
    ['Burgundy', 'בורגונדי', { ink: '#3a1f24', accent: '#5a1424', foil: 'gold', frame: '#a8843f' }],
    ['Emerald', 'גרין', { ink: '#1f3a30', accent: '#183a2c', foil: 'gold', frame: '#a8843f' }],
    ['Baby blue', 'הימל בלוי', { ink: '#23406a', accent: '#1d3b66', foil: 'blue', frame: '#7f9cc4' }],
    ['Blush', 'ראזע', { ink: '#4a2e36', accent: '#5b2a3a', foil: 'rose', frame: '#c49a8a' }],
    ['Ivory on dark', 'העל אויף טונקל', { ink: '#f1e6cf', accent: '#fbf1dc', foil: 'lightgold', frame: '#d6b46a' }],
    ['Silver', 'זילבער', { ink: '#2f3540', accent: '#1f242c', foil: 'silver', frame: '#9aa3b1' }]
  ];
  const GRADS = [['#13233a', '#2a4469'], ['#f6efe2', '#e6d8bd'], ['#0c3a2d', '#1f6650'], ['#3a0f18', '#6e1f2e'], ['#eef3f9', '#c9d9ee'], ['#f8eeee', '#e9cfcf'], ['#1b1b1b', '#3a3a3a'], ['#24123a', '#4a2a73']];

  // ---------------------------------------------------------------- rendering
  const imgCache = {};
  function loadImg(url) {
    if (!imgCache[url]) imgCache[url] = new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => { delete imgCache[url]; res(null); }; im.src = url; });
    return imgCache[url];
  }
  // The free tier gives one picture every ~45 s per visitor; past that it returns a flat yellow "limit" picture.
  function isLimitCard(im) {
    try {
      const c = document.createElement('canvas'); c.width = 24; c.height = 32; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 32);
      const d = x.getImageData(0, 0, 24, 32).data; let y = 0;
      for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - 253) < 14 && Math.abs(d[k + 1] - 216) < 20 && Math.abs(d[k + 2] - 117) < 30) y++;
      return y > (d.length / 4) * 0.6;
    } catch (_) { return false; }
  }
  async function bgImage(D, small) {
    const b = D.bg || {};
    if (b.k === 'scene' && b.key) return X.loadScene(b.key, small);
    if (b.k === 'ai' && b.url) { const im = await loadImg(b.url); if (im && !isLimitCard(im)) return im; return X.loadScene(b.fb || 'linen', small); }
    return null;
  }
  function fontStr(el, size) { return (el.it ? 'italic ' : '') + (el.fw || 400) + ' ' + Math.round(size) + 'px "' + el.f + '", "Frank Ruhl Libre", serif'; }
  function cover(ctx, im) { const r = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
  function drawFrame(ctx, D) {
    const f = D.frame || 'none', c = D.fc || '#b08d4a';
    if (f === 'none') return;
    ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = c;
    if (f === 'thin') X.rectStroke(ctx, 70, 3, c, 6);
    else if (f === 'double') { X.rectStroke(ctx, 60, 6, c, 4); X.rectStroke(ctx, 84, 2, c, 4); }
    else if (f === 'corners') { X.rectStroke(ctx, 80, 2.4, c, 0); [[110, 110, 1, 1], [W - 110, 110, -1, 1], [110, H - 110, 1, -1], [W - 110, H - 110, -1, -1]].forEach((p) => X.cornerScroll(ctx, p[0], p[1], p[2], p[3], 1.4, c, 3)); }
    else if (f === 'arch') { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(130, H - 110); ctx.lineTo(130, 640); ctx.arc(W / 2, 640, W / 2 - 130, Math.PI, 0); ctx.lineTo(W - 130, H - 110); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(156, H - 136); ctx.lineTo(156, 640); ctx.arc(W / 2, 640, W / 2 - 156, Math.PI, 0); ctx.lineTo(W - 156, H - 136); ctx.closePath(); ctx.stroke(); }
    else if (f === 'oval') { ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W / 2 - 120, H / 2 - 120, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W / 2 - 146, H / 2 - 146, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (f === 'deco') { X.rectStroke(ctx, 70, 4, c, 0); X.rectStroke(ctx, 92, 1.6, c, 0); ctx.lineWidth = 2; [[70, 70, 1, 1], [W - 70, 70, -1, 1], [70, H - 70, 1, -1], [W - 70, H - 70, -1, -1]].forEach(([x, y, sx, sy]) => { for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + sx * 40 * k, y); ctx.lineTo(x, y + sy * 40 * k); ctx.stroke(); } }); }
    else if (f === 'panel') { ctx.save(); ctx.shadowColor = 'rgba(30,20,10,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; ctx.fillStyle = D.pc || 'rgba(255,252,245,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(170, 220, W - 340, H - 440, 12) : ctx.rect(170, 220, W - 340, H - 440); ctx.fill(); ctx.restore(); X.rectStroke(ctx, 196, 2, c, 6); }
    ctx.restore();
  }
  function drawText(ctx, el, s) {
    const size = el.z;
    ctx.font = fontStr(el, size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (el.ls || 0) + 'px';
    const lines = []; String(el.s || '').split('\n').forEach((p) => { X.wrapLines(ctx, p, el.mw || 1100).forEach((l) => lines.push(l)); });
    const lh = size * (el.lh || 1.18), total = lines.length * lh;
    let widest = 0; lines.forEach((l) => { widest = Math.max(widest, ctx.measureText(l).width); });
    const al = el.al || 'center';
    ctx.textAlign = al === 'center' ? 'center' : (al === 'left' ? 'left' : 'right'); ctx.textBaseline = 'middle';
    const bx = al === 'center' ? el.x - widest / 2 : (al === 'left' ? el.x : el.x - widest);
    el._bb = [bx - 14, el.y - total / 2 - 10, widest + 28, total + 20];
    lines.forEach((l, i) => {
      const ly = el.y - total / 2 + lh * (i + 0.5);
      ctx.direction = HE.test(l) ? 'rtl' : 'ltr';
      const fx = el.fx || 'none', c = el.c || '#22314f';
      ctx.save();
      if (fx === 'foil') {
        const st = X.FOIL[el.foil || 'gold'] || X.FOIL.gold, g = ctx.createLinearGradient(0, ly - size * 0.55, 0, ly + size * 0.45);
        for (let k = 0; k < st.length; k += 2) g.addColorStop(st[k + 1], st[k]);
        ctx.shadowColor = 'rgba(40,28,8,.35)'; ctx.shadowBlur = size * 0.05; ctx.shadowOffsetY = size * 0.03; ctx.fillStyle = g; ctx.fillText(l, el.x, ly);
      } else if (fx === '3d') {
        const depth = Math.max(4, Math.round(size * 0.07));
        ctx.fillStyle = shade(c, -0.45);
        for (let k = depth; k >= 1; k--) ctx.fillText(l, el.x + k * 0.6, ly + k * 0.9);
        ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = size * 0.08; ctx.shadowOffsetY = depth;
        ctx.fillStyle = c; ctx.fillText(l, el.x, ly);
      } else if (fx === 'emboss') {
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(l, el.x - size * 0.012, ly - size * 0.016);
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillText(l, el.x + size * 0.014, ly + size * 0.02);
        ctx.fillStyle = c; ctx.fillText(l, el.x, ly);
      } else if (fx === 'outline') {
        ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.035); ctx.strokeStyle = c; ctx.strokeText(l, el.x, ly);
      } else if (fx === 'shadow') {
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05; ctx.fillStyle = c; ctx.fillText(l, el.x, ly);
      } else if (fx === 'glow') {
        ctx.shadowColor = el.gc || 'rgba(255,240,200,.95)'; ctx.shadowBlur = size * 0.35; ctx.fillStyle = c; ctx.fillText(l, el.x, ly); ctx.fillText(l, el.x, ly);
      } else { ctx.fillStyle = c; ctx.fillText(l, el.x, ly); }
      ctx.restore();
    });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function drawOrn(ctx, el) {
    const z = el.z || 60, c = el.c || '#b08d4a';
    ctx.save();
    if (['flourish', 'diamond', 'deco', 'leaf', 'rosette', 'sparkle', 'star', 'dot'].includes(el.k)) X.divider(ctx, el.k, el.x, el.y, z * 7, c);
    else if (el.k === 'magen') X.magen(ctx, el.x, el.y, z, c, Math.max(2, z * 0.08));
    else if (el.k === 'keser') X.keser(ctx, el.x, el.y + z * 0.5, z * 2.2, c);
    ctx.restore();
    const w = el.k === 'magen' ? z * 2.2 : (el.k === 'keser' ? z * 2.4 : z * 7);
    el._bb = [el.x - w / 2 - 10, el.y - z - 10, w + 20, z * 2 + 20];
  }
  function shade(hex, t) {
    const h = String(hex || '#000').replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16) || 0;
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t));
    return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  async function fontsFor(D) {
    if (!document.fonts || !document.fonts.load) return;
    const seen = {}; const loads = [];
    (D.els || []).forEach((e) => { if (e.t === 'text') { const k = e.fw + e.f; if (!seen[k]) { seen[k] = 1; loads.push(document.fonts.load(e.fw + ' 40px "' + e.f + '"', 'אבג Abc').catch(() => null)); } } });
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 3500))]);
  }
  async function render(canvas, D, scale) {
    scale = scale || 1;
    const [im] = await Promise.all([bgImage(D, scale < 0.3), fontsFor(D)]);
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const b = D.bg || {};
    if (im) cover(ctx, im);
    else { const g = (b.style === 'radial') ? ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, H * 0.8) : ctx.createLinearGradient(0, 0, W * 0.3, H); const cs = b.c || GRADS[1]; g.addColorStop(0, cs[b.style === 'radial' ? 1 : 0]); g.addColorStop(1, cs[b.style === 'radial' ? 0 : 1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (D.veil) { ctx.fillStyle = D.veil > 0 ? 'rgba(255,252,245,' + D.veil + ')' : 'rgba(8,10,16,' + (-D.veil) + ')'; ctx.fillRect(0, 0, W, H); }
    drawFrame(ctx, D);
    (D.els || []).forEach((el) => { if (el.t === 'text') drawText(ctx, el, scale); else if (el.t === 'orn') drawOrn(ctx, el); });
    return canvas;
  }

  // ---------------------------------------------------------------- building a design from the invitation form
  function region(sceneKey) { const s = (K.SCENES || []).find((x) => x.k === sceneKey); return s ? s.r : [0.14, 0.12, 0.72, 0.76]; }
  function fromData(data, opts) {
    opts = opts || {};
    const d = K.designById(data.d || 'scene-velvet');
    const yi = data.l !== 'en';
    const w = X.words(data).w, type = X.words(data).type;
    const sceneKey = opts.scene || (d.isScene ? d.scene.k : 'velvet');
    const sc = (K.SCENES || []).find((x) => x.k === sceneKey);
    const r = region(sceneKey), x0 = r[0] * W, y0 = r[1] * H, ww = r[2] * W, hh = r[3] * H, cx = x0 + ww / 2;
    const dark = sc ? sc.p === 'dark' : false;
    const th = dark ? THEMES[6][2] : THEMES[0][2];
    const fy = yi ? ['Frank Ruhl Libre', 900] : ['Cinzel', 700], fb = yi ? ['Frank Ruhl Libre', 500] : ['Cormorant Garamond', 500];
    const mw = ww * 0.86;
    const T = (role, s, f, z, c, extra) => Object.assign({ t: 'text', role, s, f: f[0], fw: f[1], z, c, x: cx, y: 0, mw, al: 'center' }, extra || {});
    const hd = data.hd || (X.hebrewParts(data.dt) || {})[yi ? 'yi' : 'en'] || '';
    const names = [data.p, type.two && data.s ? (yi ? w.c + ' ' : '& ') + data.s : ''].filter(Boolean).join('\n');
    const lines = [
      T('open', w.open, fb, 40, th.ink),
      T('title', X.titleText(data), fy, yi ? 150 : 112, th.accent, { fx: 'foil', foil: th.foil, lh: 1.1 }),
      { t: 'orn', k: 'flourish', z: 26, c: th.frame, x: cx, y: 0 },
      T('invite', data.w || w.invite, fb, 44, th.ink, { lh: 1.35 }),
      names ? T('names', names, fy, yi ? 96 : 80, th.accent, { lh: 1.15 }) : null,
      { t: 'orn', k: 'diamond', z: 22, c: th.frame, x: cx, y: 0 },
      T('date', [X.dayLine(data, yi ? 'yi' : 'en'), hd].filter(Boolean).join('\n'), fb, 46, th.ink, { lh: 1.3 }),
      data.tm ? T('time', X.timeLabel(data.tm, yi ? 'yi' : 'en'), fb, 44, th.ink, { fw: 700 }) : null,
      (data.v || data.a) ? T('place', [data.v, data.a].filter(Boolean).join('\n'), fb, 42, th.ink, { lh: 1.3 }) : null,
      data.n ? T('note', data.n, fb, 36, th.ink) : null,
      (data.h1 || data.h2) ? T('hosts', [data.h1, data.h2].filter(Boolean).join(yi ? '  ·  ' : '  ·  '), fy, yi ? 52 : 44, th.accent) : null
    ].filter(Boolean);
    // stack vertically inside the scene's card area, scaled to fit
    const mctx = document.createElement('canvas').getContext('2d');
    const nLines = (e) => { mctx.font = fontStr(e, e.z); let n = 0; String(e.s).split('\n').forEach((p) => { n += Math.max(1, X.wrapLines(mctx, p, e.mw).length); }); return n; };
    const hOf = (e) => e.t === 'orn' ? e.z * 2.6 : (nLines(e) * e.z * (e.lh || 1.18) + e.z * 0.4);
    let total = 0;
    for (let pass = 0; pass < 3; pass++) { total = lines.reduce((a, e) => a + hOf(e), 0); const k = Math.min(pass ? 1 : 1.15, (hh * 0.92) / total); if (k > 0.985 && k < 1.015) break; lines.forEach((e) => { e.z = Math.max(14, Math.round(e.z * k)); }); }
    total = lines.reduce((a, e) => a + hOf(e), 0);
    let y = y0 + (hh - total) / 2;
    lines.forEach((e) => { const h = hOf(e); e.y = Math.round(y + h / 2); y += h; });
    return { v: 1, bg: { k: 'scene', key: sceneKey }, frame: 'none', fc: th.frame, veil: 0, els: lines, meta: Object.assign({}, data, { d: undefined }) };
  }
  // A shareable copy with the family's details replaced by sample wording (Community gallery).
  function anonymize(D) {
    const meta = D.meta || {}; const lng = meta.l === 'en' ? 'en' : 'yi';
    const sample = K.sample({ id: 'scene-velvet', type: meta.t || 'general' }, lng);
    const safe = fromData(Object.assign({}, sample, { t: meta.t || 'general', l: lng }), { scene: (D.bg && D.bg.key) || 'velvet' });
    const byRole = {}; safe.els.forEach((e) => { if (e.role) byRole[e.role] = e.s; });
    const out = JSON.parse(JSON.stringify(D));
    out.els.forEach((e) => { if (e.t !== 'text') return; if (e.role && byRole[e.role] !== undefined) e.s = byRole[e.role]; else if (!e.role || e.role === 'custom') e.s = lng === 'yi' ? 'אייער טעקסט' : 'Your text'; delete e._bb; });
    out.meta = { t: meta.t || 'general', l: lng };
    return out;
  }
  function strip(D) { const c = JSON.parse(JSON.stringify(D)); (c.els || []).forEach((e) => { delete e._bb; }); return c; }

  // ---------------------------------------------------------------- links
  async function encodeDesign(D) {
    const json = new TextEncoder().encode(JSON.stringify(strip(D)));
    if (typeof CompressionStream !== 'undefined') { try { return 'z' + X.b64url(await X.streamBytes(json, CompressionStream, 'deflate-raw')); } catch (_) {} }
    return 'u' + X.b64url(json);
  }
  async function decodeDesign(tok) {
    if (!tok) return null; let bytes = X.unb64url(tok.slice(1));
    if (tok[0] === 'z') bytes = await X.streamBytes(bytes, DecompressionStream, 'deflate-raw'); else if (tok[0] !== 'u') return null;
    const D = JSON.parse(new TextDecoder().decode(bytes));
    if (!D || typeof D !== 'object' || !Array.isArray(D.els)) return null;
    if (D.bg && D.bg.k === 'ai' && !/^https:\/\/image\.pollinations\.ai\//.test(D.bg.url || '')) D.bg = { k: 'scene', key: 'velvet' };
    D.els = D.els.slice(0, 60).map((e) => Object.assign({}, e, { s: String(e.s || '').slice(0, 600), z: Math.max(8, Math.min(400, +e.z || 40)) }));
    return D;
  }
  function studioLink(tok) { return new URL('invite.html#s=' + tok, location.href).href; }

  // ---------------------------------------------------------------- My Designs (this browser only)
  const store = {
    all() { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (_) { return []; } },
    save(list) { try { localStorage.setItem(STORE, JSON.stringify(list.slice(0, 40))); return true; } catch (_) { return false; } },
    put(rec) { const l = store.all().filter((x) => x.id !== rec.id); l.unshift(rec); if (!store.save(l)) { l.pop(); store.save(l); } },
    del(id) { store.save(store.all().filter((x) => x.id !== id)); }
  };
  const newId = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  window.KashoStudio = { render, fromData, anonymize, encodeDesign, decodeDesign, studioLink, store };

  // ---------------------------------------------------------------- the studio UI (invitations page only)
  function init() {
    const root = $('#studio'); if (!root) return;
    const cv = $('#stCanvas'), panel = $('#stPanel');
    const setTop = () => { const hd = document.querySelector('.site-header, header'); const pos = hd ? getComputedStyle(hd).position : ''; root.style.setProperty('--st-top', (hd && (pos === 'sticky' || pos === 'fixed') ? hd.getBoundingClientRect().height : 0) + 'px'); };
    setTop(); window.addEventListener('resize', setTop);
    let D = null, cur = null, sel = -1, hist = [], fut = [], saveT = null, drawPending = false, dirtyShare = true;
    const status = $('#stStatus');
    const say = (en, yi) => X.flash(status, en, yi);
    const formState = () => { try { return JSON.parse(localStorage.getItem('kasho-invite-draft-v1') || 'null'); } catch (_) { return null; } };

    function snapshot() { return JSON.stringify(strip(D)); }
    function commit() { hist.push(snapshot()); if (hist.length > 80) hist.shift(); fut = []; changed(); }
    function changed() { dirtyShare = true; draw(); clearTimeout(saveT); saveT = setTimeout(persist, 600); syncPanel(); }
    function draw() { if (drawPending) return; drawPending = true; requestAnimationFrame(async () => { drawPending = false; await render(cv, D, 0.5); drawSel(); }); }
    function drawSel() {
      const e = D.els[sel]; if (!e || !e._bb) return;
      const ctx = cv.getContext('2d'); ctx.save(); ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      ctx.strokeStyle = 'rgba(30,110,200,.9)'; ctx.setLineDash([14, 10]); ctx.lineWidth = 4; ctx.strokeRect(e._bb[0], e._bb[1], e._bb[2], e._bb[3]); ctx.restore();
    }
    async function persist() {
      const thumbC = document.createElement('canvas'); await render(thumbC, D, 0.12);
      const rec = { id: cur, name: (D.els.find((e) => e.role === 'title') || {}).s || 'Design', at: Date.now(), thumb: thumbC.toDataURL('image/jpeg', 0.7), D: strip(D) };
      store.put(rec); try { localStorage.setItem(CURRENT, cur); } catch (_) {}
      listMine();
    }
    function load(design, id) { D = JSON.parse(JSON.stringify(design)); cur = id || newId(); sel = -1; hist = [snapshot()]; fut = []; dirtyShare = true; draw(); syncPanel(); listMine(); }
    function undo() { if (hist.length < 2) return; fut.push(hist.pop()); D = JSON.parse(hist[hist.length - 1]); sel = -1; changed(); }
    function redo() { if (!fut.length) return; const s = fut.pop(); hist.push(s); D = JSON.parse(s); sel = -1; changed(); }

    // --- pointer: select + drag on the canvas
    let drag = null;
    const toCard = (ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', (ev) => {
      const [x, y] = toCard(ev); let hit = -1;
      for (let i = D.els.length - 1; i >= 0; i--) { const b = D.els[i]._bb; if (b && x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]) { hit = i; break; } }
      sel = hit; syncPanel(); draw();
      if (hit >= 0) { drag = { i: hit, dx: x - D.els[hit].x, dy: y - D.els[hit].y, moved: false }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); }
    });
    cv.addEventListener('pointermove', (ev) => { if (!drag) return; const [x, y] = toCard(ev); const e = D.els[drag.i]; e.x = Math.round(Math.max(0, Math.min(W, x - drag.dx))); e.y = Math.round(Math.max(0, Math.min(H, y - drag.dy))); drag.moved = true; draw(); });
    const endDrag = () => { if (drag && drag.moved) commit(); drag = null; };
    cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
    document.addEventListener('keydown', (ev) => {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
      if (sel >= 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key) && document.activeElement === document.body) { const e = D.els[sel]; const st = ev.shiftKey ? 40 : 8; if (ev.key === 'ArrowUp') e.y -= st; if (ev.key === 'ArrowDown') e.y += st; if (ev.key === 'ArrowLeft') e.x -= st; if (ev.key === 'ArrowRight') e.x += st; ev.preventDefault(); commit(); }
    });

    // --- panel: selected element
    const sText = $('#stText'), sFont = $('#stFont'), sSize = $('#stSize'), sColor = $('#stColor'), sFx = $('#stFx'), sFoil = $('#stFoil'), sWidth = $('#stWidth');
    FONTS.forEach((f, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = f[2]; o.style.fontFamily = '"' + f[0] + '"'; sFont.appendChild(o); });
    EFFECTS.forEach((e) => { const o = document.createElement('option'); o.value = e[0]; o.textContent = e[1] + ' · ' + e[2]; sFx.appendChild(o); });
    FOILS.forEach((e) => { const o = document.createElement('option'); o.value = e[0]; o.textContent = e[1] + ' · ' + e[2]; sFoil.appendChild(o); });
    function syncPanel() {
      const e = D && D.els[sel];
      $('#stSel').hidden = !e; $('#stNoSel').hidden = !!e;
      if (!e) return;
      const isText = e.t === 'text';
      $$('.st-text-only', root).forEach((x) => { x.hidden = !isText; });
      if (isText) {
        if (document.activeElement !== sText) sText.value = e.s; sText.dir = HE.test(e.s) ? 'rtl' : 'ltr';
        sFont.value = String(Math.max(0, FONTS.findIndex((f) => f[0] === e.f && f[1] === e.fw)));
        sFx.value = e.fx || 'none'; sFoil.value = e.foil || 'gold'; $('#stFoilRow').hidden = (e.fx || 'none') !== 'foil';
        sWidth.value = String(e.mw || 1100);
        $$('[data-st-align]', root).forEach((b) => b.setAttribute('aria-pressed', String((e.al || 'center') === b.dataset.stAlign)));
      }
      sSize.value = String(e.z); sColor.value = /^#[0-9a-f]{6}$/i.test(e.c || '') ? e.c : '#22314f';
    }
    const onSel = (fn, live) => (ev) => { const e = D.els[sel]; if (!e) return; fn(e, ev); if (live) { draw(); clearTimeout(saveT); saveT = setTimeout(() => { commit(); }, 450); } else commit(); };
    sText.addEventListener('input', onSel((e) => { e.s = sText.value; sText.dir = HE.test(e.s) ? 'rtl' : 'ltr'; }, true));
    sFont.addEventListener('change', onSel((e) => { const f = FONTS[+sFont.value]; e.f = f[0]; e.fw = f[1]; }));
    sSize.addEventListener('input', onSel((e) => { e.z = +sSize.value; }, true));
    sColor.addEventListener('input', onSel((e) => { e.c = sColor.value; }, true));
    sFx.addEventListener('change', onSel((e) => { e.fx = sFx.value; }));
    sFoil.addEventListener('change', onSel((e) => { e.foil = sFoil.value; }));
    sWidth.addEventListener('input', onSel((e) => { e.mw = +sWidth.value; }, true));
    $$('[data-st-align]', root).forEach((b) => b.addEventListener('click', onSel((e) => { e.al = b.dataset.stAlign; })));
    $('#stDup').addEventListener('click', onSel((e) => { const c = JSON.parse(JSON.stringify(e)); delete c._bb; c.y += 90; c.role = 'custom'; D.els.push(c); sel = D.els.length - 1; }));
    $('#stDel').addEventListener('click', () => { if (sel < 0) return; D.els.splice(sel, 1); sel = -1; commit(); });
    $('#stFront').addEventListener('click', onSel((e) => { D.els.splice(sel, 1); D.els.push(e); sel = D.els.length - 1; }));
    $('#stAddText').addEventListener('click', () => { const th = guessTheme(); D.els.push({ t: 'text', role: 'custom', s: L('Your text', 'אייער טעקסט'), f: 'Frank Ruhl Libre', fw: 500, z: 60, c: th.ink, x: W / 2, y: H / 2, mw: 1100, al: 'center' }); sel = D.els.length - 1; commit(); });
    const ornBox = $('#stOrns');
    ORNAMENTS.forEach(([k, g]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-orn'; b.textContent = g; b.title = k; b.addEventListener('click', () => { D.els.push({ t: 'orn', k, z: k === 'magen' || k === 'keser' ? 60 : 30, c: D.fc || '#b08d4a', x: W / 2, y: H / 2 }); sel = D.els.length - 1; commit(); }); ornBox.appendChild(b); });
    function guessTheme() { const t = D.els.find((e) => e.role === 'invite' || e.role === 'open'); return { ink: t ? t.c : '#22314f' }; }

    // --- backgrounds
    const bgBox = $('#stScenes');
    (K.SCENES || []).forEach((s) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-bg'; b.title = s.en; b.style.backgroundImage = 'url(' + X.sceneSrc(s.k, true) + ')'; b.addEventListener('click', () => { D.bg = { k: 'scene', key: s.k }; commit(); }); bgBox.appendChild(b); });
    GRADS.forEach((g, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-bg'; b.style.background = 'linear-gradient(160deg,' + g[0] + ',' + g[1] + ')'; b.addEventListener('click', () => { D.bg = { k: 'grad', c: g, style: i % 2 ? 'linear' : 'radial' }; commit(); }); bgBox.appendChild(b); });
    $('#stVeil').addEventListener('input', (ev) => { D.veil = +ev.target.value; draw(); clearTimeout(saveT); saveT = setTimeout(commit, 400); });
    // frames + themes
    const frBox = $('#stFrames');
    FRAMES.forEach(([k, en, yi]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-chip'; b.dataset.frame = k; b.innerHTML = '<span data-lang="en"></span><span data-lang="yi"></span>'; X.both(b, en, yi); b.addEventListener('click', () => { D.frame = k; commit(); }); frBox.appendChild(b); });
    $('#stFrameColor').addEventListener('input', (ev) => { D.fc = ev.target.value; D.els.forEach((e) => { if (e.t === 'orn') e.c = D.fc; }); draw(); clearTimeout(saveT); saveT = setTimeout(commit, 400); });
    const thBox = $('#stThemes');
    THEMES.forEach(([en, yi, th]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-theme'; b.style.setProperty('--a', th.accent); b.style.setProperty('--b', th.frame); b.title = en; b.setAttribute('aria-label', en); b.addEventListener('click', () => applyTheme(th)); thBox.appendChild(b); });
    function applyTheme(th) { D.fc = th.frame; D.els.forEach((e) => { if (e.t === 'orn') e.c = th.frame; else if (['title', 'names', 'hosts'].includes(e.role)) { e.c = th.accent; if (e.fx === 'foil') e.foil = th.foil; } else e.c = th.ink; }); commit(); }
    // surprise me
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    $('#stSurprise').addEventListener('click', () => {
      const s = pick(K.SCENES || [{ k: 'velvet' }]);
      const base = fromData(Object.assign({}, D.meta || {}, { d: 'scene-' + s.k }), { scene: s.k });
      // keep the user's own words, re-styled
      base.els.forEach((e) => { const mine = D.els.find((m) => m.role && m.role === e.role); if (mine) e.s = mine.s; });
      const th = s.p === 'dark' ? THEMES[6][2] : pick(THEMES.slice(0, 6))[2];
      const titleFont = pick([['Frank Ruhl Libre', 900], ['Suez One', 400], ['Bona Nova', 700], ['Secular One', 400], ['Karantina', 700], ['David Libre', 700]]);
      base.els.forEach((e) => { if (e.role === 'title') { e.f = titleFont[0]; e.fw = titleFont[1]; e.fx = pick(['foil', 'foil', '3d', 'emboss', 'shadow']); e.foil = th.foil; } if (e.role === 'names') { e.f = titleFont[0]; e.fw = titleFont[1]; } });
      base.frame = pick(['none', 'none', 'thin', 'corners', 'double']);
      D = base; applyTheme(th);
    });
    $('#stUndo').addEventListener('click', undo); $('#stRedo').addEventListener('click', redo);
    $('#stFromForm').addEventListener('click', () => { const f = formState(); if (!f) { say('Fill in the invitation form above first.', 'פילט קודם אויס די הזמנה אויבן.'); return; } load(fromData(f)); commit(); say('Your details are in — now make it yours.', 'אייערע פרטים זענען אריין.'); });
    $('#stNew').addEventListener('click', () => { const f = formState() || K.sample({ id: 'scene-velvet', type: 'chasuna' }, lang()); load(fromData(f)); persist(); });

    // --- AI backgrounds
    const aiIn = $('#stAiText'), aiOut = $('#stAiOut'), aiChips = $('#stAiChips'); let aiSeed = Math.floor(Math.random() * 9000);
    AI_THEMES.forEach(([en, yi, p]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-chip'; b.innerHTML = '<span data-lang="en"></span><span data-lang="yi"></span>'; X.both(b, en, yi); b.addEventListener('click', () => { aiIn.value = p; aiGo(true); }); aiChips.appendChild(b); });
    function aiUrl(prompt, seed) { return AI_ENDPOINT + encodeURIComponent(prompt + AI_SUFFIX) + '?width=1080&height=1512&nologo=true&referrer=' + encodeURIComponent(location.hostname || 'kasho') + '&seed=' + seed; }
    const AI_GAP = 46000; let aiNextAt = 0, aiRun = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    async function aiOne(tile, text, run) {
      for (let attempt = 0; attempt < 3; attempt++) {
        let wait = aiNextAt - Date.now();
        while (wait > 0) { if (run !== aiRun) return false; tile.dataset.wait = String(Math.ceil(wait / 1000)); await sleep(Math.min(1000, wait)); wait = aiNextAt - Date.now(); }
        delete tile.dataset.wait; if (run !== aiRun) return false;
        aiNextAt = Date.now() + AI_GAP;
        const seed = ++aiSeed, url = aiUrl(text, seed);
        const im = await Promise.race([loadImg(url), sleep(60000).then(() => null)]);
        if (im && !isLimitCard(im)) {
          tile.classList.remove('is-loading'); tile.style.backgroundImage = 'url("' + url + '")'; tile.disabled = false;
          tile.onclick = () => { D.bg = { k: 'ai', url }; D.veil = D.veil || 0.08; commit(); };
          return true;
        }
        delete imgCache[url];
        if (!im) break;
      }
      tile.classList.remove('is-loading'); tile.classList.add('is-failed'); return false;
    }
    async function aiGo(fresh) {
      const text = (aiIn.value || '').trim().slice(0, 200);
      if (!text) { say('Describe a background, or tap one of the ideas.', 'באשרייבט א הינטערגרונט, אדער טאפט א געדאנק.'); return; }
      if (AI_BLOCK.test(text)) { say('Backgrounds here show objects and places only — no people or figures. Try other words.', 'די הינטערגרונטן ווייזן נאר זאכן און ערטער — נישט קיין מענטשן. פרובירט אנדערע ווערטער.'); return; }
      const run = fresh ? ++aiRun : aiRun;
      if (fresh) aiOut.innerHTML = '';
      const tiles = [];
      for (let i = 0; i < 4; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-ai is-loading'; b.disabled = true; aiOut.appendChild(b); tiles.push(b); }
      say('Creating your backgrounds — the first one takes about 15 seconds, then one every 45 seconds.', 'מאכט אייערע הינטערגרונטן — דער ערשטער נעמט בערך 15 סעקונדעס, דערנאך איינס יעדע 45 סעקונדעס.');
      let ok = 0;
      for (const t of tiles) { if (await aiOne(t, text, run)) ok++; else if (run !== aiRun) return; else if (!ok) break; }
      tiles.forEach((t) => { if (t.classList.contains('is-loading')) { t.classList.remove('is-loading'); t.classList.add('is-failed'); delete t.dataset.wait; } });
      $('#stAiMore').hidden = false;
      if (!ok) say('The free AI picture service is busy right now — try again in a minute, or pick one of our photo backgrounds.', 'דער פרייער AI בילדער סערוויס איז יעצט פארנומען — פרובירט שפעטער, אדער קלויבט איינע פון אונזערע פאטא הינטערגרונטן.');
    }
    $('#stAiGo').addEventListener('click', () => aiGo(true)); $('#stAiMore').addEventListener('click', () => aiGo(false));
    aiIn.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); aiGo(true); } });

    // --- My Designs
    function listMine() {
      const box = $('#stMine'); if (!box) return; box.innerHTML = '';
      const all = store.all(); $('#stMineEmpty').hidden = all.length > 0;
      all.forEach((rec) => {
        const fig = document.createElement('figure'); fig.className = 'st-mine' + (rec.id === cur ? ' is-current' : '');
        const img = document.createElement('img'); img.src = rec.thumb; img.alt = ''; img.loading = 'lazy';
        const cap = document.createElement('figcaption'); cap.textContent = rec.name; cap.dir = 'auto';
        const row = document.createElement('div'); row.className = 'st-mine-row';
        const mk = (en, yi, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-linkbtn'; b.innerHTML = '<span data-lang="en"></span><span data-lang="yi"></span>'; X.both(b, en, yi); b.addEventListener('click', fn); return b; };
        row.append(mk('Open', 'עפענען', () => { load(rec.D, rec.id); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }),
          mk('Duplicate', 'קאפיע', () => { load(rec.D); persist(); }),
          mk('Delete', 'אויסמעקן', () => { if (confirm(L('Delete this design?', 'אויסמעקן די דיזיין?'))) { store.del(rec.id); if (rec.id === cur) cur = newId(); listMine(); } }));
        fig.append(img, cap, row); box.appendChild(fig);
      });
    }

    // --- save / share / export
    async function link() { return studioLink(await encodeDesign(D)); }
    $('#stLink').addEventListener('click', async () => { const l = await link(); const ok = await X.copyText(l); $('#stLinkOut').value = l; $('#stLinkOut').hidden = false; $('#stOpen').href = l; $('#stOpen').hidden = false; ok ? say('Invitation link copied — paste it anywhere.', 'דער לינק איז קאפירט.') : say('Copy the link below.', 'קאפירט דעם לינק אונטן.'); });
    $('#stImg').addEventListener('click', async () => { const c = document.createElement('canvas'); await render(c, D, 1); X.saveBlob(await X.canvasBlob(c, 'image/jpeg', 0.9), X.fileBase(D.meta || {}) + '.jpg'); });
    $('#stPdf').addEventListener('click', async () => { const c = document.createElement('canvas'); await render(c, D, 1); X.saveBlob(X.buildPdf(360, 504, [{ x: 0, y: 0, w: 360, h: 504, pw: c.width, ph: c.height, jpg: await X.jpegOf(c, 0.95) }]), X.fileBase(D.meta || {}) + '.pdf'); });
    $('#stSave').addEventListener('click', async () => {
      await persist();
      const share = $('#stShare').checked;
      if (share && dirtyShare && window.KashoCommunity && window.KashoCommunity.submit) {
        const A = anonymize(D); const tc = document.createElement('canvas'); await render(tc, A, 0.2);
        const ok = await window.KashoCommunity.submit({ design: A, thumb: tc.toDataURL('image/jpeg', 0.72), title: (A.els.find((e) => e.role === 'title') || {}).s || '', simchaType: (A.meta || {}).t || 'general', site: window.KASHO_SITE });
        dirtyShare = !ok;
        say(ok ? 'Saved to My Designs — and shared: it joins the Community gallery in 3 days (names and details removed).' : 'Saved to My Designs.', ok ? 'אפגעהיטן אין "מיינע דיזיינס" — און געשיקט: עס קומט אריין אין די קאמיוניטי גאלעריע אין 3 טעג (אן נעמען און פרטים).' : 'אפגעהיטן אין "מיינע דיזיינס".');
      } else say('Saved to My Designs.', 'אפגעהיטן אין "מיינע דיזיינס".');
    });
    $('#stShare').checked = SHARE_DEFAULT;

    // --- community gallery (published designs; hidden when there are none / no table)
    async function community() {
      const sec = $('#invCommunity'); if (!sec || !window.KashoCommunity || !window.KashoCommunity.list) return;
      let rows = []; try { rows = await window.KashoCommunity.list({ limit: 24 }); } catch (_) { rows = []; }
      if (!rows || !rows.length) return;
      const box = $('#invCommunityGrid'); box.innerHTML = '';
      rows.forEach((row) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'st-comm';
        const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.src = row.thumb || '';
        b.appendChild(img);
        b.addEventListener('click', () => { const f = formState(); const Dd = row.design; if (f) { const mine = fromData(f, { scene: Dd.bg && Dd.bg.key }); Dd.els.forEach((e) => { const m = mine.els.find((x) => x.role && x.role === e.role); if (m) e.s = m.s; }); Dd.meta = mine.meta; } load(Dd); persist(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        box.appendChild(b);
      });
      sec.hidden = false;
    }

    // --- start: the last design, else one built from the invitation form
    const last = (() => { try { return localStorage.getItem(CURRENT); } catch (_) { return null; } })();
    const rec = last && store.all().find((x) => x.id === last);
    if (rec) load(rec.D, rec.id); else { const f = formState() || K.sample({ id: 'scene-velvet', type: 'chasuna' }, lang()); load(fromData(f)); }
    const openBtn = $('#btnStudio');
    if (openBtn) openBtn.addEventListener('click', () => { const f = formState(); if (f) { load(fromData(f)); persist(); } root.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); community(); } }, { rootMargin: '600px 0px' }) : null;
    const cs = $('#invCommunity'); if (io && cs) io.observe(cs); else community();
    document.addEventListener('site-language-change', () => { syncPanel(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
