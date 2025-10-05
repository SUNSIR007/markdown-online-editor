const CACHE_NAME = 'markdown-editor-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/components.css',
  './css/editor.css',
  './css/mobile.css',
  './js/app.js',
  './js/config.js',
  './js/github-config-component.js',
  './js/mobile-utils.js',
  './js/editor-manager.js',
  './js/image-handler.js',
  './github-service.js',
  './image-service.js',
  './site.webmanifest',
  './img/icons/apple-touch-icon.png',
  './img/icons/icon-192.png',
  './img/icons/icon-512.png',
  './img/icons/icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
