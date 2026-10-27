// Kasho Community service worker — makes the site installable and usable offline.
// HTML pages: network first (so every update shows right away), cached copy when offline.
// Our own CSS/JS/images: served from cache and refreshed in the background.
// Hebcal (zmanim/dates): network first; a copy is kept for a few hours only, for offline use.
// The member database (Supabase) is never touched by this worker.
const ASSET_VERSION = '20261027-6';
const SHELL = 'kasho-shell-' + ASSET_VERSION;
const RUNTIME = 'kasho-runtime-v1';
const API = 'kasho-api-v1';
const API_MAX_AGE_MS = 6 * 60 * 60 * 1000;   // 6 hours
const RUNTIME_MAX_ENTRIES = 120;

const SHELL_URLS = [
  './', 'index.html', 'zmanim.html', 'shabbos.html', 'yahrzeit.html', 'invitations.html', 'offline.html',
  'style.css?v=' + ASSET_VERSION, 'site.js?v=' + ASSET_VERSION, 'pwa.js?v=' + ASSET_VERSION,
  'widgets.js?v=' + ASSET_VERSION, 'share-zmanim.js?v=' + ASSET_VERSION,
  'shabbos.js?v=' + ASSET_VERSION, 'yahrzeit.js?v=' + ASSET_VERSION, 'vendor/hebcal-core.min.js',
  'logo.png', 'logo-mark.png', 'logo-light.png', 'favicon.png', 'apple-touch-icon.png',
  'icons/icon-192.png', 'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // One missing file must not break the install, so add them one by one.
    await Promise.all(SHELL_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, RUNTIME, API]);
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('kasho-') && !keep.has(name)).map((name) => caches.delete(name)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
    await self.clients.claim();
  })());
});

function isHtml(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

async function networkFirstPage(event) {
  const request = event.request;
  try {
    const preloaded = event.preloadResponse ? await event.preloadResponse : null;
    const response = preloaded || await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put(request, copy)).then(() => trim(RUNTIME, RUNTIME_MAX_ENTRIES));
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    return (await caches.match('offline.html')) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirstData(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw _;
  }
}

async function staleWhileRevalidate(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).then(() => trim(cacheName, RUNTIME_MAX_ENTRIES));
    return response;
  }).catch(() => null);
  if (cached) { event.waitUntil(refresh); return cached; }
  const fresh = await refresh;
  return fresh || new Response('', { status: 504 });
}

// Hebcal: always ask the network; keep a short-lived copy (6 h) for when there is no connection.
async function hebcal(request) {
  const cache = await caches.open(API);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const body = await response.clone().blob();
      const headers = new Headers(response.headers);
      headers.set('x-kasho-cached-at', String(Date.now()));
      cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    const at = cached ? Number(cached.headers.get('x-kasho-cached-at') || 0) : 0;
    if (cached && Date.now() - at < API_MAX_AGE_MS) return cached;
    if (cached) cache.delete(request);
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (/(^|\.)supabase\.(co|in)$/.test(url.hostname)) return;          // member database: never cached
  if (url.hostname === 'www.hebcal.com' || url.hostname === 'hebcal.com') { event.respondWith(hebcal(request)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { event.respondWith(staleWhileRevalidate(event, RUNTIME)); return; }
  if (url.origin !== self.location.origin) return;                       // other sites: browser default

  if (isHtml(request)) { event.respondWith(networkFirstPage(event)); return; }
  if (url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')) { event.respondWith(networkFirstData(request)); return; }
  if (/\.(?:css|js|png|jpe?g|webp|svg|gif|ico|woff2?)$/.test(url.pathname)) { event.respondWith(staleWhileRevalidate(event, url.search ? SHELL : RUNTIME)); return; }
});
