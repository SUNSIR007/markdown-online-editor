// Service Worker for BlogWriter PWA
const CACHE_NAME = 'blogwriter-v1.0';
const CDN_CACHE = 'blogwriter-cdn-v1.0';

// 需要缓存的CDN资源
const CDN_RESOURCES = [
    'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
    'https://unpkg.com/element-ui@2.15.13/lib/index.js',
    'https://unpkg.com/element-ui@2.15.13/lib/theme-chalk/index.css',
    'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.min.js',
    'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.css'
];

// 需要缓存的本地资源
const LOCAL_RESOURCES = [
    './',
    './index.html',
    './css/base.css',
    './css/components.css',
    './css/editor.css',
    './css/mobile.css',
    './js/app.js',
    './js/config.js',
    './js/editor-manager.js',
    './js/github-config-component.js',
    './js/image-handler.js',
    './js/mobile-utils.js',
    './github-service.js',
    './image-service.js',
    './img/icons/write.png',
    './img/icons/apple-touch-icon.png',
    './site.webmanifest'
];

// 安装事件 - 预缓存资源
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        Promise.all([
            // 缓存本地资源
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW] Caching local resources');
                return cache.addAll(LOCAL_RESOURCES);
            }),
            // 缓存CDN资源
            caches.open(CDN_CACHE).then((cache) => {
                console.log('[SW] Caching CDN resources');
                return cache.addAll(CDN_RESOURCES);
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            return self.skipWaiting(); // 立即激活新的SW
        })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== CDN_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Activation complete');
            return self.clients.claim(); // 立即控制所有页面
        })
    );
});

// 请求拦截 - 缓存优先策略(CDN资源) + 网络优先策略(本地资源)
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 对于CDN资源，使用缓存优先策略
    if (url.includes('unpkg.com') || url.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                if (response) {
                    console.log('[SW] Serving from cache:', url);
                    return response;
                }

                console.log('[SW] Fetching from network:', url);
                return fetch(event.request).then((response) => {
                    // 只缓存成功的响应
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CDN_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            }).catch(() => {
                console.log('[SW] Fetch failed for:', url);
            })
        );
    }
    // 对于本地资源，使用网络优先策略(保证最新)
    else if (url.startsWith(self.location.origin)) {
        event.respondWith(
            fetch(event.request).then((response) => {
                // 更新缓存
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            }).catch(() => {
                // 网络失败时使用缓存
                console.log('[SW] Network failed, using cache:', url);
                return caches.match(event.request);
            })
        );
    }
});
