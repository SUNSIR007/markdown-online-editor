// 主Vue应用 - Main Vue Application

new Vue({
    el: '#app',
    data() {
        // 立即检测移动端，在Vue初始化时就设置好
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

        return {
            vditor: null,
            currentType: window.AppConfig.contentTypes.ESSAY,
            metadata: {},
            contentTypeLabels: window.AppConfig.contentTypeLabels,
            isGitHubConfigured: false,
            isDarkMode: true,
            isMobileView: isMobile, // 初始化时就设置好
            metadataFields: window.AppConfig.metadataFields,
            bodyContent: '',
            hasUserInteracted: false,
            isImageServiceConfigured: false,
            uploadingImages: false,
            isPublishing: false,
            uploadProgress: {
                visible: false,
                status: 'idle',
                current: 0,
                total: 0,
                fileName: '',
                stage: '',
                progress: 0,
                currentSize: 0,
                targetSize: 0,
                quality: 0,
                summary: '',
                messages: []
            },
            uploadProgressTimer: null,
            mobileErrorDialog: {
                visible: false,
                content: ''
            },
            galleryPreview: {
                url: null,
                fileName: '',
                size: 0,
                file: null
            }
        };
    },

    computed: {
        hasVisibleFields() {
            if (!this.currentType || this.currentType === 'general' || this.currentType === 'gallery') {
                return false;
            }
            const fields = this.metadataFields[this.currentType];
            return fields && fields.length > 0;
        },

        hasBodyContent() {
            return !!(this.bodyContent && this.bodyContent.trim().length);
        }
    },

    mounted() {
        this.isMobileView = window.isMobileDevice();
        window.setupMobileDefaults(this);
        window.setupViewportFixes(this);

        // 直接初始化编辑器（关键路径），不使用 requestIdleCallback
        this.initEditor();

        // 延迟非关键任务
        this.deferNonCriticalInit();

        // 隐藏加载覆盖层，防止白屏
        this.$nextTick(() => {
            requestAnimationFrame(() => {
                if (window.hideLoadingOverlay) {
                    window.hideLoadingOverlay();
                }
            });
        });
    },

    methods: {
        checkGitHubConfig() {
            if (window.githubService && typeof window.githubService.loadConfig === 'function') {
                window.githubService.loadConfig();
            }
            this.isGitHubConfigured = window.githubService ? window.githubService.isConfigured() : false;
            if (!this.isGitHubConfigured) {
                console.warn('GitHub 配置缺失，请检查环境变量设置');
                if (this.$message) {
                    this.$message.warning('GitHub 配置缺失，请检查部署环境变量');
                }
            }
        },

        checkForEditFile() {
            const urlParams = new URLSearchParams(window.location.search);
            const editFile = urlParams.get('edit');
            if (editFile) {
                this.loadFileForEdit(editFile);
            }
        },

        async loadFileForEdit(filePath) {
            if (!this.isGitHubConfigured) {
                this.$message.warning('GitHub 配置缺失，请检查部署环境变量');
                return;
            }
            try {
                this.$message({ message: '正在加载文件...', type: 'info' });
                const fileData = await window.githubService.getFile(filePath);
                if (fileData) {
                    const { metadata, content } = this.parseContentWithFrontmatter(fileData.content);

                    if (filePath.includes('/posts/')) {
                        this.currentType = window.AppConfig.contentTypes.BLOG;
                    } else if (filePath.includes('/essays/')) {
                        this.currentType = window.AppConfig.contentTypes.ESSAY;
                    }

                    this.metadata = metadata;
                    this.bodyContent = content;
                    this.vditor.setValue(content);
                    this.$message.success('文件加载成功');
                }
            } catch (error) {
                this.$message.error(`加载文件失败: ${error.message}`);
            }
        },

        getTypeIcon(type) {
            const icons = {
                [window.AppConfig.contentTypes.BLOG]: 'el-icon-document',
                [window.AppConfig.contentTypes.ESSAY]: 'el-icon-edit-outline',
                [window.AppConfig.contentTypes.GALLERY]: 'el-icon-picture'
            };
            return icons[type] || 'el-icon-document';
        },

        selectType(type) {
            this.currentType = type;
            this.resetMetadata(type);
            this.bodyContent = '';
            this.vditor.setValue('');

            if (type === window.AppConfig.contentTypes.GALLERY) {
                this.resetGalleryPreview();
            }
        },

        resetMetadata(type) {
            const now = new Date();
            let newMeta = {};

            if (type === window.AppConfig.contentTypes.BLOG) {
                const dateStr = now.toISOString().split('T')[0];
                newMeta = {
                    title: '',
                    categories: 'Daily',
                    pubDate: dateStr
                };
            } else if (type === window.AppConfig.contentTypes.ESSAY) {
                const dateTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                newMeta = {
                    pubDate: dateTimeStr
                };
            } else if (type === window.AppConfig.contentTypes.GALLERY) {
                const dateStr = now.toISOString().split('T')[0];
                newMeta = {
                    date: dateStr
                };
            }
            this.metadata = newMeta;
        },

        parseContentWithFrontmatter(content) {
            if (!content.startsWith('---')) {
                return { metadata: {}, content: content };
            }

            const lines = content.split('\n');
            let frontmatterEnd = -1;

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '---') {
                    frontmatterEnd = i;
                    break;
                }
            }

            if (frontmatterEnd === -1) {
                return { metadata: {}, content: content };
            }

            const frontmatterLines = lines.slice(1, frontmatterEnd);
            const bodyContent = lines.slice(frontmatterEnd + 1).join('\n');

            const metadata = {};
            frontmatterLines.forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();

                    if (!value || value.trim() === '') {
                        value = '';
                    } else {
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }

                        if (value.startsWith('[') && value.endsWith(']')) {
                            try {
                                value = JSON.parse(value);
                            } catch (e) { }
                        }
                    }

                    metadata[key] = value;
                }
            });

            return { metadata, content: bodyContent };
        },

        async publish() {
            if (this.isPublishing) return;

            // 设置发布状态，按钮变亮
            this.isPublishing = true;

            if (!this.isGitHubConfigured) {
                this.$message.warning('GitHub 配置缺失，请检查部署环境变量');
                this.isPublishing = false;
                return;
            }

            if (this.currentType === window.AppConfig.contentTypes.GALLERY) {
                return await this.publishGalleryImage();
            }

            this.bodyContent = this.vditor.getValue();

            if (!this.bodyContent.trim()) {
                this.$message.warning('请先编写内容');
                this.isPublishing = false;
                return;
            }

            if (this.currentType === window.AppConfig.contentTypes.BLOG && !this.metadata.title) {
                this.$message.warning('请先设置标题');
                this.isPublishing = false;
                return;
            }

            const finalContent = window.generateContentWithMetadata(this.currentType, this.metadata, this.bodyContent);

            try {
                // 显示进度条
                this.showUploadProgress();

                const result = await window.githubService.publishContent(
                    this.currentType,
                    this.metadata,
                    finalContent
                );

                if (result.success) {
                    // 完成进度条
                    this.completeUploadProgress();
                    // 显示成功对勾
                    this.showSuccessCheck();

                    // 清空内容
                    setTimeout(() => {
                        this.selectType(this.currentType);
                    }, 1500);
                }
            } catch (error) {
                console.error('发布失败:', error);
                this.isPublishing = false;
                // 隐藏进度条
                this.hideUploadProgress();
                // 显示失败叉号
                this.showErrorCross(error.message);
            }
        },

        showUploadProgress() {
            const progressBar = document.getElementById('upload-progress-bar');
            if (progressBar) {
                progressBar.style.display = 'block';
                progressBar.style.width = '0%';
                // 模拟进度
                setTimeout(() => {
                    progressBar.style.width = '30%';
                }, 100);
                setTimeout(() => {
                    progressBar.style.width = '60%';
                }, 500);
            }
        },

        completeUploadProgress() {
            const progressBar = document.getElementById('upload-progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 800);
            }
        },

        hideUploadProgress() {
            const progressBar = document.getElementById('upload-progress-bar');
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        },

        showSuccessCheck() {
            const overlay = document.getElementById('upload-feedback-overlay');
            const icon = document.getElementById('upload-feedback-icon');
            if (overlay && icon) {
                icon.innerHTML = '<svg viewBox="0 0 52 52" class="success-icon"><circle class="success-icon-circle" cx="26" cy="26" r="25" fill="none"/><path class="success-icon-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>';
                overlay.classList.add('show');
                setTimeout(() => {
                    overlay.classList.remove('show');
                    // 动画结束后，恢复按钮状态并移除焦点
                    this.isPublishing = false;
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                }, 2000);
            }
        },

        showErrorCross(message) {
            const overlay = document.getElementById('upload-feedback-overlay');
            const icon = document.getElementById('upload-feedback-icon');
            if (overlay && icon) {
                icon.innerHTML = '<svg viewBox="0 0 52 52" class="error-icon"><circle class="error-icon-circle" cx="26" cy="26" r="25" fill="none"/><path class="error-icon-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/></svg>';
                overlay.classList.add('show');
                setTimeout(() => {
                    overlay.classList.remove('show');
                }, 2500);
            }
        },

        initEditor() {
            // 直接初始化编辑器
            window.initVditor(this);
            this.selectType(this.currentType);
        },

        deferNonCriticalInit() {
            const runTasks = () => {
                this.checkGitHubConfig();
                this.checkImageServiceConfig();
                this.checkForEditFile();
            };

            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => runTasks(), { timeout: 800 });
            } else {
                setTimeout(runTasks, 0);
            }
        },

        focusEditor() {
            window.focusEditor(this);
        },

        checkImageServiceConfig() {
            if (window.imageService && typeof window.imageService.loadConfig === 'function') {
                window.imageService.loadConfig();
            }
            this.isImageServiceConfigured = window.imageService ? window.imageService.isConfigured() : false;
            if (!this.isImageServiceConfigured) {
                console.warn('图床配置缺失，请检查部署环境变量');
                if (this.$message) {
                    this.$message.warning('图床配置缺失，请检查部署环境变量');
                }
            }
        },

        handleImageUpload(files) {
            return window.handleImageUpload(this, files);
        },

        insertTextToEditor(text) {
            if (this.vditor) {
                this.vditor.insertValue(text);
                // 更新bodyContent以触发按钮状态变化
                this.bodyContent = this.vditor.getValue();
            }
        },

        showMobileError(error, context = '') {
            if (window.isMobileDevice()) {
                const errorInfo = {
                    时间: new Date().toLocaleString(),
                    错误: error.message || error,
                    上下文: context,
                    用户代理: navigator.userAgent,
                    URL: window.location.href,
                    图床配置: window.imageService ? {
                        owner: window.imageService.owner,
                        repo: window.imageService.repo,
                        branch: window.imageService.branch,
                        已配置: window.imageService.isConfigured()
                    } : '未初始化'
                };

                this.mobileErrorDialog.content = JSON.stringify(errorInfo, null, 2);
                this.mobileErrorDialog.visible = true;
            }
        },

        async copyErrorToClipboard() {
            try {
                await navigator.clipboard.writeText(this.mobileErrorDialog.content);
                this.$message.success('错误信息已复制到剪贴板');
            } catch (err) {
                const textArea = document.createElement('textarea');
                textArea.value = this.mobileErrorDialog.content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.$message.success('错误信息已复制到剪贴板');
            }
        },

        resetGalleryPreview() {
            this.galleryPreview = {
                url: null,
                fileName: '',
                size: 0,
                file: null
            };
        },

        closeUploadProgress() {
            if (this.uploadProgressTimer) {
                clearTimeout(this.uploadProgressTimer);
                this.uploadProgressTimer = null;
            }
            this.uploadProgress.visible = false;
            this.uploadProgress.status = 'idle';
            this.uploadProgress.current = 0;
            this.uploadProgress.total = 0;
            this.uploadProgress.fileName = '';
            this.uploadProgress.stage = '';
            this.uploadProgress.progress = 0;
            this.uploadProgress.currentSize = 0;
            this.uploadProgress.targetSize = 0;
            this.uploadProgress.quality = 0;
            this.uploadProgress.summary = '';
            this.uploadProgress.messages = [];
        },

        scheduleUploadProgressClose(delay = 900) {
            if (this.uploadProgressTimer) {
                clearTimeout(this.uploadProgressTimer);
            }
            this.uploadProgressTimer = setTimeout(() => {
                this.closeUploadProgress();
            }, delay);
        },

        getStageText(stage) {
            return window.getStageText(stage);
        },

        formatFileSize(bytes) {
            return window.formatFileSize(bytes);
        },

        async publishGalleryImage() {
            const content = this.vditor.getValue();
            const imageUrlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);

            if (!imageUrlMatch) {
                this.$message.warning('请先在编辑器中上传图片');
                this.isPublishing = false;
                return;
            }

            const imageUrl = imageUrlMatch[1];
            const publishButton = document.querySelector('.publish-button');

            try {
                this.$message({ message: '正在保存图片信息...', type: 'info' });

                const imageData = {
                    url: imageUrl,
                    thumbnail: imageUrl,
                    date: this.metadata.date
                };

                const fileName = this.generateGalleryFileName();
                const filePath = `src/content/photos/${fileName}.json`;

                const jsonContent = JSON.stringify(imageData, null, 2);
                const result = await window.githubService.createOrUpdateFile(
                    filePath,
                    jsonContent,
                    `Add gallery image: ${fileName}`
                );

                if (publishButton) {
                    publishButton.classList.add('success');
                    setTimeout(() => {
                        publishButton.classList.remove('success');
                    }, 1500);
                }

                this.$message({
                    message: '图片发布成功！',
                    type: 'success'
                });

                this.selectType(this.currentType);

            } catch (error) {
                console.error('发布失败:', error);
                this.$message.error(`发布失败: ${error.message}`);
            } finally {
                // 确保无论成功还是失败都重置发布状态
                this.isPublishing = false;
            }
        },

        generateGalleryFileName() {
            const now = new Date();
            const timestamp = now.getTime();
            const dateStr = now.toISOString().split('T')[0];
            return `photo-${dateStr}-${timestamp}`;
        },

        triggerMobileImageUpload() {
            window.triggerMobileImageUpload(this);
        },

        handleMobileImageChange(event) {
            window.handleMobileImageChange(this, event);
        }
    }
});
