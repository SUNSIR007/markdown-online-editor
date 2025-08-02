/** @format */

/**
 * 统一配置管理服务
 */
export class ConfigManager {
  constructor() {
    this.config = new Map()
    this.loadDefaultConfig()
  }

  /**
   * 加载默认配置
   */
  loadDefaultConfig() {
    // 应用基础配置
    this.set('app', {
      title: 'Arya - 在线 Markdown 编辑器',
      version: '3.0.0',
      author: 'nicejade'
    })

    // 导出配置
    this.set('export', {
      textMap: {
        '/export/png': '导出 PNG',
        '/export/pdf': '导出 PDF',
        '/export/ppt': 'PPT 预览',
      },
      defaultFileName: 'arya-export'
    })

    // 内容类型配置
    this.set('contentTypes', {
      GENERAL: 'general',
      BLOG: 'blog',
      ESSAY: 'essay'
    })

    // 内容类型标签
    this.set('contentTypeLabels', {
      general: '通用文档',
      blog: '博客文章',
      essay: '随笔'
    })

    // 元数据字段配置
    this.set('metadataFields', {
      blog: [
        { key: 'title', label: '标题', type: 'text', required: true },
        { key: 'categories', label: '分类', type: 'tags', required: true },
        { key: 'pubDate', label: '发布日期', type: 'datetime', required: true },
        { key: 'description', label: '描述', type: 'textarea', required: true },
      ],
      essay: [
        { key: 'title', label: '标题', type: 'text', required: true },
        { key: 'categories', label: '分类', type: 'tags', required: true },
        { key: 'pubDate', label: '发布日期', type: 'datetime', required: true },
        { key: 'description', label: '描述', type: 'textarea', required: false },
      ]
    })

    // Vditor配置
    this.set('vditor', {
      defaultOptions: {
        width: '80%',
        height: '0',
        tab: '\t',
        counter: '999999',
        typewriterMode: true,
        mode: 'sv',
        preview: {
          delay: 100,
          show: true,
        },
        outline: true,
        upload: {
          max: 5 * 1024 * 1024,
        }
      },
      mobileOptions: {
        width: '100%',
        preview: {
          show: false
        }
      }
    })

    // 样式配置
    this.set('styles', {
      headerHeight: '60px',
      maxBodyWidth: '1440px',
      breakpoints: {
        mobile: 960
      }
    })
  }

  /**
   * 设置配置项
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   */
  set(key, value) {
    this.config.set(key, value)
  }

  /**
   * 获取配置项
   * @param {string} key - 配置键
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  get(key, defaultValue = null) {
    return this.config.get(key) || defaultValue
  }

  /**
   * 获取嵌套配置项
   * @param {string} path - 配置路径，如 'app.title'
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  getPath(path, defaultValue = null) {
    const keys = path.split('.')
    let current = this.config

    for (const key of keys) {
      if (current instanceof Map) {
        current = current.get(key)
      } else if (current && typeof current === 'object') {
        current = current[key]
      } else {
        return defaultValue
      }

      if (current === undefined) {
        return defaultValue
      }
    }

    return current
  }

  /**
   * 检查配置项是否存在
   * @param {string} key - 配置键
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.config.has(key)
  }

  /**
   * 删除配置项
   * @param {string} key - 配置键
   */
  delete(key) {
    this.config.delete(key)
  }

  /**
   * 清空所有配置
   */
  clear() {
    this.config.clear()
  }

  /**
   * 获取所有配置
   * @returns {Object} 所有配置
   */
  getAll() {
    const result = {}
    for (const [key, value] of this.config.entries()) {
      result[key] = value
    }
    return result
  }

  /**
   * 从对象批量设置配置
   * @param {Object} configs - 配置对象
   */
  setFromObject(configs) {
    for (const [key, value] of Object.entries(configs)) {
      this.set(key, value)
    }
  }

  /**
   * 合并配置
   * @param {string} key - 配置键
   * @param {Object} value - 要合并的配置值
   */
  merge(key, value) {
    const existing = this.get(key, {})
    if (typeof existing === 'object' && typeof value === 'object') {
      this.set(key, { ...existing, ...value })
    } else {
      this.set(key, value)
    }
  }
}

// 创建全局实例
const configManager = new ConfigManager()

export default configManager
