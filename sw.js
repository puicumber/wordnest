// Minimal service worker: caches the app shell so it opens fast and
// works offline for reviewing words you've already loaded once.
// Data itself (Supabase) still needs a connection to sync.
const CACHE_NAME = 'dogear-v2';
const SHELL_FILES = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('supabase.co')) return;
  // Network-first: always try for the newest version, fall back to cache only when offline.
  event.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
