/**
 * 图片上传服务模块
 * 基于GitHub API实现图片上传功能，支持多种CDN链接格式
 */

const imageServiceDebugLog = (...args) => {
  if (typeof window === 'undefined' || !window.__BLOGWRITER_DEBUG__) return
  console.debug('[ImageService]', ...args)
}

// ============ 常量定义 ============
const IMAGE_CONSTANTS = {
  // 文件大小限制
  MAX_UPLOAD_SIZE: 50 * 1024 * 1024,        // 50MB - 最大允许上传大小
  COMPRESSION_THRESHOLD: 10 * 1024 * 1024,  // 10MB - 超过此大小触发压缩
  TARGET_COMPRESSED_SIZE: 10 * 1024 * 1024, // 10MB - 压缩目标大小

  // Canvas 限制
  MAX_CANVAS_DIMENSION: 4096,               // 最大Canvas单边尺寸
  MAX_CANVAS_PIXELS: 16 * 1024 * 1024,      // 16MP - 最大Canvas像素数
  MIN_RESIZE_WIDTH: 800,                    // 最小缩放宽度

  // 压缩参数
  DEFAULT_QUALITY: 0.8,                     // 默认压缩质量
  MIN_QUALITY: 0.1,                         // 最低压缩质量
  QUALITY_STEP: 0.1,                        // 质量递减步长
  MAX_COMPRESS_ATTEMPTS: 8,                 // 最大压缩尝试次数
  RESIZE_SCALE: 0.8,                        // 尺寸缩放比例

  // 网络超时
  MOBILE_TIMEOUT_MS: 45000,                 // 移动端请求超时
  PROXY_TIMEOUT_MS: 60000,                  // 代理环境请求超时
  RETRY_DELAY_MS: 1000,                     // 重试延迟

  // 文件名限制
  MAX_FILENAME_LENGTH: 50                   // 最大文件名长度
}


class ImageService {
  constructor() {
    this.baseURL = 'https://api.github.com'
    this.token = null
    this.owner = null
    this.repo = null
    this.branch = 'main' // 默认使用main分支

    // CDN链接规则配置
    this.linkRules = {
      github: {
        id: 'github',
        name: 'GitHub',
        rule: 'https://github.com/{owner}/{repo}/raw/{branch}/{path}',
        editable: false
      },
      jsdelivr: {
        id: 'jsdelivr',
        name: 'jsDelivr',
        rule: 'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}',
        editable: false
      },
      statically: {
        id: 'statically',
        name: 'Statically',
        rule: 'https://cdn.statically.io/gh/{owner}/{repo}/{branch}/{path}',
        editable: false
      },
      'china-jsdelivr': {
        id: 'china-jsdelivr',
        name: 'China jsDelivr',
        rule: 'https://jsd.cdn.zzko.cn/gh/{owner}/{repo}@{branch}/{path}',
        editable: false
      }
    }

    this.selectedLinkRule = 'jsdelivr'
    this.imageDir = 'images' // 默认图片目录
  }

  normalizeRuleKey(ruleId) {
    if (!ruleId && ruleId !== 0) {
      return ''
    }
    return String(ruleId)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }

  findRuleKey(ruleId) {
    if (!ruleId && ruleId !== 0) {
      return null
    }

    if (this.linkRules[ruleId]) {
      return ruleId
    }

    const target = this.normalizeRuleKey(ruleId)
    return Object.keys(this.linkRules).find((key) => this.normalizeRuleKey(key) === target) || null
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
  setConfig(config = {}) {
    if (!config || typeof config !== 'object') {
      return
    }

    const owner = (config.owner || '').trim()
    const repo = (config.repo || '').trim()
    const branch = (config.branch || 'main').trim()

    this.token = (config.token || '').trim()
    this.owner = owner
    this.repo = repo
    this.branch = branch || 'main'

    // 清理imageDir，确保不以斜杠开头或结尾
    let imageDir = (config.imageDir || 'images').trim()
    this.imageDir = imageDir.replace(/^\/+|\/+$/g, '') || 'images'

    if (config.linkRule) {
      const matchedRule = this.findRuleKey(config.linkRule)
      if (matchedRule) {
        this.selectedLinkRule = matchedRule
      }
    }
  }

  /**
   * 从运行时配置加载
   */
  loadConfig() {
    if (typeof window !== 'undefined' && window.RuntimeConfig && window.RuntimeConfig.imageService) {
      this.setConfig(window.RuntimeConfig.imageService)
      return window.RuntimeConfig.imageService
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
    const matchedKey = this.findRuleKey(ruleId)
    if (matchedKey) {
      this.selectedLinkRule = matchedKey
    }
  }

  /**
   * 获取当前CDN链接规则
   */
  getLinkRule() {
    if (!this.linkRules[this.selectedLinkRule]) {
      this.selectedLinkRule = Object.keys(this.linkRules)[0]
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
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)

    // 检测代理环境
    const isProxyEnvironment = () => {
      try {
        // 检查连接状态
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (connection && connection.effectiveType === 'slow-2g') {
          return true
        }

        // 检查用户代理字符串
        const userAgent = navigator.userAgent.toLowerCase()
        if (userAgent.includes('proxy') || userAgent.includes('vpn')) {
          return true
        }

        // 检查时区（代理可能改变时区）
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (timezone && !timezone.includes('Asia/Shanghai') && navigator.language.includes('zh')) {
          return true
        }

        return false
      } catch (e) {
        return false
      }
    }

    const usingProxy = isProxyEnvironment()

    const headers = {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // 移动端特殊处理
    if (isMobile) {
      // 移除可能导致问题的自定义User-Agent
      // headers['User-Agent'] = 'MarkdownEditor/1.0 (Mobile)'
      headers['Cache-Control'] = 'no-cache'
      headers['Pragma'] = 'no-cache'

      // iOS Safari特殊处理
      if (isIOS) {
        headers['X-Requested-With'] = 'XMLHttpRequest'
      }
    }

    imageServiceDebugLog('GitHub API Request:', {
      url,
      method: options.method || 'GET',
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      isMobile,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent
    })

    try {
      const fetchOptions = {
        ...options,
        headers,
        // 移动端和代理环境的特殊配置
        ...((isMobile || usingProxy) && {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache',
          redirect: 'follow',
          // 代理环境下的额外配置
          referrerPolicy: 'no-referrer-when-downgrade',
          // 代理环境可能需要更宽松的设置
          keepalive: false
        })
      }

      let response

      // 移动端和代理环境的特殊处理
      if (isMobile || usingProxy) {
        imageServiceDebugLog(`检测到${isMobile ? '移动端' : ''}${usingProxy ? '代理环境' : ''}，使用特殊请求策略`)
        // 代理环境下可能需要更长的超时时间
        const timeoutMs = usingProxy ? 60000 : 45000 // 代理环境60秒，移动端45秒

        // 尝试多种请求方式
        const requestMethods = [
          // 方法1: 标准请求
          () => fetch(url, fetchOptions),
          // 方法2: 简化请求（移除一些可能导致问题的选项）
          () => fetch(url, {
            method: fetchOptions.method || 'GET',
            headers: {
              'Authorization': headers.Authorization,
              'Accept': headers.Accept,
              'Content-Type': headers['Content-Type']
            },
            ...(fetchOptions.body && { body: fetchOptions.body })
          }),
          // 方法3: 最简请求
          () => fetch(url, {
            method: fetchOptions.method || 'GET',
            headers: {
              'Authorization': headers.Authorization
            },
            ...(fetchOptions.body && { body: fetchOptions.body })
          })
        ]

        let lastError = null
        for (let i = 0; i < requestMethods.length; i++) {
          try {
            imageServiceDebugLog(`尝试请求方法 ${i + 1}/${requestMethods.length}`)
            const fetchPromise = requestMethods[i]()
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('请求超时')), timeoutMs)
            })

            response = await Promise.race([fetchPromise, timeoutPromise])
            imageServiceDebugLog(`请求方法 ${i + 1} 成功`)
            break
          } catch (error) {
            imageServiceDebugLog(`请求方法 ${i + 1} 失败:`, error.message)
            lastError = error
            if (i === requestMethods.length - 1) {
              throw lastError
            }
            // 等待一小段时间再尝试下一种方法
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } else {
        response = await fetch(url, fetchOptions)
      }

      if (!response.ok) {
        let error = {}
        try {
          error = await response.json()
        } catch (jsonError) {
          console.warn('无法解析错误响应JSON:', jsonError)
        }

        console.error('GitHub API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url,
          error,
          owner: this.owner,
          repo: this.repo,
          branch: this.branch,
          isMobile,
          isIOS,
          isAndroid,
          responseHeaders: response.headers ? Object.fromEntries(response.headers.entries()) : {}
        })

        // 特殊处理各种错误状态
        if (response.status === 404) {
          throw new Error(
            `仓库或路径不存在 (404): 请检查仓库 ${this.owner}/${this.repo} 是否存在，分支 ${this.branch} 是否正确`
          )
        } else if (response.status === 401) {
          throw new Error('GitHub Token无效或已过期，请重新配置Token')
        } else if (response.status === 403) {
          throw new Error('权限不足，请确保Token有完整的repo权限')
        } else if (response.status === 422) {
          throw new Error('请求参数错误，可能是文件已存在或路径无效')
        }

        throw new Error(
          `GitHub API Error: ${response.status} - ${error.message || response.statusText}`,
        )
      }

      return response.json()
    } catch (fetchError) {
      console.error('Fetch Error Details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
        url,
        isMobile,
        isIOS,
        isAndroid,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : 'unknown'
      })

      // 更详细的错误分类
      if (fetchError.message === '请求超时') {
        throw new Error('请求超时，请检查网络连接')
      }

      if (fetchError.name === 'AbortError') {
        throw new Error('请求被中断，请检查网络连接')
      }

      if (fetchError.name === 'TypeError') {
        if (fetchError.message.includes('Failed to fetch')) {
          if (!navigator.onLine) {
            throw new Error('网络连接已断开，请检查网络设置')
          } else if (isMobile) {
            throw new Error('移动网络连接失败，请尝试切换网络或稍后重试')
          } else {
            throw new Error('网络连接失败，可能是CORS问题或网络不可达')
          }
        } else if (fetchError.message.includes('NetworkError')) {
          throw new Error('网络错误，请检查网络连接')
        }
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

    // 安全清理文件名，防止路径遍历攻击和特殊字符
    const cleanName = name
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') // 只保留字母、数字、中文
      .replace(/^\.+|\.+$/g, '') // 移除开头和结尾的点
      .replace(/\-{2,}/g, '-') // 合并多个连字符
      .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
      .substring(0, 50) // 限制长度

    // 确保文件名不为空
    const safeName = cleanName || 'image'

    if (addHash) {
      // 生成简单的哈希值
      const hash = timestamp.toString(36) + Math.random().toString(36).substr(2, 5)
      return `${safeName}-${hash}${ext}`
    }

    return `${safeName}-${timestamp}${ext}`
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
   * 将文件路径编码为GitHub API可接受的形式
   * @param {string} filePath - 原始文件路径
   */
  encodeFilePath(filePath) {
    return filePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
  }

  /**
   * 规范化分支名称（用于比较）
   * @param {string} branch - 分支名称
   */
  normalizeBranchName(branch) {
    return (branch || '').trim().toLowerCase()
  }

  /**
   * 当分支可能配置错误时，尝试自动回退到仓库默认分支
   * @param {string} failedBranch - 失败的分支名称
   */
  async resolveBranchFallback(failedBranch) {
    try {
      const repoInfo = await this.request(`/repos/${this.owner}/${this.repo}`)
      const defaultBranch = repoInfo?.default_branch

      if (!defaultBranch) {
        return null
      }

      const normalizedDefault = this.normalizeBranchName(defaultBranch)
      const normalizedFailed = this.normalizeBranchName(failedBranch)

      if (normalizedDefault === normalizedFailed) {
        return null
      }

      console.warn('检测到分支可能配置错误，自动切换到仓库默认分支:', {
        failedBranch,
        defaultBranch
      })

      // 更新当前配置为默认分支并持久化
      this.setConfig({
        token: this.token,
        owner: this.owner,
        repo: this.repo,
        branch: defaultBranch,
        imageDir: this.imageDir
      })

      return defaultBranch
    } catch (fallbackError) {
      console.warn('尝试回退到默认分支失败:', fallbackError)
      return null
    }
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
      let objectUrl = null

      // 清理函数
      const cleanup = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
          objectUrl = null
        }
        // 清理canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        canvas.width = 0
        canvas.height = 0
      }

      try {
        objectUrl = URL.createObjectURL(file)

        img.onload = () => {
          try {
            let { width, height } = img
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }

            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            const normalizedType = file.type === 'image/jpg' ? 'image/jpeg' : file.type
            const qualityCapable = ['image/jpeg', 'image/webp'].includes(normalizedType)

            canvas.toBlob(
              (blob) => {
                cleanup()
                resolve(blob || file)
              },
              normalizedType,
              qualityCapable ? quality : undefined
            )
          } catch (error) {
            console.warn('图片压缩失败，使用原始文件:', error)
            cleanup()
            resolve(file)
          }
        }

        img.onerror = (event) => {
          console.warn('图片加载失败，使用原始文件:', event)
          cleanup()
          resolve(file)
        }

        img.src = objectUrl
      } catch (error) {
        console.warn('创建ObjectURL失败，使用原始文件:', error)
        cleanup()
        resolve(file)
      }
    })
  }

  /**
   * 智能压缩图片到指定大小以内
   * @param {File} file - 图片文件
   * @param {number} targetSize - 目标大小（字节）
   * @param {Function} onProgress - 进度回调
   */
  async compressToSize(file, targetSize = IMAGE_CONSTANTS.TARGET_COMPRESSED_SIZE, onProgress = () => { }) {
    // 如果文件已经小于目标大小，直接返回
    if (file.size <= targetSize) {
      return file
    }

    onProgress({ stage: 'analyzing', progress: 10 })

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      let objectUrl = null

      // 清理函数
      const cleanup = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
          objectUrl = null
        }
        // 清理canvas
        if (canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          canvas.width = 0
          canvas.height = 0
        }
      }

      const originalType = (file.type === 'image/jpg' ? 'image/jpeg' : file.type) || 'image/jpeg'
      const supportedCanvasTypes = ['image/jpeg', 'image/png', 'image/webp']

      if (!supportedCanvasTypes.includes(originalType)) {
        resolve(file)
        return
      }

      try {
        objectUrl = URL.createObjectURL(file)

        img.onload = async () => {
          try {
            let { width, height } = img

            const MAX_CANVAS_DIMENSION = 4096
            const MAX_CANVAS_PIXELS = 16 * 1024 * 1024 // 16MP

            const pixelCount = width * height
            const dimensionScale = Math.min(
              1,
              MAX_CANVAS_DIMENSION / width,
              MAX_CANVAS_DIMENSION / height,
              Math.sqrt(MAX_CANVAS_PIXELS / pixelCount)
            )

            if (dimensionScale < 1) {
              width = Math.max(1, Math.floor(width * dimensionScale))
              height = Math.max(1, Math.floor(height * dimensionScale))
            } else {
              // 即使不缩放，也要确保是整数
              width = Math.floor(width)
              height = Math.floor(height)
            }

            // 确保尺寸有效
            width = Math.max(1, width)
            height = Math.max(1, height)

            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            let quality = 0.9 // 从高质量开始
            let currentBlob = null
            let attempts = 0
            const maxAttempts = 8

            onProgress({ stage: 'compressing', progress: 30 })

            while (attempts < maxAttempts) {
              currentBlob = await new Promise(resolveBlob => {
                try {
                  const qualityCapable = ['image/jpeg', 'image/webp'].includes(originalType)
                  canvas.toBlob(
                    (blob) => {
                      if (!blob) {
                        console.warn('canvas.toBlob 返回空，回退原始文件')
                      }
                      resolveBlob(blob)
                    },
                    originalType,
                    qualityCapable ? quality : undefined
                  )
                } catch (blobError) {
                  console.warn('canvas.toBlob 失败，使用原始文件:', blobError)
                  resolveBlob(null)
                }
              })

              if (!currentBlob) {
                console.warn('压缩失败，返回原始文件')
                cleanup()
                resolve(file)
                return
              }

              onProgress({
                stage: 'compressing',
                progress: 30 + (attempts / maxAttempts) * 50,
                currentSize: currentBlob.size,
                targetSize: targetSize,
                quality: quality
              })

              if (currentBlob.size <= targetSize) {
                break
              }

              quality = Math.max(quality - 0.1, 0.1)
              attempts++

              if (quality < 0.3 && width > 800) {
                const scale = 0.8
                width = Math.floor(width * scale)
                height = Math.floor(height * scale)
                canvas.width = width
                canvas.height = height
                ctx.drawImage(img, 0, 0, width, height)
                quality = 0.7
              }
            }

            onProgress({ stage: 'finalizing', progress: 90 })

            const compressedFile = new File([currentBlob], file.name, {
              type: originalType,
              lastModified: Date.now()
            })

            cleanup()
            resolve(compressedFile)
          } catch (error) {
            console.warn('图片压缩出现异常，使用原始文件:', error)
            cleanup()
            resolve(file)
          }
        }

        img.onerror = (event) => {
          console.warn('图片加载失败，使用原始文件:', event)
          cleanup()
          resolve(file)
        }

        img.src = objectUrl
      } catch (error) {
        console.warn('创建ObjectURL失败，使用原始文件:', error)
        cleanup()
        resolve(file)
      }
    })
  }

  /**
   * 验证图片文件
   * @param {File} file - 文件对象
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = IMAGE_CONSTANTS.MAX_UPLOAD_SIZE

    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP 格式')
    }

    if (file.size > maxSize) {
      throw new Error('图片文件过大，请选择小于 50MB 的图片')
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
      // 检测是否为PWA模式
      const isPWA = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

      const errorMsg = isPWA
        ? '图床配置缺失，请在部署环境变量中提供图床仓库信息'
        : '图床配置缺失，请检查部署环境变量';

      throw new Error(errorMsg)
    }

    // 验证文件
    this.validateImageFile(file)

    const {
      compress = true,
      quality = 0.8,
      addHash = true,
      onProgress = () => { }
    } = options

    try {
      onProgress({ stage: 'preparing', progress: 10 })

      // 处理图片（压缩等）
      let processedFile = file
      const targetSize = IMAGE_CONSTANTS.COMPRESSION_THRESHOLD

      if (file.size > targetSize) {
        // 超过阈值使用智能压缩
        onProgress({ stage: 'compressing', progress: 20 })
        processedFile = await this.compressToSize(file, targetSize, onProgress)
      }
      // 10MB以下的图片完全无损上传，不进行任何压缩

      // 生成文件名和路径
      const fileName = this.generateFileName(file.name, addHash)
      const filePath = this.generateFilePath(fileName)
      const encodedFilePath = this.encodeFilePath(filePath)

      imageServiceDebugLog('Upload details:', {
        originalFileName: file.name,
        generatedFileName: fileName,
        filePath,
        fileSize: processedFile.size,
        owner: this.owner,
        repo: this.repo,
        branch: this.branch
      })

      onProgress({ stage: 'converting', progress: 85 })

      // 转换为Base64
      const base64Content = await this.fileToBase64(processedFile)

      onProgress({ stage: 'uploading', progress: 90 })

      // 上传到GitHub
      const attemptUpload = async (targetBranch) => {
        const uploadData = {
          message: `Upload image: ${fileName}`,
          content: base64Content,
          branch: targetBranch
        }

        return this.request(`/repos/${this.owner}/${this.repo}/contents/${encodedFilePath}`, {
          method: 'PUT',
          body: JSON.stringify(uploadData)
        })
      }

      let response
      let usedBranch = this.branch

      try {
        response = await attemptUpload(usedBranch)
      } catch (requestError) {
        const isNotFound = typeof requestError.message === 'string' && requestError.message.includes('404')
        if (isNotFound) {
          const fallbackBranch = await this.resolveBranchFallback(usedBranch)
          if (fallbackBranch) {
            usedBranch = fallbackBranch
            response = await attemptUpload(fallbackBranch)
          } else {
            throw requestError
          }
        } else {
          throw requestError
        }
      }

      onProgress({ stage: 'generating', progress: 95 })

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
      onProgress = () => { },
      onSingleComplete = () => { }
    } = options

    const results = []
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]

      let result = null

      // 安全的进度回调包装
      const safeOnProgress = (data) => {
        try {
          onProgress(data)
        } catch (e) {
          console.warn('onProgress callback error:', e)
        }
      }

      try {
        safeOnProgress({
          current: i + 1,
          total: totalFiles,
          fileName: file.name,
          stage: 'uploading'
        })

        result = await this.uploadImage(file, {
          ...options,
          onProgress: (singleProgress) => {
            safeOnProgress({
              current: i + 1,
              total: totalFiles,
              fileName: file.name,
              stage: singleProgress.stage,
              singleProgress: singleProgress.progress
            })
          }
        })
      } catch (error) {
        result = {
          success: false,
          fileName: file.name,
          error: error.message
        }
      }

      results.push(result)

      try {
        onSingleComplete(result, i)
      } catch (callbackError) {
        console.warn('onSingleComplete callback error:', callbackError)
      }
    }

    return results
  }

  /**
   * 检测网络环境和GitHub访问能力
   * @returns {Promise<Object>} 检测结果
   */
  async detectNetworkEnvironment() {
    const results = {
      environment: 'unknown',
      github_api: { accessible: false, time: null, error: null },
      github_pages: { accessible: false, time: null, error: null },
      jsdelivr_cdn: { accessible: false, time: null, error: null },
      proxy_detected: false,
      recommendations: []
    }

    // 检测代理环境
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection && connection.effectiveType === 'slow-2g') {
        results.proxy_detected = true
        results.environment = 'proxy'
      }

      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('proxy') || userAgent.includes('vpn')) {
        results.proxy_detected = true
        results.environment = 'proxy'
      }
    } catch (e) {
      imageServiceDebugLog('代理检测失败:', e.message)
    }

    // 测试GitHub API
    try {
      const startTime = Date.now()
      const response = await fetch('https://api.github.com/rate_limit', {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ImageUploader/1.0'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      })

      if (response.ok) {
        results.github_api.accessible = true
        results.github_api.time = Date.now() - startTime
      } else {
        results.github_api.error = `HTTP ${response.status}`
      }
    } catch (error) {
      results.github_api.error = error.message
    }

    // 测试GitHub Pages
    try {
      const startTime = Date.now()
      const response = await fetch('https://github.com', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      results.github_pages.accessible = true
      results.github_pages.time = Date.now() - startTime
    } catch (error) {
      results.github_pages.error = error.message
    }

    // 测试jsDelivr CDN
    try {
      const startTime = Date.now()
      const response = await fetch('https://cdn.jsdelivr.net/npm/jquery@3.6.0/package.json', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      })

      if (response.ok) {
        results.jsdelivr_cdn.accessible = true
        results.jsdelivr_cdn.time = Date.now() - startTime
      } else {
        results.jsdelivr_cdn.error = `HTTP ${response.status}`
      }
    } catch (error) {
      results.jsdelivr_cdn.error = error.message
    }

    // 生成建议
    if (results.github_api.accessible) {
      results.recommendations.push('GitHub API可访问，图片上传功能正常')
    } else {
      results.recommendations.push('GitHub API不可访问，请检查网络连接或代理设置')
    }

    if (results.proxy_detected) {
      results.recommendations.push('检测到代理环境，建议使用更长的超时时间')
    }

    if (!results.jsdelivr_cdn.accessible) {
      results.recommendations.push('jsDelivr CDN不可访问，建议使用GitHub直链')
    }

    return results
  }

  /**
   * 测试图床连接
   */
  async testConnection() {
    try {
      imageServiceDebugLog('Testing GitHub connection...')
      imageServiceDebugLog('Connection test config:', {
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        hasToken: !!this.token,
        tokenLength: this.token ? this.token.length : 0,
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      })

      // 测试用户信息
      imageServiceDebugLog('Testing user access...')
      const userResponse = await this.request('/user')
      imageServiceDebugLog('User response:', userResponse)

      // 测试仓库访问权限
      imageServiceDebugLog('Testing repository access...')
      const repoResponse = await this.request(`/repos/${this.owner}/${this.repo}`)
      imageServiceDebugLog('Repository response:', repoResponse)

      if (this.branch) {
        const encodedBranch = encodeURIComponent(this.branch)
        imageServiceDebugLog('Validating branch:', this.branch)
        await this.request(`/repos/${this.owner}/${this.repo}/branches/${encodedBranch}`)
        imageServiceDebugLog('Branch validation succeeded:', this.branch)
      }

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

      imageServiceDebugLog('Connection test successful')
      const message = `用户: ${userResponse.login}，仓库: ${repoResponse.full_name}，权限: ${permissions.admin ? '管理员' : '写入'}`
      return {
        success: true,
        message: message,
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
      const errorMessage = error.message || '未知错误'

      if (errorMessage.includes('/branches/')) {
        return {
          success: false,
          message: `连接失败: 分支 ${this.branch} 不存在或无法访问，请确认分支名称`,
          error: errorMessage
        }
      }

      return {
        success: false,
        message: `连接失败: ${errorMessage}`,
        error: errorMessage
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

// 向后兼容 - 保留全局变量
if (typeof window !== 'undefined') {
  window.ImageService = ImageService
  window.imageService = imageService
  window.IMAGE_CONSTANTS = IMAGE_CONSTANTS
}

// ES Module 导出
export { ImageService, imageService, IMAGE_CONSTANTS }
