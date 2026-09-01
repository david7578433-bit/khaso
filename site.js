(function () {
  function applyLanguage(language) {
    const isYiddish = language === 'yi';
    document.documentElement.lang = isYiddish ? 'yi' : 'en';
    

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
      'Recordings': 'רעקארדירונגען',
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
    initSiteDrawer();
    applyLanguage(savedLanguage);
    applySiteAccess();
  });

  function initSiteDrawer() {
    const footer = document.querySelector('footer');
    if (!footer || footer.classList.contains('site-footer-drawer')) return;

    footer.innerHTML = `
      <strong class="site-menu-title"><span data-lang="en">Website Menu</span><span data-lang="yi" hidden>וועבזייטל מעניו</span></strong>
      <a href="index.html"><span data-lang="en">Home</span><span data-lang="yi" hidden>היים</span></a>
      <details class="site-menu-group">
        <summary><span data-lang="en">Ages</span><span data-lang="yi" hidden>יארגאנג</span></summary>
        <div class="site-menu-submenu">
          <a href="ages-hub.html"><span data-lang="en">Ages Home</span><span data-lang="yi" hidden>יארגאנג היים</span></a>
          <a href="ages.html"><span data-lang="en">Chat</span><span data-lang="yi" hidden>שמועס</span></a>
          <a href="age-photos.html"><span data-lang="en">Photos</span><span data-lang="yi" hidden>בילדער</span></a>
          <a href="phone-book.html"><span data-lang="en">Phone Book</span><span data-lang="yi" hidden>טעלעפאן בוך</span></a>
        </div>
      </details>
      <a href="news.html"><span data-lang="en">News</span><span data-lang="yi" hidden>נייעס</span></a>
      <a href="simchas.html"><span data-lang="en">Simchas</span><span data-lang="yi" hidden>שמחות</span></a>
      <a href="community.html" data-testing-feature><span data-lang="en">Community</span><span data-lang="yi" hidden>קהילה</span></a>
      <a href="editorial.html"><span data-lang="en">Editorial</span><span data-lang="yi" hidden>רעדאקציע</span></a>
      <a href="about.html"><span data-lang="en">About</span><span data-lang="yi" hidden>וועגן אונדז</span></a>
      <details class="site-menu-group">
        <summary><span data-lang="en">Contact</span><span data-lang="yi" hidden>קאנטאקט</span></summary>
        <div class="site-menu-submenu">
          <a href="contact.html"><span data-lang="en">Contact Home</span><span data-lang="yi" hidden>קאנטאקט היים</span></a>
          <a href="contact-monsey.html"><span data-lang="en">Monsey</span><span data-lang="yi" hidden>מאנסי</span></a>
          <a href="contact-kiryas-joel.html"><span data-lang="en">Kiryas Joel</span><span data-lang="yi" hidden>קרית יואל</span></a>
        </div>
      </details>
      <a href="yeshiva.html"><span data-lang="en">Yeshiva</span><span data-lang="yi" hidden>ישיבה</span></a>
      <details class="site-menu-group">
        <summary><span data-lang="en">Botei Medrash</span><span data-lang="yi" hidden>בתי מדרשים</span></summary>
        <div class="site-menu-submenu">
          <a href="botei-medrash.html"><span data-lang="en">All Botei Medrash</span><span data-lang="yi" hidden>אלע בתי מדרשים</span></a>
          <a href="beis-medrash-monsey.html"><span data-lang="en">Monsey</span><span data-lang="yi" hidden>מאנסי</span></a>
          <a href="beis-medrash-kiryas-joel.html"><span data-lang="en">Kiryas Joel</span><span data-lang="yi" hidden>קרית יואל</span></a>
          <a href="beis-medrash-williamsburg.html"><span data-lang="en">Williamsburg</span><span data-lang="yi" hidden>וויליאמסבורג</span></a>
        </div>
      </details>
      <a href="pictures.html"><span data-lang="en">Public Pictures</span><span data-lang="yi" hidden>פובליק בילדער</span></a>
      <a href="zmanim.html"><span data-lang="en">Zmanim</span><span data-lang="yi" hidden>זמנים</span></a>
      <a href="business.html"><span data-lang="en">Business</span><span data-lang="yi" hidden>געשעפט</span></a>
      <a href="recordings.html"><span data-lang="en">Recordings</span><span data-lang="yi" hidden>רעקארדירונגען</span></a>
      <a href="login.html"><span data-lang="en">Account</span><span data-lang="yi" hidden>קאנטע</span></a>
      <a href="admin.html" data-admin-menu hidden><span data-lang="en">Admin Dashboard</span><span data-lang="yi" hidden>אדמין צענטער</span></a>
      <button class="lang-button" type="button" onclick="toggleLang()">אידיש</button>
    `;

    const style = document.createElement('style');
    style.textContent = `
      body.site-drawer-enabled { padding-bottom: 0 !important; }
      body.site-drawer-enabled main { padding-bottom: 44px; }
      body.site-drawer-enabled .main { padding-bottom: 34px !important; }
      .site-menu-button { position:fixed; top:14px; left:14px; z-index:1002; width:46px; height:46px; padding:0; display:grid; place-items:center; border:1px solid rgba(255,255,255,.45); border-radius:12px; background:#203447; color:white; box-shadow:0 5px 18px rgba(20,35,50,.24); font-size:24px; line-height:1; }
      .site-menu-button:hover,.site-menu-button:focus-visible { background:#0f7f6d; }
      .site-menu-overlay { position:fixed; inset:0; z-index:999; background:rgba(18,32,45,.42); opacity:0; pointer-events:none; transition:opacity .2s ease; }
      .site-menu-overlay.open { opacity:1; pointer-events:auto; }
      footer.site-footer-drawer { position:fixed !important; top:0 !important; bottom:0 !important; left:0 !important; right:auto !important; z-index:1001 !important; width:min(340px,88vw) !important; height:100dvh !important; padding:82px 24px 30px !important; display:flex !important; flex-direction:column !important; flex-wrap:nowrap !important; justify-content:flex-start !important; align-items:stretch !important; gap:5px !important; overflow-y:auto !important; background:#203447 !important; box-shadow:8px 0 28px rgba(20,35,50,.28) !important; transform:translateX(-105%); transition:transform .22s ease; }
      footer.site-footer-drawer.open { transform:translateX(0); }
      .site-menu-title { display:block; padding:0 12px 12px; color:white; font:700 19px/1.3 "Assistant","Segoe UI",Arial,sans-serif; }
      footer.site-footer-drawer a,footer.site-footer-drawer .lang-button { width:100% !important; padding:11px 12px !important; margin:0 !important; border:0 !important; border-radius:8px !important; color:white !important; background:transparent !important; text-align:left !important; text-decoration:none !important; font:600 16px/1.35 "Assistant","Segoe UI",Arial,sans-serif !important; }
      footer.site-footer-drawer a:hover,footer.site-footer-drawer a:focus-visible,footer.site-footer-drawer .lang-button:hover { background:rgba(255,255,255,.12) !important; text-decoration:none !important; }
      footer.site-footer-drawer a[aria-current="page"] { background:rgba(26,176,151,.3) !important; }
      .site-menu-group { width:100%; margin:0; color:white; }
      .site-menu-group summary { position:relative; padding:11px 34px 11px 12px; border-radius:8px; color:white; cursor:pointer; list-style:none; font:700 16px/1.35 "Assistant","Segoe UI",Arial,sans-serif; }
      .site-menu-group summary::-webkit-details-marker { display:none; }
      .site-menu-group summary::after { content:'›'; position:absolute; right:13px; top:9px; font-size:22px; transition:transform .15s ease; }
      .site-menu-group[open] summary::after { transform:rotate(90deg); }
      .site-menu-group summary:hover,.site-menu-group summary:focus-visible { background:rgba(255,255,255,.12); }
      .site-menu-submenu { display:grid; gap:2px; padding:3px 0 6px 14px; border-left:2px solid rgba(255,255,255,.2); margin-left:12px; }
      footer.site-footer-drawer .site-menu-submenu a { padding:9px 10px !important; font-size:15px !important; }
      @media (max-width:620px) { .site-menu-button { top:10px; left:10px; width:42px; height:42px; } footer.site-footer-drawer { position:fixed !important; padding-top:70px !important; } }
    `;
    document.head.appendChild(style);
    document.body.classList.add('site-drawer-enabled');
    footer.classList.add('site-footer-drawer');

    const currentPage = location.pathname.split('/').pop() || 'index.html';
    footer.querySelectorAll('a[href]').forEach((link) => {
      if (link.getAttribute('href').split('?')[0] === currentPage) {
        link.setAttribute('aria-current', 'page');
        const group = link.closest('details');
        if (group) group.open = true;
      }
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-menu-button';
    button.setAttribute('aria-label', 'Open website menu');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '☰';
    const overlay = document.createElement('div');
    overlay.className = 'site-menu-overlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);
    document.body.appendChild(button);

    function setOpen(open) {
      footer.classList.toggle('open', open);
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.toggle('open', open));
      button.textContent = open ? '✕' : '☰';
      button.setAttribute('aria-label', open ? 'Close website menu' : 'Open website menu');
      button.setAttribute('aria-expanded', String(open));
      if (!open) setTimeout(() => { if (!overlay.classList.contains('open')) overlay.hidden = true; }, 220);
    }

    button.addEventListener('click', () => setOpen(!footer.classList.contains('open')));
    overlay.addEventListener('click', () => setOpen(false));
    footer.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  }

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
