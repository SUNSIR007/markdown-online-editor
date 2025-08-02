#!/usr/bin/env node

/**
 * 验证代码修改的脚本
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 开始验证代码修改...\n')

// 检查文件是否存在
function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath)
  console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? '存在' : '不存在'}`)
  return exists
}

// 检查文件内容是否包含特定字符串
function checkFileContains(filePath, searchString, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${filePath} 文件不存在`)
    return false
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const contains = content.includes(searchString)
  console.log(`${contains ? '✅' : '❌'} ${filePath} ${contains ? '包含' : '不包含'} ${description}`)
  return contains
}

console.log('📁 检查新创建的文件:')
checkFileExists('src/components/ExportPageLayout.vue')
checkFileExists('src/utils/errorHandler.js')
checkFileExists('src/utils/configManager.js')

console.log('\n🔧 检查修改的文件:')

// 检查Main.vue的内存泄漏修复
checkFileContains(
  'src/pages/Main.vue',
  'this.vditor.destroy()',
  '内存泄漏修复'
)

// 检查全局变量污染修复
checkFileContains(
  'src/pages/Main.vue',
  'process.env.NODE_ENV === \'production\'',
  '全局变量污染修复'
)

// 检查异步错误处理
checkFileContains(
  'src/helper/export.js',
  'try {',
  '异步错误处理'
)

// 检查边界条件处理
checkFileContains(
  'src/helper/utils.js',
  'filter(part => part)',
  '边界条件处理'
)

// 检查冗余代码清理
console.log('\n🧹 检查冗余代码清理:')

// 检查package.json中lodash依赖清理
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const hasLodashAssign = packageJson.dependencies && packageJson.dependencies['lodash.assign']
const hasLodashCloneDeep = packageJson.dependencies && packageJson.dependencies['lodash.clonedeep']

console.log(`${!hasLodashAssign ? '✅' : '❌'} lodash.assign ${!hasLodashAssign ? '已移除' : '仍存在'}`)
console.log(`${!hasLodashCloneDeep ? '✅' : '❌'} lodash.clonedeep ${!hasLodashCloneDeep ? '已移除' : '仍存在'}`)

// 检查Advertisement组件是否已删除
const advertisementExists = fs.existsSync('src/components/Advertisement.vue')
console.log(`${!advertisementExists ? '✅' : '❌'} Advertisement.vue ${!advertisementExists ? '已删除' : '仍存在'}`)

console.log('\n🏗️ 检查架构重构:')

// 检查ExportImage.vue是否使用新的布局组件
checkFileContains(
  'src/pages/ExportImage.vue',
  'ExportPageLayout',
  '使用新的布局组件'
)

// 检查ExportPdf.vue是否使用新的布局组件
checkFileContains(
  'src/pages/ExportPdf.vue',
  'ExportPageLayout',
  '使用新的布局组件'
)

// 检查错误处理服务的使用
checkFileContains(
  'src/pages/ExportImage.vue',
  'ErrorHandler.handle',
  '使用统一错误处理'
)

// 检查全局错误处理注册
checkFileContains(
  'src/global.js',
  'ErrorHandlerInstall',
  '全局错误处理注册'
)

// 检查配置管理器的使用
checkFileContains(
  'src/config/constant.js',
  'configManager',
  '使用配置管理器'
)

// 检查webpack别名配置
checkFileContains(
  'vue.config.js',
  '.set(\'@\', resolveRealPath(\'src\'))',
  'webpack别名配置'
)

console.log('\n🎯 验证完成!')

// 统计结果
const totalChecks = 15 // 根据上面的检查项目数量调整
console.log(`\n📊 建议运行以下命令进行最终验证:`)
console.log(`   npm run lint     # 检查代码规范`)
console.log(`   npm run build    # 检查构建是否成功`)
console.log(`   npm run serve    # 启动开发服务器测试功能`)
