// 手动插入元数据栏的测试脚本
// 在浏览器控制台中执行这个脚本

function manualInsertMetadataBar() {
  console.log('🚀 手动插入元数据栏测试开始')
  
  // 1. 查找vditor元素
  const vditorElement = document.getElementById('vditor')
  console.log('1. Vditor元素:', vditorElement)
  
  if (!vditorElement) {
    console.error('❌ 未找到vditor元素')
    return false
  }
  
  // 2. 查找所有可能的工具栏
  const possibleToolbars = [
    vditorElement.querySelector('.vditor-toolbar'),
    vditorElement.querySelector('.vditor--toolbar'),
    vditorElement.querySelector('[class*="toolbar"]'),
    vditorElement.querySelector('.vditor-reset'),
    vditorElement.querySelector('.vditor-ir'),
    vditorElement.querySelector('.vditor-sv'),
    vditorElement.querySelector('.vditor-wysiwyg')
  ]
  
  console.log('2. 可能的工具栏元素:', possibleToolbars)
  
  // 3. 找到第一个存在的工具栏
  const toolbar = possibleToolbars.find(el => el !== null)
  console.log('3. 选中的工具栏:', toolbar)
  
  if (!toolbar) {
    console.error('❌ 未找到任何工具栏元素')
    console.log('Vditor内部结构:', vditorElement.innerHTML.substring(0, 1000))
    return false
  }
  
  // 4. 检查是否已经存在元数据栏
  const existingMetadataBar = vditorElement.querySelector('.vditor-metadata-bar')
  if (existingMetadataBar) {
    console.log('⚠️ 元数据栏已存在，先移除')
    existingMetadataBar.remove()
  }
  
  // 5. 创建元数据栏
  const metadataBar = document.createElement('div')
  metadataBar.className = 'vditor-metadata-bar'
  metadataBar.style.cssText = `
    height: 40px;
    background: #ff6b6b;
    border: 2px solid #409eff;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    z-index: 1000;
    position: relative;
  `
  
  metadataBar.innerHTML = `
    <span>🎯 手动插入的元数据栏测试 - 如果您看到这个，说明插入成功！</span>
    <select style="margin-left: 12px; padding: 4px;">
      <option>📄 通用文档</option>
      <option>📝 博客文章</option>
      <option>✍️ 随笔</option>
    </select>
  `
  
  // 6. 插入元数据栏
  try {
    toolbar.parentNode.insertBefore(metadataBar, toolbar.nextSibling)
    console.log('✅ 元数据栏插入成功！')
    
    // 7. 验证插入结果
    const insertedBar = vditorElement.querySelector('.vditor-metadata-bar')
    console.log('7. 验证插入结果:', insertedBar)
    
    return true
  } catch (error) {
    console.error('❌ 插入失败:', error)
    return false
  }
}

// 执行测试
console.log('='.repeat(50))
console.log('开始手动插入元数据栏测试')
console.log('='.repeat(50))

const result = manualInsertMetadataBar()

if (result) {
  console.log('🎉 测试成功！您应该能看到红色的元数据栏')
} else {
  console.log('💥 测试失败，请检查控制台输出')
}

console.log('='.repeat(50))

// 提供清理函数
window.removeTestMetadataBar = function() {
  const bar = document.querySelector('.vditor-metadata-bar')
  if (bar) {
    bar.remove()
    console.log('🧹 测试元数据栏已移除')
  }
}

console.log('💡 如果需要移除测试元数据栏，请执行: removeTestMetadataBar()')
