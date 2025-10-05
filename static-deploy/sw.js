const CACHE_NAME = 'markdown-editor-cache-v5';
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
    event.respondWith(cacheFirstWithAntiFlash(request));
    return;
  }

  if (isSameOrigin || isRemoteAsset) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirstWithAntiFlash(request) {
  const cache = await caches.open(CACHE_NAME);
  let response = await cache.match(request);

  if (!response) {
    try {
      response = await fetch(request);
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      const fallback = await cache.match(INDEX_HTML_URL);
      if (fallback) {
        response = fallback;
      } else {
        throw error;
      }
    }
  } else {
    updateCache(cache, request);
  }

  // 为 HTML 响应注入防闪烁样式
  if (response && request.destination === 'document') {
    try {
      const html = await response.text();

      // 检查是否已经有防闪烁样式（避免重复注入）
      if (!html.includes('anti-flash-injected')) {
        // 在 <head> 标签后立即注入样式
        const antiFlashStyle = `<style id="anti-flash-injected">html,body{background:#000!important;margin:0;padding:0;opacity:1!important}html::before{content:"";position:fixed;top:0;left:0;width:100%;height:100%;background:#000!important;z-index:999999;pointer-events:none}</style>`;
        const modifiedHtml = html.replace('<head>', '<head>' + antiFlashStyle);

        return new Response(modifiedHtml, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        // 已经有防闪烁样式，返回原始 HTML
        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    } catch (error) {
      console.warn('[sw] Failed to inject anti-flash style:', error);
      return response;
    }
  }

  return response;
}

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
