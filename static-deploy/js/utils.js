// 工具函数 - Utility Functions

/**
 * 防抖函数 - 限制函数执行频率
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
window.debounce = function (func, wait = 300, immediate = false) {
    let timeout;

    return function executedFunction(...args) {
        const context = this;

        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
};

/**
 * 节流函数 - 限制函数执行频率（固定时间间隔）
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
window.throttle = function (func, limit = 300) {
    let inThrottle;

    return function (...args) {
        const context = this;

        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * 一次性执行函数 - 确保函数只执行一次
 * @param {Function} func - 要执行的函数
 * @returns {Function} 包装后的函数
 */
window.once = function (func) {
    let called = false;
    let result;

    return function (...args) {
        if (!called) {
            called = true;
            result = func.apply(this, args);
        }
        return result;
    };
};

/**
 * 带超时的 fetch 请求
 * @param {string} url - 请求 URL
 * @param {Object} options - fetch 选项
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise} fetch Promise
 */
window.fetchWithTimeout = function (url, options = {}, timeout = 30000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        )
    ]);
};
