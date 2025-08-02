/** @format */

import Vue from 'vue'
const $lodash = require('./lodash').default

// 修复拼写错误：Window -> window，但现代浏览器已支持startsWith，可以移除此polyfill
// if (typeof String.prototype.startsWith !== 'function') {
//   window.String.prototype.startsWith = function (prefix) {
//     return this.slice(0, prefix.length) === prefix
//   }
// }

export default {
  resMsg(res) {
    let key = {
      zh: 'Chinese',
      en: 'English',
    }[Vue.config.lang]
    try {
      let obj = JSON.parse(res.Message)
      return obj[key] || obj.Chinese
    } catch (e) {
      return res && res.Message
    }
  },

  serverUrl(apiName) {
    return `app/${apiName}`
  },

  titleLang(zhStr, enStr) {
    return {
      zh: zhStr,
      en: enStr,
    }
  },

  query(search) {
    let str = search || window.location.search
    let objURL = {}

    str.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'), ($0, $1, $2, $3) => {
      objURL[$1] = $3
    })
    return objURL
  },

  queryString(url, query) {
    let str = []
    for (let key in query) {
      str.push(key + '=' + query[key])
    }
    let paramStr = str.join('&')
    return paramStr ? `${url}?${paramStr}` : url
  },

  assembleExternalLink(url) {
    const separator = $lodash.endsWith(url, '/') ? '' : '/'
    return `${url}${separator}?utm_source=markdown.lovejade.cn`
  },

  openAuthorSite(p) {
    window.open(`${this.assembleExternalLink('https://aboutme.lovejade.cn/')}&position=${p}`)
  },

  makeUpZero(num = 0) {
    return num < 10 ? `0${num}` : num
  },

  getTimestamp() {
    const date = new Date()
    const y = `${date.getFullYear()}`.replace('20', '')
    let mo = this.makeUpZero(date.getMonth() + 1)
    const d = this.makeUpZero(date.getDate())
    const h = this.makeUpZero(date.getHours())
    const m = this.makeUpZero(date.getMinutes())
    const s = this.makeUpZero(date.getSeconds())
    return `${y}-${mo}-${d}-${h}${m}${s}`
  },

  getExportFileName() {
    // 修复边界条件：处理根路径情况
    const pathParts = location.pathname.split('/').filter(part => part)
    const type = pathParts.length > 0 ? pathParts[0] : 'export'
    const timestamp = this.getTimestamp()
    const filename = `arya-${timestamp}.${type}`
    return filename
  },

  updateHtmlStyle() {
    const htmlNode = document.querySelector('html')
    htmlNode.style.overflow = 'auto'
    htmlNode.style.height = 'auto'
  },

  hideVditorTextarea() {
    const exportVditorNode = document.getElementById('khaleesi')
    if (!exportVditorNode) return

    const option = {
      childList: true, // 子节点的变动（新增、删除或者更改）
      attributes: true, // 属性的变动
      characterData: true, // 节点内容或节点文本的变动
      subtree: true, // 是否将观察器应用于该节点的所有后代节点
      attributeFilter: ['class', 'style'], // 观察特定属性
      attributeOldValue: true, // 观察 attributes 变动时，是否需要记录变动前的属性值
      characterDataOldValue: true, // 观察 characterData 变动，是否需要记录变动前的值
    }

    // 优化DOM查询：缓存选择器并使用更高效的查询方式
    let vditorTextarea = null
    const mutationObserver = new MutationObserver(() => {
      if (!vditorTextarea) {
        vditorTextarea = exportVditorNode.querySelector('.vditor-textarea')
      }
      if (vditorTextarea) {
        vditorTextarea.style.display = 'none'
        mutationObserver.disconnect()
      }
    })
    mutationObserver.observe(exportVditorNode, option)
  },

  /* -----------------------------localStorage------------------------------------ */
  /*
   * set localStorage
   */
  setStorage(name, content) {
    if (!name) return
    if (typeof content !== 'string') {
      content = JSON.stringify(content)
    }
    window.localStorage.setItem(name, content)
  },

  /**
   * get localStorage
   */
  getStorage(name) {
    if (!name) return
    let content = window.localStorage.getItem(name)
    return JSON.parse(content)
  },

  /**
   * delete localStorage
   */
  removeStorage(name) {
    if (!name) return
    window.localStorage.removeItem(name)
  },
}
