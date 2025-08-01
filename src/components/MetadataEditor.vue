<!-- @format -->

<template>
  <el-dialog
    title="编辑元数据"
    :visible.sync="visible"
    width="600px"
    :before-close="handleClose"
    class="metadata-dialog"
  >
    <el-form
      ref="metadataForm"
      :model="formData"
      :rules="rules"
      label-width="80px"
      class="metadata-form"
    >
      <el-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :prop="field.key"
        :required="field.required"
      >
        <!-- 文本输入 -->
        <el-input
          v-if="field.type === 'text'"
          v-model="formData[field.key]"
          :placeholder="`请输入${field.label}`"
        />

        <!-- 多行文本输入 -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          type="textarea"
          :rows="3"
          :placeholder="`请输入${field.label}`"
        />

        <!-- 日期时间选择器 -->
        <el-date-picker
          v-else-if="field.type === 'datetime'"
          v-model="formData[field.key]"
          type="datetime"
          placeholder="选择日期时间"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          style="width: 100%"
        />

        <!-- 标签输入 -->
        <div v-else-if="field.type === 'tags'" class="tags-input">
          <el-tag
            v-for="tag in formData[field.key]"
            :key="tag"
            closable
            @close="removeTag(field.key, tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible[field.key]"
            ref="tagInput"
            v-model="tagInputValue[field.key]"
            size="small"
            @keyup.enter.native="addTag(field.key)"
            @blur="addTag(field.key)"
            class="tag-input"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput(field.key)"
            class="add-tag-btn"
          >
            + 添加标签
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { metadataFields } from '@config/constant'

export default {
  name: 'MetadataEditor',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    contentType: {
      type: String,
      required: true
    },
    metadata: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      formData: {},
      tagInputVisible: {},
      tagInputValue: {},
      rules: {}
    }
  },

  computed: {
    fields() {
      return metadataFields[this.contentType] || []
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initFormData()
        this.initRules()
      }
    },

    metadata: {
      handler() {
        this.initFormData()
      },
      deep: true
    }
  },

  methods: {
    initFormData() {
      this.formData = {}
      this.tagInputVisible = {}
      this.tagInputValue = {}

      this.fields.forEach(field => {
        if (field.type === 'tags') {
          this.formData[field.key] = Array.isArray(this.metadata[field.key])
            ? [...this.metadata[field.key]]
            : []
          this.tagInputVisible[field.key] = false
          this.tagInputValue[field.key] = ''
        } else {
          this.formData[field.key] = this.metadata[field.key] || ''
        }
      })
    },

    initRules() {
      this.rules = {}
      this.fields.forEach(field => {
        if (field.required) {
          this.rules[field.key] = [
            {
              required: true,
              message: `请输入${field.label}`,
              trigger: field.type === 'tags' ? 'change' : 'blur'
            }
          ]
        }
      })
    },

    showTagInput(fieldKey) {
      this.tagInputVisible[fieldKey] = true
      this.$nextTick(() => {
        const inputs = this.$refs.tagInput
        if (inputs) {
          const input = Array.isArray(inputs) ? inputs[inputs.length - 1] : inputs
          input.focus()
        }
      })
    },

    addTag(fieldKey) {
      const value = this.tagInputValue[fieldKey]
      if (value && !this.formData[fieldKey].includes(value)) {
        this.formData[fieldKey].push(value)
      }
      this.tagInputVisible[fieldKey] = false
      this.tagInputValue[fieldKey] = ''
    },

    removeTag(fieldKey, tag) {
      const index = this.formData[fieldKey].indexOf(tag)
      if (index > -1) {
        this.formData[fieldKey].splice(index, 1)
      }
    },

    handleSave() {
      this.$refs.metadataForm.validate(valid => {
        if (valid) {
          this.$emit('save', { ...this.formData })
          this.$emit('update:visible', false)
        }
      })
    },

    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="less" scoped>
.metadata-dialog {
  .metadata-form {
    .tags-input {
      .tag-item {
        margin-right: 8px;
        margin-bottom: 8px;
      }

      .tag-input {
        width: 120px;
        margin-right: 8px;
      }

      .add-tag-btn {
        height: 24px;
        line-height: 22px;
        border-style: dashed;
      }
    }
  }

  .dialog-footer {
    text-align: right;
  }
}
</style>
