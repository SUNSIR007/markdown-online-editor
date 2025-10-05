const CACHE_NAME = 'markdown-editor-cache-v1';
const INDEX_HTML_URL = new URL('./index.html', self.location.href).href;

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
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
  './img/icons/apple-touch-icon.png',
  './img/icons/icon-192.png',
  './img/icons/icon-512.png',
  './img/icons/icon-512-maskable.png'
];

const REMOTE_ASSETS = [
  'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
  'https://unpkg.com/element-ui@2.15.13/lib/index.js',
  'https://unpkg.com/element-ui@2.15.13/lib/theme-chalk/index.css',
  'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.min.js',
  'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL_ASSETS);
    await Promise.all(REMOTE_ASSETS.map(async (url) => {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.warn('[sw] Failed to pre-cache remote asset:', url, error);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) {
        return caches.delete(key);
      }
      return Promise.resolve();
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isRemoteAsset = REMOTE_ASSETS.includes(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isSameOrigin || isRemoteAsset) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    updateCache(cache, request);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (request.destination === 'document') {
      const fallback = await cache.match(INDEX_HTML_URL);
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const fallback = await cache.match(INDEX_HTML_URL);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

async function updateCache(cache, request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    // Skip cache refresh when the network request fails
  }
}
