/**
 * 服务端图片压缩和处理工具
 * 基于 Sharp 库实现高质量图片压缩
 */
import "server-only"
import sharp from 'sharp'

// 图片压缩配置接口
interface CompressOptions {
  /** 目标文件大小(KB) */
  targetSizeKB?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** JPEG 质量 (1-100) */
  quality?: number
  /** 输出格式 */
  format?: 'jpeg' | 'png' | 'webp'
  /** 是否保持宽高比 */
  keepAspectRatio?: boolean
}

// 默认压缩配置
const DEFAULT_OPTIONS: Required<CompressOptions> = {
  targetSizeKB: 200,
  maxWidth: 800,
  maxHeight: 800,
  quality: 85,
  format: 'jpeg',
  keepAspectRatio: true,
}

/**
 * 压缩图片 Buffer 到指定大小
 * @param buffer 原始图片 Buffer
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串
 */
export async function compressImageBuffer(
  buffer: Buffer,
  options: CompressOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  let sharpInstance = sharp(buffer)
  
  // 获取图片元信息
  const metadata = await sharpInstance.metadata()
  const { width = 0, height = 0 } = metadata
  
  // 计算新的尺寸
  let newWidth = width
  let newHeight = height
  
  if (opts.keepAspectRatio) {
    const aspectRatio = width / height
    
    if (width > opts.maxWidth) {
      newWidth = opts.maxWidth
      newHeight = Math.round(newWidth / aspectRatio)
    }
    
    if (newHeight > opts.maxHeight) {
      newHeight = opts.maxHeight
      newWidth = Math.round(newHeight * aspectRatio)
    }
  } else {
    newWidth = Math.min(width, opts.maxWidth)
    newHeight = Math.min(height, opts.maxHeight)
  }
  
  // 应用尺寸变换
  if (newWidth !== width || newHeight !== height) {
    sharpInstance = sharpInstance.resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }
  
  // 根据格式进行压缩
  let compressedBuffer: Buffer
  
  switch (opts.format) {
    case 'webp':
      compressedBuffer = await sharpInstance
        .webp({ quality: opts.quality })
        .toBuffer()
      break
    case 'png':
      compressedBuffer = await sharpInstance
        .png({ 
          compressionLevel: 9,
          quality: opts.quality 
        })
        .toBuffer()
      break
    case 'jpeg':
    default:
      compressedBuffer = await sharpInstance
        .jpeg({ 
          quality: opts.quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer()
      break
  }
  
  // 检查文件大小并调整质量
  const targetSizeBytes = opts.targetSizeKB * 1024
  let currentQuality = opts.quality
  
  while (compressedBuffer.length > targetSizeBytes && currentQuality > 10) {
    currentQuality -= 10
    
    switch (opts.format) {
      case 'webp':
        compressedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: currentQuality })
          .toBuffer()
        break
      case 'png':
        compressedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, quality: currentQuality })
          .toBuffer()
        break
      case 'jpeg':
      default:
        compressedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: currentQuality, progressive: true, mozjpeg: true })
          .toBuffer()
        break
    }
  }
  
  // 转换为 base64
  const mimeType = opts.format === 'png' ? 'image/png' : 
                   opts.format === 'webp' ? 'image/webp' : 'image/jpeg'
  const base64 = `data:${mimeType};base64,${compressedBuffer.toString('base64')}`
  
  return base64
}

/**
 * 从 base64 字符串中提取 Buffer
 * @param base64String base64 字符串
 * @returns Buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  // 移除 data URL 前缀
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * 从 FormData 中提取图片文件并压缩
 * @param formData FormData 对象
 * @param fieldName 字段名
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串，如果没有文件则返回 null
 */
export async function compressImageFromFormData(
  formData: FormData,
  fieldName: string,
  options: CompressOptions = {}
): Promise<string | null> {
  const file = formData.get(fieldName) as File | null
  
  if (!file || !(file instanceof File)) {
    return null
  }
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，只支持 JPEG、PNG、WebP 格式')
  }
  
  // 检查文件大小限制 (10MB)
  const maxSizeBytes = 10 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error('图片文件过大，请选择小于 10MB 的图片')
  }
  
  // 转换为 Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // 压缩图片
  return await compressImageBuffer(buffer, options)
}

/**
 * 验证 base64 图片字符串
 * @param base64String base64 字符串
 * @returns 验证结果
 */
export function validateBase64Image(base64String: string): {
  valid: boolean
  error?: string
  sizeKB?: number
} {
  try {
    // 检查是否是有效的 base64 图片格式
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/
    if (!base64Regex.test(base64String)) {
      return { valid: false, error: '无效的图片格式' }
    }
    
    // 计算文件大小
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
    const sizeBytes = (base64Data.length * 3) / 4
    const sizeKB = Math.round(sizeBytes / 1024)
    
    // 检查大小限制 (500KB)
    if (sizeKB > 500) {
      return { 
        valid: false, 
        error: `图片过大 (${sizeKB}KB)，请使用小于 500KB 的图片`,
        sizeKB 
      }
    }
    
    return { valid: true, sizeKB }
  } catch {
    return { valid: false, error: '图片格式验证失败' }
  }
}

/**
 * 压缩 base64 图片字符串
 * @param base64String base64 图片字符串 (data:image/...;base64,...)
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串
 */
export async function compressBase64Image(
  base64String: string,
  options: CompressOptions = {}
): Promise<string> {
  // 验证 base64 格式
  if (!base64String.startsWith('data:image/')) {
    throw new Error('无效的 base64 图片格式')
  }
  
  // 提取 base64 数据部分
  const base64Data = base64String.split(',')[1]
  if (!base64Data) {
    throw new Error('无效的 base64 数据')
  }
  
  // 转换为 Buffer
  const buffer = Buffer.from(base64Data, 'base64')
  
  // 压缩图片
  return await compressImageBuffer(buffer, options)
}

// 导出常用的压缩预设
export const COMPRESSION_PRESETS = {
  // 头像压缩 (50x50 显示)
  avatar: {
    targetSizeKB: 50,
    maxWidth: 200,
    maxHeight: 200,
    quality: 85,
    format: 'jpeg' as const,
  },
  // 工作区图标 (50x50 显示)
  workspace: {
    targetSizeKB: 100,
    maxWidth: 200,
    maxHeight: 200,
    quality: 90,
    format: 'jpeg' as const,
  },
  // 项目图标 (类似工作区)
  project: {
    targetSizeKB: 100,
    maxWidth: 200,
    maxHeight: 200,
    quality: 90,
    format: 'jpeg' as const,
  },
} as const