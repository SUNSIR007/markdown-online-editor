/** @format */

import configManager from '@/utils/configManager'

// 从配置管理器导出常量，保持向后兼容
export const appTitle = configManager.getPath('app.title')
export const exportTextMap = configManager.get('export').textMap
