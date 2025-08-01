/** @format */

import { contentTypes } from './constant'

// 获取当前日期时间字符串
const getCurrentDateTime = () => {
  const now = new Date()
  return now.toISOString().slice(0, 19).replace('T', ' ')
}

// 获取当前日期字符串
const getCurrentDate = () => {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

// 博客文章模板
export const blogTemplate = {
  metadata: {
    title: '新博客文章',
    categories: ['技术'],
    pubDate: getCurrentDateTime(),
    description: ''
  },
  content: `---
title: 新博客文章
categories: ["技术"]
pubDate: ${getCurrentDateTime()}
description: ""
---

# 新博客文章

在这里开始编写您的博客文章内容...

## 章节标题

您的内容...

### 子章节

更多内容...
`
}

// 随笔模板
export const essayTemplate = {
  metadata: {
    title: '新随笔',
    categories: ['Daily'],
    pubDate: getCurrentDate(),
    description: ''
  },
  content: `---
title: 新随笔
categories: ["Daily"]
pubDate: ${getCurrentDate()}
description: ""
---

在这里开始编写您的随笔内容...
`
}

// 通用文档模板
export const generalTemplate = {
  metadata: {},
  content: `# 新文档

在这里开始编写您的内容...
`
}

// 模板映射
export const templates = {
  [contentTypes.BLOG]: blogTemplate,
  [contentTypes.ESSAY]: essayTemplate,
  [contentTypes.GENERAL]: generalTemplate
}

// 根据内容类型获取模板
export const getTemplate = (contentType) => {
  return templates[contentType] || generalTemplate
}

// 生成带有元数据的完整内容
export const generateContentWithMetadata = (contentType, metadata, content) => {
  if (contentType === contentTypes.GENERAL) {
    return content
  }

  const frontMatter = Object.keys(metadata)
    .filter(key => metadata[key] !== undefined && metadata[key] !== '')
    .map(key => {
      const value = metadata[key]
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`
      } else if (typeof value === 'string' && value.includes(' ')) {
        return `${key}: "${value}"`
      } else {
        return `${key}: ${value}`
      }
    })
    .join('\n')

  return `---
${frontMatter}
---

${content.replace(/^---[\s\S]*?---\n/, '')}`
}

// 从内容中解析元数据
export const parseMetadataFromContent = (content) => {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!frontMatterMatch) {
    return { metadata: {}, content }
  }

  const frontMatterText = frontMatterMatch[1]
  const contentWithoutFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
  
  const metadata = {}
  const lines = frontMatterText.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      
      // 处理数组格式 ["item1", "item2"]
      if (value.startsWith('[') && value.endsWith(']')) {
        const arrayContent = value.slice(1, -1)
        metadata[key] = arrayContent
          .split(',')
          .map(item => item.trim().replace(/^"(.*)"$/, '$1'))
          .filter(item => item)
      }
      // 处理带引号的字符串
      else if (value.startsWith('"') && value.endsWith('"')) {
        metadata[key] = value.slice(1, -1)
      }
      // 处理普通值
      else {
        metadata[key] = value
      }
    }
  }

  return { metadata, content: contentWithoutFrontMatter }
}
