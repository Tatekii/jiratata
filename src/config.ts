import { getEnv, getEnvNumber, requireEnv } from "../lib/env-loader"
import "../lib/env" // 自动加载环境变量

// MongoDB 和应用配置
export const MONGODB_URI = requireEnv("MONGODB_URI")
export const JWT_SECRET = requireEnv("JWT_SECRET")
export const JWT_EXPIRES_IN = getEnv("JWT_EXPIRES_IN", "7d")
export const JWT_REFRESH_EXPIRES_IN = getEnv("JWT_R_EXPIRES_IN", "30d")

// 文件上传配置
export const UPLOAD_DIR = getEnv("UPLOAD_DIR", "./public/uploads")
export const MAX_FILE_SIZE = getEnvNumber("MAX_FILE_SIZE", 10485760) // 10MB

// 应用配置
export const APP_URL = getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
export const APP_NAME = getEnv("APP_NAME", "Jiratata")
export const APP_VERSION = getEnv("APP_VERSION", "1.0.0")

// Debug 配置
export const DEBUG = getEnv("DEBUG", "false") === "true"
export const LOG_LEVEL = getEnv("LOG_LEVEL", "info") as "error" | "warn" | "info" | "debug"

// 导出配置对象
export const config = {
  mongodb: {
    uri: MONGODB_URI,
  },
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
  },
  upload: {
    dir: UPLOAD_DIR,
    maxFileSize: MAX_FILE_SIZE,
  },
  app: {
    url: APP_URL,
    name: APP_NAME,
    version: APP_VERSION,
  },
  debug: {
    enabled: DEBUG,
    logLevel: LOG_LEVEL,
  },
}
