/**
 * Playwright全局设置
 * 用于E2E测试的数据库清理和环境准备
 */

import { request } from '@playwright/test'

export default async function globalSetup() {
  console.log('🧹 Starting E2E test database cleanup...')
  
  try {
    // 使用API请求清理数据库，而不是直接导入服务器端模型
    const apiRequest = await request.newContext({
      baseURL: 'http://localhost:3000'
    })
    
    // 如果有测试清理端点，可以使用（但按照新策略，我们不依赖测试端点）
    // 这里我们可以选择不做任何操作，让每个测试使用唯一数据来避免冲突
    
    console.log('✅ E2E test database cleanup completed (using unique test data strategy)')
    
    await apiRequest.dispose()
  } catch (error) {
    console.error('❌ E2E test database cleanup failed:', error)
    // 不抛出错误，因为我们使用唯一数据策略，不需要强制清理
    console.log('ℹ️  Using unique test data strategy, cleanup failure is not critical')
  }
}
