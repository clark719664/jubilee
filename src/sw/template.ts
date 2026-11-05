/**
 * Offline support: the service worker is generated at build time (see vite.config.ts) with the exact
 * list of files the build emitted, so after the first visit Jubilee works with Wi-Fi off — every view,
 * every holiday's content chunk, every scene and sticker. It never fetches anything cross-origin (the
 * CSP forbids it anyway), never caches anything it wasn't built with except same-origin navigations,
 * and drops old caches when a new build activates.
 *
 * Strategy:
 * - install: precache every emitted file plus the app shell (./ and ./index.html);
 * - activate: delete caches from older builds, take control of open pages;
 * - fetch (same-origin GET only): navigations try the network first (so a new deploy shows up) and fall
 *   back to the cached shell; everything else is cache-first, falling back to the network.
 */
export function precacheList(files: readonly string[]): string[] {
  const keep = files
    .filter((f) => !f.endsWith('.map') && f !== 'sw.js' && !f.startsWith('.'))
    .map((f) => `./${f.replace(/^\.?\//, '')}`);
  return [...new Set(['./', './index.html', ...keep])].sort();
}

export function buildServiceWorker(files: readonly string[], version: string): string {
  const cache = `jubilee-${version}`;
  const list = JSON.stringify(precacheList(files));
  return `/* Jubilee offline cache ${version}. Generated at build time; do not edit. */
const CACHE = ${JSON.stringify(cache)};
const PRECACHE = ${list};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jubilee-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
`;
}

/** Register the generated worker in production builds only (dev and tests never install it). */
export function registerOffline(prod: boolean): void {
  if (!prod || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Offline support is a bonus: private browsing or file:// simply runs online-only.
    });
  });
}
