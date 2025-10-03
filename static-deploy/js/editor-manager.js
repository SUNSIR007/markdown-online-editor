// 编辑器管理 - Editor Manager

// 初始化 Vditor 编辑器
window.initVditor = function(vm) {
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
            handler: (files) => {
                return vm.handleImageUpload(files);
            }
        },
        cache: { enable: false },
        after: function() {
            // 将元数据编辑器移动到工具栏下方
            const vditorElement = document.getElementById('vditor');
            const toolbar = vditorElement.querySelector('.vditor-toolbar');
            const metadataEditor = document.getElementById('metadata-editor-wrapper');
            if (toolbar && metadataEditor) {
                toolbar.insertAdjacentElement('afterend', metadataEditor);
                metadataEditor.style.display = 'block';
            }

            // 绑定 input 事件
            vm.vditor.vditor.element.addEventListener('input', () => {
                vm.bodyContent = vm.vditor.getValue();
            });

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
window.focusEditor = function(vm) {
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
window.setupImageDragAndPaste = function(vm) {
    const vditorElement = document.getElementById('vditor');
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
