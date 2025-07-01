/**
 * JWT Auth Service 集成测试
 * 测试完整的JWT认证流程，包括access token和refresh token
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { testClient } from "hono/testing"
import { Hono } from "hono"
import authApp from "@/features/auth/service/auth.service"
import * as authLib from "@/lib/hono-jwt"
import { connectToDatabase } from "@/lib/mongodb"

// Mock外部依赖
vi.mock("@/lib/mongodb")
vi.mock("@/lib/auth")
vi.mock("@/models")

const mockedConnectToDatabase = vi.mocked(connectToDatabase)
const mockedLoginUser = vi.mocked(authLib.loginUser)
const mockedRegisterUser = vi.mocked(authLib.registerUser)
const mockedRefreshAccessToken = vi.mocked(authLib.refreshAccessToken)

// 创建测试应用
const app = new Hono().route("/auth", authApp)
const client = testClient(app)

describe("JWT Auth Service Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockedConnectToDatabase.mockResolvedValue()
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

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				token: "access_token_123",
				refreshToken: "refresh_token_123",
			})

			const response = await client.auth.login.$post({
				json: {
					email: "test@example.com",
					password: "password123",
				},
			})

			expect(response.status).toBe(200)

			const data = await response.json() as { success: boolean; data: any } | { error: string }
			if ('success' in data) {
				expect(data.success).toBe(true)
				// 比较时忽略日期类型差异
				expect(data.data._id).toBe(mockUser._id)
				expect(data.data.name).toBe(mockUser.name)
				expect(data.data.email).toBe(mockUser.email)
				expect(data.data.createdAt).toBeDefined()
				expect(data.data.updatedAt).toBeDefined()
			} else {
				throw new Error('Expected success response')
			}

			// 检查cookies是否设置
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			const authCookie = cookies.find((cookie) => cookie.includes("auth_session"))
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))

			expect(authCookie).toBeDefined()
			expect(refreshCookie).toBeDefined()
			expect(authCookie).toContain("HttpOnly")
			expect(refreshCookie).toContain("HttpOnly")
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
			expect(data.error).toBe("邮箱或密码不正确")
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

			mockedRegisterUser.mockResolvedValue({
				user: mockUser,
				token: "access_token_456",
				refreshToken: "refresh_token_456",
			})

			const testPwd = "password123"
            
			const response = await client.auth.register.$post({
				json: {
					name: "New User",
					email: "new@example.com",
					password: testPwd,
					password2: testPwd,
				},
			})

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.success).toBe(true)
			expect(data.data).toEqual(mockUser)

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
				},
			})

			expect(response.status).toBe(400)

			const data = await response.json()
			expect(data.error).toBe("此邮箱已被注册")
		})
	})

	describe("POST /auth/refresh", () => {
		it("should refresh tokens successfully", async () => {
			mockedRefreshAccessToken.mockResolvedValue({
				token: "new_access_token",
				refreshToken: "new_refresh_token",
			})

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
			expect(data.success).toBe(true)

			// 检查新的cookies是否设置
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			expect(mockedRefreshAccessToken).toHaveBeenCalledWith("valid_refresh_token")
		})

		it("should fail when refresh token is missing", async () => {
			const response = await client.auth.refresh.$post({})

			expect(response.status).toBe(401)

			const data = await response.json()
			expect(data.error).toBe("Refresh token not found")
		})

		it("should fail when refresh token is invalid", async () => {
			mockedRefreshAccessToken.mockResolvedValue(null)

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
			expect(data.error).toBe("Invalid refresh token")
		})
	})

	describe("POST /auth/logout", () => {
		it("should logout successfully and clear cookies", async () => {
			// Mock authenticated user
			vi.mocked(authLib.verifyToken).mockReturnValue({
				userId: "user123",
			})

			const response = await client.auth.logout.$post(
				{},
				{
					headers: {
						Cookie: "auth_session=valid_token; refresh_token=valid_refresh_token",
					},
				}
			)

			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data.success).toBe(true)

			// 检查cookies是否被清除
			const cookies = response.headers.getSetCookie()
			expect(cookies).toHaveLength(2)

			const authCookie = cookies.find((cookie) => cookie.includes("auth_session"))
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))

			expect(authCookie).toContain("Max-Age=0")
			expect(refreshCookie).toContain("Max-Age=0")
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

			// 1. 登录
			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				token: "initial_access_token",
				refreshToken: "initial_refresh_token",
			})

			const loginResponse = await client.auth.login.$post({
				json: {
					email: "flow@example.com",
					password: "password123",
				},
			})

			expect(loginResponse.status).toBe(200)

			// 2. 刷新token
			mockedRefreshAccessToken.mockResolvedValue({
				token: "refreshed_access_token",
				refreshToken: "refreshed_refresh_token",
			})

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
			const logoutResponse = await client.auth.logout.$post(
				{},
				{
					headers: {
						Cookie: "auth_session=refreshed_access_token; refresh_token=refreshed_refresh_token",
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

			mockedLoginUser.mockResolvedValue({
				user: mockUser,
				token: "access_token",
				refreshToken: "refresh_token",
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
			const authCookie = cookies.find((cookie) => cookie.includes("auth_session"))
			expect(authCookie).toContain("Max-Age=604800") // 7 days in seconds

			// Refresh token 有效期应该是30天
			const refreshCookie = cookies.find((cookie) => cookie.includes("refresh_token"))
			expect(refreshCookie).toContain("Max-Age=2592000") // 30 days in seconds
		})
	})
})
