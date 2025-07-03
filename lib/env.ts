/**
 * 环境变量自动加载入口文件
 * 在应用启动时自动加载环境变量
 */

import { loadEnv, getEnvironment } from './env-loader'

// 立即加载环境变量
const env = getEnvironment()
loadEnv(env)

// 导出常用的环境变量访问器
export * from './env-loader'

// 导出加载的环境变量（用于验证）
export const loadedEnv = { ...process.env }

// 开发环境下显示加载的环境变量信息
if (process.env.NODE_ENV !== 'production') {
  const envVars = Object.keys(process.env).filter(key => 
    key.startsWith('APP_') || 
    key.startsWith('JWT_') || 
    key.startsWith('MONGODB_') || 
    key.startsWith('NEXT_PUBLIC_')
  )
  
  console.log(`✅ Loaded ${envVars.length} environment variables for ${env} environment`)
}
