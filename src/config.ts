// MongoDB 和应用配置 (替代 AppWrite)
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jiratata_dev'
export const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 原有的 AppWrite 配置 (迁移期间保留，逐步移除)
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
export const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID
export const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID
export const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID
export const TASKS_ID = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID
export const IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID
