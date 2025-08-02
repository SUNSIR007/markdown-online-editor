<!-- @format -->

<template>
  <div class="export-page">
    <div class="button-group">
      <el-button round @click="handleBack">返回主页</el-button>
      <el-button 
        round 
        @click="handleExport" 
        type="primary" 
        :loading="loading"
        :disabled="disabled"
      >
        {{ loading ? loadingText : exportText }}
      </el-button>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ExportPageLayout',
  
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: '正在导出...'
    },
    exportText: {
      type: String,
      default: '生成导出'
    }
  },

  methods: {
    handleBack() {
      this.$emit('back')
      // 默认行为：返回主页
      if (!this.$listeners.back) {
        this.$router.push('/')
      }
    },
    
    handleExport() {
      this.$emit('export')
    }
  }
}
</script>

<style lang="less">
@import './../assets/styles/style.less';

.export-page {
  width: 100%;
  height: 100%;
  background-color: @white;
  .flex-box-center(column);

  .button-group {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    gap: 10px;
    
    .el-button {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

@media (max-width: 960px) {
  .export-page {
    .button-group {
      position: relative;
      top: auto;
      right: auto;
      margin: 10px;
      justify-content: center;
    }
  }
}
</style>
