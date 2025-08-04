/**
 * 图片上传服务
 * 支持多种图床服务：GitHub、SM.MS、ImgBB等
 */
class ImageUploadService {
    constructor() {
        this.config = this.loadConfig();
        this.provider = this.config.provider || 'github';
    }

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('image-upload-config');
        return saved ? JSON.parse(saved) : {
            provider: 'github',
            github: {
                token: '',
                owner: '',
                repo: '',
                branch: 'main',
                path: 'images/'
            },
            smms: {
                token: ''
            }
        };
    }

    // 保存配置
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('image-upload-config', JSON.stringify(this.config));
    }

    // 设置图床服务商
    setProvider(provider) {
        this.provider = provider;
        this.config.provider = provider;
        this.saveConfig(this.config);
    }

    // 主上传方法
    async uploadImage(file) {
        if (!this.isValidImageFile(file)) {
            throw new Error('不支持的文件格式，请上传图片文件');
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB限制
            throw new Error('文件大小不能超过10MB');
        }

        switch (this.provider) {
            case 'github':
                return await this.uploadToGitHub(file);
            case 'smms':
                return await this.uploadToSMMS(file);
            default:
                throw new Error(`不支持的图床服务: ${this.provider}`);
        }
    }

    // 验证文件类型
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // 生成唯一文件名
    generateFileName(file) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        return `${timestamp}_${randomStr}.${extension}`;
    }

    // 上传到GitHub
    async uploadToGitHub(file) {
        const { github } = this.config;
        
        if (!github.token || !github.owner || !github.repo) {
            throw new Error('GitHub配置不完整，请先配置GitHub信息');
        }

        const fileName = this.generateFileName(file);
        const filePath = `${github.path}${fileName}`;
        
        // 将文件转换为base64
        const base64Content = await this.fileToBase64(file);
        
        const url = `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${filePath}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${github.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload image: ${fileName}`,
                content: base64Content,
                branch: github.branch
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub上传失败: ${error.message}`);
        }

        const result = await response.json();
        
        // 返回图片的访问URL
        return {
            success: true,
            url: `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.branch}/${filePath}`,
            filename: fileName,
            provider: 'github'
        };
    }

    // 上传到SM.MS
    async uploadToSMMS(file) {
        const { smms } = this.config;
        
        const formData = new FormData();
        formData.append('smfile', file);
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        if (smms.token) {
            headers['Authorization'] = smms.token;
        }

        const response = await fetch('https://sm.ms/api/v2/upload', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`SM.MS上传失败: ${result.message || '未知错误'}`);
        }

        return {
            success: true,
            url: result.data.url,
            filename: result.data.filename,
            provider: 'smms'
        };
    }

    // 文件转base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除data:image/xxx;base64,前缀
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 测试连接
    async testConnection() {
        try {
            switch (this.provider) {
                case 'github':
                    return await this.testGitHubConnection();
                case 'smms':
                    return await this.testSMMSConnection();
                default:
                    return { success: false, message: '不支持的图床服务' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // 测试GitHub连接
    async testGitHubConnection() {
        const { github } = this.config;
        
        if (!github.token || !github.owner || !github.repo) {
            return { success: false, message: 'GitHub配置不完整' };
        }

        const url = `https://api.github.com/repos/${github.owner}/${github.repo}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${github.token}`,
            }
        });

        if (response.ok) {
            return { success: true, message: 'GitHub连接成功' };
        } else {
            return { success: false, message: 'GitHub连接失败，请检查配置' };
        }
    }

    // 测试SM.MS连接
    async testSMMSConnection() {
        const response = await fetch('https://sm.ms/api/v2/profile', {
            headers: {
                'Authorization': this.config.smms.token || ''
            }
        });

        if (response.ok) {
            return { success: true, message: 'SM.MS连接成功' };
        } else {
            return { success: false, message: 'SM.MS连接失败' };
        }
    }
}

// 全局实例
window.imageUploadService = new ImageUploadService();
