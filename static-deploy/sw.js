const CACHE_NAME = 'blog-writer-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './site.webmanifest',
    './css/base.css',
    './css/components.css',
    './css/editor.css',
    './css/mobile.css',
    './js/app.js',
    './js/config.js',
    './js/editor-manager.js',
    './js/github-service.js',
    './js/image-handler.js',
    './js/image-service.js',
    './js/mobile-utils.js',
    './js/runtime-config.js',
    './img/icons/write.png',
    './img/icons/upload-icon.png'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Cache First, Network Fallback strategy
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like CDN files) for now, or handle them with Stale-While-Revalidate
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Don't cache if not a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clone the response to cache it
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                });
            })
    );
});
