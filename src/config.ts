// MongoDB 和应用配置 (替代 AppWrite)
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jiratata_dev"
export const JWT_SECRET = process.env.JWT_SECRET || "your_super_secure_jwt_secret"
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d"
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads"
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760") // 10MB
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
