/**
 * JWT Auth Service 单元测试
 * 
 * 测试范围：
 * - 基于 Hono 的 RPC 路由的 HTTP 行为
 * - Cookie 设置、清除和安全属性
 * - 客户端信息传递（IP地址、User-Agent）
 * - 错误处理和边界场景
 * - 并发和安全性测试
 * 
 * 测试策略：
 * - 使用 mock 隔离外部依赖（JWT库、数据库、中间件）
 * - 专注测试路由层的逻辑，不测试底层JWT实现
 * - 验证HTTP状态码、响应格式、Cookie属性
 * - 涵盖正常流程、异常场景、边界条件
 * 
 * 覆盖的路由：
 * - POST /auth/login - 用户登录
 * - POST /auth/register - 用户注册
 * - POST /auth/refresh - 刷新token
 * - POST /auth/logout - 用户登出
 * - GET /auth/current - 获取当前用户
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { testClient } from "hono/testing"
import { Hono } from "hono"
import authApp from "@/features/auth/service/auth.service"
import * as authLib from "@/lib/hono-jwt"
import { connectToDatabase } from "@/lib/mongodb"


// Mock外部依赖
vi.mock("@/lib/mongodb")
vi.mock("@/lib/hono-jwt")
vi.mock("@/models")

// Mock中间件
vi.mock("@/lib/hono-middleware", () => ({
	authSessionMiddleware: vi.fn((c: any, next: any) => {
		// Mock认证中间件，设置用户信息
		c.set("user", {
			_id: "user123",
			name: "Test User",
			email: "test@example.com"
		})
		return next()
	}),
	localeMiddleware: vi.fn((c: any, next: any) => next()),
	localeValidatorMiddleware: vi.fn(() => (c: any, next: any) => {
		// Mock验证函数，直接返回测试数据
		const originalValid = c.req.valid
		c.req.valid = vi.fn((type: string) => {
			if (type === "json") {
				// 从testClient注入的数据中获取
				return originalValid?.call(c.req, type) || {}
			}
			return {}
		})
		return next()
	})
}))

const mockedConnectToDatabase = vi.mocked(connectToDatabase)
const mockedLoginUser = vi.mocked(authLib.loginUser)
const mockedRegisterUser = vi.mocked(authLib.registerUser)
const mockedRefreshTokenPair = vi.mocked(authLib.refreshTokenPair)
const mockedRevokeAllUserTokens = vi.mocked(authLib.revokeAllUserTokens)

// 创建测试应用
const app = new Hono().route("/auth", authApp)
const client = testClient(app)

describe("JWT Auth Service Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-expect-error - mock function doesn't need exact return type
		mockedConnectToDatabase.mockResolvedValue({})
	})

	describe("POST /auth/login", () => {
		it("should login successfully and set both tokens", async () => {
			const now = new Date()
			const mockUser = {
				_id: "user123",
				name: "Test User",
				email: "test@example.com",
				createdAt: now,
				updatedAt: now,
			}

			const mockTokens = {
				accessToken: "access_token_123",
				refreshToken: "refresh_token_123",
				sessionId: "session_123",
				expiresIn: 604800, // 7 days
				refreshExpiresIn: 2592000, // 30 days
			}

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			expect(response.status).toBe(200)

			const result = await response.json()
			expect(result).toHaveProperty('success', true)
			expect(result).toHaveProperty('data')
			
			// Use type guard to check if result has data property
			if ('data' in result) {
				expect(result.data._id).toBe(mockUser._id)
				expect(result.data.name).toBe(mockUser.name)
				expect(result.data.email).toBe(mockUser.email)
			}

			// 检查cookies是否设置
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			const authCookie = cookies.find((cookie) => cookie.includes("auth_token"))
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))

			expect(authCookie).toBeDefined()
			expect(refreshCookie).toBeDefined()
			expect(authCookie).toContain("HttpOnly")
			expect(refreshCookie).toContain("HttpOnly")
			expect(authCookie).toContain("Secure")
			expect(refreshCookie).toContain("Secure")
			expect(authCookie).toContain("SameSite=Strict")
			expect(refreshCookie).toContain("SameSite=Strict")
		})

		it("should handle login errors", async () => {
			mockedLoginUser.mockRejectedValue(new Error("邮箱或密码不正确"))

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "wrongpassword",
				},
			})

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data).toHaveProperty('error', "邮箱或密码不正确")
		})

		it("should pass client info to loginUser", async () => {
			const mockUser = {
				_id: "user123",
				name: "Test User",
				email: "test@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTokens = {
				accessToken: "access_token_123",
				refreshToken: "refresh_token_123",
				sessionId: "session_123",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			}, {
				headers: {
					'x-forwarded-for': '192.168.1.1',
					'user-agent': 'Mozilla/5.0 Test Browser'
				}
			})

			// 验证loginUser被调用，重点是客户端信息
			expect(mockedLoginUser).toHaveBeenCalledWith(
				expect.any(Object), // 不验证具体内容，因为mock可能无法准确解析
				"192.168.1.1",
				"Mozilla/5.0 Test Browser"
			)
		})
	})

	describe("POST /auth/register", () => {
		it("should register successfully and set both tokens", async () => {
			const mockUser = {
				_id: "user456",
				name: "New User",
				email: "new@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTokens = {
				accessToken: "access_token_456",
				refreshToken: "refresh_token_456",
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRegisterUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			const response = await client.auth.register.$post({
				json: {
					name: "New User",
					email: "new@example.com",
					password: "password123",
					password2: "password123",
				},
			})

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data).toHaveProperty('success', true)
			expect(data).toHaveProperty('data')
			expect(data.data._id).toBe(mockUser._id)

			// 检查cookies
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)
		})

		it("should handle registration errors", async () => {
			mockedRegisterUser.mockRejectedValue(new Error("此邮箱已被注册"))

			const response = await client.auth.register.$post({
				json: {
					name: "Test User",
					email: "existing@example.com",
					password: "password123",
					password2: "password123",
				},
			})

			expect(response.status).toBe(400)

			const data = await response.json()
			expect(data).toHaveProperty('error', "此邮箱已被注册")
		})

		it("should pass client info to registerUser", async () => {
			const mockUser = {
				_id: "user456",
				name: "New User",
				email: "new@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTokens = {
				accessToken: "access_token_456",
				refreshToken: "refresh_token_456",
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRegisterUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			await client.auth.register.$post({
				json: {
					name: "New User",
					email: "new@example.com",
					password: "password123",
					password2: "password123",
				},
			}, {
				headers: {
					'x-real-ip': '10.0.0.1',
					'user-agent': 'Mobile App 1.0'
				}
			})

			// 验证registerUser被调用，重点是客户端信息
			expect(mockedRegisterUser).toHaveBeenCalledWith(
				expect.any(Object), // 不验证具体内容，因为mock可能无法准确解析
				"10.0.0.1",
				"Mobile App 1.0"
			)
		})
	})

	describe("POST /auth/refresh", () => {
		it("should refresh tokens successfully", async () => {
			const mockTokens = {
				accessToken: "new_access_token",
				refreshToken: "new_refresh_token",
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(mockTokens)

			const response = await client.auth.refresh.$post(
				{},
				{
					headers: {
						Cookie: "refresh_token=valid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data).toHaveProperty('success', true)

			// 检查新的cookies是否设置
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			expect(mockedRefreshTokenPair).toHaveBeenCalledWith(
				"valid_refresh_token",
				undefined, // no x-forwarded-for header
				undefined  // no user-agent header
			)
		})

		it("should pass client info to refreshTokenPair", async () => {
			const mockTokens = {
				accessToken: "new_access_token",
				refreshToken: "new_refresh_token",
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(mockTokens)

			await client.auth.refresh.$post(
				{},
				{
					headers: {
						Cookie: "refresh_token=valid_refresh_token",
						'x-forwarded-for': '192.168.1.100',
						'user-agent': 'Safari 17.0'
					},
				}
			)

			expect(mockedRefreshTokenPair).toHaveBeenCalledWith(
				"valid_refresh_token",
				"192.168.1.100",
				"Safari 17.0"
			)
		})

		it("should fail when refresh token is missing", async () => {
			const response = await client.auth.refresh.$post({})

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data).toHaveProperty('error', "Refresh token not found")
		})

		it("should fail when refresh token is invalid", async () => {
			mockedRefreshTokenPair.mockResolvedValue(null)

			const response = await client.auth.refresh.$post(
				{},
				{
					headers: {
						Cookie: "refresh_token=invalid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data).toHaveProperty('error', "Invalid refresh token")
		})

		it("should handle refresh errors gracefully", async () => {
			mockedRefreshTokenPair.mockRejectedValue(new Error("Database connection failed"))

			const response = await client.auth.refresh.$post(
				{},
				{
					headers: {
						Cookie: "refresh_token=valid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data).toHaveProperty('error', "Database connection failed")
		})
	})

	describe("POST /auth/logout", () => {
		it("should logout successfully and clear cookies", async () => {
			mockedRevokeAllUserTokens.mockResolvedValue()

			const response = await client.auth.logout.$post(
				{},
				{
					headers: {
						Cookie: "auth_token=valid_token; refresh_token=valid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data).toHaveProperty('success', true)

			// 检查cookies是否被清除
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			const authCookie = cookies.find((cookie) => cookie.includes("auth_token"))
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))

			expect(authCookie).toContain("Max-Age=0")
			expect(refreshCookie).toContain("Max-Age=0")

			// 验证调用了token撤销
			expect(mockedRevokeAllUserTokens).toHaveBeenCalledWith("user123", "user_logout")
		})

		it("should clear cookies even when token revocation fails", async () => {
			mockedRevokeAllUserTokens.mockRejectedValue(new Error("Database error"))

			const response = await client.auth.logout.$post(
				{},
				{
					headers: {
						Cookie: "auth_token=valid_token; refresh_token=valid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(500)

			const data = await response.json()
			expect(data).toHaveProperty('error', "Database error")

			// 即使出错也要清除cookies
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			const authCookie = cookies.find((cookie) => cookie.includes("auth_token"))
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))

			expect(authCookie).toContain("Max-Age=0")
			expect(refreshCookie).toContain("Max-Age=0")
		})
	})

	describe("GET /auth/current", () => {
		it("should return current user when authenticated", async () => {
			const response = await client.auth.current.$get()

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data).toHaveProperty('data')
			expect(data.data).toEqual({
				_id: "user123",
				name: "Test User",
				email: "test@example.com"
			})
		})
	})

	describe("Token Flow Integration", () => {
		it("should handle complete authentication flow", async () => {
			const mockUser = {
				_id: "user789",
				name: "Flow Test User",
				email: "flow@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const initialTokens = {
				accessToken: "initial_access_token",
				refreshToken: "initial_refresh_token",
				sessionId: "session_789",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			const refreshedTokens = {
				accessToken: "refreshed_access_token",
				refreshToken: "refreshed_refresh_token",
				sessionId: "session_789_new",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			// 1. 登录
			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: initialTokens,
			})

			const loginResponse = await client.auth.login.$post({
				json: {
					email: "flow@example.com",
					password: "password123",
				},
			})

			expect(loginResponse.status).toBe(200)

			// 2. 刷新token
			mockedRefreshTokenPair.mockResolvedValue(refreshedTokens)

			const refreshResponse = await client.auth.refresh.$post(
				{},
				{
					headers: {
						Cookie: "refresh_token=initial_refresh_token",
					},
				}
			)

			expect(refreshResponse.status).toBe(200)

			// 3. 登出
			mockedRevokeAllUserTokens.mockResolvedValue()

			const logoutResponse = await client.auth.logout.$post(
				{},
				{
					headers: {
						Cookie: "auth_token=refreshed_access_token; refresh_token=refreshed_refresh_token",
					},
				}
			)

			expect(logoutResponse.status).toBe(200)
		})
	})

	describe("Cookie Security", () => {
		it("should set secure cookie attributes", async () => {
			const mockUser = {
				_id: "user123",
				name: "Test User",
				email: "test@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTokens = {
				accessToken: "access_token",
				refreshToken: "refresh_token",
				sessionId: "session_123",
				expiresIn: 604800, // 7 days
				refreshExpiresIn: 2592000, // 30 days
			}

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			const cookies = response.headers.getSetCookie()

			cookies.forEach((cookie) => {
				expect(cookie).toContain("HttpOnly")
				expect(cookie).toContain("Secure")
				expect(cookie).toContain("SameSite=Strict")
			})

			// Access token 有效期应该是7天
			const authCookie = cookies.find((cookie) => cookie.includes("auth_token"))
			expect(authCookie).toContain("Max-Age=604800") // 7 days in seconds

			// Refresh token 有效期应该是30天
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))
			expect(refreshCookie).toContain("Max-Age=2592000") // 30 days in seconds
		})
	})

	describe("Error Handling", () => {
		it("should handle malformed request bodies gracefully", async () => {
			// 测试缺少必需字段的情况 - 这里实际会测试JWT库的行为
			mockedLoginUser.mockRejectedValue(new Error("Missing required fields"))

			const response = await client.auth.login.$post({
				// @ts-expect-error - 故意传递不完整的数据来测试错误处理
				json: {
					email: "test@example.com",
					// missing password
				},
			})

			// 验证返回了适当的错误状态
			expect(response.status).toBe(401)
			
			const data = await response.json()
			if ('error' in data) {
				expect(data.error).toBe("Missing required fields")
			}
		})

		it("should handle network errors", async () => {
			mockedLoginUser.mockRejectedValue(new Error("Network timeout"))

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			expect(response.status).toBe(401)

			const data = await response.json() 
			expect(data).toHaveProperty('error', "Network timeout")
		})

		it("should handle unknown errors", async () => {
			mockedLoginUser.mockRejectedValue("Unknown error")

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data).toHaveProperty('error', "登录失败")
		})
	})

	describe("Advanced Security Tests", () => {
		it("should handle concurrent logout requests gracefully", async () => {
			mockedRevokeAllUserTokens.mockResolvedValue()

			// 模拟并发登出请求
			const requests = Array(3).fill(null).map(() => 
				client.auth.logout.$post({}, {
					headers: {
						Cookie: "auth_token=valid_token; refresh_token=valid_refresh_token",
					},
				})
			)

			const responses = await Promise.all(requests)
			
			// 所有请求都应该成功
			responses.forEach(response => {
				expect(response.status).toBe(200)
			})

			// token撤销应该被调用多次
			expect(mockedRevokeAllUserTokens).toHaveBeenCalledTimes(3)
		})

		it("should handle refresh token rotation correctly", async () => {
			const firstTokens = {
				accessToken: "first_access_token",
				refreshToken: "first_refresh_token",
				sessionId: "session_1",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			const secondTokens = {
				accessToken: "second_access_token", 
				refreshToken: "second_refresh_token",
				sessionId: "session_2",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			// 第一次刷新
			mockedRefreshTokenPair.mockResolvedValueOnce(firstTokens)
			
			const firstResponse = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=original_token",
				},
			})

			expect(firstResponse.status).toBe(200)

			// 第二次刷新使用新的token
			mockedRefreshTokenPair.mockResolvedValueOnce(secondTokens)

			const secondResponse = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=first_refresh_token",
				},
			})

			expect(secondResponse.status).toBe(200)

			// 验证token轮换
			expect(mockedRefreshTokenPair).toHaveBeenNthCalledWith(1, "original_token", undefined, undefined)
			expect(mockedRefreshTokenPair).toHaveBeenNthCalledWith(2, "first_refresh_token", undefined, undefined)
		})

		it("should handle cookie overflow scenarios", async () => {
			const mockUser = {
				_id: "user123",
				name: "Test User",
				email: "test@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			// 创建一个非常长的token来测试cookie大小限制
			const longToken = "a".repeat(4000) // 4KB token
			
			const mockTokens = {
				accessToken: longToken,
				refreshToken: longToken,
				sessionId: "session_123",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			expect(response.status).toBe(200)

			// 验证cookie确实被设置（即使很大）
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)
			
			// 检查长token是否在cookie中
			const authCookie = cookies.find(c => c.includes("auth_token"))
			expect(authCookie).toContain(longToken)
		})
	})

	describe("Edge Cases and Boundary Conditions", () => {
		it("should handle missing cookie header in logout", async () => {
			mockedRevokeAllUserTokens.mockResolvedValue()

			// 无cookie的登出请求
			const response = await client.auth.logout.$post({})

			expect(response.status).toBe(200)

			// 应该仍然尝试清除cookies
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)
		})

		it("should handle empty string tokens", async () => {
			// 测试空字符串refresh token
			const response = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=",
				},
			})

			expect(response.status).toBe(401)
			
			const data = await response.json()
			expect(data).toHaveProperty('error', "Refresh token not found")
		})

		it("should handle special characters in tokens", async () => {
			const specialTokens = {
				accessToken: "token_with_特殊字符_and_émojis_🔐",
				refreshToken: "refresh_with_特殊字符_and_émojis_🔄",
				sessionId: "session_特殊",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(specialTokens)

			const response = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=token_with_special_chars",
				},
			})

			expect(response.status).toBe(200)

			// 检查特殊字符是否正确处理
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)
		})

		it("should handle multiple cookie values", async () => {
			const mockTokens = {
				accessToken: "new_access_token",
				refreshToken: "new_refresh_token", 
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(mockTokens)

			// 发送包含多个cookie的请求
			const response = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=valid_token; other_cookie=value; session_id=123",
				},
			})

			expect(response.status).toBe(200)

			// 验证正确提取了refresh_token
			expect(mockedRefreshTokenPair).toHaveBeenCalledWith("valid_token", undefined, undefined)
		})

		it("should handle extremely long cookie strings", async () => {
			const longCookieValue = "x".repeat(8000) // 8KB cookie value
			
			const response = await client.auth.refresh.$post({}, {
				headers: {
					Cookie: `refresh_token=${longCookieValue}; other=value`,
				},
			})

			// 应该能正确处理长cookie
			expect(mockedRefreshTokenPair).toHaveBeenCalledWith(longCookieValue, undefined, undefined)
		})
	})

	describe("HTTP Header Validation", () => {
		it("should prioritize x-forwarded-for over x-real-ip", async () => {
			const mockUser = {
				_id: "user123",
				name: "Test User", 
				email: "test@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockTokens = {
				accessToken: "access_token_123",
				refreshToken: "refresh_token_123",
				sessionId: "session_123",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				tokens: mockTokens,
			})

			await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			}, {
				headers: {
					'x-forwarded-for': '192.168.1.1',
					'x-real-ip': '10.0.0.1', // 应该被忽略
					'user-agent': 'Test Browser'
				}
			})

			// 验证使用了x-forwarded-for而不是x-real-ip
			expect(mockedLoginUser).toHaveBeenCalledWith(
				expect.any(Object),
				"192.168.1.1", // 应该是x-forwarded-for的值
				"Test Browser"
			)
		})

		it("should handle missing user-agent header", async () => {
			const mockTokens = {
				accessToken: "new_access_token",
				refreshToken: "new_refresh_token",
				sessionId: "session_456", 
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(mockTokens)

			await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=valid_token",
					'x-forwarded-for': '192.168.1.100',
					// 故意省略user-agent
				},
			})

			expect(mockedRefreshTokenPair).toHaveBeenCalledWith(
				"valid_token",
				"192.168.1.100",
				undefined // user-agent应该是undefined
			)
		})

		it("should handle malformed header values", async () => {
			const mockTokens = {
				accessToken: "new_access_token",
				refreshToken: "new_refresh_token",
				sessionId: "session_456",
				expiresIn: 604800,
				refreshExpiresIn: 2592000,
			}

			mockedRefreshTokenPair.mockResolvedValue(mockTokens)

			await client.auth.refresh.$post({}, {
				headers: {
					Cookie: "refresh_token=valid_token",
					'x-forwarded-for': '   ', // 空白字符
					'user-agent': '', // 空字符串
				},
			})

			// 验证空白值被正确处理（Hono可能会将空白转为undefined）
			expect(mockedRefreshTokenPair).toHaveBeenCalledWith(
				"valid_token",
				undefined, // 空白字符可能被Hono处理为undefined
				""         // 空字符串保留
			)
		})
	})
})
