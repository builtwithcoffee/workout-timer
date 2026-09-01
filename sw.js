const APP_VERSION = '1.0.9';
const CACHE_PREFIX = 'workout-timer-v';
const CACHE = `${CACHE_PREFIX}${APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './lower-body-focus-day.workout.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];
const ASSET_PATHS = new Set(ASSETS.map(asset => new URL(asset, self.location.href).pathname));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match('./index.html') || await cache.match('./');
      if (cached) return cached;
      return fetch(request);
    }));
    return;
  }

  if (!ASSET_PATHS.has(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  }));
});
