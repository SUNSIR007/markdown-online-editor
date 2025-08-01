<!-- @format -->

<template>
  <div class="content-type-selector">
    <el-select
      v-model="selectedType"
      placeholder="选择内容类型"
      @change="onTypeChange"
      class="type-selector"
    >
      <el-option
        v-for="(label, type) in contentTypeLabels"
        :key="type"
        :label="label"
        :value="type"
      >
        <span class="option-content">
          <icon :name="getTypeIcon(type)" class="option-icon" />
          {{ label }}
        </span>
      </el-option>
    </el-select>

    <el-button
      v-if="selectedType !== contentTypes.GENERAL"
      type="primary"
      size="small"
      @click="showMetadataEditor"
      class="metadata-btn"
    >
      <icon name="setting" class="btn-icon" />
      元数据
    </el-button>

    <el-button
      v-if="selectedType !== contentTypes.GENERAL"
      type="success"
      size="small"
      @click="showPublishDialog"
      class="publish-btn"
    >
      <icon name="upload" class="btn-icon" />
      发布
    </el-button>
  </div>
</template>

<script>
import { contentTypes, contentTypeLabels } from '@config/constant'

export default {
  name: 'ContentTypeSelector',

  props: {
    value: {
      type: String,
      default: contentTypes.GENERAL,
    },
  },

  data() {
    return {
      selectedType: this.value,
      contentTypes,
      contentTypeLabels,
    }
  },

  watch: {
    value(newVal) {
      this.selectedType = newVal
    },
  },

  methods: {
    onTypeChange(type) {
      this.$emit('input', type)
      this.$emit('type-change', type)
    },

    getTypeIcon(type) {
      const iconMap = {
        [contentTypes.GENERAL]: 'document',
        [contentTypes.BLOG]: 'blog',
        [contentTypes.ESSAY]: 'essay',
      }
      return iconMap[type] || 'document'
    },

    showMetadataEditor() {
      this.$emit('show-metadata-editor')
    },

    showPublishDialog() {
      this.$emit('show-publish-dialog')
    },
  },
}
</script>

<style lang="less" scoped>
.content-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;

  .type-selector {
    min-width: 150px;
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .option-icon {
      width: 16px;
      height: 16px;
      fill: #666;
    }
  }

  .metadata-btn,
  .publish-btn {
    display: flex;
    align-items: center;
    gap: 4px;

    .btn-icon {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }
  }
}

@media (max-width: 768px) {
  .content-type-selector {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;

    .type-selector {
      min-width: 120px;
    }

    .metadata-btn,
    .publish-btn {
      font-size: 12px;
      padding: 4px 8px;
    }
  }
}
</style>
