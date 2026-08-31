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
    applySiteAccess();
  });

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
