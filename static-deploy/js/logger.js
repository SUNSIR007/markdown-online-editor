// 日志工具 - Logger Utility
// 在生产环境中禁用调试日志，保留错误日志

const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('local');

const logger = {
    /**
     * 调试日志 - 仅在开发环境输出
     */
    debug: function (...args) {
        if (isDevelopment || window.__BLOGWRITER_DEBUG__) {
            console.debug(...args);
        }
    },

    /**
     * 普通日志 - 仅在开发环境输出
     */
    log: function (...args) {
        if (isDevelopment || window.__BLOGWRITER_DEBUG__) {
            console.log(...args);
        }
    },

    /**
     * 信息日志 - 仅在开发环境输出
     */
    info: function (...args) {
        if (isDevelopment || window.__BLOGWRITER_DEBUG__) {
            console.info(...args);
        }
    },

    /**
     * 警告日志 - 始终输出
     */
    warn: function (...args) {
        console.warn(...args);
    },

    /**
     * 错误日志 - 始终输出
     */
    error: function (...args) {
        console.error(...args);
    },

    /**
     * PWA 相关日志 - 添加前缀
     */
    pwa: function (message, ...args) {
        if (isDevelopment || window.__BLOGWRITER_DEBUG__) {
            console.log(`[PWA] ${message}`, ...args);
        }
    },

    /**
     * Service Worker 日志 - 添加前缀
     */
    sw: function (message, ...args) {
        if (isDevelopment || window.__BLOGWRITER_DEBUG__) {
            console.log(`[Service Worker] ${message}`, ...args);
        }
    }
};

// 导出到全局
window.logger = logger;
