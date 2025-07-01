import mongoose, { Schema, Document, Model } from 'mongoose'

// 设备信息接口
export interface IDeviceInfo {
  device?: string
  os?: string
  browser?: string
}

// Token类型枚举
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  MAGIC_LINK = 'magic_link'
}

// Token状态枚举
export enum TokenStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  USED = 'used'
}

// Token文档接口
export interface IToken extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: TokenType
  status: TokenStatus
  jti: string  // JWT ID - 唯一标识符
  tokenHash: string  // token的哈希值，不存储明文
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  revokedAt?: Date
  revokedBy?: mongoose.Types.ObjectId
  revokedReason?: string
  lastUsedAt?: Date
  ipAddress?: string
  userAgent?: string
  deviceInfo?: {
    device?: string
    os?: string
    browser?: string
  }
  sessionId?: string  // 用于会话管理
  parentTokenId?: mongoose.Types.ObjectId  // 父token ID（用于refresh token关联access token）
  
  // 实例方法
  isExpired(): boolean
  isActive(): boolean
  revoke(reason?: string, revokedBy?: mongoose.Types.ObjectId): Promise<void>
  markAsUsed(): Promise<void>
  updateLastUsed(ipAddress?: string, userAgent?: string): Promise<void>
}

// Token模型接口
export interface ITokenModel extends Model<IToken> {
  // 静态方法
  createTokenPair(userId: mongoose.Types.ObjectId, deviceInfo?: IDeviceInfo, ipAddress?: string, userAgent?: string): Promise<{
    accessToken: IToken
    refreshToken: IToken
    sessionId: string
  }>
  findByJTI(jti: string): Promise<IToken | null>
  findActiveTokenByJTI(jti: string): Promise<IToken | null>
  revokeAllUserTokens(userId: mongoose.Types.ObjectId, reason?: string): Promise<void>
  revokeTokenFamily(parentTokenId: mongoose.Types.ObjectId, reason?: string): Promise<void>
  cleanupExpiredTokens(): Promise<number>
  findActiveTokensByUser(userId: mongoose.Types.ObjectId, type?: TokenType): Promise<IToken[]>
  validateTokenChain(refreshTokenJTI: string, accessTokenJTI: string): Promise<boolean>
}

// Token Schema定义
const TokenSchema = new Schema<IToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(TokenType),
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(TokenStatus),
    default: TokenStatus.ACTIVE,
    index: true
  },
  jti: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL索引
  },
  revokedAt: {
    type: Date,
    index: true
  },
  revokedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedReason: {
    type: String,
    enum: [
      'user_logout',
      'security_breach',
      'admin_action',
      'token_rotation',
      'suspicious_activity',
      'password_change',
      'account_deactivation',
      'manual_revocation'
    ]
  },
  lastUsedAt: {
    type: Date,
    index: true
  },
  ipAddress: {
    type: String,
    index: true
  },
  userAgent: String,
  deviceInfo: {
    device: String,
    os: String,
    browser: String
  },
  sessionId: {
    type: String,
    index: true
  },
  parentTokenId: {
    type: Schema.Types.ObjectId,
    ref: 'Token',
    index: true
  }
}, {
  timestamps: true,
  // 优化查询性能
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 复合索引 - 优化常用查询
TokenSchema.index({ userId: 1, type: 1, status: 1 })
TokenSchema.index({ userId: 1, sessionId: 1 })
TokenSchema.index({ expiresAt: 1, status: 1 })
TokenSchema.index({ createdAt: -1 })

// 实例方法实现
TokenSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt
}

TokenSchema.methods.isActive = function(): boolean {
  return this.status === TokenStatus.ACTIVE && !this.isExpired()
}

TokenSchema.methods.revoke = async function(reason?: string, revokedBy?: mongoose.Types.ObjectId): Promise<void> {
  this.status = TokenStatus.REVOKED
  this.revokedAt = new Date()
  if (reason) this.revokedReason = reason
  if (revokedBy) this.revokedBy = revokedBy
  await this.save()
}

TokenSchema.methods.markAsUsed = async function(): Promise<void> {
  this.status = TokenStatus.USED
  await this.save()
}

TokenSchema.methods.updateLastUsed = async function(ipAddress?: string, userAgent?: string): Promise<void> {
  this.lastUsedAt = new Date()
  if (ipAddress) this.ipAddress = ipAddress
  if (userAgent) this.userAgent = userAgent
  await this.save()
}

// 静态方法实现
TokenSchema.statics.createTokenPair = async function(
  userId: mongoose.Types.ObjectId, 
  deviceInfo?: IDeviceInfo, 
  ipAddress?: string, 
  userAgent?: string
) {
  const { nanoid } = await import('nanoid')
  const crypto = await import('crypto')
  
  const sessionId = nanoid()
  const now = new Date()
  
  // 创建refresh token
  const refreshToken = new this({
    userId,
    type: TokenType.REFRESH,
    jti: nanoid(),
    tokenHash: crypto.createHash('sha256').update(nanoid()).digest('hex'),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7天
    sessionId,
    deviceInfo,
    ipAddress,
    userAgent
  })
  
  await refreshToken.save()
  
  // 创建access token，关联到refresh token
  const accessToken = new this({
    userId,
    type: TokenType.ACCESS,
    jti: nanoid(),
    tokenHash: crypto.createHash('sha256').update(nanoid()).digest('hex'),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24小时
    sessionId,
    parentTokenId: refreshToken._id,
    deviceInfo,
    ipAddress,
    userAgent
  })
  
  await accessToken.save()
  
  return { accessToken, refreshToken, sessionId }
}

TokenSchema.statics.findByJTI = async function(jti: string) {
  return this.findOne({ jti })
}

TokenSchema.statics.findActiveTokenByJTI = async function(jti: string) {
  return this.findOne({ jti, status: TokenStatus.ACTIVE })
}

TokenSchema.statics.revokeAllUserTokens = async function(userId: mongoose.Types.ObjectId, reason = 'user_logout') {
  await this.updateMany(
    { userId, status: TokenStatus.ACTIVE },
    { 
      status: TokenStatus.REVOKED,
      revokedAt: new Date(),
      revokedReason: reason
    }
  )
}

TokenSchema.statics.revokeTokenFamily = async function(parentTokenId: mongoose.Types.ObjectId, reason = 'token_rotation') {
  await this.updateMany(
    { 
      $or: [
        { _id: parentTokenId },
        { parentTokenId }
      ],
      status: TokenStatus.ACTIVE
    },
    {
      status: TokenStatus.REVOKED,
      revokedAt: new Date(),
      revokedReason: reason
    }
  )
}

TokenSchema.statics.cleanupExpiredTokens = async function(): Promise<number> {
  const result = await this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      status: { $ne: TokenStatus.EXPIRED }
    },
    { status: TokenStatus.EXPIRED }
  )
  return result.modifiedCount
}

TokenSchema.statics.findActiveTokensByUser = async function(userId: mongoose.Types.ObjectId, type?: TokenType) {
  const query: { userId: mongoose.Types.ObjectId; status: TokenStatus; expiresAt: { $gt: Date }; type?: TokenType } = { 
    userId, 
    status: TokenStatus.ACTIVE,
    expiresAt: { $gt: new Date() }
  }
  
  if (type) {
    query.type = type
  }
  
  return this.find(query).sort({ createdAt: -1 })
}

TokenSchema.statics.validateTokenChain = async function(refreshTokenJTI: string, accessTokenJTI: string): Promise<boolean> {
  const refreshToken = await this.findOne({ jti: refreshTokenJTI, type: TokenType.REFRESH, status: TokenStatus.ACTIVE })
  if (!refreshToken) return false
  
  const accessToken = await this.findOne({ 
    jti: accessTokenJTI, 
    type: TokenType.ACCESS, 
    parentTokenId: refreshToken._id,
    status: TokenStatus.ACTIVE
  })
  
  return !!accessToken
}

// Pre-save中间件 - 自动处理过期状态
TokenSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === TokenStatus.ACTIVE) {
    this.status = TokenStatus.EXPIRED
  }
  next()
})

// 创建并导出模型
export const Token = (mongoose.models.Token as ITokenModel) || mongoose.model<IToken, ITokenModel>('Token', TokenSchema)
export default Token