/**
 * Hono认证中间件单元测试 - 优化版本
 * 专注于测试中间件的核心逻辑，所有外部依赖都使用mock
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'

// ========== 模拟所有外部依赖 ==========
const mockVerifyToken = vi.fn()
const mockUserFindById = vi.fn()
const mockConnectToDatabase = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyToken: mockVerifyToken,
}))

vi.mock('@/models', () => ({
  User: {
    findById: mockUserFindById,
  },
}))

vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: mockConnectToDatabase,
}))

vi.mock('@/features/auth/constans', () => ({
  AUTH_COOKIE: 'auth_token',
}))

describe('authSessionMiddleware 专项测试', () => {
  let authSessionMiddleware: any

  beforeEach(async () => {
    // 重置所有mock
    vi.clearAllMocks()
    
    // 设置默认的成功mock
    mockConnectToDatabase.mockResolvedValue(true)
    
    // 动态导入中间件
    const middleware = await import('@/lib/hono-middleware')
    authSessionMiddleware = middleware.authSessionMiddleware
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('🔧 中间件基础功能', () => {
    it('应该是一个有效的中间件函数', () => {
      expect(authSessionMiddleware).toBeDefined()
      expect(typeof authSessionMiddleware).toBe('function')
    })

    it('应该能正确集成到Hono应用中', () => {
      const app = new Hono()
      expect(() => {
        app.use('/protected/*', authSessionMiddleware)
      }).not.toThrow()
    })
  })

  describe('🍪 Cookie处理逻辑', () => {
    it('❌ 缺少cookie时应该立即拒绝', async () => {
      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test')
      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
      
      // 关键：应该不调用任何验证函数
      expect(mockVerifyToken).not.toHaveBeenCalled()
      expect(mockUserFindById).not.toHaveBeenCalled()
      expect(mockConnectToDatabase).not.toHaveBeenCalled()
    })

    it('✅ 正确解析auth_token cookie', async () => {
      mockVerifyToken.mockReturnValue({ userId: 'user123' })
      mockUserFindById.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=jwt-token-here' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(200)
      expect(mockVerifyToken).toHaveBeenCalledWith('jwt-token-here')
    })

    it('✅ 从复杂cookie字符串中提取正确token', async () => {
      mockVerifyToken.mockReturnValue({ userId: 'user123' })
      mockUserFindById.mockResolvedValue({ _id: 'user123', name: 'User', email: 'test@example.com' })

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 
          'Cookie': 'session_id=abc123; auth_token=target-jwt-token; theme=dark' 
        }
      })

      const res = await app.request(req)

      expect(res.status).toBe(200)
      expect(mockVerifyToken).toHaveBeenCalledWith('target-jwt-token')
    })
  })

  describe('🔐 Token验证流程', () => {
    it('❌ 无效token时应该拒绝', async () => {
      mockVerifyToken.mockReturnValue(null) // 模拟验证失败

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=invalid-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Invalid token' })
      
      // 验证调用顺序：应该调用验证但不查询用户
      expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token')
      expect(mockUserFindById).not.toHaveBeenCalled()
    })

    it('❌ token验证异常时应该拒绝', async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error('JWT parsing failed')
      })

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=malformed-jwt' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('👤 用户查询流程', () => {
    beforeEach(() => {
      // 设置有效token验证
      mockVerifyToken.mockReturnValue({ userId: 'user123' })
    })

    it('❌ 用户不存在时应该拒绝', async () => {
      mockUserFindById.mockResolvedValue(null) // 用户不存在

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=valid-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'User not found' })
      
      // 验证完整的调用链
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockConnectToDatabase).toHaveBeenCalled()
      expect(mockUserFindById).toHaveBeenCalledWith('user123')
    })

    it('❌ 数据库查询失败时应该拒绝', async () => {
      mockUserFindById.mockRejectedValue(new Error('Database connection lost'))

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=valid-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('❌ 数据库连接失败时应该拒绝', async () => {
      mockConnectToDatabase.mockRejectedValue(new Error('Cannot connect to MongoDB'))

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ success: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=valid-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('✅ 完整成功流程', () => {
    it('所有验证通过时应该设置用户上下文并继续', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      mockVerifyToken.mockReturnValue({ userId: 'user123' })
      mockUserFindById.mockResolvedValue(mockUser)

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/profile', (c) => {
        // 测试用户上下文是否正确设置
        return c.json({ message: 'Profile accessed successfully' })
      })

      const req = new Request('http://localhost/api/profile', {
        headers: { 'Cookie': 'auth_token=valid-jwt-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ message: 'Profile accessed successfully' })

      // 验证完整的调用链
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt-token')
      expect(mockConnectToDatabase).toHaveBeenCalled()
      expect(mockUserFindById).toHaveBeenCalledWith('user123')
    })

    it('应该正确处理用户信息的各种字段', async () => {
      const mockUser = {
        _id: 'user456',
        name: 'Jane Smith',
        email: 'jane@company.com',
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-10'),
      }

      mockVerifyToken.mockReturnValue({ userId: 'user456' })
      mockUserFindById.mockResolvedValue(mockUser)

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ authenticated: true }))

      const req = new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=another-valid-token' }
      })

      const res = await app.request(req)

      expect(res.status).toBe(200)
      expect(mockUserFindById).toHaveBeenCalledWith('user456')
    })
  })

  describe('🛣️ 路径匹配行为', () => {
    it('中间件应该只影响匹配的路径', async () => {
      const app = new Hono()
      
      // 只对特定路径应用中间件
      app.use('/protected/*', authSessionMiddleware)
      
      app.get('/public/info', (c) => c.json({ public: true }))
      app.get('/protected/secret', (c) => c.json({ secret: true }))

      // 公开路径不应该被中间件影响
      const publicReq = new Request('http://localhost/public/info')
      const publicRes = await app.request(publicReq)
      
      expect(publicRes.status).toBe(200)
      expect(await publicRes.json()).toEqual({ public: true })
      expect(mockVerifyToken).not.toHaveBeenCalled()

      // 受保护路径应该被中间件拦截
      const protectedReq = new Request('http://localhost/protected/secret')
      const protectedRes = await app.request(protectedReq)
      
      expect(protectedRes.status).toBe(401)
      expect(await protectedRes.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('📊 Mock调用验证', () => {
    it('成功认证时应该按正确顺序调用所有依赖', async () => {
      const mockUser = { _id: 'test', name: 'Test', email: 'test@example.com' }
      
      mockVerifyToken.mockReturnValue({ userId: 'test' })
      mockUserFindById.mockResolvedValue(mockUser)

      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ ok: true }))

      await app.request(new Request('http://localhost/api/test', {
        headers: { 'Cookie': 'auth_token=test-token' }
      }))

      // 验证调用次数
      expect(mockVerifyToken).toHaveBeenCalledTimes(1)
      expect(mockConnectToDatabase).toHaveBeenCalledTimes(1)
      expect(mockUserFindById).toHaveBeenCalledTimes(1)

      // 验证调用参数
      expect(mockVerifyToken).toHaveBeenCalledWith('test-token')
      expect(mockUserFindById).toHaveBeenCalledWith('test')
    })

    it('早期失败时不应该调用后续函数', async () => {
      // 场景：没有cookie
      const app = new Hono()
      app.use('/api/*', authSessionMiddleware)
      app.get('/api/test', (c) => c.json({ ok: true }))

      await app.request(new Request('http://localhost/api/test'))

      expect(mockVerifyToken).not.toHaveBeenCalled()
      expect(mockConnectToDatabase).not.toHaveBeenCalled()
      expect(mockUserFindById).not.toHaveBeenCalled()
    })
  })
})
