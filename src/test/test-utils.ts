/**
 * Hono API 测试工具
 */
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { expect } from 'vitest'

// 模拟用户数据
export const mockUser = {
  _id: '67890abcdef123456789012',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 模拟管理员用户
export const mockAdminUser = {
  _id: '67890abcdef123456789013',
  name: 'Admin User',
  email: 'admin@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 模拟工作区数据
export const mockWorkspace = {
  _id: '67890abcdef123456789014',
  name: 'Test Workspace',
  userId: mockUser._id,
  image: 'https://example.com/image.jpg',
  inviteCode: 'ABC123DEF456',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 模拟成员数据
export const mockMember = {
  _id: '67890abcdef123456789015',
  userId: mockUser._id,
  workspaceId: mockWorkspace._id,
  role: 'MEMBER',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 模拟管理员成员
export const mockAdminMember = {
  _id: '67890abcdef123456789016',
  userId: mockAdminUser._id,
  workspaceId: mockWorkspace._id,
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 创建测试客户端的辅助函数
export function createTestClient<T extends Hono<Record<string, unknown>>>(app: T) {
  return testClient(app)
}

// 模拟认证中间件
export const mockAuthMiddleware = (user = mockUser) => {
  return async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', user)
    await next()
  }
}

// HTTP状态码断言辅助函数
export const expectStatus = {
  ok: (response: Response) => expect(response.status).toBe(200),
  created: (response: Response) => expect(response.status).toBe(201),
  badRequest: (response: Response) => expect(response.status).toBe(400),
  unauthorized: (response: Response) => expect(response.status).toBe(401),
  forbidden: (response: Response) => expect(response.status).toBe(403),
  notFound: (response: Response) => expect(response.status).toBe(404),
  internalServerError: (response: Response) => expect(response.status).toBe(500),
}

// JSON响应断言辅助函数
export const expectJsonResponse = async (response: Response, expectedData?: Record<string, unknown>) => {
  expect(response.headers.get('content-type')).toContain('application/json')
  
  if (expectedData) {
    const json = await response.json()
    expect(json).toEqual(expectedData)
    return json
  }
  
  return await response.json()
}
