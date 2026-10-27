/* Standalone language + share helpers for the public invitations maker.
   Replaces the parent site's site.js: language toggle ([data-lang] spans, <html lang/dir>),
   window.toggleLang(), the 'site-language-change' event, and a neutral share/copy helper. */
(function () {
  'use strict';
  var KEY = 'siteLanguage';
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'yi' || v === 'en' ? v : null; } catch (_) { return null; } }
  function browserDefault() {
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i] || '').toLowerCase();
      if (/^(yi|ji|he|iw)\b/.test(l)) return 'yi';
    }
    return 'en';
  }
  function current() { return document.documentElement.lang === 'yi' ? 'yi' : 'en'; }

  function apply(language, opts) {
    var yi = language === 'yi';
    var root = document.documentElement;
    root.lang = yi ? 'yi' : 'en';
    root.dir = yi ? 'rtl' : 'ltr';
    var els = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < els.length; i++) els[i].hidden = els[i].getAttribute('data-lang') !== language;
    var tx = document.querySelectorAll('[data-i18n-en][data-i18n-yi]');
    for (var j = 0; j < tx.length; j++) tx[j].textContent = yi ? tx[j].getAttribute('data-i18n-yi') : tx[j].getAttribute('data-i18n-en');
    var btns = document.querySelectorAll('.lang-button');
    for (var k = 0; k < btns.length; k++) {
      btns[k].textContent = yi ? 'English' : 'אידיש';
      btns[k].setAttribute('aria-label', yi ? 'Switch to English' : 'טוישן אויף אידיש');
      btns[k].setAttribute('lang', yi ? 'en' : 'yi');
    }
    if (opts && opts.store) { try { localStorage.setItem(KEY, language); } catch (_) {} }
    if (!opts || opts.event !== false) {
      document.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: language } }));
    }
  }

  window.toggleLang = function () { apply(current() === 'yi' ? 'en' : 'yi', { store: true }); };
  window.SIMCHA_SITE = 'public';   // which site a community design comes from

  // This script is loaded with defer, so the whole document is parsed: set the language now (no event,
  // nothing stored, so a first-time visitor still counts as "no saved choice"), then once more on
  // DOMContentLoaded with the event, the way the maker expects.
  var initial = saved() || browserDefault();
  apply(initial, { event: false });
  function ready() {
    apply(saved() || initial);
    var years = document.querySelectorAll('[data-year]');
    for (var i = 0; i < years.length; i++) years[i].textContent = String(new Date().getFullYear());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();

// Neutral sharing (no social-media apps): the phone's own share sheet when it has one,
// otherwise the text/link is copied and a short note confirms it.
(function () {
  if (window.KashoShare) return;
  var yi = function () { return document.documentElement.lang === 'yi'; };
  async function copy(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (_) {}
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
  var toastEl = null, toastTimer = 0;
  function toast(en, yiText) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'k-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = yi() ? (yiText || en) : en;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }
  async function share(opts) {
    var o = opts || {};
    if (navigator.share) {
      var data = {}; if (o.title) data.title = o.title; if (o.text) data.text = o.text; if (o.url) data.url = o.url;
      try { await navigator.share(data); return 'shared'; }
      catch (err) { if (err && err.name === 'AbortError') return 'aborted'; }
    }
    var ok = await copy([o.text, o.url].filter(Boolean).join('\n'));
    if (ok) toast('Copied — paste it in any message.', 'קאפירט — לייגט עס אריין אין סיי וועלכע מעסעדזש.');
    else toast('Could not copy — please copy the page address.', 'עס האט נישט געקענט קאפירן — קאפירט דעם אדרעס.');
    return ok ? 'copied' : 'failed';
  }
  async function copyWithNote(text, en, yiText) {
    var ok = await copy(text);
    if (ok) toast(en || 'Copied.', yiText || 'קאפירט.');
    else toast('Could not copy — please copy the page address.', 'עס האט נישט געקענט קאפירן — קאפירט דעם אדרעס.');
    return ok;
  }
  window.KashoShare = { share: share, copy: copy, copyWithNote: copyWithNote, toast: toast };
})();
