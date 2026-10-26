(function () {
  function applyLanguage(language) {
    const isYiddish = language === 'yi';
    document.documentElement.lang = isYiddish ? 'yi' : 'en';
    document.documentElement.dir = isYiddish ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-lang]').forEach((element) => {
      element.hidden = element.dataset.lang !== language;
    });

    document.querySelectorAll('[data-i18n-en][data-i18n-yi]').forEach((element) => {
      element.textContent = isYiddish ? element.dataset.i18nYi : element.dataset.i18nEn;
    });

    const siteLabels = {
      'Home': 'היים', 'About': 'וועגן אונדז', 'Contact': 'קאנטאקט',
      'Yeshiva': 'ישיבה', 'Botei Medrash': 'בתי מדרשים', 'News': 'נייעס',
      'Simchas': 'שמחות', 'Editorial': 'רעדאקציע', 'Community': 'קהילה',
      'Kasho Chat': 'קאשוי שמועס', 'Pictures': 'בילדער', 'Zmanim': 'זמנים',
      'Recordings': 'רעקארדירונגען', 'Business': 'געשעפט', 'Ages': 'יארגאנג',
      'Log In': 'לאגין', 'Account': 'קאנטע'
    };
    document.querySelectorAll('nav a, footer a').forEach((link) => {
      if (link.querySelector('[data-lang]')) return;
      if (!link.dataset.i18nOriginal) link.dataset.i18nOriginal = link.textContent.trim();
      const original = link.dataset.i18nOriginal;
      if (siteLabels[original]) link.textContent = isYiddish ? siteLabels[original] : original;
    });

    document.querySelectorAll('.lang-button').forEach((button) => {
      button.textContent = isYiddish ? 'English' : 'אידיש';
      button.setAttribute('aria-label', isYiddish ? 'Switch to English' : 'טוישן אויף אידיש');
    });

    try { localStorage.setItem('siteLanguage', language); } catch (_) {}
    document.dispatchEvent(new CustomEvent('site-language-change', { detail: { language } }));
  }

  window.toggleLang = function () {
    applyLanguage(document.documentElement.lang === 'yi' ? 'en' : 'yi');
  };

  document.addEventListener('DOMContentLoaded', () => {
    let savedLanguage = 'en';
    try { savedLanguage = localStorage.getItem('siteLanguage') === 'yi' ? 'yi' : 'en'; } catch (_) {}
    initHeader();
    applyLanguage(savedLanguage);
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
    initToday();
    applySiteAccess();
  });



  // ---------- Header: drawer menu (tablet/phone) and dropdowns (desktop) ----------
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const nav = header.querySelector('.primary-nav');
    const toggle = header.querySelector('.menu-toggle');
    const overlay = document.querySelector('.nav-overlay');
    const drawerQuery = window.matchMedia('(max-width: 1099px)');
    const isDrawer = () => header.classList.contains('site-header--floating') || drawerQuery.matches;

    function closeSubs(except) {
      header.querySelectorAll('.has-sub.open').forEach((item) => {
        if (item === except) return;
        item.classList.remove('open');
        const button = item.querySelector('.nav-parent');
        if (button) button.setAttribute('aria-expanded', 'false');
      });
    }

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(open));
        const label = toggle.querySelector('.visually-hidden');
        if (label) label.textContent = open ? 'Close menu' : 'Menu';
      }
      if (overlay) overlay.hidden = !open;
      if (open) {
        const current = nav.querySelector('.has-sub.is-current');
        if (current) { current.classList.add('open'); current.querySelector('.nav-parent').setAttribute('aria-expanded', 'true'); }
        const first = nav.querySelector('a, button');
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
      }
    }

    if (toggle) toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
    if (overlay) overlay.addEventListener('click', () => setOpen(false));

    header.querySelectorAll('.nav-parent').forEach((button) => {
      const item = button.parentElement;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = !item.classList.contains('open');
        if (!isDrawer()) closeSubs(item);
        item.classList.toggle('open', open);
        button.setAttribute('aria-expanded', String(open));
      });
      // Desktop: keep aria-expanded in step with hover.
      item.addEventListener('mouseenter', () => { if (!isDrawer()) button.setAttribute('aria-expanded', 'true'); });
      item.addEventListener('mouseleave', () => {
        if (isDrawer()) return;
        item.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      });
      item.addEventListener('focusout', (event) => {
        if (!isDrawer() && !item.contains(event.relatedTarget)) { item.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); }
      });
    });

    document.addEventListener('click', (event) => { if (!isDrawer() && !header.contains(event.target)) closeSubs(); });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openItem = header.querySelector('.has-sub.open');
      if (document.body.classList.contains('nav-open')) { setOpen(false); if (toggle) toggle.focus(); }
      else if (openItem) { closeSubs(); openItem.querySelector('.nav-parent').focus(); }
    });
    nav.addEventListener('click', (event) => { if (event.target.closest('a') && isDrawer()) setOpen(false); });
    const onChange = () => { if (!isDrawer()) setOpen(false); closeSubs(); };
    if (drawerQuery.addEventListener) drawerQuery.addEventListener('change', onChange);
  }

  // ---------- Today's date line (Hebrew date, civil date, this week's parsha) ----------
  const YI_DAYS = ['זונטאג', 'מאנטאג', 'דינסטאג', 'מיטוואך', 'דאנערשטאג', 'פרייטאג', 'שבת קודש'];
  const YI_MONTHS = ['יאנואר', 'פעברואר', 'מערץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אויגוסט', 'סעפטעמבער', 'אקטאבער', 'נאוועמבער', 'דעצעמבער'];

  function nyDateParts(date) {
    const parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
      .formatToParts(date || new Date()).forEach((p) => { parts[p.type] = p.value; });
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day), wd: days[parts.weekday] };
  }

  function civilDate(lang) {
    const t = nyDateParts();
    if (lang === 'yi') return YI_DAYS[t.wd] + ', ' + t.d + ' ' + YI_MONTHS[t.m - 1] + ' ' + t.y;
    return new Date(Date.UTC(t.y, t.m - 1, t.d, 12)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function hebrewDateFallback() {
    try {
      return new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' }).format(new Date());
    } catch (_) { return ''; }
  }

  function parshaLabel(today, lang) {
    if (!today || !today.parshaEn) return '';
    return lang === 'yi' ? (today.parshaHe || '') : today.parshaEn.replace(/^Parashat\s+/, 'Parshas ');
  }

  async function loadToday() {
    const t = nyDateParts();
    const key = 'kasho-today-' + t.y + '-' + t.m + '-' + t.d;
    try { const cached = JSON.parse(localStorage.getItem(key) || 'null'); if (cached) return cached; } catch (_) {}
    const today = {};
    try {
      const conv = await fetch('https://www.hebcal.com/converter?cfg=json&g2h=1&gy=' + t.y + '&gm=' + t.m + '&gd=' + t.d).then((r) => r.ok ? r.json() : null);
      if (conv && conv.heDateParts) today.hebrew = conv.heDateParts.d + ' ' + conv.heDateParts.m + ' ' + conv.heDateParts.y;
      if (conv) today.hebrewEn = conv.hd + ' ' + conv.hm + ' ' + conv.hy;
    } catch (_) {}
    try {
      const week = await fetch('https://www.hebcal.com/shabbat?cfg=json&zip=11211&M=on').then((r) => r.ok ? r.json() : null);
      const parsha = week && (week.items || []).find((item) => item.category === 'parashat');
      if (parsha) { today.parshaEn = parsha.title; today.parshaHe = parsha.hebrew; }
    } catch (_) {}
    if (today.hebrew) { try { localStorage.setItem(key, JSON.stringify(today)); } catch (_) {} }
    return today;
  }

  let todayInfo = null;
  function renderToday() {
    const lang = document.documentElement.lang === 'yi' ? 'yi' : 'en';
    const heb = (todayInfo && todayInfo.hebrew) || hebrewDateFallback();
    document.querySelectorAll('[data-hebrew-date]').forEach((el) => { el.textContent = heb; el.setAttribute('lang', 'he'); });
    document.querySelectorAll('[data-greg-date]').forEach((el) => { el.textContent = civilDate(lang); });
    document.querySelectorAll('[data-parsha]').forEach((el) => { el.textContent = parshaLabel(todayInfo, lang); });
  }

  async function initToday() {
    if (!document.querySelector('[data-hebrew-date], [data-greg-date], [data-parsha]')) return;
    renderToday();
    todayInfo = await loadToday();
    renderToday();
    document.addEventListener('site-language-change', renderToday);
  }

  window.KashoSite = { nyDateParts, civilDate, YI_DAYS, YI_MONTHS };

  async function applySiteAccess() {
    const projectUrl = 'https://dzlxyglrefyzebjrlgtl.supabase.co';
    const publicKey = 'sb_publishable_Lz7HJgOFTKNAkjlQIhplFQ_4bIAZ3La';
    let token = null;
    let userId = null;
    let isAdmin = false;

    try {
      const raw = localStorage.getItem('sb-dzlxyglrefyzebjrlgtl-auth-token');
      const stored = raw ? JSON.parse(raw) : null;
      token = stored && stored.access_token ? stored.access_token : null;
      if (token) {
        let encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        encoded += '='.repeat((4 - encoded.length % 4) % 4);
        const payload = JSON.parse(atob(encoded));
        userId = payload.sub || null;
      }
    } catch (_) {}

    const headers = { apikey: publicKey, Authorization: 'Bearer ' + (token || publicKey) };
    try {
      if (userId) {
        const profileResponse = await fetch(projectUrl + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=role', { headers });
        const profiles = profileResponse.ok ? await profileResponse.json() : [];
        isAdmin = !!(profiles[0] && (profiles[0].role === 'owner' || profiles[0].role === 'admin'));
      }

      const adminMenuLink = document.querySelector('[data-admin-menu]');
      if (adminMenuLink) adminMenuLink.hidden = !isAdmin;

      const settingsResponse = await fetch(projectUrl + '/rest/v1/site_settings?select=key,value&key=in.(maintenance,testing_mode)', { headers });
      if (!settingsResponse.ok) throw new Error('Site settings unavailable');
      const settings = await settingsResponse.json();
      const maintenance = settings.find((item) => item.key === 'maintenance');
      const testing = settings.find((item) => item.key === 'testing_mode');

      if (testing && testing.value && testing.value.enabled && !isAdmin) {
        document.querySelectorAll('[data-testing-feature]').forEach((element) => { element.hidden = true; });
        if (document.body.hasAttribute('data-testing-page')) {
          const main = document.querySelector('main');
          if (main) { main.innerHTML = '<section class="card"><h2>Coming Soon</h2><p>This feature is being tested by the admins.</p></section>'; main.hidden = false; }
        }
      } else if (document.body.hasAttribute('data-testing-page')) {
        const main = document.querySelector('main');
        if (main) main.hidden = false;
      }

      if (maintenance && maintenance.value && maintenance.value.enabled && !isAdmin && !/admin\.html$/.test(location.pathname)) {
        const main = document.querySelector('main');
        if (main) { main.innerHTML = '<section class="card"><h2>Website temporarily on hold</h2><p></p></section>'; main.hidden = false; }
        const message = main && main.querySelector('p');
        if (message) message.textContent = maintenance.value.message || 'We will be back soon.';
      }
    } catch (_) {
      if (document.body.hasAttribute('data-testing-page')) {
        const main = document.querySelector('main');
        if (main) { main.innerHTML = '<section class="card"><h2>Coming Soon</h2><p>This feature is being tested.</p></section>'; main.hidden = false; }
      }
    }
  }
})();
