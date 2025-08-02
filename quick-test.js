// 快速测试脚本 - 在控制台执行
// 这个脚本会创建一个绝对不会错过的测试栏

function quickTest() {
  console.log('🚀 开始快速测试...')
  
  // 清理之前的测试
  document.querySelectorAll('.quick-test-bar').forEach(el => el.remove())
  
  // 创建超级明显的测试栏
  const testBar = document.createElement('div')
  testBar.className = 'quick-test-bar'
  testBar.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 80px !important;
    background: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important;
    background-size: 400% 400% !important;
    color: white !important;
    font-size: 24px !important;
    font-weight: bold !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
    animation: gradientShift 2s ease infinite, bounce 1s ease-in-out infinite !important;
  `
  
  testBar.innerHTML = `
    <div style="text-align: center;">
      <div>🌈 超级明显的测试栏！</div>
      <div style="font-size: 16px;">如果您看到这个，说明JavaScript插入功能完全正常</div>
      <div style="font-size: 14px; margin-top: 5px;">这个栏会在8秒后自动消失</div>
    </div>
  `
  
  // 添加动画样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
  `
  document.head.appendChild(style)
  
  // 插入到页面
  document.body.appendChild(testBar)
  
  console.log('✅ 超级明显测试栏已插入')
  
  // 8秒后移除
  setTimeout(() => {
    testBar.remove()
    style.remove()
    console.log('🗑️ 测试栏已清理')
  }, 8000)
  
  // 同时测试vditor内部插入
  const vditor = document.getElementById('vditor')
  if (vditor) {
    console.log('📍 Vditor元素存在，尝试内部插入...')
    
    const internalBar = document.createElement('div')
    internalBar.className = 'quick-test-internal'
    internalBar.style.cssText = `
      height: 50px !important;
      background: linear-gradient(90deg, #ff6b6b, #4ecdc4) !important;
      color: white !important;
      font-size: 18px !important;
      font-weight: bold !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 3px solid #ffd93d !important;
      margin: 5px 0 !important;
      border-radius: 8px !important;
    `
    internalBar.textContent = '📍 Vditor内部测试栏 - 在编辑器内部'
    
    // 尝试插入到vditor内部
    if (vditor.children.length > 0) {
      vditor.insertBefore(internalBar, vditor.children[0])
      console.log('✅ 已在vditor内部插入测试栏')
    } else {
      vditor.appendChild(internalBar)
      console.log('✅ 已在vditor末尾添加测试栏')
    }
    
    // 8秒后移除内部测试栏
    setTimeout(() => {
      internalBar.remove()
      console.log('🗑️ Vditor内部测试栏已清理')
    }, 8000)
    
  } else {
    console.error('❌ 未找到vditor元素')
  }
  
  return true
}

// 立即执行
console.log('='.repeat(60))
console.log('🚀 执行快速测试')
console.log('='.repeat(60))

quickTest()

console.log('💡 如果您看到了彩色的测试栏，说明插入功能正常')
console.log('💡 如果没有看到，可能是其他问题阻止了显示')
console.log('='.repeat(60))
