# 🔍 元数据栏调试指南

## 当前状态

元数据栏输出为null，说明插入没有成功。让我们逐步排查问题。

## 📋 调试步骤

### 步骤1: 基础检查

在浏览器控制台执行以下命令：

```javascript
// 检查Vditor元素
console.log('Vditor元素:', document.getElementById('vditor'))

// 检查Vditor内部结构
const vditor = document.getElementById('vditor')
if (vditor) {
  console.log('子元素:', Array.from(vditor.children).map(el => ({
    tagName: el.tagName,
    className: el.className,
    id: el.id
  })))
}
```

### 步骤2: 查找工具栏

```javascript
// 查找所有可能的工具栏元素
const vditor = document.getElementById('vditor')
const selectors = [
  '.vditor-toolbar',
  '.vditor--toolbar', 
  '[class*="toolbar"]',
  '.vditor-reset',
  '.vditor-ir',
  '.vditor-sv',
  '.vditor-wysiwyg'
]

selectors.forEach(selector => {
  const element = vditor?.querySelector(selector)
  console.log(`${selector}:`, element)
})
```

### 步骤3: 手动插入测试

复制并执行 `manual-insert-test.js` 中的代码，或者直接在控制台执行：

```javascript
// 手动插入红色测试栏
const vditor = document.getElementById('vditor')
const testBar = document.createElement('div')
testBar.style.cssText = `
  height: 40px;
  background: red;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  position: relative;
  z-index: 1000;
`
testBar.textContent = '🚨 手动插入测试 - 如果看到这个说明插入方法有效'

// 尝试插入到vditor内部
if (vditor && vditor.children.length > 0) {
  vditor.insertBefore(testBar, vditor.children[1] || vditor.children[0])
  console.log('✅ 手动插入完成')
} else {
  console.log('❌ 无法插入')
}
```

### 步骤4: 检查Vditor版本和配置

```javascript
// 检查Vditor实例
console.log('Vditor实例:', window.vditorInstance)

// 检查Vditor版本
if (window.Vditor) {
  console.log('Vditor版本:', window.Vditor.version || 'unknown')
}

// 检查DOM结构
const vditor = document.getElementById('vditor')
console.log('Vditor HTML:', vditor?.outerHTML.substring(0, 1000))
```

## 🎯 可能的问题和解决方案

### 问题1: 工具栏选择器不正确

**现象**: 找不到 `.vditor-toolbar` 元素
**解决**: 使用备用选择器或查看实际的DOM结构

### 问题2: Vditor版本差异

**现象**: 不同版本的Vditor可能有不同的DOM结构
**解决**: 适配当前版本的结构

### 问题3: 时机问题

**现象**: DOM还没有完全渲染
**解决**: 增加延迟或使用MutationObserver

### 问题4: CSS冲突

**现象**: 元素插入了但不可见
**解决**: 使用更强的样式声明

## 🛠️ 备用方案

如果上述方法都不行，我们可以尝试：

### 方案A: 在Vditor容器外部插入

```javascript
const vditor = document.getElementById('vditor')
const metadataBar = document.createElement('div')
// 配置元数据栏...
vditor.parentNode.insertBefore(metadataBar, vditor)
```

### 方案B: 使用CSS定位

```javascript
const metadataBar = document.createElement('div')
metadataBar.style.cssText = `
  position: absolute;
  top: 40px; /* 工具栏高度 */
  left: 0;
  right: 0;
  height: 40px;
  background: #f8f9fa;
  z-index: 1000;
`
vditor.style.position = 'relative'
vditor.appendChild(metadataBar)
```

### 方案C: 修改Vditor配置

在初始化时添加自定义工具栏项目。

## 📞 下一步

请执行上述调试步骤，并告诉我：

1. **Vditor元素的结构**是什么样的？
2. **工具栏元素**能找到吗？使用哪个选择器？
3. **手动插入测试**是否成功？
4. **控制台有什么错误信息**？

根据这些信息，我可以提供更精确的解决方案。
