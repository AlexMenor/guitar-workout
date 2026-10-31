/* Generated during the Astro production build. */
const CACHE = 'guitar-workout-__VERSION__';
const ASSETS = __ASSETS__;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
    // Activate promptly, but let the page decide when to reload its interface.
    await self.skipWaiting();
  })());
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
    const navigation = request.mode === 'navigate';
    let path = url.pathname;
    if (navigation) {
      path = path.replace(/index\.html$/, '');
      if (!path.endsWith('/') && !path.split('/').pop().includes('.')) path += '/';
    }
    const cache = await caches.open(CACHE);
    const cached = await cache.match(path);
    // Only fingerprinted assets are immutable. Pages and named assets revalidate.
    if (!navigation && path.startsWith('/_astro/') && cached) return cached;
    try {
      const response = await fetch(new Request(request, { cache: 'no-cache' }));
      if (response.ok && (navigation || ASSETS.includes(path) || path.startsWith('/_astro/'))) {
        // Also retain newly deployed JS/CSS referenced by fresh HTML.
        try { await cache.put(path, response.clone()); } catch { /* Storage may be full. */ }
      }
      if (response.status >= 500 && cached) return cached;
      return response;
    } catch {
      if (cached) return cached;
      return new Response('This page is not available offline. Open the exercise library when you are connected.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
