(() => {
    const SW_PATH = './service-worker.js';
    const CDN_RESOURCES = [
        'https://unpkg.com/element-ui@2.15.13/lib/theme-chalk/index.css',
        'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.css',
        'https://unpkg.com/vue@2.6.14/dist/vue.min.js',
        'https://unpkg.com/element-ui@2.15.13/lib/index.js',
        'https://cdn.jsdelivr.net/npm/vditor@3.9.4/dist/index.min.js'
    ];

    const schedule = (callback) => {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback, { timeout: 2000 });
        } else {
            setTimeout(callback, 1500);
        }
    };

    const warmupCDNCache = (registration) => {
        schedule(() => {
            const messenger = registration.active || navigator.serviceWorker.controller;
            if (messenger && CDN_RESOURCES.length) {
                messenger.postMessage({
                    type: 'WARMUP_CDN_CACHE',
                    payload: CDN_RESOURCES
                });
            }
        });
    };

    const handleUpdateLifecycle = (registration) => {
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) {
                return;
            }

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        });
    };

    const registerServiceWorker = () => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        const performRegistration = () => {
            navigator.serviceWorker.register(SW_PATH).then((registration) => {
                handleUpdateLifecycle(registration);
            }).catch((error) => {
                console.warn('[PWA] Service Worker registration failed:', error);
            });
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            performRegistration();
        } else {
            document.addEventListener('DOMContentLoaded', performRegistration);
        }

        navigator.serviceWorker.ready.then((registration) => {
            warmupCDNCache(registration);
        }).catch((error) => {
            console.warn('[PWA] Service Worker readiness failed:', error);
        });
    };

    registerServiceWorker();
})();
