/** @format */

export const appTitle = 'Arya - 在线 Markdown 编辑器'

export const exportTextMap = {
  '/export/png': '导出 PNG',
  '/export/pdf': '导出 PDF',
  '/export/ppt': 'PPT 预览',
}

// 内容类型配置
export const contentTypes = {
  GENERAL: 'general',
  BLOG: 'blog',
  ESSAY: 'essay'
}

export const contentTypeLabels = {
  [contentTypes.GENERAL]: '通用文档',
  [contentTypes.BLOG]: '博客文章',
  [contentTypes.ESSAY]: '随笔'
}

// 博客和随笔的元数据字段配置
export const metadataFields = {
  [contentTypes.BLOG]: [
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'categories', label: '分类', type: 'tags', required: true },
    { key: 'pubDate', label: '发布日期', type: 'datetime', required: true },
    { key: 'description', label: '描述', type: 'textarea', required: true }
  ],
  [contentTypes.ESSAY]: [
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'categories', label: '分类', type: 'tags', required: true },
    { key: 'pubDate', label: '发布日期', type: 'datetime', required: true },
    { key: 'description', label: '描述', type: 'textarea', required: false }
  ]
}
