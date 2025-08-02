<!-- @format -->

<template>
  <div class="index-page" v-loading="isLoading">
    <HeaderNav />
    <MetadataBar ref="metadataBar" />
    <div id="vditor" class="vditor" />
  </div>
</template>

<script>
import Vditor from 'vditor'
import HeaderNav from './partials/HeaderNav'
import MetadataBar from '@components/MetadataBar'
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
    MetadataBar,
  },

  mounted() {
    this.initVditor()
    this.$nextTick(() => {
      this.isLoading = false
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

          // 将vditor实例暴露给MetadataBar组件使用
          window.vditorInstance = this.vditor

          // 通知MetadataBar解析现有元数据
          this.$nextTick(() => {
            if (this.$refs.metadataBar) {
              this.$refs.metadataBar.parseExistingMetadata()
            }
          })
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
    reloadContent() {
      if (this.vditor && this.vditor.getValue) {
        const content = localStorage.getItem('vditorvditor') || ''
        this.vditor.setValue(content)
        this.vditor.focus()

        // 重新解析元数据
        this.$nextTick(() => {
          if (this.$refs.metadataBar) {
            this.$refs.metadataBar.parseExistingMetadata()
          }
        })
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

  .vditor {
    position: absolute;
    top: calc(@header-height * 2); // 为元数据栏留出空间
    max-width: @max-body-width;
    width: 80%;
    height: calc(100vh - 140px); // 调整高度以适应元数据栏
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
      top: calc(@header-height + 120px); // 移动端元数据栏高度更大
      height: calc(100vh - 180px);
      padding: 10px;
      margin: 0px auto;
      width: 100%;
    }
  }
}
</style>
