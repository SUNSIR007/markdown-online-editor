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
    this.initVditor()
    this.$nextTick(() => {
      this.isLoading = false
      console.log('✅ Main.vue 加载完成，元数据栏应该可见')
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

          // 在vditor工具栏下方插入元数据栏
          this.insertMetadataBar()

          // 添加全局调试函数
          window.debugVditorStructure = () => {
            const vditor = document.getElementById('vditor')
            console.log('🔍 Vditor调试信息:')
            console.log('- Vditor元素:', vditor)
            console.log('- 子元素数量:', vditor?.children.length)
            console.log('- 类名列表:', Array.from(vditor?.children || []).map(el => el.className))
            console.log('- HTML结构:', vditor?.innerHTML.substring(0, 500))
          }
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

        const toolbar = vditorElement.querySelector('.vditor-toolbar')
        console.log('🔍 工具栏元素:', toolbar)

        // 尝试查找其他可能的工具栏选择器
        if (!toolbar) {
          const alternativeToolbar = vditorElement.querySelector('.vditor--toolbar') ||
                                   vditorElement.querySelector('[class*="toolbar"]') ||
                                   vditorElement.querySelector('.vditor-reset')
          console.log('🔍 备用工具栏元素:', alternativeToolbar)

          if (!alternativeToolbar) {
            console.error('❌ 未找到任何工具栏元素，重试中...')
            console.log('🔍 Vditor内部结构:', vditorElement.innerHTML.substring(0, 500))
            // 如果没找到，再次尝试
            setTimeout(() => this.insertMetadataBar(), 500)
            return
          }
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
          <div class="metadata-content">
            <span class="metadata-label">📝 元数据栏</span>
            <select class="metadata-type-select">
              <option value="general">📄 通用文档</option>
              <option value="blog">📝 博客文章</option>
              <option value="essay">✍️ 随笔</option>
            </select>
            <div class="metadata-fields" style="display: none;">
              <input placeholder="标题" class="metadata-input" />
              <input placeholder="分类" class="metadata-input" />
              <input placeholder="日期" class="metadata-input" />
              <input placeholder="描述" class="metadata-input" />
            </div>
            <button class="metadata-btn">插入模板</button>
            <button class="metadata-btn">清空</button>
            <span class="metadata-debug">测试成功</span>
          </div>
        `

        // 添加样式
        metadataBar.style.cssText = `
          height: 40px;
          background: #f8f9fa;
          border-left: 1px solid #d1d5da;
          border-right: 1px solid #d1d5da;
          border-bottom: 1px solid #d1d5da;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 12px;
          overflow-x: auto;
        `

        // 插入到工具栏下方
        const targetToolbar = toolbar || alternativeToolbar
        targetToolbar.parentNode.insertBefore(metadataBar, targetToolbar.nextSibling)

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
      }, 100) // 延迟100ms确保DOM渲染完成
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
