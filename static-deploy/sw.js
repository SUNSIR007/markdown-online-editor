// 使用时间戳作为版本号，确保每次部署都会更新缓存
const CACHE_VERSION = '2025-12-06-16:48';
const CACHE_NAME = `blog-writer-${CACHE_VERSION}`;

// Navigation Preload 标识
const NAVIGATION_PRELOAD_HEADER = 'Blog-Writer-Preload';

// 需要缓存的静态资源 - 按优先级排序
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './site.webmanifest',
    './css/components.css',
    './css/editor.css',
    './css/mobile.css',
    './js/app.js',
    './js/config.js',
    './js/editor-manager.js',
    './js/image-handler.js',
    './js/mobile-utils.js',
    './js/runtime-config.js',
    './js/github-service.js',
    './js/image-service.js',
    './img/icons/write.png',
    './img/icons/upload-icon.png',
    './img/icons/apple-touch-icon.png'
];

// CDN 资源 - 核心库，提前缓存以提升加载速度
const CDN_ASSETS = [
    'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
    'https://unpkg.com/element-ui@2.15.13/lib/index.js',
    'https://unpkg.com/element-ui@2.15.13/lib/theme-chalk/index.css',
    'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.min.js',
    'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.css'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell and content');
                // 先缓存本地资源
                return cache.addAll(ASSETS_TO_CACHE)
                    .then(() => {
                        console.log('[Service Worker] Caching CDN resources');
                        // 再缓存 CDN 资源（允许部分失败）
                        return Promise.allSettled(
                            CDN_ASSETS.map(url =>
                                cache.add(url).catch(err => {
                                    console.warn('[Service Worker] Failed to cache CDN resource:', url, err);
                                })
                            )
                        );
                    });
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

// Activate event - clean up old caches and enable navigation preload
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        (async () => {
            // 启用 Navigation Preload（如果支持）
            if ('navigationPreload' in self.registration) {
                try {
                    await self.registration.navigationPreload.enable();
                    // 设置自定义 header 以便服务器识别预加载请求
                    await self.registration.navigationPreload.setHeaderValue(NAVIGATION_PRELOAD_HEADER);
                    console.log('[Service Worker] Navigation Preload enabled');
                } catch (err) {
                    console.warn('[Service Worker] Navigation Preload failed:', err);
                }
            }

            // 清理旧缓存
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );

            console.log('[Service Worker] Claiming clients');
            await self.clients.claim();

            // 清理当前缓存，限制大小
            await trimCache(CACHE_NAME, 50);
        })()
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
    const { url } = event.request;

    // 只处理 GET 请求
    if (event.request.method !== 'GET') {
        return;
    }

    // CDN 资源（Vue、Element UI、Vditor）使用 Cache First + 后台更新
    const isCDNResource = CDN_ASSETS.some(cdnUrl => url.startsWith(cdnUrl.split('?')[0]));
    if (isCDNResource) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // 返回缓存，同时在后台更新
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
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

    // 跨域请求（非CDN）不缓存
    if (!url.startsWith(self.location.origin)) {
        return;
    }

    const isNavigationRequest = event.request.mode === 'navigate';
    const isStaticAsset = /\.(js|css|html)$/.test(url);
    const isImage = /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(url);

    // 导航请求使用 Navigation Preload 加速
    if (isNavigationRequest) {
        event.respondWith(
            (async () => {
                // 同时获取缓存和 preload 响应
                const cachedResponse = await caches.match(event.request);

                // 尝试使用 Navigation Preload（如果可用）
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        console.log('[Service Worker] Using navigation preload response');
                        // 后台更新缓存
                        const responseToCache = preloadResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return preloadResponse;
                    }
                } catch (err) {
                    console.log('[Service Worker] Navigation preload unavailable:', err);
                }

                // 有缓存时，返回缓存同时后台更新
                if (cachedResponse) {
                    // 后台更新
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, networkResponse);
                                });
                            }
                        })
                        .catch(() => { });
                    return cachedResponse;
                }

                // 无缓存时，从网络获取
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })()
        );
        return;
    }

    // 对于 JS、CSS 使用 Stale-While-Revalidate 策略
    if (isStaticAsset) {
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
