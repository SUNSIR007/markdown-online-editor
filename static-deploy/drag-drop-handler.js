/**
 * 拖拽上传处理器
 * 处理图片拖拽到编辑器的功能
 */
class DragDropHandler {
    constructor(editor, uploadService) {
        this.editor = editor;
        this.uploadService = uploadService;
        this.isDragging = false;
        this.dragCounter = 0;
        this.setupEventListeners();
        this.createDragOverlay();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 阻止浏览器默认的拖拽行为
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));

        // 阻止编辑器区域的默认拖拽行为
        const editorElement = document.getElementById('vditor');
        if (editorElement) {
            editorElement.addEventListener('dragover', this.handleDragOver.bind(this));
            editorElement.addEventListener('drop', this.handleDrop.bind(this));
        }
    }

    // 创建拖拽覆盖层
    createDragOverlay() {
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.className = 'drag-overlay';
        this.dragOverlay.innerHTML = `
            <div class="drag-overlay-content">
                <div class="drag-icon">📁</div>
                <div class="drag-text">拖拽图片到此处上传</div>
                <div class="drag-hint">支持 JPG、PNG、GIF、WebP 格式</div>
            </div>
        `;
        this.dragOverlay.style.display = 'none';
        document.body.appendChild(this.dragOverlay);
    }

    // 处理拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 处理拖拽进入
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter++;
        
        if (this.hasImageFiles(e.dataTransfer)) {
            this.showDragOverlay();
        }
    }

    // 处理拖拽离开
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter--;
        
        if (this.dragCounter === 0) {
            this.hideDragOverlay();
        }
    }

    // 处理拖拽释放
    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter = 0;
        this.hideDragOverlay();
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => this.uploadService.isValidImageFile(file));
        
        if (imageFiles.length === 0) {
            this.showMessage('没有找到有效的图片文件', 'warning');
            return;
        }

        // 批量上传图片
        for (const file of imageFiles) {
            await this.uploadAndInsertImage(file);
        }
    }

    // 检查是否包含图片文件
    hasImageFiles(dataTransfer) {
        if (!dataTransfer.types) return false;
        
        return Array.from(dataTransfer.types).includes('Files');
    }

    // 显示拖拽覆盖层
    showDragOverlay() {
        if (!this.isDragging) {
            this.isDragging = true;
            this.dragOverlay.style.display = 'flex';
            document.body.classList.add('dragging');
        }
    }

    // 隐藏拖拽覆盖层
    hideDragOverlay() {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragOverlay.style.display = 'none';
            document.body.classList.remove('dragging');
        }
    }

    // 上传并插入图片
    async uploadAndInsertImage(file) {
        const progressId = this.showUploadProgress(file.name);
        
        try {
            // 上传图片
            const result = await this.uploadService.uploadImage(file);
            
            if (result.success) {
                // 插入markdown链接到编辑器
                this.insertImageToEditor(result.url, file.name);
                
                // 显示成功消息
                this.updateUploadProgress(progressId, 100, '上传成功');
                this.showMessage(`图片 ${file.name} 上传成功`, 'success');
                
                // 延迟隐藏进度条
                setTimeout(() => {
                    this.hideUploadProgress(progressId);
                }, 2000);
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            this.updateUploadProgress(progressId, 0, '上传失败');
            this.showMessage(`图片上传失败: ${error.message}`, 'error');
            
            // 延迟隐藏进度条
            setTimeout(() => {
                this.hideUploadProgress(progressId);
            }, 3000);
        }
    }

    // 插入图片到编辑器
    insertImageToEditor(imageUrl, altText) {
        if (!this.editor || !this.editor.vditor) {
            console.error('编辑器未初始化');
            return;
        }

        const markdownImage = `![${altText}](${imageUrl})`;
        
        // 获取当前光标位置
        const currentValue = this.editor.getValue();
        const cursorPos = this.editor.vditor.ir.element.selectionStart || currentValue.length;
        
        // 在光标位置插入图片
        const newValue = currentValue.slice(0, cursorPos) + 
                        '\n' + markdownImage + '\n' + 
                        currentValue.slice(cursorPos);
        
        this.editor.setValue(newValue);
        
        // 将光标移动到插入内容之后
        setTimeout(() => {
            const newCursorPos = cursorPos + markdownImage.length + 2;
            this.editor.vditor.ir.element.focus();
            this.editor.vditor.ir.element.setSelectionRange(newCursorPos, newCursorPos);
        }, 100);
    }

    // 显示上传进度
    showUploadProgress(filename) {
        const progressId = 'progress_' + Date.now();
        const progressElement = document.createElement('div');
        progressElement.id = progressId;
        progressElement.className = 'upload-progress';
        progressElement.innerHTML = `
            <div class="upload-progress-content">
                <div class="upload-filename">${filename}</div>
                <div class="upload-progress-bar">
                    <div class="upload-progress-fill" style="width: 0%"></div>
                </div>
                <div class="upload-status">准备上传...</div>
            </div>
        `;
        
        // 添加到页面右上角
        let progressContainer = document.getElementById('upload-progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'upload-progress-container';
            progressContainer.className = 'upload-progress-container';
            document.body.appendChild(progressContainer);
        }
        
        progressContainer.appendChild(progressElement);
        
        // 模拟进度更新
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) {
                progress = 90;
                clearInterval(progressInterval);
            }
            this.updateUploadProgress(progressId, progress, '上传中...');
        }, 200);
        
        return progressId;
    }

    // 更新上传进度
    updateUploadProgress(progressId, percent, status) {
        const progressElement = document.getElementById(progressId);
        if (progressElement) {
            const fillElement = progressElement.querySelector('.upload-progress-fill');
            const statusElement = progressElement.querySelector('.upload-status');
            
            if (fillElement) {
                fillElement.style.width = `${percent}%`;
            }
            
            if (statusElement) {
                statusElement.textContent = status;
            }
            
            // 成功时改变颜色
            if (percent === 100 && status.includes('成功')) {
                fillElement.style.backgroundColor = '#4CAF50';
                progressElement.classList.add('success');
            } else if (status.includes('失败')) {
                fillElement.style.backgroundColor = '#f44336';
                progressElement.classList.add('error');
            }
        }
    }

    // 隐藏上传进度
    hideUploadProgress(progressId) {
        const progressElement = document.getElementById(progressId);
        if (progressElement) {
            progressElement.style.opacity = '0';
            progressElement.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (progressElement.parentNode) {
                    progressElement.parentNode.removeChild(progressElement);
                }
            }, 300);
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 使用Element UI的消息组件
        if (window.Vue && window.Vue.prototype.$message) {
            window.Vue.prototype.$message({
                message: message,
                type: type
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 销毁处理器
    destroy() {
        document.removeEventListener('dragover', this.handleDragOver);
        document.removeEventListener('dragenter', this.handleDragEnter);
        document.removeEventListener('dragleave', this.handleDragLeave);
        document.removeEventListener('drop', this.handleDrop);
        
        if (this.dragOverlay && this.dragOverlay.parentNode) {
            this.dragOverlay.parentNode.removeChild(this.dragOverlay);
        }
    }
}
