const CACHE_NAME = 'lini-hris-v2';
const STATIC_ASSETS = [
  '/login',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API routes: Network first (always fresh data), fallback to cache
// - Static assets (images, fonts, pages): Cache first, fallback to network
  // Optimized Strategy: Network First for everything to ensure users always see latest UI
  // Fallback to cache only if network is down (Offline Mode)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
