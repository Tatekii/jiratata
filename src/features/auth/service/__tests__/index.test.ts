/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Models } from "node-appwrite"
import { testClient } from "hono/testing"
import app from ".."
import { AUTH_COOKIE } from "../../constans"

// Mock next/headers first
vi.mock("next/headers", () => ({
	cookies: vi.fn().mockImplementation(() => ({
		get: vi.fn().mockReturnValue({ value: "mock-session-token" }),
	})),
}))

vi.mock("server-only", () => {
	return {
		// mock server-only module
	}
})

// Create mock account instance with logging
const mockAccount = {
	create: vi.fn<() => Promise<Models.User<Models.Preferences>>>().mockImplementation(() => {
		return Promise.resolve({} as Models.User<Models.Preferences>)
	}),
	createEmailPasswordSession: vi.fn<() => Promise<Models.Session>>().mockImplementation(() => {
		return Promise.resolve({} as Models.Session)
	}),
	deleteSessions: vi.fn<() => Promise<void>>(),
	deleteSession: vi.fn<() => Promise<void>>(),
	get: vi.fn<() => Promise<Models.User<Models.Preferences>>>(),
}

// Mock the hono lib with logging
vi.mock("@/lib/hono", () => {
	const mock = {
		createSessionClient: vi.fn().mockImplementation(() => {
			return Promise.resolve({
				account: mockAccount,
				databases: {},
				storage: {},
			})
		}),
		createAdminClient: vi.fn().mockImplementation(() => {
			return Promise.resolve({
				account: mockAccount,
				users: {},
				databases: {},
			})
		}),
	}
	return mock
})

describe("Auth API", () => {
	const client = testClient(app)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("GET /current", () => {
		it("should return current user", async () => {
			const mockUser = {
				$id: "test-user-id",
				name: "Test User",
				email: "test@example.com",
			} as Models.User<Models.Preferences>

			mockAccount.get.mockResolvedValueOnce(mockUser)

			const res = await client.current.$get()

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ data: mockUser })
		})
	})

	describe("POST /login", () => {
		const loginData = {
			email: "test@example.com",
			password: "1qaz@WSX",
		}

		it("should login successfully", async () => {
			const mockSession = {
				secret: "test-session-secret",
			} as Models.Session

			mockAccount.createEmailPasswordSession.mockResolvedValueOnce(mockSession)

			const res = await client.login.$post({
				json: loginData,
			})

			expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
				loginData.email,
				loginData.password
			)

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(AUTH_COOKIE)
		})
	})

	describe("POST /register", () => {
		const registerData = {
			name: "mockUser",
			email: "mockEmail@email.com",
			password: "1qaz@WSX",
			password2: "1qaz@WSX",
		}

		it("should register successfully", async () => {
			const mockUser = {
				$id: "test-user-id",
				name: "Test User",
				email: "test@example.com",
			} as Models.User<Models.Preferences>

			const mockSession = {
				secret: "test-session-secret",
			} as Models.Session

			mockAccount.create.mockResolvedValueOnce(mockUser)
			mockAccount.createEmailPasswordSession.mockResolvedValueOnce(mockSession)

			const res = await client.register.$post({
				json: registerData,
			})

			expect(mockAccount.create).toHaveBeenCalledWith(
				expect.any(String),
				registerData.email,
				registerData.password,
				registerData.name
			)

			expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
				registerData.email,
				registerData.password
			)

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(AUTH_COOKIE)
		})
	})

	describe("POST /logout", () => {
		it("should logout successfully", async () => {
			const res = await client.logout.$post()

			expect(mockAccount.deleteSession).toHaveBeenCalledWith("current")
			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(AUTH_COOKIE + "=;")
		})
	})
})
