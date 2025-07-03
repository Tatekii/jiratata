import { config as dotenvFlowConfig } from 'dotenv-flow'

/**
 * 环境变量加载器 - 使用 dotenv-flow
 * 支持按优先级合并多个环境变量文件
 * 文件命名规范: .env.base, .env.[dev|test|prod], .env.base.local, .env.[dev|test|prod].local
 */

// 环境类型定义
export type Environment = 'dev' | 'test' | 'prod'

/**
 * 根据 NODE_ENV 获取环境类型
 */
export function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'prod'
  if (nodeEnv === 'test') return 'test'
  return 'dev'
}

/**
 * 加载环境变量
 * @param env 环境类型，如果不指定则从 NODE_ENV 自动推断
 * @param options 配置选项
 */
export function loadEnv(env?: Environment, options: {
  path?: string
  silent?: boolean
  debug?: boolean
} = {}): Record<string, string> {
  const environment = env || getEnvironment()
  
  // dotenv-flow 配置
  const result = dotenvFlowConfig({
    // 指定环境
    node_env: environment,
    
    // 默认环境（当 NODE_ENV 未设置时）
    default_node_env: 'dev',
    
    // 环境变量文件模式
    pattern: '.env[.node_env][.local]',
    
    // 项目根目录
    path: options.path || process.cwd(),
    
    // 是否静默模式
    silent: options.silent !== false,
    
    // 是否调试模式
    debug: options.debug || false,
    
    // 自定义文件名模式，支持 .env.base
    files: [
      '.env.base',
      `.env.${environment}`,
      '.env.base.local',
      `.env.${environment}.local`
    ]
  })

  // 如果不是静默模式，输出加载信息
  if (!options.silent && process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Environment loaded: ${environment}`)
    if (result.error) {
      console.warn('⚠️ dotenv-flow error:', result.error)
    }
  }

  return process.env as Record<string, string>
}

/**
 * 获取特定环境变量
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

/**
 * 获取所有环境变量
 */
export function getAllEnv(): Record<string, string> {
  return { ...process.env } as Record<string, string>
}

/**
 * 检查环境变量是否存在
 */
export function hasEnv(key: string): boolean {
  return key in process.env && process.env[key] !== undefined
}

/**
 * 获取必需的环境变量，如果不存在则抛出错误
 */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value
}

/**
 * 获取数字类型的环境变量
 */
export function getEnvNumber(key: string, defaultValue?: number): number | undefined {
  const value = process.env[key]
  if (!value) return defaultValue
  
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number: ${value}`)
  }
  return parsed
}

/**
 * 获取布尔类型的环境变量
 */
export function getEnvBoolean(key: string, defaultValue?: boolean): boolean | undefined {
  const value = process.env[key]
  if (!value) return defaultValue
  
  const lower = value.toLowerCase()
  return lower === 'true' || lower === '1' || lower === 'yes'
}

/**
 * 获取数组类型的环境变量（逗号分隔）
 */
export function getEnvArray(key: string, defaultValue?: string[]): string[] | undefined {
  const value = process.env[key]
  if (!value) return defaultValue
  
  return value.split(',').map(item => item.trim()).filter(Boolean)
}
