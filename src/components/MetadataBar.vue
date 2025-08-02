<!-- @format -->

<template>
  <div class="metadata-bar" :class="{ 'mobile': isMobile }">
    <!-- 内容类型选择器 -->
    <div class="content-type-selector">
      <el-select 
        v-model="currentContentType" 
        @change="onContentTypeChange"
        size="small"
        class="type-select"
      >
        <el-option value="general" label="通用文档">
          <icon name="document" class="option-icon" />
          <span>通用文档</span>
        </el-option>
        <el-option value="blog" label="博客文章">
          <icon name="document" class="option-icon" />
          <span>博客文章</span>
        </el-option>
        <el-option value="essay" label="随笔">
          <icon name="document" class="option-icon" />
          <span>随笔</span>
        </el-option>
      </el-select>
    </div>

    <!-- 元数据输入字段 -->
    <div v-if="currentContentType !== 'general'" class="metadata-fields">
      <div 
        v-for="field in currentFields" 
        :key="field.key"
        class="metadata-field"
      >
        <label class="field-label">{{ field.label }}:</label>
        <el-input
          v-model="metadataValues[field.key]"
          :placeholder="field.placeholder"
          @input="onMetadataChange"
          size="small"
          class="field-input"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button 
        v-if="currentContentType !== 'general'"
        @click="insertTemplate"
        size="small"
        type="text"
        class="action-btn"
      >
        插入模板
      </el-button>
      <el-button 
        v-if="hasMetadata"
        @click="clearMetadata"
        size="small"
        type="text"
        class="action-btn"
      >
        清空
      </el-button>
    </div>
  </div>
</template>

<script>
import configManager from '@/utils/configManager'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'MetadataBar',

  data() {
    return {
      isMobile: window.innerWidth <= 960,
      currentContentType: 'general',
      metadataValues: {},
      contentTypes: configManager.get('contentTypes'),
      metadataFields: configManager.get('metadataFields')
    }
  },

  computed: {
    currentFields() {
      return this.metadataFields[this.currentContentType] || []
    },

    hasMetadata() {
      return Object.values(this.metadataValues).some(value => value && value.trim())
    }
  },

  mounted() {
    this.parseExistingMetadata()
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('keydown', this.handleKeydown)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('keydown', this.handleKeydown)
  },

  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 960
    },

    handleKeydown(event) {
      // Ctrl/Cmd + Shift + M: 切换内容类型
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault()
        const types = ['general', 'blog', 'essay']
        const currentIndex = types.indexOf(this.currentContentType)
        const nextIndex = (currentIndex + 1) % types.length
        this.onContentTypeChange(types[nextIndex])
      }
    },

    onContentTypeChange(newType) {
      this.currentContentType = newType
      this.initMetadataValues()
      
      if (newType !== 'general') {
        this.insertTemplate()
      } else {
        this.removeMetadataFromContent()
      }
    },

    initMetadataValues() {
      this.metadataValues = {}
      this.currentFields.forEach(field => {
        this.metadataValues[field.key] = ''
      })
    },

    parseExistingMetadata() {
      try {
        const content = this.getEditorContent()
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
        
        if (frontmatterMatch) {
          const frontmatterText = frontmatterMatch[1]
          const metadata = this.parseFrontmatter(frontmatterText)
          
          // 根据元数据判断内容类型
          if (metadata.title || metadata.categories || metadata.pubDate) {
            if (metadata.description !== undefined) {
              this.currentContentType = 'blog'
            } else {
              this.currentContentType = 'essay'
            }
            this.initMetadataValues()
            Object.assign(this.metadataValues, metadata)
          }
        }
      } catch (error) {
        ErrorHandler.handle(error, '解析元数据', { showUser: false })
      }
    },

    parseFrontmatter(frontmatterText) {
      const metadata = {}
      const lines = frontmatterText.split('\n')

      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/)
        if (match) {
          const [, key, value] = match
          let parsedValue = value.trim()

          // 移除引号
          if ((parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
              (parsedValue.startsWith("'") && parsedValue.endsWith("'"))) {
            parsedValue = parsedValue.slice(1, -1)
          }

          metadata[key] = parsedValue
        }
      }

      return metadata
    },

    onMetadataChange() {
      this.updateEditorContent()
    },

    updateEditorContent() {
      try {
        const content = this.getEditorContent()
        const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
        
        if (this.hasMetadata) {
          const frontmatter = this.generateFrontmatter()
          const newContent = `---\n${frontmatter}\n---\n\n${contentWithoutFrontmatter}`
          this.setEditorContent(newContent)
        } else {
          this.setEditorContent(contentWithoutFrontmatter)
        }
      } catch (error) {
        ErrorHandler.handle(error, '更新编辑器内容')
      }
    },

    generateFrontmatter() {
      const lines = []
      this.currentFields.forEach(field => {
        const value = this.metadataValues[field.key]
        if (value && value.trim()) {
          let formattedValue = value.trim()
          
          // 处理分类字段
          if (field.key === 'categories') {
            const categories = formattedValue.split(',').map(cat => cat.trim()).filter(cat => cat)
            formattedValue = JSON.stringify(categories)
          }
          // 处理包含特殊字符的值
          else if (formattedValue.includes(':') || formattedValue.includes('"')) {
            formattedValue = `"${formattedValue}"`
          }
          
          lines.push(`${field.key}: ${formattedValue}`)
        }
      })
      return lines.join('\n')
    },

    insertTemplate() {
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]

      if (this.currentContentType === 'blog') {
        this.metadataValues = {
          title: '',
          categories: '技术',
          pubDate: dateStr,
          description: ''
        }
      } else if (this.currentContentType === 'essay') {
        this.metadataValues = {
          title: '',
          categories: '随笔',
          pubDate: dateStr
        }
      }

      this.updateEditorContent()

      // 聚焦到第一个输入框
      this.$nextTick(() => {
        const firstInput = this.$el.querySelector('.field-input input')
        if (firstInput) {
          firstInput.focus()
        }
      })
    },

    clearMetadata() {
      this.initMetadataValues()
      this.removeMetadataFromContent()
    },

    removeMetadataFromContent() {
      try {
        const content = this.getEditorContent()
        const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
        this.setEditorContent(contentWithoutFrontmatter)
      } catch (error) {
        ErrorHandler.handle(error, '移除元数据')
      }
    },

    getEditorContent() {
      // 获取Vditor编辑器内容
      if (window.vditorInstance && window.vditorInstance.getValue) {
        return window.vditorInstance.getValue()
      }
      return localStorage.getItem('vditorvditor') || ''
    },

    setEditorContent(content) {
      // 设置Vditor编辑器内容
      if (window.vditorInstance && window.vditorInstance.setValue) {
        window.vditorInstance.setValue(content)
      }
      localStorage.setItem('vditorvditor', content)
    }
  }
}
</script>

<style lang="less">
@import './../assets/styles/style.less';

.metadata-bar {
  position: fixed;
  top: @header-height;
  left: 0;
  right: 0;
  height: @header-height;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  z-index: 999;
  overflow-x: auto;
  overflow-y: hidden;

  .content-type-selector {
    flex-shrink: 0;
    
    .type-select {
      width: 120px;
      
      .el-input__inner {
        height: 32px;
        line-height: 32px;
      }
    }
    
    .option-icon {
      width: 14px;
      height: 14px;
      margin-right: 6px;
      vertical-align: middle;
    }
  }

  .metadata-fields {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .metadata-field {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;

      .field-label {
        font-size: 12px;
        color: #606266;
        white-space: nowrap;
        font-weight: 500;
      }

      .field-input {
        width: 140px;
        
        .el-input__inner {
          height: 32px;
          line-height: 32px;
          font-size: 12px;
          padding: 0 8px;
        }
      }
    }
  }

  .action-buttons {
    flex-shrink: 0;
    display: flex;
    gap: 8px;

    .action-btn {
      padding: 6px 12px;
      font-size: 12px;
      height: 32px;
    }
  }

  // 移动端样式
  &.mobile {
    position: fixed;
    top: @header-height;
    padding: 12px 10px;
    flex-direction: column;
    height: auto;
    min-height: 120px;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .content-type-selector {
      width: 100%;

      .type-select {
        width: 100%;

        .el-input__inner {
          height: 36px;
          line-height: 36px;
          font-size: 14px;
        }
      }
    }

    .metadata-fields {
      width: 100%;
      flex-direction: column;
      gap: 12px;

      .metadata-field {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;

        .field-label {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .field-input {
          width: 100%;

          .el-input__inner {
            height: 36px;
            line-height: 36px;
            font-size: 14px;
            padding: 0 12px;
          }
        }
      }
    }

    .action-buttons {
      width: 100%;
      justify-content: center;
      gap: 12px;

      .action-btn {
        padding: 8px 16px;
        font-size: 14px;
        height: 36px;
        min-width: 80px;
      }
    }
  }
}

// 选择器下拉选项样式
.el-select-dropdown__item {
  display: flex;
  align-items: center;
  
  .option-icon {
    margin-right: 6px;
  }
}
</style>
