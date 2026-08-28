(function () {
  function applyLanguage(language) {
    const isYiddish = language === 'yi';
    document.documentElement.lang = isYiddish ? 'yi' : 'en';
    document.documentElement.dir = isYiddish ? 'rtl' : 'ltr';

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
  });
})();
