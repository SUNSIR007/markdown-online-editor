<!-- @format -->

<template>
  <div class="simple-metadata-bar">
    <div class="content">
      <span class="label">📝 元数据栏测试</span>
      
      <select v-model="selectedType" @change="onTypeChange" class="type-select">
        <option value="general">📄 通用文档</option>
        <option value="blog">📝 博客文章</option>
        <option value="essay">✍️ 随笔</option>
      </select>
      
      <div v-if="selectedType !== 'general'" class="fields">
        <input 
          v-for="field in currentFields" 
          :key="field.key"
          :placeholder="field.placeholder"
          v-model="values[field.key]"
          class="field-input"
        />
      </div>
      
      <button @click="insertTemplate" class="btn">插入模板</button>
      <button @click="clearAll" class="btn">清空</button>
      
      <span class="debug">{{ selectedType }} | {{ Object.keys(values).length }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleMetadataBar',
  
  data() {
    return {
      selectedType: 'general',
      values: {},
      fields: {
        blog: [
          { key: 'title', placeholder: '标题' },
          { key: 'categories', placeholder: '分类' },
          { key: 'pubDate', placeholder: '日期' },
          { key: 'description', placeholder: '描述' }
        ],
        essay: [
          { key: 'title', placeholder: '标题' },
          { key: 'categories', placeholder: '分类' },
          { key: 'pubDate', placeholder: '日期' }
        ]
      }
    }
  },
  
  computed: {
    currentFields() {
      return this.fields[this.selectedType] || []
    }
  },
  
  mounted() {
    console.log('SimpleMetadataBar mounted successfully!')
  },
  
  methods: {
    onTypeChange() {
      console.log('Type changed to:', this.selectedType)
      this.values = {}
      this.currentFields.forEach(field => {
        this.$set(this.values, field.key, '')
      })
    },
    
    insertTemplate() {
      const now = new Date().toISOString().split('T')[0]
      if (this.selectedType === 'blog') {
        this.values = {
          title: '',
          categories: '技术',
          pubDate: now,
          description: ''
        }
      } else if (this.selectedType === 'essay') {
        this.values = {
          title: '',
          categories: '随笔',
          pubDate: now
        }
      }
      console.log('Template inserted:', this.values)
    },
    
    clearAll() {
      this.values = {}
      console.log('Metadata cleared')
    }
  }
}
</script>

<style lang="less" scoped>
.simple-metadata-bar {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  height: 60px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .content {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
    overflow-x: auto;
  }
  
  .label {
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
  }
  
  .type-select {
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    font-size: 14px;
    min-width: 120px;
  }
  
  .fields {
    display: flex;
    gap: 8px;
    flex: 1;
  }
  
  .field-input {
    padding: 6px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 12px;
    width: 120px;
    
    &:focus {
      outline: none;
      border-color: #409eff;
    }
  }
  
  .btn {
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
    
    &:hover {
      background: #f5f7fa;
    }
  }
  
  .debug {
    font-size: 11px;
    color: #909399;
    margin-left: auto;
  }
}

@media (max-width: 960px) {
  .simple-metadata-bar {
    height: auto;
    min-height: 100px;
    
    .content {
      flex-direction: column;
      align-items: stretch;
      padding: 12px;
      gap: 8px;
    }
    
    .fields {
      flex-direction: column;
    }
    
    .field-input {
      width: 100%;
    }
    
    .debug {
      margin-left: 0;
      text-align: center;
    }
  }
}
</style>
