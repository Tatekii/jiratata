/**
 * 服务端环境变量初始化
 * 只负责在应用启动时加载环境变量文件
 */
import "server-only"
import { config as dotenvFlowConfig } from 'dotenv-flow'


// 全局标记，确保只初始化一次
let isInitialized = false

// 只在服务端加载环境变量，且只初始化一次
if (typeof window === 'undefined' && !isInitialized) {
  const environment = process.env.NODE_ENV
  
  try {
    const result = dotenvFlowConfig({
      node_env: environment,
      default_node_env: 'dev',
      pattern: '.env[.node_env][.local]',
      path: process.cwd(),
      silent: process.env.NODE_ENV === 'production',
      files: [
        '.env',
        '.env.local',
        `.env.${environment}`,
        `.env.${environment}.local`
      ]
    })

    if (result.error && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Environment loading error:', result.error)
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(`🔧 Environment loaded: ${environment}`)
    }
    
    isInitialized = true
  } catch (error) {
    console.warn('⚠️ Failed to load environment variables:', error)
  }
}
