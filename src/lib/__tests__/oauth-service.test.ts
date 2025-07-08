import { describe, it, expect, vi, beforeEach } from "vitest"
import { authenticateWithGitHub, authenticateWithGoogle } from "@/lib/oauth-providers"
import { User, OAuthProvider } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { createTokenPair } from "@/lib/hono-jwt"

// Mock dependencies
vi.mock("@/lib/mongodb", () => ({
	connectToDatabase: vi.fn(),
}))

vi.mock("@/lib/hono-jwt", () => ({
	createTokenPair: vi.fn(),
}))

vi.mock("@/models", () => ({
	User: {
		findOne: vi.fn(),
		prototype: {
			save: vi.fn(),
		},
	},
	OAuthProvider: {
		GITHUB: "github",
		GOOGLE: "google",
	},
}))

vi.mock("@octokit/rest", () => ({
	Octokit: vi.fn().mockImplementation(() => ({
		rest: {
			users: {
				getAuthenticated: vi.fn(),
				listEmailsForAuthenticatedUser: vi.fn(),
			},
		},
	})),
}))

vi.mock("googleapis", () => ({
	google: {
		auth: {
			OAuth2: vi.fn().mockImplementation(() => ({
				setCredentials: vi.fn(),
			})),
		},
		oauth2: vi.fn().mockImplementation(() => ({
			userinfo: {
				get: vi.fn(),
			},
		})),
	},
}))

const mockConnectToDatabase = vi.mocked(connectToDatabase)
const mockCreateTokenPair = vi.mocked(createTokenPair)
const mockUser = vi.mocked(User)

describe("OAuth Service", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("authenticateWithGitHub", () => {
		it("should create new user for first-time GitHub OAuth", async () => {
			// Mock dependencies
			mockConnectToDatabase.mockResolvedValue({} as any)
			mockUser.findOne.mockResolvedValue(null)

			const mockNewUser = {
				_id: "user123",
				name: "Test User",
				email: "test@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
				save: vi.fn().mockResolvedValue({}),
			}

			// Mock User constructor
			const UserConstructor = vi.fn().mockImplementation(() => mockNewUser)
			vi.mocked(User).mockImplementation(UserConstructor as any)

			const mockTokens = {
				accessToken: "access_token",
				refreshToken: "refresh_token",
				sessionId: "session_id",
				expiresIn: 3600,
				refreshExpiresIn: 7200,
			}

			mockCreateTokenPair.mockResolvedValue(mockTokens)

			// Mock Octokit response
			const { Octokit } = await import("@octokit/rest")
			const mockOctokit = new Octokit()
			vi.mocked(mockOctokit.rest.users.getAuthenticated).mockResolvedValue({
				data: {
					id: 123456,
					login: "testuser",
					name: "Test User",
					email: "test@example.com",
					avatar_url: "https://avatar.url",
				},
			} as any)

			const result = await authenticateWithGitHub("mock_token")

			expect(result.isNewUser).toBe(true)
			expect(result.user.email).toBe("test@example.com")
			expect(result.tokens).toBe(mockTokens)
			expect(mockNewUser.save).toHaveBeenCalled()
		})

		it("should return existing user for GitHub OAuth", async () => {
			const existingUser = {
				_id: "existing_user",
				name: "Existing User",
				email: "existing@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
				oauthAccounts: [
					{
						provider: OAuthProvider.GITHUB,
						providerId: "123456",
					},
				],
				save: vi.fn().mockResolvedValue({}),
			}

			mockConnectToDatabase.mockResolvedValue({} as any)
			mockUser.findOne.mockResolvedValue(existingUser as any)

			const mockTokens = {
				accessToken: "access_token",
				refreshToken: "refresh_token",
				sessionId: "session_id",
				expiresIn: 3600,
				refreshExpiresIn: 7200,
			}

			mockCreateTokenPair.mockResolvedValue(mockTokens)

			// Mock Octokit response
			const { Octokit } = await import("@octokit/rest")
			const mockOctokit = new Octokit()
			vi.mocked(mockOctokit.rest.users.getAuthenticated).mockResolvedValue({
				data: {
					id: 123456,
					login: "testuser",
					name: "Test User",
					email: "existing@example.com",
					avatar_url: "https://avatar.url",
				},
			} as any)

			const result = await authenticateWithGitHub("mock_token")

			expect(result.isNewUser).toBe(false)
			expect(result.user.email).toBe("existing@example.com")
		})
	})

	describe("authenticateWithGoogle", () => {
		it("should create new user for first-time Google OAuth", async () => {
			mockConnectToDatabase.mockResolvedValue({} as any)
			mockUser.findOne.mockResolvedValue(null)

			const mockNewUser = {
				_id: "user123",
				name: "Google User",
				email: "google@example.com",
				createdAt: new Date(),
				updatedAt: new Date(),
				save: vi.fn().mockResolvedValue({}),
			}

			const UserConstructor = vi.fn().mockImplementation(() => mockNewUser)
			vi.mocked(User).mockImplementation(UserConstructor as any)

			const mockTokens = {
				accessToken: "access_token",
				refreshToken: "refresh_token",
				sessionId: "session_id",
				expiresIn: 3600,
				refreshExpiresIn: 7200,
			}

			mockCreateTokenPair.mockResolvedValue(mockTokens)

			// Mock Google OAuth response
			const { google } = await import("googleapis")
			const mockOAuth2 = {
				userinfo: {
					get: vi.fn().mockResolvedValue({
						data: {
							id: "google123",
							email: "google@example.com",
							name: "Google User",
							picture: "https://picture.url",
							verified_email: true,
						},
					}),
				},
			}

			vi.mocked(google.oauth2).mockReturnValue(mockOAuth2 as any)

			const result = await authenticateWithGoogle("mock_token")

			expect(result.isNewUser).toBe(true)
			expect(result.user.email).toBe("google@example.com")
			expect(result.tokens).toBe(mockTokens)
		})
	})
})
