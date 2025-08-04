/**
 * 图片上传服务模块
 * 基于GitHub API实现图片上传功能，支持多种CDN链接格式
 */

class ImageService {
  constructor() {
    this.baseURL = 'https://api.github.com'
    this.token = null
    this.owner = null
    this.repo = null
    this.branch = 'main'
    
    // CDN链接规则配置
    this.linkRules = {
      'GitHub': {
        id: 'github',
        name: 'GitHub',
        rule: 'https://github.com/{owner}/{repo}/raw/{branch}/{path}',
        editable: false
      },
      'jsDelivr': {
        id: 'jsdelivr',
        name: 'jsDelivr',
        rule: 'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}',
        editable: false
      },
      'Statically': {
        id: 'statically',
        name: 'Statically',
        rule: 'https://cdn.statically.io/gh/{owner}/{repo}/{branch}/{path}',
        editable: false
      },
      'ChinaJsDelivr': {
        id: 'china-jsdelivr',
        name: 'China jsDelivr',
        rule: 'https://jsd.cdn.zzko.cn/gh/{owner}/{repo}@{branch}/{path}',
        editable: false
      }
    }
    
    this.selectedLinkRule = 'jsDelivr'
    this.imageDir = 'images' // 默认图片目录
  }

  /**
   * 设置图床配置
   * @param {Object} config - 配置对象
   * @param {string} config.token - GitHub Personal Access Token
   * @param {string} config.owner - 仓库所有者
   * @param {string} config.repo - 仓库名称
   * @param {string} config.branch - 分支名称
   * @param {string} config.imageDir - 图片目录
   */
  setConfig(config) {
    this.token = config.token
    this.owner = config.owner
    this.repo = config.repo
    this.branch = config.branch || 'main'

    // 清理imageDir，确保不以斜杠开头或结尾
    let imageDir = (config.imageDir || 'images').trim()
    this.imageDir = imageDir.replace(/^\/+|\/+$/g, '') || 'images'

    // 保存到localStorage
    localStorage.setItem('image-service-config', JSON.stringify(config))
  }

  /**
   * 从localStorage加载配置
   */
  loadConfig() {
    const saved = localStorage.getItem('image-service-config')
    if (saved) {
      const config = JSON.parse(saved)
      this.setConfig(config)
      return config
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
   * 设置CDN链接规则
   * @param {string} ruleId - 规则ID
   */
  setLinkRule(ruleId) {
    if (this.linkRules[ruleId]) {
      this.selectedLinkRule = ruleId
      localStorage.setItem('image-service-link-rule', ruleId)
    }
  }

  /**
   * 获取当前CDN链接规则
   */
  getLinkRule() {
    const saved = localStorage.getItem('image-service-link-rule')
    if (saved && this.linkRules[saved]) {
      this.selectedLinkRule = saved
    }
    return this.linkRules[this.selectedLinkRule]
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

    // 检测移动端并添加特殊处理
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    const headers = {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // 移动端添加额外的头部
    if (isMobile) {
      headers['User-Agent'] = 'MarkdownEditor/1.0 (Mobile)'
      headers['Cache-Control'] = 'no-cache'
    }

    console.log('GitHub API Request:', {
      url,
      method: options.method || 'GET',
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      isMobile,
      userAgent: navigator.userAgent
    })

    try {
      const fetchOptions = {
        ...options,
        headers,
      }

      // 移动端添加超时处理
      if (isMobile) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)
        fetchOptions.signal = controller.signal

        try {
          const response = await fetch(url, fetchOptions)
          clearTimeout(timeoutId)

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            console.error('GitHub API Error Details:', {
              status: response.status,
              statusText: response.statusText,
              url,
              error,
              owner: this.owner,
              repo: this.repo,
              branch: this.branch,
              isMobile,
              responseHeaders: Object.fromEntries(response.headers.entries())
            })

            // 特殊处理404错误
            if (response.status === 404) {
              throw new Error(
                `仓库或路径不存在 (404): 请检查仓库 ${this.owner}/${this.repo} 是否存在，分支 ${this.branch} 是否正确`
              )
            }

            throw new Error(
              `GitHub API Error: ${response.status} - ${error.message || response.statusText}`,
            )
          }

          return response.json()
        } catch (mobileError) {
          clearTimeout(timeoutId)
          throw mobileError
        }
      } else {
        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          console.error('GitHub API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            url,
            error,
            owner: this.owner,
            repo: this.repo,
            branch: this.branch,
            isMobile,
            responseHeaders: Object.fromEntries(response.headers.entries())
          })

          // 特殊处理404错误
          if (response.status === 404) {
            throw new Error(
              `仓库或路径不存在 (404): 请检查仓库 ${this.owner}/${this.repo} 是否存在，分支 ${this.branch} 是否正确`
            )
          }

          throw new Error(
            `GitHub API Error: ${response.status} - ${error.message || response.statusText}`,
          )
        }

        return response.json()
      }
    } catch (fetchError) {
      console.error('Fetch Error Details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
        url,
        isMobile,
        userAgent: navigator.userAgent
      })

      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接')
      }

      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，可能是CORS问题或网络不可达')
      }

      throw fetchError
    }
  }

  /**
   * 生成唯一的文件名
   * @param {string} originalName - 原始文件名
   * @param {boolean} addHash - 是否添加哈希值
   */
  generateFileName(originalName, addHash = true) {
    const now = new Date()
    const timestamp = now.getTime()
    
    // 提取文件扩展名
    const lastDotIndex = originalName.lastIndexOf('.')
    const name = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
    const ext = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : ''
    
    // 清理文件名，移除特殊字符
    const cleanName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
    
    if (addHash) {
      // 生成简单的哈希值
      const hash = timestamp.toString(36) + Math.random().toString(36).substr(2, 5)
      return `${cleanName}-${hash}${ext}`
    }
    
    return `${cleanName}-${timestamp}${ext}`
  }

  /**
   * 生成文件路径
   * @param {string} fileName - 文件名
   */
  generateFilePath(fileName) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    // 清理imageDir，确保不以斜杠开头或结尾
    let cleanImageDir = (this.imageDir || 'images').trim()
    cleanImageDir = cleanImageDir.replace(/^\/+|\/+$/g, '') // 移除开头和结尾的斜杠

    // 按年月组织目录结构，确保路径不以斜杠开头
    return `${cleanImageDir}/${year}/${month}/${fileName}`
  }

  /**
   * 将文件转换为Base64
   * @param {File} file - 文件对象
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 移除data:image/xxx;base64,前缀
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片
   * @param {File} file - 图片文件
   * @param {number} quality - 压缩质量 (0-1)
   * @param {number} maxWidth - 最大宽度
   */
  compressImage(file, quality = 0.8, maxWidth = 1920) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(resolve, file.type, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 验证图片文件
   * @param {File} file - 文件对象
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP 格式')
    }

    if (file.size > maxSize) {
      throw new Error('图片文件过大，请选择小于 10MB 的图片')
    }

    return true
  }

  /**
   * 上传图片到GitHub
   * @param {File} file - 图片文件
   * @param {Object} options - 上传选项
   * @param {boolean} options.compress - 是否压缩
   * @param {number} options.quality - 压缩质量
   * @param {boolean} options.addHash - 是否添加哈希值
   * @param {Function} options.onProgress - 进度回调
   */
  async uploadImage(file, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('图床未配置，请先配置GitHub仓库信息')
    }

    // 验证文件
    this.validateImageFile(file)

    const {
      compress = true,
      quality = 0.8,
      addHash = true,
      onProgress = () => {}
    } = options

    try {
      onProgress({ stage: 'preparing', progress: 10 })

      // 处理图片（压缩等）
      let processedFile = file
      if (compress && file.size > 500 * 1024) { // 大于500KB才压缩
        onProgress({ stage: 'compressing', progress: 30 })
        processedFile = await this.compressImage(file, quality)
      }

      // 生成文件名和路径
      const fileName = this.generateFileName(file.name, addHash)
      const filePath = this.generateFilePath(fileName)

      console.log('Upload details:', {
        originalFileName: file.name,
        generatedFileName: fileName,
        filePath,
        fileSize: processedFile.size,
        owner: this.owner,
        repo: this.repo,
        branch: this.branch
      })

      onProgress({ stage: 'converting', progress: 50 })

      // 转换为Base64
      const base64Content = await this.fileToBase64(processedFile)

      onProgress({ stage: 'uploading', progress: 70 })

      // 上传到GitHub
      const uploadData = {
        message: `Upload image: ${fileName}`,
        content: base64Content,
        branch: this.branch
      }

      const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
        method: 'PUT',
        body: JSON.stringify(uploadData)
      })

      onProgress({ stage: 'generating', progress: 90 })

      // 生成CDN链接
      const imageUrl = this.generateImageUrl(filePath)

      onProgress({ stage: 'completed', progress: 100 })

      return {
        success: true,
        fileName,
        filePath,
        originalSize: file.size,
        compressedSize: processedFile.size,
        url: imageUrl,
        sha: response.content.sha,
        htmlUrl: response.content.html_url
      }

    } catch (error) {
      console.error('图片上传失败:', error)
      console.error('Upload error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fileName: file.name,
        fileSize: file.size,
        owner: this.owner,
        repo: this.repo,
        branch: this.branch
      })

      // 提供更具体的错误信息
      let errorMessage = error.message
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '网络连接失败，请检查网络连接或稍后重试'
      } else if (error.message.includes('404')) {
        errorMessage = '仓库不存在或无权限访问，请检查仓库配置'
      } else if (error.message.includes('401')) {
        errorMessage = 'GitHub Token无效或已过期，请重新配置'
      } else if (error.message.includes('403')) {
        errorMessage = '权限不足，请确保Token有repo权限'
      }

      throw new Error(`图片上传失败: ${errorMessage}`)
    }
  }

  /**
   * 生成图片CDN链接
   * @param {string} filePath - 文件路径
   */
  generateImageUrl(filePath) {
    const rule = this.getLinkRule()
    return rule.rule
      .replace('{owner}', this.owner)
      .replace('{repo}', this.repo)
      .replace('{branch}', this.branch)
      .replace('{path}', filePath)
  }

  /**
   * 批量上传图片
   * @param {FileList|Array} files - 图片文件列表
   * @param {Object} options - 上传选项
   * @param {Function} options.onProgress - 进度回调
   * @param {Function} options.onSingleComplete - 单个文件完成回调
   */
  async uploadImages(files, options = {}) {
    const {
      onProgress = () => {},
      onSingleComplete = () => {}
    } = options

    const results = []
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]

      try {
        onProgress({
          current: i + 1,
          total: totalFiles,
          fileName: file.name,
          stage: 'uploading'
        })

        const result = await this.uploadImage(file, {
          ...options,
          onProgress: (singleProgress) => {
            onProgress({
              current: i + 1,
              total: totalFiles,
              fileName: file.name,
              stage: singleProgress.stage,
              singleProgress: singleProgress.progress
            })
          }
        })

        results.push(result)
        onSingleComplete(result, i)

      } catch (error) {
        const errorResult = {
          success: false,
          fileName: file.name,
          error: error.message
        }
        results.push(errorResult)
        onSingleComplete(errorResult, i)
      }
    }

    return results
  }

  /**
   * 测试图床连接
   */
  async testConnection() {
    try {
      console.log('Testing GitHub connection...')
      console.log('Connection test config:', {
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        hasToken: !!this.token,
        tokenLength: this.token ? this.token.length : 0,
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      })

      // 测试用户信息
      console.log('Testing user access...')
      const userResponse = await this.request('/user')
      console.log('User response:', userResponse)

      // 测试仓库访问权限
      console.log('Testing repository access...')
      const repoResponse = await this.request(`/repos/${this.owner}/${this.repo}`)
      console.log('Repository response:', repoResponse)

      // 检查权限
      const permissions = repoResponse.permissions || {}
      const hasWriteAccess = permissions.push || permissions.admin

      if (!hasWriteAccess) {
        console.error('Insufficient permissions:', permissions)
        return {
          success: false,
          error: `权限不足！当前用户: ${userResponse.login}，但对仓库 ${this.owner}/${this.repo} 没有写入权限。请确保Token有完整的repo权限。`,
        }
      }

      console.log('Connection test successful')
      return {
        success: true,
        repo: repoResponse.full_name,
        private: repoResponse.private,
        user: userResponse.login,
        permissions: permissions.admin ? '管理员' : '写入',
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取已上传的图片列表
   * @param {string} path - 目录路径
   */
  async getImageList(path = '') {
    try {
      // 清理路径，确保不以斜杠开头
      let cleanImageDir = (this.imageDir || 'images').replace(/^\/+|\/+$/g, '')
      const fullPath = path ? `${cleanImageDir}/${path}` : cleanImageDir
      const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${fullPath}`)

      return response
        .filter(item => item.type === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name))
        .map(item => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          url: this.generateImageUrl(item.path),
          htmlUrl: item.html_url,
          downloadUrl: item.download_url
        }))
    } catch (error) {
      if (error.message.includes('404')) {
        return [] // 目录不存在
      }
      throw error
    }
  }

  /**
   * 删除图片
   * @param {string} filePath - 文件路径
   * @param {string} sha - 文件SHA
   */
  async deleteImage(filePath, sha) {
    try {
      const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete image: ${filePath.split('/').pop()}`,
          sha: sha,
          branch: this.branch
        })
      })

      return {
        success: true,
        message: '图片删除成功'
      }
    } catch (error) {
      throw new Error(`删除图片失败: ${error.message}`)
    }
  }
}

// 创建全局实例
const imageService = new ImageService()

// 自动加载配置
imageService.loadConfig()

// 导出服务实例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageService
} else {
  window.ImageService = ImageService
  window.imageService = imageService
}
