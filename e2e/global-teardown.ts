/**
 * Playwright全局清理
 * 用于E2E测试结束后的环境清理
 */

import { request } from '@playwright/test'

export default async function globalTeardown() {
  console.log('🧹 Starting E2E test global teardown...')
  
  try {
    // 使用API请求清理数据库，而不是直接导入服务器端模型
    const apiRequest = await request.newContext({
      baseURL: 'http://localhost:3000'
    })
    
    // 按照新策略，每个测试使用唯一数据，所以不需要强制清理
    // 这里可以进行一些轻量级的清理工作
    
    console.log('✅ E2E test global teardown completed')
    
    await apiRequest.dispose()
  } catch (error) {
    console.error('❌ E2E test global teardown failed:', error)
    // 不抛出错误，避免影响测试结果
  }
}
