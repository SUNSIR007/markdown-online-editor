// 使用时间戳作为版本号，确保每次部署都会更新缓存
const CACHE_VERSION = '2025-12-03-14:47';
const CACHE_NAME = `blog-writer-${CACHE_VERSION}`;

// 需要缓存的静态资源
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
    './js/image-handler.js',
    './js/mobile-utils.js',
    './js/runtime-config.js',
    './github-service.js',        // 修复：添加缺失的关键文件
    './image-service.js',          // 修复：添加缺失的关键文件
    './img/icons/write.png',
    './img/icons/upload-icon.png',
    './img/icons/apple-touch-icon.png'  // 修复：添加 Apple 图标
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell and content');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Cache failed:', error);
            })
    );
});

// 监听来自客户端的消息
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
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
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        }).then(() => {
            // 清理当前缓存，限制大小
            return trimCache(CACHE_NAME, 50); // 最多保留50个缓存项
        })
    );
});

/**
 * 限制缓存大小，删除最旧的条目
 * @param {string} cacheName - 缓存名称
 * @param {number} maxItems - 最大缓存项数
 */
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        if (keys.length > maxItems) {
            console.log(`[Service Worker] Cache size (${keys.length}) exceeds limit (${maxItems}), trimming...`);

            // 按URL排序（简单策略，实际可以按访问时间）
            const keysToDelete = keys.slice(0, keys.length - maxItems);

            await Promise.all(
                keysToDelete.map(key => {
                    console.log('[Service Worker] Removing from cache:', key.url);
                    return cache.delete(key);
                })
            );

            console.log(`[Service Worker] Trimmed cache to ${maxItems} items`);
        }
    } catch (error) {
        console.error('[Service Worker] Cache trimming failed:', error);
    }
}

// Fetch event - 使用智能缓存策略
self.addEventListener('fetch', (event) => {
    // 跨域请求不缓存（如 CDN 资源）
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // 只处理 GET 请求
    if (event.request.method !== 'GET') {
        return;
    }

    const { url } = event.request;
    const isNavigationRequest = event.request.mode === 'navigate';
    const isStaticAsset = /\.(js|css|html)$/.test(url);
    const isImage = /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(url);

    // 对于 HTML、JS、CSS 使用 Stale-While-Revalidate 策略
    if (isNavigationRequest || isStaticAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // 在后台获取最新版本
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        // 只缓存成功的响应
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('[Service Worker] Fetch failed, using cache:', error);
                        return cachedResponse;
                    });

                // 立即返回缓存（如果有），同时在后台更新
                return cachedResponse || fetchPromise;
            })
        );
    }
    // 对于图片使用 Cache First 策略（图片不经常变化）
    else if (isImage) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
    }
    // 其他资源使用 Network First 策略
    else {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    }
});
