/** @format */

import Vue from 'vue'

/**
 * 统一错误处理服务
 */
export class ErrorHandler {
  /**
   * 处理错误
   * @param {Error|string} error - 错误对象或错误消息
   * @param {string} context - 错误上下文
   * @param {Object} options - 处理选项
   */
  static handle(error, context = '', options = {}) {
    const {
      showUser = true,
      logToConsole = true,
      userMessage = null,
      severity = 'error'
    } = options

    // 构建错误信息
    const errorMessage = error instanceof Error ? error.message : error
    const fullContext = context ? `[${context}]` : ''
    
    // 控制台日志
    if (logToConsole) {
      const logMethod = console[severity] || console.error
      logMethod(`${fullContext} ${errorMessage}`, error instanceof Error ? error : '')
    }

    // 用户提示
    if (showUser && Vue.prototype.$message) {
      const displayMessage = userMessage || this.getUserFriendlyMessage(errorMessage)
      Vue.prototype.$message({
        type: severity === 'warn' ? 'warning' : 'error',
        message: displayMessage,
        duration: 5000
      })
    }

    // 可以在这里添加错误上报逻辑
    // this.reportError(error, context)
  }

  /**
   * 获取用户友好的错误消息
   * @param {string} errorMessage - 原始错误消息
   * @returns {string} 用户友好的错误消息
   */
  static getUserFriendlyMessage(errorMessage) {
    const errorMap = {
      'Network Error': '网络连接失败，请检查网络设置',
      'timeout': '操作超时，请重试',
      'Permission denied': '权限不足，请检查相关设置',
      'File not found': '文件未找到',
      'Invalid format': '文件格式不正确'
    }

    for (const [key, message] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return message
      }
    }

    return '操作失败，请重试'
  }

  /**
   * 处理异步操作错误
   * @param {Promise} promise - Promise对象
   * @param {string} context - 错误上下文
   * @param {Object} options - 处理选项
   */
  static async handleAsync(promise, context = '', options = {}) {
    try {
      return await promise
    } catch (error) {
      this.handle(error, context, options)
      throw error // 重新抛出错误，让调用者决定如何处理
    }
  }

  /**
   * 创建错误处理装饰器
   * @param {string} context - 错误上下文
   * @param {Object} options - 处理选项
   */
  static createHandler(context, options = {}) {
    return (error) => this.handle(error, context, options)
  }

  /**
   * 上报错误（可扩展）
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static reportError(error, context) {
    // 这里可以集成错误监控服务，如 Sentry
    if (process.env.NODE_ENV === 'production') {
      // 示例：发送到错误监控服务
      // errorReportingService.report(error, context)
    }
  }
}

/**
 * Vue插件安装函数
 */
export function install(Vue) {
  Vue.prototype.$errorHandler = ErrorHandler
  
  // 全局错误处理
  Vue.config.errorHandler = (error, vm, info) => {
    ErrorHandler.handle(error, `Vue Error: ${info}`, {
      showUser: true,
      logToConsole: true
    })
  }
}

export default ErrorHandler
