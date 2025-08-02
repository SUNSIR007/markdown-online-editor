<!-- @format -->

<template>
  <div class="index-page" v-loading="isLoading">
    <HeaderNav />
    <div id="vditor" class="vditor" />
  </div>
</template>

<script>
import Vditor from 'vditor'
import HeaderNav from './partials/HeaderNav'
import defaultText from '@config/default'

export default {
  name: 'index-page',

  data() {
    return {
      isLoading: true,
      isMobile: window.innerWidth <= 960,
      vditor: null,
    }
  },

  created() {
    this.setDefaultText()
    // 修复全局变量污染：只在生产环境禁用console.log
    if (process.env.NODE_ENV === 'production') {
      console.log = () => { }
    }
  },

  components: {
    HeaderNav,
  },

  mounted() {
    console.log('🚀 Main.vue mounted - 开始初始化')

    // 简单测试 - 直接alert
    alert('JavaScript正在执行！')

    this.initVditor()
    this.$nextTick(() => {
      this.isLoading = false
      console.log('✅ Main.vue 加载完成')
    })
    this.$root.$on('reload-content', this.reloadContent)
  },

  beforeDestroy() {
    this.$root.$off('reload-content', this.reloadContent)
    // 修复内存泄漏：销毁Vditor实例
    if (this.vditor && typeof this.vditor.destroy === 'function') {
      this.vditor.destroy()
      this.vditor = null
    }
  },

  methods: {
    initVditor() {
      const that = this
      const options = {
        width: this.isMobile ? '100%' : '80%',
        height: '0',
        tab: '\t',
        counter: '999999',
        typewriterMode: true,
        mode: 'sv',
        preview: {
          delay: 100,
          show: !this.isMobile,
        },
        outline: true,
        upload: {
          max: 5 * 1024 * 1024,
          handler(file) {
            let formData = new FormData()
            for (let i in file) {
              formData.append('smfile', file[i])
            }
            let request = new XMLHttpRequest()
            request.open('POST', 'https://sm.ms/api/upload')
            request.onload = that.onloadCallback
            request.send(formData)
          },
        },
        after: () => {
          const content = localStorage.getItem('vditorvditor') || defaultText
          this.vditor.setValue(content)
          this.vditor.focus()

          // 将vditor实例暴露给全局使用
          window.vditorInstance = this.vditor

          console.log('✅ Vditor初始化完成')
        }
      }
      this.vditor = new Vditor('vditor', options)
    },
    onloadCallback(oEvent) {
      const currentTarget = oEvent.currentTarget
      if (currentTarget.status !== 200) {
        return this.$message({
          type: 'error',
          message: currentTarget.status + ' ' + currentTarget.statusText,
        })
      }
      let resp = JSON.parse(currentTarget.response)
      let imgMdStr = ''
      if (resp.code === 'invalid_source') {
        return this.$message({
          type: 'error',
          message: resp.message,
        })
      }
      if (resp.code === 'image_repeated') {
        imgMdStr = `![](${resp.images})`
      } else if (resp.code === 'success' || resp.success) {
        imgMdStr = `![${resp.data.filename}](${resp.data.url})`
      }
      this.vditor.insertValue(imgMdStr)
    },
    setDefaultText() {
      const savedMdContent = localStorage.getItem('vditorvditor') || ''
      if (!savedMdContent.trim()) {
        localStorage.setItem('vditorvditor', defaultText)
      }
    },
    insertMetadataBar() {
      console.log('🚀 开始插入元数据栏到vditor工具栏下方')

      // 使用setTimeout确保DOM完全渲染
      setTimeout(() => {
        // 查找vditor的工具栏
        const vditorElement = document.getElementById('vditor')
        console.log('🔍 Vditor元素:', vditorElement)

        if (!vditorElement) {
          console.error('❌ 未找到vditor元素')
          return
        }

        // 根据开发者工具，查找正确的工具栏元素
        const toolbar = vditorElement.querySelector('.vditor-toolbar')
        console.log('🔍 工具栏元素:', toolbar)

        if (!toolbar) {
          console.error('❌ 未找到工具栏元素，重试中...')
          console.log('🔍 Vditor内部结构:', vditorElement.innerHTML.substring(0, 500))
          setTimeout(() => this.insertMetadataBar(), 500)
          return
        }

        // 检查是否已经插入过
        if (vditorElement.querySelector('.vditor-metadata-bar')) {
          console.log('⚠️ 元数据栏已存在，跳过插入')
          return
        }

        // 创建元数据栏
        const metadataBar = document.createElement('div')
        metadataBar.className = 'vditor-metadata-bar'
        metadataBar.innerHTML = `
          <div class="metadata-content" style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <span class="metadata-label" style="color: #fff; font-weight: bold;">📝 元数据栏</span>
            <select class="metadata-type-select" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #409eff; background: white;">
              <option value="general">📄 通用文档</option>
              <option value="blog">📝 博客文章</option>
              <option value="essay">✍️ 随笔</option>
            </select>
            <div class="metadata-fields" style="display: none; gap: 8px;">
              <input placeholder="标题" class="metadata-input" style="padding: 4px; border-radius: 4px; border: 1px solid #409eff;" />
              <input placeholder="分类" class="metadata-input" style="padding: 4px; border-radius: 4px; border: 1px solid #409eff;" />
              <input placeholder="日期" class="metadata-input" style="padding: 4px; border-radius: 4px; border: 1px solid #409eff;" />
              <input placeholder="描述" class="metadata-input" style="padding: 4px; border-radius: 4px; border: 1px solid #409eff;" />
            </div>
            <button class="metadata-btn" style="padding: 4px 12px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer;">插入模板</button>
            <button class="metadata-btn" style="padding: 4px 12px; background: #f56c6c; color: white; border: none; border-radius: 4px; cursor: pointer;">清空</button>
            <span class="metadata-debug" style="color: #67c23a; font-weight: bold; margin-left: auto;">✅ 元数据栏已激活</span>
          </div>
        `

        // 添加样式 - 使用明亮的颜色确保在黑色背景下可见
        metadataBar.style.cssText = `
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid #409eff;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 12px;
          overflow-x: auto;
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `

        // 先插入一个临时测试栏验证位置
        const testBar = document.createElement('div')
        testBar.style.cssText = `
          background: #ff4444;
          color: white;
          padding: 8px 16px;
          font-size: 14px;
          border-bottom: 1px solid #ddd;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        `
        testBar.textContent = '⚠️ 测试栏 - 这里应该是元数据栏的位置'

        // 插入到工具栏正下方
        toolbar.parentNode.insertBefore(testBar, toolbar.nextSibling)

        // 3秒后移除测试栏并插入真正的元数据栏
        setTimeout(() => {
          if (testBar.parentNode) {
            testBar.parentNode.removeChild(testBar)
          }
          // 插入真正的元数据栏
          toolbar.parentNode.insertBefore(metadataBar, toolbar.nextSibling)
          console.log('📍 元数据栏已插入到工具栏下方')
        }, 3000)

        // 添加事件监听
        const typeSelect = metadataBar.querySelector('.metadata-type-select')
        const fieldsContainer = metadataBar.querySelector('.metadata-fields')

        typeSelect.addEventListener('change', (e) => {
          const type = e.target.value
          console.log('📝 元数据类型切换为:', type)

          if (type === 'general') {
            fieldsContainer.style.display = 'none'
          } else {
            fieldsContainer.style.display = 'flex'
            fieldsContainer.style.gap = '8px'
            fieldsContainer.style.marginLeft = '12px'
          }
        })

        console.log('✅ 元数据栏插入成功')

        // 添加闪烁效果确保可见性
        let flashCount = 0
        const flashInterval = setInterval(() => {
          metadataBar.style.background = flashCount % 2 === 0
            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          flashCount++
          if (flashCount >= 6) {
            clearInterval(flashInterval)
            metadataBar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        }, 300)

      }, 100) // 延迟100ms确保DOM渲染完成
    },

    forceInsertTestBar() {
      console.log('🚀 强制插入测试栏开始')

      setTimeout(() => {
        // 移除之前的测试栏
        const oldBars = document.querySelectorAll('.force-test-bar')
        oldBars.forEach(bar => bar.remove())

        // 查找vditor容器
        const vditor = document.getElementById('vditor')
        console.log('🔍 Vditor容器:', vditor)

        if (!vditor) {
          console.error('❌ 未找到vditor容器')
          return
        }

        // 创建超级明显的测试栏
        const testBar = document.createElement('div')
        testBar.className = 'force-test-bar'
        testBar.style.cssText = `
          position: fixed !important;
          top: 100px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 80% !important;
          height: 60px !important;
          background: linear-gradient(45deg, #ff0000, #00ff00, #0000ff) !important;
          color: white !important;
          font-size: 20px !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 999999 !important;
          border: 5px solid yellow !important;
          border-radius: 10px !important;
          box-shadow: 0 0 20px rgba(255,255,255,0.8) !important;
          animation: rainbow 2s infinite !important;
        `

        testBar.innerHTML = `
          <div style="text-align: center;">
            <div>🌈 强制插入测试栏 - 如果您看到这个，说明插入功能正常！</div>
            <div style="font-size: 14px; margin-top: 5px;">这个栏会在5秒后消失</div>
          </div>
        `

        // 添加彩虹动画
        const style = document.createElement('style')
        style.textContent = `
          @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
        `
        document.head.appendChild(style)

        // 插入到body顶部确保可见
        document.body.appendChild(testBar)

        console.log('✅ 强制测试栏已插入到页面顶部')

        // 5秒后移除
        setTimeout(() => {
          testBar.remove()
          console.log('🗑️ 强制测试栏已移除')
        }, 5000)

        // 同时尝试在vditor内部插入
        const vditorTestBar = document.createElement('div')
        vditorTestBar.className = 'vditor-internal-test'
        vditorTestBar.style.cssText = `
          height: 40px !important;
          background: linear-gradient(135deg, #ff6b6b, #4ecdc4) !important;
          color: white !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 2px solid #ffd93d !important;
          margin: 2px 0 !important;
        `
        vditorTestBar.textContent = '📍 Vditor内部测试栏'

        // 尝试多种插入方式
        if (vditor.children.length > 0) {
          vditor.insertBefore(vditorTestBar, vditor.children[0])
          console.log('✅ 已在vditor内部插入测试栏')
        } else {
          vditor.appendChild(vditorTestBar)
          console.log('✅ 已在vditor末尾添加测试栏')
        }

      }, 200)
    },



    reloadContent() {
      if (this.vditor && this.vditor.getValue) {
        const content = localStorage.getItem('vditorvditor') || ''
        this.vditor.setValue(content)
        this.vditor.focus()

        // 重新加载内容
      }
    },
  },
}
</script>

<style lang="less">
@import './../assets/styles/style.less';

.index-page {
  width: 100%;
  height: 100%;
  background-color: @white;
  .flex-box-center(column);

  /* vditor元数据栏样式 */
  .vditor-metadata-bar {
    .metadata-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .metadata-label {
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
    }

    .metadata-type-select {
      padding: 4px 8px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      background: white;
      font-size: 12px;
      min-width: 100px;
    }

    .metadata-fields {
      display: flex;
      gap: 8px;
      flex: 1;
    }

    .metadata-input {
      padding: 4px 6px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      font-size: 11px;
      width: 80px;

      &:focus {
        outline: none;
        border-color: #409eff;
      }
    }

    .metadata-btn {
      padding: 4px 8px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      background: white;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;

      &:hover {
        background: #f5f7fa;
      }
    }

    .metadata-debug {
      margin-left: auto;
      font-size: 10px;
      color: #909399;
      background: rgba(64, 158, 255, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }
  }

  .vditor {
    position: absolute;
    top: @header-height;
    max-width: @max-body-width;
    width: 80%;
    height: calc(100vh - 80px);
    margin: 20px auto;
    text-align: left;

    .vditor-toolbar {
      border-left: 1px solid #d1d5da;
      border-right: 1px solid #d1d5da;
    }

    .vditor-content {
      height: auto;
      min-height: auto;
      border: 1px solid #d1d5da;
      border-top: none;
    }
  }

  .vditor-reset {
    font-size: 14px;
  }

  .vditor-textarea {
    font-size: 14px;
    height: 100% !important;
  }
}

@media (max-width: 960px) {
  .index-page {
    .vditor {
      top: @header-height;
      height: calc(100vh - 80px);
      padding: 10px;
      margin: 0px auto;
      width: 100%;
    }

    .vditor-metadata-bar {
      .metadata-content {
        flex-wrap: wrap;
        gap: 6px;
      }

      .metadata-fields {
        width: 100%;
        margin-left: 0 !important;
      }

      .metadata-input {
        flex: 1;
        min-width: 60px;
      }
    }
  }
}
</style>
