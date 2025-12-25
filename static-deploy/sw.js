// 使用时间戳作为版本号，确保每次部署都会更新缓存
const CACHE_VERSION = '2025-12-25-14:00';
const CACHE_NAME = `blog-writer-${CACHE_VERSION}`;

// 需要缓存的静态资源
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
    './img/icons/apple-touch-icon.png',
    // iOS 启动图像 - 关键资源，防止闪烁
    './img/apple-splash.png',
    './img/apple-splash-828x1792.png',
    './img/apple-splash-1179x2556.png',
    './img/apple-splash-1206x2622.png',
    './img/apple-splash-1290x2796.png'
];

/**
 * CDN 资源版本配置
 * 注意：如需更新版本，请同时更新 index.html 中对应的引用
 * - Vue: 2.6.14
 * - Element UI: 2.15.13
 * - Vditor: 3.9.4
 */
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

// Activate event - clean up old caches and enable Navigation Preload
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        (async () => {
            // 启用 Navigation Preload（减少导航延迟 50-100ms）
            if (self.registration.navigationPreload) {
                try {
                    await self.registration.navigationPreload.enable();
                    console.log('[Service Worker] Navigation Preload enabled');
                } catch (err) {
                    console.warn('[Service Worker] Navigation Preload not supported:', err);
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
 * 限制缓存大小，删除非核心资源的缓存条目
 * @param {string} cacheName - 缓存名称
 * @param {number} maxItems - 最大缓存项数
 */
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        if (keys.length > maxItems) {
            console.log(`[Service Worker] Cache size (${keys.length}) exceeds limit (${maxItems}), trimming...`);

            // 构建核心资源的完整URL列表（需要保护的资源）
            const coreUrls = new Set([
                ...ASSETS_TO_CACHE.map(asset => new URL(asset, self.location.origin).href),
                ...CDN_ASSETS
            ]);

            // 分离核心资源和非核心资源
            const nonCoreKeys = keys.filter(key => !coreUrls.has(key.url));
            const coreKeysCount = keys.length - nonCoreKeys.length;

            // 只删除非核心资源，保留核心资源
            const itemsToRemove = Math.max(0, keys.length - maxItems);
            const keysToDelete = nonCoreKeys.slice(0, Math.min(itemsToRemove, nonCoreKeys.length));

            if (keysToDelete.length > 0) {
                await Promise.all(
                    keysToDelete.map(key => {
                        console.log('[Service Worker] Removing from cache:', key.url);
                        return cache.delete(key);
                    })
                );
                console.log(`[Service Worker] Trimmed ${keysToDelete.length} non-core items, preserved ${coreKeysCount} core resources`);
            } else {
                console.log('[Service Worker] No non-core items to trim, all cached items are core resources');
            }
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
    const isFont = /\.(woff2?|ttf|otf|eot)$/.test(url);

    // 字体资源使用 Cache First 策略（字体很少变化）
    if (isFont) {
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
        return;
    }

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
