// 编辑器管理 - Editor Manager

// 缓存常用的DOM元素
let editorElementCache = {
    vditorElement: null,
    metadataWrapper: null,
    lastUpdated: 0
};

// 获取缓存的编辑器元素
function getCachedEditorElement() {
    const now = Date.now();
    // 缓存1秒内有效
    if (editorElementCache.vditorElement && (now - editorElementCache.lastUpdated) < 1000) {
        return editorElementCache.vditorElement;
    }

    editorElementCache.vditorElement = document.getElementById('vditor');
    editorElementCache.lastUpdated = now;
    return editorElementCache.vditorElement;
}

// 获取缓存的元数据包装器
function getCachedMetadataWrapper() {
    const now = Date.now();
    if (editorElementCache.metadataWrapper && (now - editorElementCache.lastUpdated) < 1000) {
        return editorElementCache.metadataWrapper;
    }

    editorElementCache.metadataWrapper = document.getElementById('metadata-editor-wrapper');
    editorElementCache.lastUpdated = now;
    return editorElementCache.metadataWrapper;
}

// 初始化 Vditor 编辑器
window.initVditor = function (vm) {
    const editorMode = 'ir';
    const vditorTheme = 'dark';

    const isMobile = window.isMobileDevice();
    const toolbar = isMobile ? [] : [
        'emoji', 'headings', 'bold', 'italic', 'strike', 'link', '|',
        'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
        'quote', 'line', 'code', 'inline-code', 'insert-before', 'insert-after', '|',
        'upload', 'table', '|',
        'undo', 'redo', '|',
        'edit-mode', '|',
        'outline', 'preview', 'fullscreen'
    ];

    vm.vditor = new Vditor('vditor', {
        height: '100%',
        mode: editorMode,
        theme: vditorTheme,
        preview: {
            theme: { current: vditorTheme },
            actions: []
        },
        toolbar: toolbar,
        upload: {
            accept: 'image/*',
            multiple: true,
            fieldName: 'file[]',
            filename: (name) => name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, ''),
            handler: async (files) => {
                try {
                    await vm.handleImageUpload(files);
                } catch (error) {
                    console.debug('[Editor] 图片上传异常已处理:', error?.message || error);
                }
                // 返回一个符合 Vditor 预期的成功对象结构
                // 这样 Vditor 会认为上传成功，不会显示任何提示
                return {
                    msg: '',
                    code: 0,
                    data: {
                        errFiles: [],
                        succMap: {}
                    }
                };
            }
        },
        cache: { enable: false },
        after: function () {
            // 使用缓存的DOM元素
            const vditorElement = getCachedEditorElement();
            const metadataEditor = getCachedMetadataWrapper();

            if (vditorElement && metadataEditor) {
                const toolbar = vditorElement.querySelector('.vditor-toolbar');
                if (toolbar) {
                    toolbar.insertAdjacentElement('afterend', metadataEditor);
                    metadataEditor.style.display = 'block';
                }
            }

            // 绑定 input 事件
            if (vm.vditor && vm.vditor.vditor && vm.vditor.vditor.element) {
                vm.vditor.vditor.element.addEventListener('input', () => {
                    vm.bodyContent = vm.vditor.getValue();
                });
            }

            // 设置拖拽和粘贴支持
            window.setupImageDragAndPaste(vm);

            // 编辑器初始化完成后，触发自动聚焦
            vm.$nextTick(() => {
                if (window.isMobileDevice()) {
                    window.setupMobileAutoFocus(vm);
                } else {
                    window.setupDesktopAutoFocus(vm);
                }
            });
        }
    });
};

// 聚焦编辑器
window.focusEditor = function (vm) {
    if (!vm.vditor || !vm.vditor.vditor || !vm.vditor.vditor.ir) {
        setTimeout(() => window.focusEditor(vm), 200);
        return;
    }

    try {
        vm.vditor.focus();

        const editorElement = vm.vditor.vditor.ir.element;
        if (editorElement) {
            editorElement.focus();

            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            editorElement.dispatchEvent(clickEvent);

            setTimeout(() => {
                const range = document.createRange();
                const selection = window.getSelection();

                if (editorElement.childNodes.length > 0) {
                    let lastNode = editorElement;
                    while (lastNode.lastChild) {
                        lastNode = lastNode.lastChild;
                    }

                    if (lastNode.nodeType === Node.TEXT_NODE) {
                        range.setStart(lastNode, lastNode.textContent.length);
                        range.setEnd(lastNode, lastNode.textContent.length);
                    } else {
                        range.selectNodeContents(editorElement);
                        range.collapse(false);
                    }
                } else {
                    range.setStart(editorElement, 0);
                    range.setEnd(editorElement, 0);
                }

                selection.removeAllRanges();
                selection.addRange(range);
                editorElement.focus();
            }, 100);

            setTimeout(() => {
                if (window.isMobileDevice()) {
                    try {
                        window.scrollTo({ top: 0, behavior: 'auto' });
                    } catch (err) {
                        window.scrollTo(0, 0);
                    }
                } else {
                    editorElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 200);
        }
    } catch (error) {
        console.log('聚焦编辑器失败:', error);
        try {
            const vditorContainer = document.querySelector('#vditor .vditor-ir pre');
            if (vditorContainer) {
                vditorContainer.focus();
            }
        } catch (e) {
            console.log('备用聚焦方案也失败:', e);
        }
    }
};

// 设置图片拖拽和粘贴支持
window.setupImageDragAndPaste = function (vm) {
    const vditorElement = getCachedEditorElement();
    if (!vditorElement) return;

    vditorElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vditorElement.classList.add('drag-over');
    });

    vditorElement.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vditorElement.classList.remove('drag-over');
    });

    vditorElement.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vditorElement.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            vm.handleImageUpload(files);
        }
    });

    vditorElement.addEventListener('paste', (e) => {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
            e.preventDefault();
            const files = imageItems.map(item => item.getAsFile()).filter(file => file);
            if (files.length > 0) {
                vm.handleImageUpload(files);
            }
        }
    });
};
