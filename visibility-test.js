// 元数据栏可见性测试脚本
// 在浏览器控制台中执行

function testMetadataBarVisibility() {
  console.log('🔍 开始检查元数据栏可见性...')
  
  // 1. 查找现有的元数据栏
  const existingBar = document.querySelector('.vditor-metadata-bar')
  console.log('1. 现有元数据栏:', existingBar)
  
  if (existingBar) {
    console.log('- 元素样式:', window.getComputedStyle(existingBar))
    console.log('- 位置信息:', existingBar.getBoundingClientRect())
    console.log('- 是否可见:', existingBar.offsetWidth > 0 && existingBar.offsetHeight > 0)
    
    // 强制设置高对比度样式
    existingBar.style.cssText = `
      height: 50px !important;
      background: linear-gradient(45deg, #ff0000, #00ff00) !important;
      color: white !important;
      font-size: 16px !important;
      font-weight: bold !important;
      display: flex !important;
      align-items: center !important;
      padding: 0 20px !important;
      border: 3px solid yellow !important;
      z-index: 9999 !important;
      position: relative !important;
    `
    
    existingBar.innerHTML = `
      <span style="color: white; font-size: 18px; font-weight: bold;">
        🌟 元数据栏可见性测试 - 如果您看到这个，说明元数据栏工作正常！
      </span>
    `
    
    console.log('✅ 已应用高对比度样式')
    return true
  }
  
  // 2. 如果没有找到，手动创建一个测试栏
  console.log('2. 未找到现有元数据栏，创建新的测试栏...')
  
  const vditor = document.getElementById('vditor')
  if (!vditor) {
    console.error('❌ 未找到vditor元素')
    return false
  }
  
  // 移除之前的测试栏
  const oldTestBars = document.querySelectorAll('[class*="test-metadata"]')
  oldTestBars.forEach(bar => bar.remove())
  
  // 创建新的高可见性测试栏
  const testBar = document.createElement('div')
  testBar.className = 'test-metadata-bar'
  testBar.style.cssText = `
    height: 50px;
    background: linear-gradient(45deg, #ff4757, #3742fa);
    color: white;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #ffa502;
    z-index: 9999;
    position: relative;
    animation: pulse 1s infinite;
  `
  
  // 添加CSS动画
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
  `
  document.head.appendChild(style)
  
  testBar.innerHTML = `
    <span>🎯 高可见性元数据栏测试 - 现在应该非常明显了！</span>
    <select style="margin-left: 15px; padding: 5px; font-size: 14px;">
      <option>📄 通用文档</option>
      <option>📝 博客文章</option>
      <option>✍️ 随笔</option>
    </select>
  `
  
  // 插入到vditor顶部
  if (vditor.children.length > 0) {
    vditor.insertBefore(testBar, vditor.children[0])
  } else {
    vditor.appendChild(testBar)
  }
  
  console.log('✅ 高可见性测试栏已创建')
  
  // 3秒后恢复正常样式
  setTimeout(() => {
    testBar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    testBar.style.border = '1px solid #409eff'
    testBar.innerHTML = `
      <span style="color: white;">📝 元数据栏 (正常样式)</span>
      <select style="margin-left: 15px; padding: 5px;">
        <option>📄 通用文档</option>
        <option>📝 博客文章</option>
        <option>✍️ 随笔</option>
      </select>
    `
    console.log('🔄 已恢复正常样式')
  }, 3000)
  
  return true
}

// 执行测试
console.log('='.repeat(60))
console.log('🚀 元数据栏可见性测试开始')
console.log('='.repeat(60))

const result = testMetadataBarVisibility()

if (result) {
  console.log('✅ 测试完成！请查看页面上是否出现了明显的彩色元数据栏')
} else {
  console.log('❌ 测试失败')
}

// 提供清理函数
window.cleanupVisibilityTest = function() {
  const testBars = document.querySelectorAll('.test-metadata-bar, .vditor-metadata-bar')
  testBars.forEach(bar => bar.remove())
  console.log('🧹 所有测试元数据栏已清理')
}

console.log('💡 如需清理测试栏，执行: cleanupVisibilityTest()')
console.log('='.repeat(60))
