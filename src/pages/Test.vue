<!-- @format -->

<template>
  <div class="test-page">
    <h1>组件测试页面</h1>
    
    <div class="test-section">
      <h2>内容类型选择器</h2>
      <ContentTypeSelector
        v-model="currentContentType"
        @type-change="onContentTypeChange"
        @show-metadata-editor="showMetadataEditor"
        @show-publish-dialog="showPublishDialog"
      />
      <p>当前选择的类型: {{ currentContentType }}</p>
    </div>

    <div class="test-section">
      <h2>元数据编辑器</h2>
      <el-button @click="showMetadataEditor">打开元数据编辑器</el-button>
      <MetadataEditor
        :visible.sync="metadataDialogVisible"
        :content-type="currentContentType"
        :metadata="currentMetadata"
        @save="onMetadataSave"
      />
      <div v-if="Object.keys(currentMetadata).length > 0">
        <h3>当前元数据:</h3>
        <pre>{{ JSON.stringify(currentMetadata, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import ContentTypeSelector from '@/components/ContentTypeSelector'
import MetadataEditor from '@/components/MetadataEditor'
import { contentTypes } from '@config/constant'

export default {
  name: 'TestPage',

  components: {
    ContentTypeSelector,
    MetadataEditor,
  },

  data() {
    return {
      currentContentType: contentTypes.GENERAL,
      currentMetadata: {},
      metadataDialogVisible: false,
    }
  },

  methods: {
    onContentTypeChange(newType) {
      console.log('Content type changed to:', newType)
      this.currentContentType = newType
    },

    showMetadataEditor() {
      this.metadataDialogVisible = true
    },

    onMetadataSave(metadata) {
      console.log('Metadata saved:', metadata)
      this.currentMetadata = metadata
    },

    showPublishDialog() {
      this.$message({
        type: 'info',
        message: '发布功能正在开发中...'
      })
    },
  }
}
</script>

<style lang="less" scoped>
.test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .test-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid #e9ecef;
    border-radius: 8px;

    h2 {
      margin-top: 0;
      color: #333;
    }

    pre {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  }
}
</style>
