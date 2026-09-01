(function () {
  function applyLanguage(language) {
    const isYiddish = language === 'yi';
    document.documentElement.lang = isYiddish ? 'yi' : 'en';
    

    document.querySelectorAll('[data-lang]').forEach((element) => {
      element.hidden = element.dataset.lang !== language;
    });

    document.querySelectorAll('.lang-button').forEach((button) => {
      button.textContent = isYiddish ? 'English' : 'אידיש';
      button.setAttribute('aria-label', isYiddish ? 'Switch to English' : 'טוישן אויף אידיש');
    });

    try { localStorage.setItem('siteLanguage', language); } catch (_) {}
  }

  window.toggleLang = function () {
    applyLanguage(document.documentElement.lang === 'yi' ? 'en' : 'yi');
  };

  document.addEventListener('DOMContentLoaded', () => {
    let savedLanguage = 'en';
    try { savedLanguage = localStorage.getItem('siteLanguage') === 'yi' ? 'yi' : 'en'; } catch (_) {}
    applyLanguage(savedLanguage);
    initSiteDrawer();
    applySiteAccess();
  });

  function initSiteDrawer() {
    const footer = document.querySelector('footer');
    if (!footer || footer.classList.contains('site-footer-drawer')) return;

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
      footer.site-footer-drawer a,footer.site-footer-drawer .lang-button { width:100% !important; padding:11px 12px !important; margin:0 !important; border:0 !important; border-radius:8px !important; color:white !important; background:transparent !important; text-align:left !important; text-decoration:none !important; font:600 16px/1.35 "Assistant","Segoe UI",Arial,sans-serif !important; }
      footer.site-footer-drawer a:hover,footer.site-footer-drawer a:focus-visible,footer.site-footer-drawer .lang-button:hover { background:rgba(255,255,255,.12) !important; text-decoration:none !important; }
      @media (max-width:620px) { .site-menu-button { top:10px; left:10px; width:42px; height:42px; } footer.site-footer-drawer { position:fixed !important; padding-top:70px !important; } }
    `;
    document.head.appendChild(style);
    document.body.classList.add('site-drawer-enabled');
    footer.classList.add('site-footer-drawer');

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
