const CACHE_NAME = 'historias-biblicas-static-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // NEVER intercept document navigations or non-GET requests.
  // Passing navigations directly to the browser guarantees Cloud Run / auth
  // redirects and standalone cold-start launches on Android never block or hang.
  if (
    request.method !== 'GET' ||
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only cache same-origin static media/bundles; never touch API, dev modules, or SW/manifest files
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/dev-sw.js' ||
    url.pathname === '/registerSW.js' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(?:png|svg|ico|woff2?|jpg|jpeg|webp)$/i.test(url.pathname);

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        return cached;
      }

      const fresh = await networkFetch;
      return fresh || Response.error();
    })
  );
});
