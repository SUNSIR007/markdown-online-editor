const CACHE_VERSION = '20240206';
const APP_SHELL_CACHE = `blogwriter-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `blogwriter-runtime-${CACHE_VERSION}`;
const CDN_CACHE = `blogwriter-cdn-${CACHE_VERSION}`;

const NAVIGATION_FALLBACK = './index.html';

const APP_SHELL = [
    './',
    NAVIGATION_FALLBACK,
    './css/base.css',
    './css/components.css',
    './css/editor.css',
    './css/mobile.css',
    './css/vendor/element-ui@2.15.13.css',
    './css/vendor/vditor@3.9.4.css',
    './img/icons/write.png',
    './img/icons/icon-192.png',
    './img/icons/icon-512.png',
    './img/icons/icon-512-maskable.png',
    './img/icons/apple-touch-icon.png',
    './js/app.js',
    './js/config.js',
    './js/editor-manager.js',
    './js/github-config-component.js',
    './js/image-handler.js',
    './js/mobile-utils.js',
    './js/pwa-init.js',
    './github-service.js',
    './image-service.js',
    './site.webmanifest'
];

const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            const keepList = [APP_SHELL_CACHE, RUNTIME_CACHE, CDN_CACHE];
            await Promise.all(
                cacheNames.filter((name) => !keepList.includes(name)).map((name) => caches.delete(name))
            );

            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            await self.clients.claim();
        })()
    );
});

const cacheNavigationResponse = async (cache, requestKey, response) => {
    if (!response || !response.ok) {
        return;
    }

    const normalizedRequest = new Request(requestKey, {
        headers: { 'Accept': 'text/html' }
    });

    await cache.put(normalizedRequest, response.clone());
    await cache.put(NAVIGATION_FALLBACK, response.clone());
};

const handleNavigationRequest = async (event) => {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cachedResponse = await cache.match(event.request, { ignoreSearch: true }) ||
                           await cache.match(NAVIGATION_FALLBACK);

    const preloadPromise = event.preloadResponse
        ? event.preloadResponse.catch(() => null)
        : Promise.resolve(null);

    const networkPromise = fetch(event.request).catch(() => null);

    if (cachedResponse) {
        event.waitUntil((async () => {
            const preloadResponse = await preloadPromise;
            if (preloadResponse) {
                await cacheNavigationResponse(cache, event.request.url, preloadResponse);
                return;
            }

            const networkResponse = await networkPromise;
            if (networkResponse) {
                await cacheNavigationResponse(cache, event.request.url, networkResponse);
            }
        })());

        return cachedResponse;
    }

    const preloadResponse = await preloadPromise;
    if (preloadResponse) {
        await cacheNavigationResponse(cache, event.request.url, preloadResponse);
        return preloadResponse;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) {
        await cacheNavigationResponse(cache, event.request.url, networkResponse);
        return networkResponse;
    }

    const fallback = await cache.match(NAVIGATION_FALLBACK);
    if (fallback) {
        return fallback;
    }

    return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
    });
};

const cacheFirst = async (request, cacheName = APP_SHELL_CACHE) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
};

const staleWhileRevalidate = async (event, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);

    const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.ok) {
            cache.put(event.request, response.clone());
        }
        return response;
    }).catch(() => null);

    if (cachedResponse) {
        event.waitUntil(fetchPromise);
        return cachedResponse;
    }

    const networkResponse = await fetchPromise;
    if (networkResponse) {
        return networkResponse;
    }

    return new Response('', { status: 503, statusText: 'Service Unavailable' });
};

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event));
        return;
    }

    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (CDN_HOSTS.includes(url.hostname)) {
        event.respondWith(staleWhileRevalidate(event, CDN_CACHE));
        return;
    }
});

const warmupCDNCache = async (urls = []) => {
    if (!urls.length) {
        return;
    }

    const cache = await caches.open(CDN_CACHE);
    await Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (response && response.ok) {
                    await cache.put(url, response.clone());
                }
            } catch (error) {
                console.warn('[SW] Warmup failed for', url, error);
            }
        })
    );
};

self.addEventListener('message', (event) => {
    const { data } = event;
    if (!data || !data.type) {
        return;
    }

    if (data.type === 'WARMUP_CDN_CACHE') {
        event.waitUntil(warmupCDNCache(data.payload || []));
    } else if (data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
