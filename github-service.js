/**
 * GitHub API 服务模块
 * 用于与GitHub API交互，实现文件的创建、更新和推送功能
 */

class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = null;
        this.owner = null;
        this.repo = null;
    }

    /**
     * 设置GitHub配置
     * @param {Object} config - 配置对象
     * @param {string} config.token - GitHub Personal Access Token
     * @param {string} config.owner - 仓库所有者
     * @param {string} config.repo - 仓库名称
     */
    setConfig(config) {
        this.token = config.token;
        this.owner = config.owner;
        this.repo = config.repo;
        
        // 保存到localStorage
        localStorage.setItem('github_config', JSON.stringify(config));
    }

    /**
     * 从localStorage加载配置
     */
    loadConfig() {
        const saved = localStorage.getItem('github_config');
        if (saved) {
            const config = JSON.parse(saved);
            this.setConfig(config);
            return config;
        }
        return null;
    }

    /**
     * 检查是否已配置
     */
    isConfigured() {
        return !!(this.token && this.owner && this.repo);
    }

    /**
     * 发送HTTP请求到GitHub API
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     */
    async request(endpoint, options = {}) {
        if (!this.token) {
            throw new Error('GitHub token not configured');
        }

        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`GitHub API Error: ${response.status} - ${error.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * 获取文件内容
     * @param {string} path - 文件路径
     */
    async getFile(path) {
        try {
            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`);
            return {
                content: atob(response.content.replace(/\s/g, '')),
                sha: response.sha
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return null; // 文件不存在
            }
            throw error;
        }
    }

    /**
     * 创建或更新文件
     * @param {string} path - 文件路径
     * @param {string} content - 文件内容
     * @param {string} message - 提交消息
     * @param {string} sha - 文件的SHA（更新时需要）
     */
    async createOrUpdateFile(path, content, message, sha = null) {
        const data = {
            message,
            content: btoa(unescape(encodeURIComponent(content))), // 处理中文字符
            ...(sha && { sha })
        };

        return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * 生成文件路径
     * @param {string} contentType - 内容类型
     * @param {Object} metadata - 元数据
     * @param {string} title - 标题
     */
    generateFilePath(contentType, metadata, title) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');

        // 生成文件名（移除特殊字符）
        const fileName = (title || metadata.title || 'untitled')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();

        // 添加时间戳避免同一天的文件覆盖
        const timestamp = `${hour}${minute}${second}`;

        if (contentType === 'blog') {
            return `src/content/posts/${year}-${month}-${day}-${timestamp}-${fileName}.md`;
        } else if (contentType === 'essay') {
            return `src/content/essays/${year}-${month}-${day}-${timestamp}-${fileName}.md`;
        } else {
            return `docs/${fileName}-${timestamp}.md`;
        }
    }

    /**
     * 发布内容到GitHub
     * @param {string} contentType - 内容类型
     * @param {Object} metadata - 元数据
     * @param {string} content - 内容
     */
    async publishContent(contentType, metadata, content) {
        if (!this.isConfigured()) {
            throw new Error('GitHub not configured');
        }

        // 生成文件路径
        const filePath = this.generateFilePath(contentType, metadata, metadata.title);
        
        // 检查文件是否已存在
        const existingFile = await this.getFile(filePath);
        
        // 生成提交消息
        const action = existingFile ? 'Update' : 'Add';
        const title = metadata.title || 'Untitled';
        const message = `${action} ${contentType}: ${title}`;

        // 创建或更新文件
        const result = await this.createOrUpdateFile(
            filePath,
            content,
            message,
            existingFile?.sha
        );

        return {
            success: true,
            filePath,
            url: result.content.html_url,
            action: action.toLowerCase()
        };
    }

    /**
     * 测试GitHub连接和权限
     */
    async testConnection() {
        try {
            // 测试用户信息
            const userResponse = await this.request('/user');

            // 测试仓库访问权限
            const repoResponse = await this.request(`/repos/${this.owner}/${this.repo}`);

            // 检查权限
            const permissions = repoResponse.permissions || {};
            const hasWriteAccess = permissions.push || permissions.admin;

            if (!hasWriteAccess) {
                return {
                    success: false,
                    error: `权限不足！当前用户: ${userResponse.login}，但对仓库 ${this.owner}/${this.repo} 没有写入权限。请确保Token有完整的repo权限。`
                };
            }

            return {
                success: true,
                repo: repoResponse.full_name,
                private: repoResponse.private,
                user: userResponse.login,
                permissions: permissions.admin ? '管理员' : '写入'
            };
        } catch (error) {
            if (error.message.includes('403')) {
                return {
                    success: false,
                    error: `权限被拒绝: ${error.message}。请检查：1) Token是否有效 2) Token是否有完整的repo权限 3) 是否有访问该仓库的权限`
                };
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取仓库信息
     */
    async getRepoInfo() {
        return this.request(`/repos/${this.owner}/${this.repo}`);
    }

    /**
     * 列出已发布的文件
     * @param {string} contentType - 内容类型
     */
    async listPublishedFiles(contentType) {
        let path;
        if (contentType === 'blog') {
            path = 'src/content/posts';
        } else if (contentType === 'essay') {
            path = 'src/content/essays';
        } else {
            path = 'docs';
        }

        try {
            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`);
            return response.filter(file => file.name.endsWith('.md')).map(file => ({
                name: file.name,
                path: file.path,
                url: file.html_url,
                downloadUrl: file.download_url
            }));
        } catch (error) {
            if (error.message.includes('404')) {
                return []; // 目录不存在
            }
            throw error;
        }
    }
}

// 创建全局实例
const githubService = new GitHubService();

// 自动加载配置
githubService.loadConfig();

// 导出服务实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubService;
} else {
    window.GitHubService = GitHubService;
    window.githubService = githubService;
}
