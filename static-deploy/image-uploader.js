/**
 * 图片上传处理器
 * 处理拖拽、粘贴、选择文件等上传方式
 */
class ImageUploader {
    constructor(editor, api) {
        this.editor = editor;
        this.api = api;
        this.isDragging = false;
        this.dragCounter = 0;
        this.uploadQueue = [];
        this.isUploading = false;
        
        this.init();
    }

    // 初始化
    init() {
        this.createDragOverlay();
        this.setupEventListeners();
        this.createUploadProgress();
    }

    // 创建拖拽覆盖层
    createDragOverlay() {
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.className = 'picx-drag-overlay';
        this.dragOverlay.innerHTML = `
            <div class="picx-drag-content">
                <div class="picx-drag-icon">🖼️</div>
                <div class="picx-drag-title">拖拽图片到此处上传</div>
                <div class="picx-drag-subtitle">支持 JPG、PNG、GIF、WebP 格式</div>
                <div class="picx-drag-features">
                    <span>✨ 自动压缩</span>
                    <span>🚀 CDN 加速</span>
                    <span>📝 自动插入</span>
                </div>
            </div>
        `;
        this.dragOverlay.style.display = 'none';
        document.body.appendChild(this.dragOverlay);
    }

    // 创建上传进度容器
    createUploadProgress() {
        this.progressContainer = document.createElement('div');
        this.progressContainer.className = 'picx-upload-progress-container';
        document.body.appendChild(this.progressContainer);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 拖拽事件
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));

        // 粘贴事件
        document.addEventListener('paste', this.handlePaste.bind(this));

        // 阻止默认拖拽行为
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    // 处理拖拽进入
    handleDragEnter(e) {
        e.preventDefault();
        this.dragCounter++;
        
        if (this.hasImageFiles(e.dataTransfer)) {
            this.showDragOverlay();
        }
    }

    // 处理拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
    }

    // 处理拖拽离开
    handleDragLeave(e) {
        e.preventDefault();
        this.dragCounter--;
        
        if (this.dragCounter === 0) {
            this.hideDragOverlay();
        }
    }

    // 处理拖拽释放
    async handleDrop(e) {
        e.preventDefault();
        this.dragCounter = 0;
        this.hideDragOverlay();
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => this.isValidImageFile(file));
        
        if (imageFiles.length === 0) {
            this.showMessage('没有找到有效的图片文件', 'warning');
            return;
        }

        await this.uploadFiles(imageFiles);
    }

    // 处理粘贴事件
    async handlePaste(e) {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length === 0) return;
        
        e.preventDefault();
        
        const files = [];
        for (const item of imageItems) {
            const file = item.getAsFile();
            if (file) {
                // 为粘贴的图片生成名称
                const timestamp = Date.now();
                const extension = file.type.split('/')[1];
                const newFile = new File([file], `paste_${timestamp}.${extension}`, {
                    type: file.type
                });
                files.push(newFile);
            }
        }
        
        if (files.length > 0) {
            this.showMessage(`检测到 ${files.length} 张粘贴的图片，开始上传...`, 'info');
            await this.uploadFiles(files);
        }
    }

    // 检查是否包含图片文件
    hasImageFiles(dataTransfer) {
        if (!dataTransfer.types) return false;
        return Array.from(dataTransfer.types).includes('Files');
    }

    // 验证图片文件
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // 显示拖拽覆盖层
    showDragOverlay() {
        if (!this.isDragging) {
            this.isDragging = true;
            this.dragOverlay.style.display = 'flex';
            document.body.classList.add('picx-dragging');
        }
    }

    // 隐藏拖拽覆盖层
    hideDragOverlay() {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragOverlay.style.display = 'none';
            document.body.classList.remove('picx-dragging');
        }
    }

    // 上传文件列表
    async uploadFiles(files) {
        if (!this.api.isConfigured()) {
            this.showMessage('请先配置 PicX 图床设置', 'error');
            return;
        }

        // 添加到上传队列
        this.uploadQueue.push(...files);
        
        // 如果没有正在上传，开始处理队列
        if (!this.isUploading) {
            await this.processUploadQueue();
        }
    }

    // 处理上传队列
    async processUploadQueue() {
        this.isUploading = true;
        
        while (this.uploadQueue.length > 0) {
            const file = this.uploadQueue.shift();
            await this.uploadSingleFile(file);
        }
        
        this.isUploading = false;
    }

    // 上传单个文件
    async uploadSingleFile(file) {
        const progressId = this.showUploadProgress(file);
        
        try {
            // 更新进度
            this.updateProgress(progressId, 20, '压缩图片中...');
            
            // 上传到 GitHub
            this.updateProgress(progressId, 60, '上传中...');
            const result = await this.api.uploadToGitHub(file);
            
            if (result.success) {
                this.updateProgress(progressId, 100, '上传成功');
                
                // 插入到编辑器
                this.insertImageToEditor(result);
                
                // 显示成功消息
                const compressionInfo = result.originalSize !== result.size 
                    ? ` (压缩: ${this.formatFileSize(result.originalSize)} → ${this.formatFileSize(result.size)})` 
                    : '';
                
                this.showMessage(
                    `图片上传成功${compressionInfo}`, 
                    'success'
                );
                
                // 延迟隐藏进度条
                setTimeout(() => {
                    this.hideProgress(progressId);
                }, 2000);
            }
        } catch (error) {
            console.error('上传失败:', error);
            this.updateProgress(progressId, 0, '上传失败');
            this.showMessage(`上传失败: ${error.message}`, 'error');
            
            // 延迟隐藏进度条
            setTimeout(() => {
                this.hideProgress(progressId);
            }, 3000);
        }
    }

    // 插入图片到编辑器
    insertImageToEditor(result) {
        if (!this.editor || !this.editor.vditor) {
            console.error('编辑器未初始化');
            return;
        }

        console.log('插入图片到编辑器:', result);

        const markdownImage = `![${result.fileName}](${result.url})`;

        console.log('生成的Markdown:', markdownImage);

        // 获取当前内容和光标位置
        const currentValue = this.editor.getValue();
        const cursorPos = this.editor.vditor.ir.element.selectionStart || currentValue.length;

        console.log('当前编辑器内容长度:', currentValue.length);
        console.log('光标位置:', cursorPos);

        // 在光标位置插入图片
        const newValue = currentValue.slice(0, cursorPos) +
                        '\n' + markdownImage + '\n' +
                        currentValue.slice(cursorPos);

        console.log('新内容长度:', newValue.length);

        this.editor.setValue(newValue);

        // 将光标移动到插入内容之后
        setTimeout(() => {
            const newCursorPos = cursorPos + markdownImage.length + 2;
            this.editor.vditor.ir.element.focus();
            this.editor.vditor.ir.element.setSelectionRange(newCursorPos, newCursorPos);
        }, 100);
    }

    // 显示上传进度
    showUploadProgress(file) {
        const progressId = 'progress_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const progressElement = document.createElement('div');
        progressElement.id = progressId;
        progressElement.className = 'picx-upload-item';
        progressElement.innerHTML = `
            <div class="picx-upload-info">
                <div class="picx-upload-filename">${file.name}</div>
                <div class="picx-upload-size">${this.formatFileSize(file.size)}</div>
            </div>
            <div class="picx-upload-progress">
                <div class="picx-upload-progress-bar">
                    <div class="picx-upload-progress-fill" style="width: 0%"></div>
                </div>
                <div class="picx-upload-status">准备上传...</div>
            </div>
        `;
        
        this.progressContainer.appendChild(progressElement);
        
        // 添加入场动画
        setTimeout(() => {
            progressElement.classList.add('picx-upload-item-show');
        }, 10);
        
        return progressId;
    }

    // 更新进度
    updateProgress(progressId, percent, status) {
        const element = document.getElementById(progressId);
        if (!element) return;
        
        const fillElement = element.querySelector('.picx-upload-progress-fill');
        const statusElement = element.querySelector('.picx-upload-status');
        
        if (fillElement) {
            fillElement.style.width = `${percent}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = status;
        }
        
        // 成功时改变样式
        if (percent === 100 && status.includes('成功')) {
            element.classList.add('picx-upload-success');
        } else if (status.includes('失败')) {
            element.classList.add('picx-upload-error');
        }
    }

    // 隐藏进度
    hideProgress(progressId) {
        const element = document.getElementById(progressId);
        if (element) {
            element.classList.add('picx-upload-item-hide');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 使用 Element UI 的消息组件
        if (window.Vue && window.Vue.prototype.$message) {
            window.Vue.prototype.$message({
                message: message,
                type: type,
                duration: type === 'error' ? 5000 : 3000
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 销毁
    destroy() {
        document.removeEventListener('dragenter', this.handleDragEnter);
        document.removeEventListener('dragover', this.handleDragOver);
        document.removeEventListener('dragleave', this.handleDragLeave);
        document.removeEventListener('drop', this.handleDrop);
        document.removeEventListener('paste', this.handlePaste);
        
        if (this.dragOverlay && this.dragOverlay.parentNode) {
            this.dragOverlay.parentNode.removeChild(this.dragOverlay);
        }
        
        if (this.progressContainer && this.progressContainer.parentNode) {
            this.progressContainer.parentNode.removeChild(this.progressContainer);
        }
    }
}
