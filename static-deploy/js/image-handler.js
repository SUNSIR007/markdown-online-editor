// 图片处理 - Image Handler

// 处理图片上传
window.handleImageUpload = async function(vm, files) {
    if (!vm.isImageServiceConfigured) {
        vm.$message.warning('请先配置图床服务');
        return Promise.reject('图床未配置');
    }

    const fileArray = Array.from(files);
    vm.uploadingImages = true;
    vm.uploadProgress.visible = true;
    vm.uploadProgress.total = fileArray.length;

    const vditorElement = document.getElementById('vditor');
    if (vditorElement) {
        vditorElement.classList.remove('drag-over');
    }

    if (window.isMobileDevice()) {
        console.log('移动端上传开始:', {
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
                    vm.$message.success(`图片 ${result.fileName} 上传成功`);
                } else {
                    vm.$message.error(`图片 ${result.fileName} 上传失败: ${result.error}`);
                    if (window.isMobileDevice()) {
                        console.error('移动端上传失败详情:', result);
                    }
                }
            }
        });

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
            vm.$message.success(`成功上传 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张失败` : ''}`);
        }

        return Promise.resolve(results);

    } catch (error) {
        console.error('图片上传错误:', error);
        if (window.isMobileDevice()) {
            vm.showMobileError(error, '图片上传');
        } else {
            vm.$message.error(`图片上传失败: ${error.message}`);
        }
        return Promise.reject(error);
    } finally {
        vm.uploadingImages = false;
        vm.uploadProgress.visible = false;
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
