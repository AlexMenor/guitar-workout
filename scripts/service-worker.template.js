/* Generated during the Astro production build. */
const CACHE = 'guitar-workout-__VERSION__';
const ASSETS = __ASSETS__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // Updates wait for existing app windows to close; never interrupt a session.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('guitar-workout-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    // Canonicalize HTML routes, including bookmarks with query parameters.
    let path = url.pathname;
    if (request.mode === 'navigate') {
      path = path.replace(/index\.html$/, '');
      if (!path.endsWith('/') && !path.split('/').pop().includes('.')) path += '/';
    }
    const cache = await caches.open(CACHE);
    const cached = await cache.match(path);
    if (cached) return cached;
    try { return await fetch(request); }
    catch {
      return new Response('This page is not available offline. Open the exercise library when you are connected.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
