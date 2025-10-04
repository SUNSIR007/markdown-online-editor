// 移动端工具函数 - Mobile Utilities

// 检测是否为移动设备
window.isMobileDevice = function() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
           window.innerWidth <= 768;
};

// 设置移动端默认值
window.setupMobileDefaults = function(vm) {
    if (window.isMobileDevice()) {
        vm.currentType = window.AppConfig.contentTypes.ESSAY;
    }
};

// 设置视口修复
window.setupViewportFixes = function(vm) {
    const updateViewportUnit = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        vm.isMobileView = window.isMobileDevice();
    };

    let lastViewportHeight = window.innerHeight;
    updateViewportUnit();

    const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDrop = lastViewportHeight - currentHeight;

        if (window.isMobileDevice() && heightDrop > 150) {
            // 键盘弹出时忽略viewport高度变化，避免布局跳动
            return;
        }

        lastViewportHeight = currentHeight;
        updateViewportUnit();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            lastViewportHeight = window.innerHeight;
            updateViewportUnit();
        }, 300);
    });

    if (!window.isMobileDevice()) {
        return;
    }

    const editorContainer = document.querySelector('.editor-container');
    if (!editorContainer) {
        return;
    }

    const toggleKeyboardState = (isOpen) => {
        editorContainer.classList.toggle('keyboard-open', isOpen);
    };

    document.addEventListener('focusin', (event) => {
        if (event.target.closest('#vditor')) {
            toggleKeyboardState(true);
        }
    });

    document.addEventListener('focusout', () => {
        setTimeout(() => {
            const active = document.activeElement;
            if (!active || !active.closest || !active.closest('#vditor')) {
                toggleKeyboardState(false);
            }
        }, 0);
    });
};

// 移动端自动聚焦 - 减少聚焦频率，避免干扰用户
window.setupMobileAutoFocus = function(vm) {
    if (!window.isMobileDevice()) return;

    let focusAttempted = false;

    const attemptFocus = (attempt = 1) => {
        if (focusAttempted && attempt > 1) return; // 避免重复聚焦

        vm.focusEditor();

        setTimeout(() => {
            const editorElement = vm.vditor?.vditor?.ir?.element;
            const isEditorFocused = document.activeElement === editorElement ||
                                  editorElement?.contains(document.activeElement);

            if (!isEditorFocused && attempt < 3 && !focusAttempted) { // 减少重试次数
                attemptFocus(attempt + 1);
            } else {
                focusAttempted = true;
            }
        }, 300);
    };

    // 只在页面加载后尝试一次聚焦
    setTimeout(() => {
        if (!focusAttempted) {
            attemptFocus();
        }
    }, 500);
};

// 桌面端自动聚焦 - 减少重试次数
window.setupDesktopAutoFocus = function(vm) {
    let focusAttempted = false;

    const attemptFocus = (attempt = 1) => {
        if (focusAttempted && attempt > 1) return;

        vm.focusEditor();

        setTimeout(() => {
            const editorElement = vm.vditor?.vditor?.ir?.element;
            const isEditorFocused = document.activeElement === editorElement ||
                                  editorElement?.contains(document.activeElement);

            if (!isEditorFocused && attempt < 3 && !focusAttempted) {
                attemptFocus(attempt + 1);
            } else {
                focusAttempted = true;
            }
        }, 300);
    };

    // 桌面端也只尝试一次初始聚焦
    setTimeout(() => {
        if (!focusAttempted) {
            attemptFocus();
        }
    }, 200);
};
