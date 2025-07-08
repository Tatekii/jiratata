import "server-only"
/**
 * 初始化环境变量
 */
import "../env/env-init"


import { getEnv, getEnvNumber, requireEnv } from "../env/env-loader"

export const APP_URI = requireEnv("NEXT_PUBLIC_APP_URL")
// MongoDB 和应用配置
export const MONGODB_URI = requireEnv("MONGODB_URI")
export const MONGODB_USERNAME = getEnv("MONGODB_USERNAME")
export const MONGODB_PASSWORD = getEnv("MONGODB_PASSWORD")
export const MONGODB_DB = requireEnv("MONGODB_DB")
export const JWT_SECRET = requireEnv("JWT_SECRET")
export const JWT_EXPIRES_IN = getEnv("JWT_EXPIRES_IN", "7d")
export const JWT_REFRESH_EXPIRES_IN = getEnv("JWT_R_EXPIRES_IN", "30d")

// OAuth 配置
export const GITHUB_CLIENT_ID = requireEnv("GITHUB_CLIENT_ID")
export const GITHUB_CLIENT_SECRET = requireEnv("GITHUB_CLIENT_SECRET")
export const GOOGLE_CLIENT_ID = requireEnv("GOOGLE_CLIENT_ID")
export const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET")

// 文件上传配置
export const UPLOAD_DIR = getEnv("UPLOAD_DIR", "./public/uploads")
export const MAX_FILE_SIZE = getEnvNumber("MAX_FILE_SIZE", 10485760) // 10MB

// Debug 配置
export const DEBUG = getEnv("DEBUG", "false") === "true"
export const LOG_LEVEL = getEnv("LOG_LEVEL", "info") as "error" | "warn" | "info" | "debug"
