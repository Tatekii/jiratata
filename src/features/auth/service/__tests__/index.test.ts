import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { testClient } from "hono/testing"
// import { Account, Client } from "node-appwrite"
import app from ".."
import { AUTH_COOKIE } from "../../constans"

// Mock Appwrite client and account
jest.mock("node-appwrite", () => ({
	Client: jest.fn().mockImplementation(() => ({
		setEndpoint: jest.fn(),
		setProject: jest.fn(),
	})),
	Account: jest.fn().mockImplementation(() => ({
		create: jest.fn(),
		createEmailPasswordSession: jest.fn(),
		deleteSessions: jest.fn(),
	})),
}))

describe("Auth API", () => {
	const client = testClient(app)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("POST /register", () => {
		const registerData = {
			name: "mockUser",
			email: "mockEmail@email.com",
			password: "1qaz@WSX",
			password2: "1qaz@WSX",
		}

		it("should register successfully", async () => {
			//   const mockUser = {
			//     $id: "user123",
			//     email: registerData.email,
			//     name: registerData.name,
			//   }

			//   const mockSession = {
			//     $id: "session123",
			//     userId: mockUser.$id,
			//     secret: "mock-secret",
			//   }

			// Mock Appwrite responses
			//   const appwriteClient = new Client()
			//   const account = new Account(appwriteClient)
			//   ;(account.create as jest.Mock<typeof account.create>).mockResolvedValueOnce(mockUser)
			//   ;(account.createEmailPasswordSession as jest.Mock).mockResolvedValueOnce(mockSession)

			const res = await client.register.$post({
				json: registerData,
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(AUTH_COOKIE)
		})

		it("should handle registration failure", async () => {
			// const appwriteClient = new Client()
			// const account = new Account(appwriteClient)

			//      ;(account.create as jest.Mock).mockRejectedValueOnce(new Error("Email already exists"))

			const res = await client.register.$post({
				json: registerData,
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({
				success: false,
				error: "Email already exists",
			})
		})
	})

	describe("POST /login", () => {
		const loginData = {
			email: "mockEmail@email.com",
			password: "1qaz@WSX",
		}

		it("should login successfully", async () => {
			//   const mockSession = {
			//     $id: "session123",
			//     userId: "user123",
			//     secret: "mock-secret",
			//   }

			//   const appwriteClient = new Client()
			//   const account = new Account(appwriteClient)
			//   ;(account.createEmailPasswordSession as jest.Mock).mockResolvedValueOnce(mockSession)

			const res = await client.login.$post({
				json: loginData,
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(AUTH_COOKIE)
		})

		it("should handle login failure", async () => {
			//   const appwriteClient = new Client()
			//   const account = new Account(appwriteClient)
			// ;(account.createEmailPasswordSession as jest.Mock).mockRejectedValueOnce(
			//         new Error("Invalid credentials")
			//       )

			const res = await client.login.$post({
				json: loginData,
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({
				success: false,
				error: "Invalid credentials",
			})
		})
	})

	describe("POST /logout", () => {
		it("should logout successfully", async () => {
			// const appwriteClient = new Client()
			// const account = new Account(appwriteClient)
			// ;(account.deleteSessions as jest.Mock).mockResolvedValueOnce({})

			const res = await client.logout.$post()

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ success: true })
			expect(res.headers.get("Set-Cookie")).toContain(`${AUTH_COOKIE}=;`)
		})

		it("should handle logout failure", async () => {
			//   const appwriteClient = new Client()
			//   const account = new Account(appwriteClient)
			//   account.deleteSessions.mockRejectedValueOnce(
			//     new Error("Session not found")
			//   )

			const res = await client.logout.$post()

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({
				success: false,
				error: "Session not found",
			})
		})
	})
})
