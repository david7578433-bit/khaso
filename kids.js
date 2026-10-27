// Kids' corner: this week's parsha quiz (parsha from Hebcal, questions from data/kids.json) and
// printable coloring pages drawn as simple SVG line art. No tracking; scores stay in this browser.
(function () {
  const yi = () => document.documentElement.lang === 'yi';
  const $ = (id) => document.getElementById(id);
  let data = null, currentKey = '', weekKey = '', weekEn = '', weekHe = '';
  let answers = [];

  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function keyOf(title) { return String(title || '').replace(/^Parashat\s+/, '').trim(); }

  async function loadWeek() {
    try {
      if (window.KashoSite && window.KashoSite.loadToday) {
        const t = await window.KashoSite.loadToday();
        if (t && t.parshaEn) { weekEn = t.parshaEn; weekHe = t.parshaHe || ''; }
      }
    } catch (_) {}
    if (!weekEn) {
      try {
        const j = await fetch('https://www.hebcal.com/shabbat?cfg=json&M=on&zip=11211').then((r) => r.json());
        const p = (j.items || []).find((i) => i.category === 'parashat');
        if (p) { weekEn = p.title; weekHe = p.hebrew; }
      } catch (_) {}
    }
    weekKey = keyOf(weekEn);
  }

  function quizFor(key) { return data && data.quizzes && data.quizzes[key]; }

  function renderStars(total, right) {
    const box = $('quizStars');
    box.replaceChildren();
    if (!total) return;
    for (let i = 0; i < total; i++) {
      const s = el('span', 'kstar' + (i < right ? ' is-on' : ''), '★');
      s.setAttribute('aria-hidden', 'true');
      box.append(s);
    }
    box.append(el('span', 'visually-hidden', right + ' / ' + total));
  }

  function renderQuiz() {
    const body = $('quizBody');
    const quiz = quizFor(currentKey);
    const label = quiz ? (yi() ? quiz.title_yi : quiz.title) : (yi() ? (weekHe || '') : (weekEn ? weekEn.replace(/^Parashat\s+/, 'Parshas ') : ''));
    $('quizParsha').textContent = label;
    if (!data) return;
    if (!quiz) {
      renderStars(0, 0);
      const empty = el('div', 'quiz-empty');
      empty.innerHTML = '<svg viewBox="0 0 120 24" aria-hidden="true" class="quiz-empty-orn"><path d="M2 12h44M74 12h44" stroke="currentColor" stroke-width="1.4"/><path d="M60 3l9 9-9 9-9-9z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M60 8l4 4-4 4-4-4z" fill="currentColor"/></svg>';
      empty.append(el('p', 'quiz-empty-title', yi() ? 'דער קוויז פאר די וואך קומט באלד' : 'This week’s quiz is coming soon'));
      empty.append(el('p', null, yi() ? 'אינצווישן, פרובירט א קוויז פון אונטן אדער פארבט א בילד!' : 'Meanwhile, try one of the quizzes below or color a picture!'));
      body.replaceChildren(empty);
      renderOthers();
      return;
    }
    const right = answers.filter((a, i) => a === quiz.questions[i].answer).length;
    const done = answers.filter((a) => a != null).length;
    renderStars(quiz.questions.length, right);
    const list = el('ol', 'quiz-list');
    quiz.questions.forEach((qq, i) => {
      const li = el('li', 'quiz-q');
      const picked = answers[i];
      li.append(el('p', 'quiz-q-text', yi() ? qq.q_yi : qq.q));
      const opts = el('div', 'quiz-opts');
      opts.setAttribute('role', 'group');
      (yi() ? qq.options_yi : qq.options).forEach((text, j) => {
        const b = el('button', 'quiz-opt', text);
        b.type = 'button';
        if (picked != null) {
          b.disabled = true;
          if (j === qq.answer) b.classList.add('is-right');
          else if (j === picked) b.classList.add('is-wrong');
        }
        b.addEventListener('click', () => { answers[i] = j; renderQuiz(); });
        opts.append(b);
      });
      li.append(opts);
      if (picked != null) {
        li.append(el('p', 'quiz-feedback ' + (picked === qq.answer ? 'good' : 'try'),
          picked === qq.answer ? (yi() ? '✓ גערעכט! א שטערנדל פאר דיר.' : '✓ Right! You earned a star.')
                               : (yi() ? 'נישט די ריכטיגע — דער ריכטיגער ענטפער איז אנגעצייכנט.' : 'Not quite — the right answer is marked in green.')));
      }
      list.append(li);
    });
    const nodes = [list];
    if (done === quiz.questions.length) {
      const fin = el('div', 'quiz-done');
      const all = right === quiz.questions.length;
      fin.append(el('p', 'quiz-done-title', all ? (yi() ? 'יישר כח! אלע ריכטיג 🌟' : 'Yasher koach! All correct 🌟') : (yi() ? 'שיין! ' + right + ' פון ' + quiz.questions.length + ' ריכטיג' : 'Well done! ' + right + ' of ' + quiz.questions.length + ' right')));
      const again = el('button', 'button button-gold', yi() ? 'נאכאמאל פרובירן' : 'Try again'); again.type = 'button';
      again.addEventListener('click', () => { answers = []; renderQuiz(); $('quiz').scrollIntoView({ behavior: 'smooth' }); });
      fin.append(again);
      nodes.push(fin);
    }
    body.replaceChildren(...nodes);
    renderOthers();
  }

  function renderOthers() {
    const keys = data && data.quizzes ? Object.keys(data.quizzes).filter((k) => k !== currentKey) : [];
    $('quizOther').hidden = !keys.length;
    $('quizOtherList').replaceChildren(...keys.map((k) => {
      const qz = data.quizzes[k];
      const b = el('button', 'quiz-other-btn', (yi() ? qz.title_yi : qz.title) + (k === weekKey ? (yi() ? ' · די וואך' : ' · this week') : ''));
      b.type = 'button';
      b.addEventListener('click', () => { currentKey = k; answers = []; renderQuiz(); $('quiz').scrollIntoView({ behavior: 'smooth' }); });
      return b;
    }));
  }

  // ---------- Coloring pages (simple line art, no people) ----------
  const S = 'fill="#fff" stroke="#111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
  const flame = (x, y, s) => `<path ${S} d="M${x} ${y} c ${-14 * s} ${-14 * s} ${-14 * s} ${-34 * s} 0 ${-56 * s} c ${14 * s} ${22 * s} ${14 * s} ${42 * s} 0 ${56 * s} z"/>`;
  const star = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path ${S} d="${d}Z"/>`; };
  const magen = (cx, cy, r) => { const t = (rot) => { let d = ''; for (let i = 0; i < 3; i++) { const a = rot + i * 2 * Math.PI / 3; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); } return `<path ${S} d="${d}Z"/>`; }; return t(-Math.PI / 2) + t(Math.PI / 2); };
  const title = (he, y) => `<text x="300" y="${y || 760}" text-anchor="middle" font-family="Frank Ruhl Libre, serif" font-size="64" font-weight="700" fill="#fff" stroke="#111" stroke-width="2.5">${he}</text>`;
  let clipSeq = 0;
  const PAGES = [
    { key: 'candles', en: 'Shabbos candles', yi: 'שבת ליכט', svg: () =>
      `<ellipse ${S} cx="300" cy="640" rx="230" ry="34"/>` +
      [210, 390].map((x) => `<path ${S} d="M${x - 60} 630 q60 -40 120 0 z"/><rect ${S} x="${x - 14}" y="430" width="28" height="180" rx="10"/><ellipse ${S} cx="${x}" cy="520" rx="34" ry="14"/><path ${S} d="M${x - 50} 430 q50 40 100 0 z"/><rect ${S} x="${x - 22}" y="250" width="44" height="180" rx="6"/><line x1="${x}" y1="250" x2="${x}" y2="232" stroke="#111" stroke-width="6"/>` + flame(x, 230, 1.6) + `<path fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" d="M${x - 70} 150 l-24 -18 M${x + 70} 150 l24 -18 M${x} 110 v-30"/>`).join('') +
      star(90, 120, 30) + star(510, 110, 24) + title('שבת קודש') },
    { key: 'challah', en: 'Challah', yi: 'חלה', svg: () => {
      const cid = 'loafClip' + (++clipSeq);
      const loaf = 'M95 430 Q85 320 190 305 Q300 285 410 305 Q515 320 505 430 Q495 490 300 495 Q105 490 95 430 Z';
      let strands = '';
      for (let i = 0; i < 7; i++) {
        const x = 130 + i * 58;
        strands += `<ellipse ${S} cx="${x}" cy="365" rx="46" ry="30" transform="rotate(-32 ${x} 365)"/>`;
        strands += `<ellipse ${S} cx="${x + 29}" cy="430" rx="46" ry="30" transform="rotate(32 ${x + 29} 430)"/>`;
      }
      const seeds = [[180, 350], [250, 345], [320, 352], [390, 346], [215, 418], [290, 425], [365, 420], [430, 428]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#111"/>`).join('');
      return `<defs><clipPath id="${cid}"><path d="${loaf}"/></clipPath></defs>` +
        `<rect ${S} x="55" y="500" width="490" height="60" rx="14"/><circle ${S} cx="85" cy="530" r="10"/>` +
        `<path ${S} d="${loaf}"/><g clip-path="url(#${cid})">${strands}${seeds}</g><path fill="none" stroke="#111" stroke-width="7" d="${loaf}"/>` +
        star(110, 170, 34) + star(490, 150, 28) + star(300, 120, 22) + title('לכבוד שבת קודש', 690);
    } },
    { key: 'sukkah', en: 'Sukkah', yi: 'סוכה', svg: () =>
      `<rect ${S} x="90" y="260" width="420" height="380"/><rect ${S} x="250" y="430" width="120" height="210" rx="6"/><line x1="90" y1="640" x2="510" y2="640" stroke="#111" stroke-width="8"/>` +
      `<path fill="none" stroke="#111" stroke-width="6" stroke-linecap="round" d="M70 250 q60 -50 120 0 q60 -50 120 0 q60 -50 120 0 q60 -50 120 0"/>` +
      [110, 170, 230, 290, 350, 410, 470].map((x, i) => `<path ${S} d="M${x} 250 l${i % 2 ? 22 : -22} -54 l${i % 2 ? 14 : -14} 46 z"/>`).join('') +
      [140, 200, 400, 460].map((x, i) => `<line x1="${x}" y1="260" x2="${x}" y2="${300 + (i % 2) * 30}" stroke="#111" stroke-width="3"/>` + (i % 2 ? star(x, 345, 20) : `<circle ${S} cx="${x}" cy="${322}" r="22"/>`)).join('') +
      `<rect ${S} x="120" y="400" width="100" height="80"/><line x1="170" y1="400" x2="170" y2="480" stroke="#111" stroke-width="4"/><rect ${S} x="400" y="400" width="80" height="80"/><line x1="440" y1="400" x2="440" y2="480" stroke="#111" stroke-width="4"/>` + title('חג הסוכות', 740) },
    { key: 'menorah', en: 'Menorah', yi: 'מנורה', svg: () =>
      `<path ${S} d="M220 660 h160 l-30 -50 h-100 z"/><rect ${S} x="285" y="330" width="30" height="280"/>` +
      [1, 2, 3, 4].map((i) => `<path fill="none" stroke="#111" stroke-width="22" stroke-linecap="round" d="M${300 - i * 50} 330 v40 a${i * 50} ${i * 50} 0 0 0 ${i * 100} 0 v-40"/><path fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" d="M${300 - i * 50} 330 v40 a${i * 50} ${i * 50} 0 0 0 ${i * 100} 0 v-40"/>`).join('') +
      [-200, -150, -100, -50, 50, 100, 150, 200].map((dx) => `<rect ${S} x="${300 + dx - 16}" y="296" width="32" height="34" rx="4"/>` + flame(300 + dx, 290, 0.8)).join('') +
      `<rect ${S} x="284" y="240" width="32" height="40" rx="4"/>` + flame(300, 234, 0.9) + title('חנוכה', 760) },
    { key: 'torah', en: 'Sefer Torah', yi: 'ספר תורה', svg: () =>
      [170, 430].map((x) => `<rect ${S} x="${x - 14}" y="110" width="28" height="560" rx="12"/><ellipse ${S} cx="${x}" cy="200" rx="56" ry="16"/><ellipse ${S} cx="${x}" cy="590" rx="56" ry="16"/><rect ${S} x="${x - 50}" y="200" width="100" height="390"/><circle ${S} cx="${x}" cy="100" r="22"/>`).join('') +
      `<rect ${S} x="220" y="210" width="160" height="370"/>` + [250, 280, 310, 340, 370, 400, 430, 460, 490, 520, 550].map((y) => `<line x1="240" y1="${y}" x2="360" y2="${y}" stroke="#111" stroke-width="3"/>`).join('') +
      `<path ${S} d="M240 60 l20 -36 l20 26 l20 -32 l20 32 l20 -26 l20 36 z"/>` + title('תורה', 750) },
    { key: 'shul', en: 'Shul', yi: 'שול', svg: () =>
      `<path ${S} d="M80 300 L300 120 L520 300 Z"/><rect ${S} x="110" y="300" width="380" height="350"/><path ${S} d="M250 650 v-130 a50 50 0 0 1 100 0 v130 z"/><line x1="300" y1="470" x2="300" y2="650" stroke="#111" stroke-width="5"/>` +
      `<circle ${S} cx="300" cy="230" r="52"/>` + magen(300, 230, 36) +
      [[150, 360], [390, 360], [150, 500], [390, 500]].map(([x, y]) => `<path ${S} d="M${x} ${y + 90} v-60 a30 30 0 0 1 60 0 v60 z"/><line x1="${x + 30}" y1="${y}" x2="${x + 30}" y2="${y + 90}" stroke="#111" stroke-width="4"/>`).join('') +
      `<rect ${S} x="210" y="650" width="180" height="22"/><rect ${S} x="190" y="672" width="220" height="22"/>` + title('בית הכנסת', 770) }
  ];
  function svgOf(page) { return '<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + page.en + '">' + page.svg() + '</svg>'; }

  function renderColoring() {
    const grid = $('coloringGrid');
    grid.replaceChildren(...PAGES.map((page) => {
      const card = el('figure', 'coloring-card');
      const art = el('div', 'coloring-art'); art.innerHTML = svgOf(page);
      const cap = el('figcaption');
      cap.append(el('span', 'coloring-name', yi() ? page.yi : page.en));
      const b = el('button', 'button coloring-print-btn', yi() ? '🖨️ דרוקן' : '🖨️ Print'); b.type = 'button';
      b.setAttribute('aria-label', (yi() ? 'דרוקן: ' : 'Print: ') + (yi() ? page.yi : page.en));
      b.addEventListener('click', () => printPage(page));
      cap.append(b);
      card.append(art, cap);
      return card;
    }));
  }
  function printPage(page) {
    const holder = $('coloringPrint');
    holder.innerHTML = svgOf(page) + '<p class="coloring-print-foot">' + (yi() ? page.yi : page.en) + ' · Kasho קאשוי</p>';
    document.body.classList.add('printing-coloring');
    const done = () => { document.body.classList.remove('printing-coloring'); holder.innerHTML = ''; window.removeEventListener('afterprint', done); };
    setTimeout(() => { window.addEventListener('afterprint', done); window.print(); }, 50);
  }

  async function init() {
    renderColoring();
    const [json] = await Promise.all([
      fetch('data/kids.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      loadWeek()
    ]);
    data = json || { quizzes: {} };
    currentKey = weekKey;
    renderQuiz();
    document.addEventListener('site-language-change', () => { renderQuiz(); renderColoring(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
