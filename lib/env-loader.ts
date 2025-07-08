import "server-only"

/**
 * 环境变量访问工具
 * 提供类型安全的环境变量访问方法
 * 注意: 使用前需要先导入 env-init.ts 初始化环境变量
 */

/**
 * 获取特定环境变量
 */
export function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || ""
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
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    console.warn(`Environment variable ${key} is not a valid number: ${value}, using default: ${defaultValue}`)
    return defaultValue
  }
  return parsed
}

/**
 * 获取布尔类型的环境变量
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  
  const lower = value.toLowerCase()
  return lower === 'true' || lower === '1' || lower === 'yes'
}

/**
 * 获取数组类型的环境变量（逗号分隔）
 */
export function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key]
  if (!value) return defaultValue
  
  return value.split(',').map(item => item.trim()).filter(Boolean)
}
