const imageHandlerDebugLog = (...args) => {
    if (typeof window === 'undefined' || !window.__BLOGWRITER_DEBUG__) return;
    console.debug('[ImageHandler]', ...args);
};

// 图片处理 - Image Handler

// 处理图片上传
window.handleImageUpload = async function(vm, files) {
    if (!vm.isImageServiceConfigured) {
        vm.$message.warning('请先配置图床服务');
        return Promise.reject('图床未配置');
    }

    const fileArray = Array.from(files);
    vm.uploadingImages = true;

    if (typeof vm.closeUploadProgress === 'function') {
        vm.closeUploadProgress();
    }

    vm.uploadProgress.visible = true;
    vm.uploadProgress.status = 'progress';
    vm.uploadProgress.total = fileArray.length;
    vm.uploadProgress.current = 0;
    vm.uploadProgress.fileName = '';
    vm.uploadProgress.stage = 'preparing';
    vm.uploadProgress.progress = 0;
    vm.uploadProgress.currentSize = 0;
    vm.uploadProgress.targetSize = 0;
    vm.uploadProgress.quality = 0;
    vm.uploadProgress.summary = '';
    vm.uploadProgress.messages = [];

    const vditorElement = document.getElementById('vditor');
    if (vditorElement) {
        vditorElement.classList.remove('drag-over');
    }

    if (window.isMobileDevice()) {
        imageHandlerDebugLog('移动端上传开始:', {
            fileCount: fileArray.length,
            files: fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })),
            userAgent: navigator.userAgent,
            imageServiceConfig: {
                owner: window.imageService?.owner,
                repo: window.imageService?.repo,
                branch: window.imageService?.branch,
                isConfigured: window.imageService?.isConfigured()
            }
        });
    }

    try {
        const results = await window.imageService.uploadImages(fileArray, {
            compress: true,
            quality: 0.8,
            addHash: true,
            onProgress: (progress) => {
                vm.uploadProgress.current = progress.current;
                vm.uploadProgress.fileName = progress.fileName;
                vm.uploadProgress.stage = progress.stage;
                vm.uploadProgress.progress = progress.singleProgress || 0;
                vm.uploadProgress.currentSize = progress.currentSize || 0;
                vm.uploadProgress.targetSize = progress.targetSize || 0;
                vm.uploadProgress.quality = progress.quality || 0;
            },
            onSingleComplete: (result, index) => {
                if (result.success) {
                    const imageMarkdown = `![${result.fileName}](${result.url})\n`;
                    vm.insertTextToEditor(imageMarkdown);
                } else if (window.isMobileDevice()) {
                    console.error('移动端上传失败详情:', result);
                }

                vm.uploadProgress.messages.push({
                    type: result.success ? 'success' : 'error',
                    text: result.success
                        ? `图片 ${result.fileName} 上传成功`
                        : `图片 ${result.fileName} 上传失败${result.error ? `：${result.error}` : ''}`
                });
            }
        });

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        vm.uploadProgress.progress = 100;
        vm.uploadProgress.stage = 'completed';

        if (failCount === 0) {
            vm.uploadProgress.status = 'success';
            vm.uploadProgress.summary = `成功上传 ${successCount || 1} 张图片`;

            if (typeof vm.scheduleUploadProgressClose === 'function') {
                vm.scheduleUploadProgressClose();
            }
        } else {
            vm.uploadProgress.status = 'error';
            vm.uploadProgress.summary = failCount === results.length
                ? '上传失败，未成功上传任何图片'
                : `上传完成，但成功 ${successCount} 张，失败 ${failCount} 张`;

            if (typeof vm.scheduleUploadProgressClose === 'function') {
                vm.scheduleUploadProgressClose(3200);
            }
        }

        return Promise.resolve(results);

    } catch (error) {
        console.error('图片上传错误:', error);
        vm.uploadProgress.status = 'error';
        vm.uploadProgress.stage = 'error';
        vm.uploadProgress.summary = '上传失败';
        vm.uploadProgress.messages = [
            {
                type: 'error',
                text: error && error.message ? `原因：${error.message}` : '发生未知错误'
            }
        ];
        vm.uploadProgress.visible = true;

        if (typeof vm.scheduleUploadProgressClose === 'function') {
            vm.scheduleUploadProgressClose(3600);
        }

        if (window.isMobileDevice()) {
            vm.showMobileError(error, '图片上传');
        }
        return Promise.reject(error);
    } finally {
        vm.uploadingImages = false;
    }
};

// 触发移动端图片上传
window.triggerMobileImageUpload = function(vm) {
    if (!vm.isImageServiceConfigured) {
        vm.$message.warning('请先配置图床服务');
        return;
    }

    if (vm.uploadingImages) {
        vm.$message({ message: '正在上传图片，请稍候', type: 'info' });
        return;
    }

    const input = vm.$refs.mobileImageInput;
    if (input) {
        input.click();
    }
};

// 处理移动端图片选择
window.handleMobileImageChange = async function(vm, event) {
    const { files } = event.target;
    if (!files || !files.length) {
        return;
    }

    try {
        await window.handleImageUpload(vm, files);
    } finally {
        event.target.value = '';
    }
};

// 获取阶段文本
window.getStageText = function(stage) {
    const stageTexts = {
        'preparing': '准备中...',
        'analyzing': '分析图片...',
        'compressing': '智能压缩中...',
        'converting': '转换中...',
        'uploading': '上传中...',
        'generating': '生成链接...',
        'finalizing': '完成处理...',
        'completed': '完成'
    };
    return stageTexts[stage] || '处理中...';
};

// 格式化文件大小
window.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
