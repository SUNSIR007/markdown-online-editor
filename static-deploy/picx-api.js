/**
 * PicX 风格的 GitHub API 图床服务
 * 完全基于 PicX 项目的源码实现
 */
class PicXAPI {
    constructor() {
        this.config = this.loadConfig();
        this.baseURL = 'https://api.github.com';

        // 图片链接规则（完全按照PicX源码）
        this.imageLinkRules = {
            'GitHub': {
                rule: 'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}'
            },
            'jsDelivr': {
                rule: 'https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
            },
            'Statically': {
                rule: 'https://cdn.statically.io/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
            },
            'GitHubPages': {
                rule: 'https://{{owner}}.github.io/{{repo}}/{{path}}'
            },
            'ChinaJsDelivr': {
                rule: 'https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
            }
        };
    }

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('picx-config');
        return saved ? JSON.parse(saved) : {
            token: '',
            owner: '',
            repo: '',
            branch: 'master',
            selectedDir: '/', // PicX使用selectedDir而不是path
            imageLinkType: 'jsDelivr', // 默认使用 jsDelivr CDN
            compress: true,
            quality: 0.8,
            enableHash: true, // PicX的重命名选项
            addPrefix: false,
            prefix: '',
            useShortName: true // 新增：使用短文件名
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

    // 生成文件名（优化版本）
    generateFileName(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        let fileName = '';

        if (this.config.enableHash) {
            // 优化：使用更短的哈希，只保留时间戳后几位
            const timestamp = Date.now().toString(36); // 转换为36进制，更短
            const shortTimestamp = timestamp.slice(-6); // 只取后6位
            fileName = `${shortTimestamp}.${extension}`;
        } else {
            // 保持原名，但清理特殊字符
            fileName = file.name.replace(/[^\w\-\.]/g, '_');
        }

        // 添加前缀（可选）
        if (this.config.addPrefix && this.config.prefix) {
            fileName = `${this.config.prefix}${fileName}`;
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
                console.log('🔍 FileReader结果:', {
                    fullResult: reader.result.substring(0, 100) + '...',
                    resultType: typeof reader.result,
                    hasComma: reader.result.includes(','),
                    splitLength: reader.result.split(',').length
                });

                // 移除 data:image/xxx;base64, 前缀
                const base64 = reader.result.split(',')[1];

                console.log('🔍 Base64提取结果:', {
                    base64Length: base64 ? base64.length : 0,
                    base64Preview: base64 ? base64.substring(0, 50) + '...' : 'null',
                    base64Type: typeof base64
                });

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

    // 上传图片到 GitHub（完全按照PicX的uploadImageToGitHub函数）
    async uploadToGitHub(file) {
        console.log('🚀🚀🚀 开始上传到GitHub:', file.name);
        console.log('🚀🚀🚀 当前配置:', this.config);

        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        // 压缩图片
        const compressedFile = await this.compressImage(file);

        // 生成文件名
        const fileName = this.generateFileName(compressedFile);

        // 构建文件路径（按照PicX逻辑）
        const { selectedDir } = this.config;
        let filePath = fileName;
        if (selectedDir !== '/') {
            filePath = `${selectedDir}/${fileName}`;
        }

        // 转换为 Base64
        const base64Content = await this.fileToBase64(compressedFile);

        console.log('🔍 Base64转换完成:', {
            originalFileName: compressedFile.name,
            base64Length: base64Content.length,
            base64Preview: base64Content.substring(0, 50) + '...'
        });

        // 构建上传URL（按照PicX的uploadUrlHandle函数）
        const uploadUrl = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`;

        // 构建请求数据（按照PicX源码）
        const uploadData = {
            message: 'Upload image via PicX', // PicX使用的提交信息
            branch: this.config.branch,
            content: base64Content
        };

        console.log('🔍 上传请求详情:', {
            url: uploadUrl,
            fileName,
            filePath,
            branch: this.config.branch,
            contentLength: uploadData.content.length,
            contentPreview: uploadData.content.substring(0, 50) + '...'
        });

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`上传失败: ${error.message}`);
        }

        const result = await response.json();

        console.log('🔍 完整的GitHub API响应:', result);
        console.log('🔍 result.content详情:', result.content);

        // 使用GitHub API返回的path（这是关键！）
        const actualPath = result.content.path;

        // 关键检查：确保actualPath不是base64数据
        if (actualPath && (actualPath.includes('base64') || actualPath.includes('data:image'))) {
            console.error('❌ 严重错误：actualPath包含base64或data:image数据！');
            console.error('❌ actualPath内容:', actualPath.substring(0, 200));
            console.error('❌ 完整的result.content:', result.content);
            throw new Error('GitHub API返回的路径包含base64数据，这是不正常的');
        }

        console.log('🔍 调试信息 - GitHub API 响应:', {
            contentName: result.content.name,
            contentPath: result.content.path,
            contentSha: result.content.sha,
            contentSize: result.content.size,
            contentType: typeof result.content.path,
            pathIsString: typeof result.content.path === 'string',
            pathStartsWith: result.content.path ? result.content.path.substring(0, 20) : 'null'
        });

        console.log('🔍 调试信息 - 路径对比:', {
            fileName,
            requestPath: filePath,
            actualPath: actualPath,
            pathLength: actualPath.length,
            pathPreview: actualPath.substring(0, 100) + (actualPath.length > 100 ? '...' : '')
        });

        // 生成图片链接（按照PicX的generateImageLink函数）
        const imageLink = this.generateImageLink(actualPath);

        console.log('🔍 调试信息 - 链接生成:', {
            inputPath: actualPath,
            outputLink: imageLink,
            linkLength: imageLink ? imageLink.length : 0
        });

        return {
            success: true,
            fileName: fileName,
            filePath: actualPath, // 使用实际的path
            url: imageLink,
            rawUrl: result.content.download_url,
            sha: result.content.sha,
            size: compressedFile.size,
            originalSize: file.size,
            linkType: this.config.imageLinkType
        };
    }

    // 生成图片链接（完全按照PicX源码的generateImageLink函数）
    generateImageLink(imagePath) {
        console.log('🔍 generateImageLink 输入参数:', {
            imagePath,
            pathType: typeof imagePath,
            pathLength: imagePath ? imagePath.length : 0,
            pathPreview: imagePath ? imagePath.substring(0, 100) + (imagePath.length > 100 ? '...' : '') : 'null'
        });

        const { owner, repo, branch, imageLinkType } = this.config;

        // 获取对应的链接规则
        const linkRule = this.imageLinkRules[imageLinkType];
        if (!linkRule) {
            console.error('❌ 未找到链接规则:', imageLinkType);
            return null;
        }

        console.log('🔍 链接规则:', {
            linkType: imageLinkType,
            rule: linkRule.rule,
            owner,
            repo,
            branch
        });

        // 使用模板替换生成链接（完全按照PicX源码）
        const imageLink = linkRule.rule
            .replaceAll('{{owner}}', owner)
            .replaceAll('{{repo}}', repo)
            .replaceAll('{{branch}}', branch)
            .replaceAll('{{path}}', imagePath);

        console.log('✅ 生成的图片链接:', {
            result: imageLink,
            resultLength: imageLink.length,
            resultPreview: imageLink.substring(0, 100) + (imageLink.length > 100 ? '...' : '')
        });

        return imageLink;
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
