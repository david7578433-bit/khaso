// Install-as-app support for the Kasho site: registers the service worker and shows a small,
// dismissable "Add to home screen" banner (Android: the browser's install prompt; iPhone: a short how-to sheet).
// Nothing here is tracked or sent anywhere; the dismissal is remembered only in this browser.
(function () {
  const DISMISS_KEY = 'kasho-install-dismissed';
  const DISMISS_DAYS = 120;
  const SKIP_BANNER_ON = ['invite.html', 'admin.html', 'login.html', 'ages.html', 'thread.html'];
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    });
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const isPhoneSized = () => window.matchMedia && window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const yi = () => document.documentElement.lang === 'yi';
  let deferredPrompt = null;
  let banner = null;
  let sheet = null;

  function dismissedRecently() {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return at && (Date.now() - at) < DISMISS_DAYS * 864e5;
    } catch (_) { return false; }
  }
  function rememberDismissal() { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (_) {} }

  function L(en, yiText) {
    const lang = yi() ? 'yi' : 'en';
    return '<span data-lang="en"' + (lang === 'en' ? '' : ' hidden') + '>' + en + '</span>' +
           '<span data-lang="yi"' + (lang === 'yi' ? '' : ' hidden') + '>' + yiText + '</span>';
  }

  const SHARE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  const PLUS_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const DOTS_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';

  function canInstall() { return !isStandalone() && (!!deferredPrompt || isIOS); }

  function updateInstallLinks() {
    const show = canInstall();
    document.querySelectorAll('[data-install-app]').forEach((el) => { el.hidden = !show; });
    document.querySelectorAll('[data-install-fallback]').forEach((el) => { el.hidden = show || isStandalone(); });
    document.querySelectorAll('[data-installed-note]').forEach((el) => { el.hidden = !isStandalone(); });
  }

  async function startInstall() {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      hideBanner();
      try {
        prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice && choice.outcome === 'dismissed') rememberDismissal();
      } catch (_) {}
      updateInstallLinks();
      return;
    }
    if (isIOS) openSheet();
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    const b = banner; banner = null;
    setTimeout(() => b.remove(), 300);
  }

  function showBanner() {
    if (banner || !canInstall() || dismissedRecently() || !isPhoneSized() || SKIP_BANNER_ON.includes(page)) return;
    banner = document.createElement('aside');
    banner.className = 'install-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Install the Kasho app');
    banner.innerHTML =
      '<img class="install-banner-icon" src="icons/icon-192.png" width="48" height="48" alt="">' +
      '<div class="install-banner-text"><strong>' + L('Add Kasho to your home screen', 'לייגט צו קאשוי אויף אייער טעלעפאן') + '</strong>' +
      '<span>' + L('Zmanim, Shabbos times and more — one tap away.', 'זמנים, זמני שבת און נאך — מיט איין קליק.') + '</span></div>' +
      '<div class="install-banner-actions"><button type="button" class="button button-gold install-go">' +
      (isIOS && !deferredPrompt ? L('Show me how', 'ווייזט מיר ווי') : L('Install', 'אינסטאלירן')) + '</button>' +
      '<button type="button" class="install-later">' + L('Not now', 'נישט יעצט') + '</button></div>' +
      '<button type="button" class="install-close" aria-label="Close">×</button>';
    document.body.appendChild(banner);
    banner.querySelector('.install-go').addEventListener('click', startInstall);
    const dismiss = () => { rememberDismissal(); hideBanner(); };
    banner.querySelector('.install-later').addEventListener('click', dismiss);
    banner.querySelector('.install-close').addEventListener('click', dismiss);
    requestAnimationFrame(() => requestAnimationFrame(() => banner && banner.classList.add('is-visible')));
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('is-open');
    const s = sheet; sheet = null;
    document.removeEventListener('keydown', onSheetKey);
    setTimeout(() => s.remove(), 250);
  }
  function onSheetKey(event) { if (event.key === 'Escape') closeSheet(); }

  function openSheet() {
    if (sheet) return;
    hideBanner();
    sheet = document.createElement('div');
    sheet.className = 'ios-sheet';
    sheet.innerHTML =
      '<div class="ios-sheet-backdrop" data-close></div>' +
      '<div class="ios-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="iosSheetTitle">' +
      '<button type="button" class="ios-sheet-close" data-close aria-label="Close">×</button>' +
      '<img src="icons/icon-192.png" width="64" height="64" alt="" class="ios-sheet-icon">' +
      '<h2 id="iosSheetTitle">' + L('Add Kasho to your iPhone', 'לייגט צו קאשוי אויף אייער אייפאון') + '</h2>' +
      '<ol class="ios-steps">' +
      '<li><span class="ios-step-icon">' + SHARE_ICON + '</span><span>' +
        L('Tap the <strong>Share</strong> button in Safari’s toolbar <small>(on newer iPhones, tap ' + DOTS_ICON + ' first)</small>',
          'דריקט אויף <strong>Share</strong> אין סאפארי <small>(אויף נייערע אייפאונס, דריקט קודם ' + DOTS_ICON + ')</small>') + '</span></li>' +
      '<li><span class="ios-step-icon">' + PLUS_ICON + '</span><span>' +
        L('Scroll down and tap <strong>Add to Home Screen</strong>', 'סקראלט אראפ און דריקט <strong>Add to Home Screen</strong>') + '</span></li>' +
      '<li><span class="ios-step-icon ios-step-text">' + L('Add', 'Add') + '</span><span>' +
        L('Tap <strong>Add</strong>. Kasho now opens like an app.', 'דריקט <strong>Add</strong>. קאשוי עפנט זיך יעצט ווי אן אפ.') + '</span></li>' +
      '</ol>' +
      '<button type="button" class="button ios-sheet-done" data-close>' + L('Got it', 'פארשטאנען') + '</button>' +
      '</div>';
    document.body.appendChild(sheet);
    sheet.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => { rememberDismissal(); closeSheet(); }));
    document.addEventListener('keydown', onSheetKey);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (sheet) { sheet.classList.add('is-open'); sheet.querySelector('.ios-sheet-done').focus(); } }));
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallLinks();
    setTimeout(showBanner, 1500);
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    rememberDismissal();
    hideBanner();
    updateInstallLinks();
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-install-app]');
    if (!trigger) return;
    event.preventDefault();
    startInstall();
  });

  function init() {
    updateInstallLinks();
    if (isIOS && !isStandalone()) setTimeout(showBanner, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.KashoInstall = { open: startInstall, canInstall, showBanner, openSheet };
})();
