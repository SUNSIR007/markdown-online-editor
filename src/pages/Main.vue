<!-- @format -->

<template>
  <div class="index-page" v-loading="isLoading">
    <HeaderNav />

    <!-- 最简单的测试元素 -->
    <div style="position: fixed; top: 60px; left: 0; right: 0; height: 60px; background: red; z-index: 9999; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
      🚨 紧急测试：如果您看到这个红色条，说明元数据栏位置正确！当前类型: {{ testType }}
    </div>

    <!-- 原来的测试元数据栏 -->
    <div class="test-metadata-bar">
      <div class="test-content">
        <span class="test-label">🎯 元数据栏测试 - 如果您看到这行文字，说明元数据栏正常显示！</span>
        <select v-model="testType" @change="onTestTypeChange" class="test-select">
          <option value="general">📄 通用文档</option>
          <option value="blog">📝 博客文章</option>
          <option value="essay">✍️ 随笔</option>
        </select>
        <span class="test-debug">当前: {{ testType }}</span>
      </div>
    </div>
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
      testType: 'general', // 测试用的数据
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
    onTestTypeChange() {
      console.log('🔄 内容类型切换为:', this.testType)
      alert(`内容类型已切换为: ${this.testType}`)
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

  /* 测试元数据栏样式 - 使用明显的颜色 */
  .test-metadata-bar {
    position: fixed !important;
    top: 120px !important; /* 在红色测试栏下方 */
    left: 0 !important;
    right: 0 !important;
    height: 60px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border-bottom: 3px solid #ff6b6b !important;
    z-index: 9998 !important; /* 比红色测试栏低一点 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;

    .test-content {
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      max-width: @max-body-width;
      margin: 0 auto;
    }

    .test-label {
      font-weight: 700;
      color: white;
      font-size: 14px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .test-select {
      padding: 8px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      background: white;
      font-size: 14px;
      min-width: 140px;

      &:focus {
        outline: none;
        border-color: #409eff;
      }
    }

    .test-debug {
      margin-left: auto;
      font-size: 12px;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }

  .vditor {
    position: absolute;
    top: 180px; /* 60px工具栏 + 60px红色测试栏 + 60px元数据栏 */
    max-width: @max-body-width;
    width: 80%;
    height: calc(100vh - 200px); /* 调整高度以适应两个测试栏 */
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
    .test-metadata-bar {
      height: auto;
      min-height: 80px;

      .test-content {
        flex-direction: column;
        align-items: stretch;
        padding: 12px;
        gap: 8px;
      }

      .test-select {
        width: 100%;
      }

      .test-debug {
        margin-left: 0;
        text-align: center;
      }
    }

    .vditor {
      top: 140px; /* 调整移动端的顶部位置 */
      height: calc(100vh - 160px);
      padding: 10px;
      margin: 0px auto;
      width: 100%;
    }
  }
}
</style>
