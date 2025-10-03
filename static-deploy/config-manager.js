/**
 * 统一配置管理模块
 * 负责处理所有localStorage操作和配置管理
 */
class ConfigManager {
    constructor() {
        this.CONFIG_KEYS = {
            GITHUB: 'github-config',
            IMAGE_SERVICE: 'image-service-config',
            LINK_RULE: 'image-service-link-rule'
        };
    }

    /**
     * 获取配置
     * @param {string} key - 配置键名
     * @returns {Object|null} 解析后的配置对象，如果不存在则返回null
     */
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`配置读取失败 [${key}]:`, error);
            return null;
        }
    }

    /**
     * 设置配置
     * @param {string} key - 配置键名
     * @param {Object} value - 配置值
     * @returns {boolean} 是否设置成功
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`配置保存失败 [${key}]:`, error);
            return false;
        }
    }

    /**
     * 删除配置
     * @param {string} key - 配置键名
     * @returns {boolean} 是否删除成功
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`配置删除失败 [${key}]:`, error);
            return false;
        }
    }

    /**
     * 清空所有配置
     * @returns {boolean} 是否清空成功
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空配置失败:', error);
            return false;
        }
    }

    /**
     * 检查配置是否存在
     * @param {string} key - 配置键名
     * @returns {boolean} 配置是否存在
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * 获取GitHub配置
     * @returns {Object|null} GitHub配置对象
     */
    getGitHubConfig() {
        return this.get(this.CONFIG_KEYS.GITHUB);
    }

    /**
     * 设置GitHub配置
     * @param {Object} config - GitHub配置对象
     * @returns {boolean} 是否设置成功
     */
    setGitHubConfig(config) {
        return this.set(this.CONFIG_KEYS.GITHUB, config);
    }

    /**
     * 检查GitHub是否已配置
     * @returns {boolean} GitHub是否已配置
     */
    hasGitHubConfig() {
        const config = this.getGitHubConfig();
        return !!(config && config.token && config.owner && config.repo);
    }

    /**
     * 获取图床服务配置
     * @returns {Object|null} 图床服务配置对象
     */
    getImageServiceConfig() {
        return this.get(this.CONFIG_KEYS.IMAGE_SERVICE);
    }

    /**
     * 设置图床服务配置
     * @param {Object} config - 图床服务配置对象
     * @returns {boolean} 是否设置成功
     */
    setImageServiceConfig(config) {
        // 规范化配置
        const normalizedConfig = {
            ...config,
            branch: (config.branch || '').trim() || 'main',
            imageDir: (config.imageDir || '').trim() || 'images'
        };
        return this.set(this.CONFIG_KEYS.IMAGE_SERVICE, normalizedConfig);
    }

    /**
     * 检查图床服务是否已配置
     * @returns {boolean} 图床服务是否已配置
     */
    hasImageServiceConfig() {
        const config = this.getImageServiceConfig();
        return !!(config && config.token && config.owner && config.repo);
    }

    /**
     * 获取链接生成规则
     * @returns {string|null} 链接生成规则
     */
    getLinkRule() {
        const rule = localStorage.getItem(this.CONFIG_KEYS.LINK_RULE);
        return rule || 'jsdelivr'; // 默认使用 jsdelivr
    }

    /**
     * 设置链接生成规则
     * @param {string} rule - 链接生成规则
     * @returns {boolean} 是否设置成功
     */
    setLinkRule(rule) {
        try {
            localStorage.setItem(this.CONFIG_KEYS.LINK_RULE, rule);
            return true;
        } catch (error) {
            console.error('链接规则保存失败:', error);
            return false;
        }
    }

    /**
     * 批量保存配置
     * @param {Object} configs - 配置对象，包含github、image、linkRule
     * @returns {Object} 保存结果
     */
    saveAllConfigs(configs) {
        const results = {
            github: false,
            image: false,
            linkRule: false
        };

        if (configs.github) {
            results.github = this.setGitHubConfig(configs.github);
        }

        if (configs.image) {
            results.image = this.setImageServiceConfig(configs.image);
        }

        if (configs.linkRule) {
            results.linkRule = this.setLinkRule(configs.linkRule);
        }

        return results;
    }

    /**
     * 获取所有配置
     * @returns {Object} 所有配置对象
     */
    getAllConfigs() {
        return {
            github: this.getGitHubConfig(),
            image: this.getImageServiceConfig(),
            linkRule: this.getLinkRule()
        };
    }

    /**
     * 验证GitHub配置的完整性
     * @param {Object} config - GitHub配置对象
     * @returns {Object} 验证结果 {valid: boolean, message: string}
     */
    validateGitHubConfig(config) {
        if (!config) {
            return { valid: false, message: '配置对象不能为空' };
        }

        if (!config.token || !config.token.trim()) {
            return { valid: false, message: 'GitHub Token 不能为空' };
        }

        if (!config.owner || !config.owner.trim()) {
            return { valid: false, message: 'Repository Owner 不能为空' };
        }

        if (!config.repo || !config.repo.trim()) {
            return { valid: false, message: 'Repository Name 不能为空' };
        }

        return { valid: true, message: '配置有效' };
    }

    /**
     * 验证图床服务配置的完整性
     * @param {Object} config - 图床服务配置对象
     * @returns {Object} 验证结果 {valid: boolean, message: string}
     */
    validateImageServiceConfig(config) {
        if (!config) {
            return { valid: false, message: '配置对象不能为空' };
        }

        if (!config.token || !config.token.trim()) {
            return { valid: false, message: 'Token 不能为空' };
        }

        if (!config.owner || !config.owner.trim()) {
            return { valid: false, message: 'Owner 不能为空' };
        }

        if (!config.repo || !config.repo.trim()) {
            return { valid: false, message: 'Repo 不能为空' };
        }

        return { valid: true, message: '配置有效' };
    }

    /**
     * 导出所有配置为JSON
     * @returns {string} JSON字符串
     */
    exportConfigs() {
        return JSON.stringify(this.getAllConfigs(), null, 2);
    }

    /**
     * 从JSON导入配置
     * @param {string} jsonString - JSON字符串
     * @returns {Object} 导入结果
     */
    importConfigs(jsonString) {
        try {
            const configs = JSON.parse(jsonString);
            return this.saveAllConfigs(configs);
        } catch (error) {
            console.error('配置导入失败:', error);
            return { github: false, image: false, linkRule: false };
        }
    }
}

// 创建全局单例
if (typeof window !== 'undefined') {
    window.configManager = new ConfigManager();
}
