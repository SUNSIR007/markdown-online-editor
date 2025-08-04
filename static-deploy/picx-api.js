/**
 * PicX 风格的 GitHub API 图床服务
 * 基于 PicX 项目的实现逻辑
 */
class PicXAPI {
    constructor() {
        this.config = this.loadConfig();
        this.baseURL = 'https://api.github.com';
        this.cdnConfig = {
            github: 'https://raw.githubusercontent.com',
            jsdelivr: 'https://cdn.jsdelivr.net/gh',
            statically: 'https://cdn.statically.io/gh'
        };
    }

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('picx-config');
        return saved ? JSON.parse(saved) : {
            token: '',
            owner: '',
            repo: '',
            branch: 'main',
            path: 'images/',
            cdn: 'jsdelivr', // 默认使用 jsDelivr CDN
            compress: true,
            quality: 0.8,
            rename: true,
            addPrefix: false,
            prefix: ''
        };
    }

    // 保存配置
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('picx-config', JSON.stringify(this.config));
    }

    // 设置认证信息
    setAuth(token, owner, repo) {
        this.config.token = token;
        this.config.owner = owner;
        this.config.repo = repo;
        this.saveConfig(this.config);
    }

    // 检查配置是否完整
    isConfigured() {
        return !!(this.config.token && this.config.owner && this.config.repo);
    }

    // 生成文件名（PicX 风格）
    generateFileName(file) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop().toLowerCase();
        
        let fileName = '';
        
        if (this.config.rename) {
            // 重命名：时间戳 + 随机字符串
            fileName = `${timestamp}_${randomStr}.${extension}`;
        } else {
            // 保持原名，但添加时间戳避免冲突
            const originalName = file.name.replace(/\.[^/.]+$/, '');
            fileName = `${originalName}_${timestamp}.${extension}`;
        }
        
        // 添加前缀
        if (this.config.addPrefix && this.config.prefix) {
            fileName = `${this.config.prefix}_${fileName}`;
        }
        
        return fileName;
    }

    // 图片压缩（PicX 风格）
    async compressImage(file) {
        if (!this.config.compress || !file.type.startsWith('image/')) {
            return file;
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 计算压缩后的尺寸
                let { width, height } = img;
                const maxSize = 1920; // 最大尺寸
                
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制并压缩
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        // 创建新的 File 对象
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    this.config.quality
                );
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 文件转 Base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除 data:image/xxx;base64, 前缀
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 检查文件是否已存在
    async checkFileExists(filePath) {
        try {
            const url = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 上传图片到 GitHub
    async uploadToGitHub(file) {
        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        // 压缩图片
        const compressedFile = await this.compressImage(file);
        
        // 生成文件名
        const fileName = this.generateFileName(compressedFile);
        const filePath = `${this.config.path}${fileName}`;
        
        // 检查文件是否已存在
        const exists = await this.checkFileExists(filePath);
        if (exists) {
            throw new Error(`文件 ${fileName} 已存在`);
        }
        
        // 转换为 Base64
        const base64Content = await this.fileToBase64(compressedFile);
        
        // 上传到 GitHub
        const url = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload image: ${fileName}`,
                content: base64Content,
                branch: this.config.branch
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`上传失败: ${error.message}`);
        }

        const result = await response.json();
        
        // 生成 CDN 链接
        const cdnUrl = this.generateCDNUrl(filePath);
        
        return {
            success: true,
            fileName: fileName,
            filePath: filePath,
            url: cdnUrl,
            rawUrl: result.content.download_url,
            sha: result.content.sha,
            size: compressedFile.size,
            originalSize: file.size,
            cdn: this.config.cdn
        };
    }

    // 生成 CDN 链接
    generateCDNUrl(filePath) {
        const { owner, repo, branch } = this.config;
        const cdnBase = this.cdnConfig[this.config.cdn];
        
        switch (this.config.cdn) {
            case 'github':
                return `${cdnBase}/${owner}/${repo}/${branch}/${filePath}`;
            case 'jsdelivr':
                return `${cdnBase}/${owner}/${repo}@${branch}/${filePath}`;
            case 'statically':
                return `${cdnBase}/${owner}/${repo}/${branch}/${filePath}`;
            default:
                return `${this.cdnConfig.github}/${owner}/${repo}/${branch}/${filePath}`;
        }
    }

    // 删除图片
    async deleteImage(filePath, sha) {
        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        const url = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete image: ${filePath.split('/').pop()}`,
                sha: sha,
                branch: this.config.branch
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`删除失败: ${error.message}`);
        }

        return { success: true };
    }

    // 获取仓库信息
    async getRepoInfo() {
        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        const url = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`获取仓库信息失败: ${error.message}`);
        }

        return await response.json();
    }

    // 测试连接
    async testConnection() {
        try {
            await this.getRepoInfo();
            return { success: true, message: '连接成功' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // 获取用户信息
    async getUserInfo() {
        if (!this.config.token) {
            throw new Error('请先设置 GitHub Token');
        }

        const url = `${this.baseURL}/user`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`获取用户信息失败: ${error.message}`);
        }

        return await response.json();
    }
}

// 全局实例
window.picxAPI = new PicXAPI();
