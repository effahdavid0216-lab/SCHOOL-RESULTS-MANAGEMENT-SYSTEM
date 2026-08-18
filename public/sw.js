// EduMaster School Management Pro - Service Worker
// Offline Caching & Resilience for Primary Academic Dashboard Views

const CACHE_NAME = 'edumaster-academic-cache-v2';
const DYNAMIC_CACHE = 'edumaster-dynamic-academic-v2';

const STATIC_ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css'
];

// Install Event - Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS_TO_PRECACHE).catch((err) => {
        console.warn('[ServiceWorker] Some pre-cache assets could not be cached immediately:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with resilient cache fallback for academic routes & dashboards
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests or chrome-extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Static assets (Scripts, Styles, Images, Fonts) -> Stale-While-Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 2: Navigation & Primary Dashboard Views -> Network first with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache during temporary network outages
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, fallback to index.html to maintain SPA dashboard accessibility
        if (request.mode === 'navigate') {
          const fallbackShell = await caches.match('/index.html') || await caches.match('/');
          if (fallbackShell) {
            return fallbackShell;
          }
        }

        return new Response(
          JSON.stringify({
            offline: true,
            message: 'Academic record request served in offline resilience mode. Data will synchronize upon network reconnection.'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
  );
});

// Background Sync / Message Event
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PRECACHE_ACADEMIC_DATA') {
    // Academic record payload cached for offline viewing
    const { key, data } = event.data;
    if (key && data) {
      caches.open(DYNAMIC_CACHE).then((cache) => {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const response = new Response(blob, { status: 200, statusText: 'OK' });
        cache.put(new Request(`/offline-cache/${key}`), response);
      });
    }
  }
});
