/**
 * GitHub API 服务模块
 * 用于与GitHub API交互，实现文件的创建、更新和推送功能
 */

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com'
    this.token = null
    this.owner = null
    this.repo = null
    this.branch = null
  }

  /**
   * 设置GitHub配置
   * @param {Object} config - 配置对象
   * @param {string} config.token - GitHub Personal Access Token
   * @param {string} config.owner - 仓库所有者
   * @param {string} config.repo - 仓库名称
   */
  setConfig(config = {}) {
    if (!config || typeof config !== 'object') {
      return
    }
    this.token = (config.token || '').trim()
    this.owner = (config.owner || '').trim()
    this.repo = (config.repo || '').trim()
    this.branch = (config.branch || '').trim() || null
  }

  /**
   * 从运行时配置加载
   */
  loadConfig() {
    if (typeof window !== 'undefined' && window.RuntimeConfig && window.RuntimeConfig.github) {
      this.setConfig(window.RuntimeConfig.github)
      return window.RuntimeConfig.github
    }
    return null
  }

  /**
   * 检查是否已配置
   */
  isConfigured() {
    return !!(this.token && this.owner && this.repo)
  }

  /**
   * 发送HTTP请求到GitHub API
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   */
  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('GitHub token not configured')
    }

    const url = `${this.baseURL}${endpoint}`
    const headers = {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `GitHub API Error: ${response.status} - ${error.message || response.statusText}`,
      )
    }

    return response.json()
  }

  /**
   * 获取文件内容
   * @param {string} path - 文件路径
   */
  async getFile(path) {
    try {
      const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`)
      return {
        content: atob(response.content.replace(/\s/g, '')),
        sha: response.sha,
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return null // 文件不存在
      }
      throw error
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
      ...(sha && { sha }),
    }

    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * 生成文件路径
   * @param {string} contentType - 内容类型
   * @param {Object} metadata - 元数据
   * @param {string} title - 标题
   * @param {string} content - 内容（用于提取前四个字）
   */
  generateFilePath(contentType, metadata, title, content = '') {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')

    const datePrefix = `${year}-${month}-${day}`
    const timestamp = `${hour}${minute}${second}`

    let fileName = ''

    if (contentType === 'blog') {
      // Blog: 标题 + 时间戳
      const safeTitle = (title || metadata.title || 'untitled')
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 保留中文、英文、数字、空格、连字符
        .replace(/\s+/g, '-')
        .toLowerCase()

      fileName = `${safeTitle}-${timestamp}`
      return `src/content/posts/${fileName}.md`

    } else if (contentType === 'essay') {
      // Essay: 日期 + 内容前四个字 + 时间戳
      // 提取纯文本内容（去除YAML frontmatter和Markdown标记）
      let plainText = content
        .replace(/^---[\s\S]*?---\n*/m, '') // 移除YAML frontmatter
        .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接保留文字
        .replace(/[#*`_~\->/]/g, '') // 移除Markdown标记
        .replace(/\s+/g, '') // 移除所有空白
        .trim()

      // 获取前四个字符（中文或英文）
      let firstFourChars = ''
      let charCount = 0
      for (let i = 0; i < plainText.length && charCount < 4; i++) {
        const char = plainText[i]
        // 只计算中文字符或英文字母
        if (/[\u4e00-\u9fa5a-zA-Z]/.test(char)) {
          firstFourChars += char
          charCount++
        }
      }

      // 如果内容为空或只有图片，只用日期 + 时间戳
      if (!firstFourChars) {
        fileName = `${datePrefix}-${timestamp}`
      } else {
        fileName = `${datePrefix}-${firstFourChars}-${timestamp}`
      }

      return `src/content/essays/${fileName}.md`

    } else {
      // 其他类型
      const safeTitle = (title || metadata.title || 'untitled')
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()

      fileName = `${datePrefix}-${safeTitle}-${timestamp}`
      return `docs/${fileName}.md`
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
      throw new Error('GitHub not configured')
    }

    // 生成文件路径（传递完整内容用于提取前四个字）
    const filePath = this.generateFilePath(contentType, metadata, metadata.title, content)

    // 检查文件是否已存在
    const existingFile = await this.getFile(filePath)

    // 生成提交消息
    const action = existingFile ? 'Update' : 'Add'
    const title = metadata.title || 'Untitled'
    const message = `${action} ${contentType}: ${title}`

    // 创建或更新文件
    const result = await this.createOrUpdateFile(filePath, content, message, existingFile?.sha)

    return {
      success: true,
      filePath,
      url: result.content.html_url,
      action: action.toLowerCase(),
    }
  }

  /**
   * 测试GitHub连接和权限
   */
  async testConnection() {
    try {
      // 测试用户信息
      const userResponse = await this.request('/user')

      // 测试仓库访问权限
      const repoResponse = await this.request(`/repos/${this.owner}/${this.repo}`)

      // 检查权限
      const permissions = repoResponse.permissions || {}
      const hasWriteAccess = permissions.push || permissions.admin

      if (!hasWriteAccess) {
        return {
          success: false,
          error: `权限不足！当前用户: ${userResponse.login}，但对仓库 ${this.owner}/${this.repo} 没有写入权限。请确保Token有完整的repo权限。`,
        }
      }

      return {
        success: true,
        repo: repoResponse.full_name,
        private: repoResponse.private,
        user: userResponse.login,
        permissions: permissions.admin ? '管理员' : '写入',
      }
    } catch (error) {
      if (error.message.includes('403')) {
        return {
          success: false,
          error: `权限被拒绝: ${error.message}。请检查：1) Token是否有效 2) Token是否有完整的repo权限 3) 是否有访问该仓库的权限`,
        }
      }
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepoInfo() {
    return this.request(`/repos/${this.owner}/${this.repo}`)
  }

  /**
   * 列出已发布的文件
   * @param {string} contentType - 内容类型
   */
  async listPublishedFiles(contentType) {
    let path
    if (contentType === 'blog') {
      path = 'src/content/posts'
    } else if (contentType === 'essay') {
      path = 'src/content/essays'
    } else {
      path = 'docs'
    }

    try {
      const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`)
      return response
        .filter((file) => file.name.endsWith('.md'))
        .map((file) => ({
          name: file.name,
          path: file.path,
          url: file.html_url,
          downloadUrl: file.download_url,
        }))
    } catch (error) {
      if (error.message.includes('404')) {
        return [] // 目录不存在
      }
      throw error
    }
  }

  /**
   * 上传图片到指定仓库
   * @param {string} imageRepo - 图片仓库名称
   * @param {string} filePath - 文件路径
   * @param {string} base64Content - Base64编码的图片内容
   * @param {string} message - 提交消息
   */
  async uploadImageToRepo(imageRepo, filePath, base64Content, message) {
    const data = {
      message: message || `Upload image: ${filePath.split('/').pop()}`,
      content: base64Content,
      branch: 'main'
    }

    try {
      const response = await this.request(`/repos/${this.owner}/${imageRepo}/contents/${filePath}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })

      return {
        success: true,
        sha: response.content.sha,
        path: response.content.path,
        htmlUrl: response.content.html_url,
        downloadUrl: response.content.download_url
      }
    } catch (error) {
      throw new Error(`图片上传失败: ${error.message}`)
    }
  }

  /**
   * 检查图片仓库是否存在且有权限
   * @param {string} imageRepo - 图片仓库名称
   */
  async checkImageRepo(imageRepo) {
    try {
      const response = await this.request(`/repos/${this.owner}/${imageRepo}`)
      const permissions = response.permissions || {}
      const hasWriteAccess = permissions.push || permissions.admin

      return {
        exists: true,
        hasWriteAccess,
        private: response.private,
        fullName: response.full_name
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return {
          exists: false,
          hasWriteAccess: false
        }
      }
      throw error
    }
  }

  /**
   * 创建图片仓库
   * @param {string} imageRepo - 图片仓库名称
   * @param {boolean} isPrivate - 是否为私有仓库
   */
  async createImageRepo(imageRepo, isPrivate = false) {
    const data = {
      name: imageRepo,
      description: 'Image hosting repository for markdown editor',
      private: isPrivate,
      auto_init: true
    }

    try {
      const response = await this.request('/user/repos', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      return {
        success: true,
        fullName: response.full_name,
        htmlUrl: response.html_url
      }
    } catch (error) {
      throw new Error(`创建图片仓库失败: ${error.message}`)
    }
  }
}

// 创建全局实例
const githubService = new GitHubService()

// 自动加载配置
githubService.loadConfig()

// 导出服务实例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubService
} else {
  window.GitHubService = GitHubService
  window.githubService = githubService
}
