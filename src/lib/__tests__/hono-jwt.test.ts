/**
 * Token Service 简化测试
 * 测试基于数据库的JWT token系统的核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { 
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenPair,
  revokeToken,
  revokeAllUserTokens,
  getUserActiveTokens,
  cleanupExpiredTokens,
  loginUser,
  registerUser
} from '@/lib/hono-jwt'
import { Token, TokenType, TokenStatus } from '@/models/token'
import { User } from '@/models/user'

let mongod: MongoMemoryServer

// Mock config
vi.mock('@/config', () => ({
  JWT_SECRET: 'test-secret-key-for-testing-only',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  MONGODB_URI: 'mongodb://test'
}))

// Mock mongodb connection
vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined)
}))

describe('Token Service', () => {
  let testUserId: mongoose.Types.ObjectId

  beforeEach(async () => {
    // 启动内存数据库
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    
    await mongoose.connect(uri)
    
    // 创建测试用户
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    await testUser.save()
    testUserId = new mongoose.Types.ObjectId(testUser._id)
  })

  afterEach(async () => {
    // 清理数据库
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
  })

  describe('createTokenPair', () => {
    it('should create access and refresh token pair', async () => {
      const result = await createTokenPair(testUserId.toString())
      
      expect(result).toBeDefined()
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.sessionId).toBeDefined()
      expect(result.expiresIn).toBeGreaterThan(0)
      expect(result.refreshExpiresIn).toBeGreaterThan(0)
    })

    it('should store tokens in database', async () => {
      await createTokenPair(testUserId.toString())
      
      const tokensInDb = await Token.find({ userId: testUserId })
      expect(tokensInDb).toHaveLength(2) // access + refresh
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const { accessToken } = await createTokenPair(testUserId.toString())
      
      const decoded = await verifyAccessToken(accessToken)
      
      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(testUserId.toString())
      expect(decoded?.jti).toBeDefined()
    })

    it('should return null for invalid token', async () => {
      const result = await verifyAccessToken('invalid.token.here')
      expect(result).toBeNull()
    })

    it('should return null for revoked token', async () => {
      const { accessToken } = await createTokenPair(testUserId.toString())
      
      // 撤销token
      await revokeToken(accessToken)
      
      const result = await verifyAccessToken(accessToken)
      expect(result).toBeNull()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const { refreshToken } = await createTokenPair(testUserId.toString())
      
      const decoded = await verifyRefreshToken(refreshToken)
      
      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(testUserId.toString())
      expect(decoded?.type).toBe('refresh')
    })

    it('should return null for access token', async () => {
      const { accessToken } = await createTokenPair(testUserId.toString())
      
      const result = await verifyRefreshToken(accessToken)
      expect(result).toBeNull()
    })
  })

  describe('refreshTokenPair', () => {
    it('should create new token pair from valid refresh token', async () => {
      const { refreshToken: oldRefreshToken } = await createTokenPair(testUserId.toString())
      
      const newTokens = await refreshTokenPair(oldRefreshToken)
      
      expect(newTokens).toBeDefined()
      expect(newTokens?.accessToken).toBeDefined()
      expect(newTokens?.refreshToken).toBeDefined()
      expect(newTokens?.refreshToken).not.toBe(oldRefreshToken)
    })

    it('should return null for invalid refresh token', async () => {
      const result = await refreshTokenPair('invalid.token')
      expect(result).toBeNull()
    })
  })

  describe('revokeToken', () => {
    it('should revoke valid token', async () => {
      const { accessToken } = await createTokenPair(testUserId.toString())
      
      const success = await revokeToken(accessToken)
      expect(success).toBe(true)
    })

    it('should return false for invalid token', async () => {
      const success = await revokeToken('invalid.token')
      expect(success).toBe(false)
    })
  })

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens', async () => {
      // 创建多个token对
      await createTokenPair(testUserId.toString())
      await createTokenPair(testUserId.toString())
      
      await revokeAllUserTokens(testUserId.toString())
      
      const revokedTokens = await Token.find({ 
        userId: testUserId, 
        status: TokenStatus.REVOKED 
      })
      expect(revokedTokens.length).toBe(4) // 2对token，每对包含access和refresh
    })
  })

  describe('getUserActiveTokens', () => {
    it('should return user active tokens grouped by session', async () => {
      // 创建两个不同的会话
      await createTokenPair(testUserId.toString())
      await createTokenPair(testUserId.toString())
      
      const result = await getUserActiveTokens(testUserId.toString())
      
      expect(result.sessions).toHaveLength(2)
      expect(result.totalTokens).toBe(4)
      expect(result.sessions[0].sessionId).toBeDefined()
      expect(result.sessions[0].tokenCount).toBe(2)
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should mark expired tokens as expired', async () => {
      // 创建token并手动设置为过期
      await createTokenPair(testUserId.toString())
      
      // 将token设置为过期
      await Token.findOneAndUpdate(
        { userId: testUserId, type: TokenType.ACCESS },
        { expiresAt: new Date(Date.now() - 1000) } // 1秒前过期
      )
      
      const cleanedCount = await cleanupExpiredTokens()
      expect(cleanedCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('registerUser', () => {
    it('should register user and return tokens', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      }
      
      const result = await registerUser(userData)
      
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(userData.email)
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'test@example.com', // 已存在的邮箱
        password: 'password123'
      }
      
      await expect(registerUser(userData)).rejects.toThrow('此邮箱已被注册')
    })
  })

  describe('loginUser', () => {
    it('should login user and return tokens', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = await loginUser(credentials)
      
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(credentials.email)
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('should throw error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      
      await expect(loginUser(credentials)).rejects.toThrow('邮箱或密码不正确')
    })

    it('should throw error for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }
      
      await expect(loginUser(credentials)).rejects.toThrow('邮箱或密码不正确')
    })
  })
})
