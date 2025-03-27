import { describe, it, expect, beforeEach, vi } from "vitest"
import { testClient } from "hono/testing"
import app from ".."
import { EMemberRole } from "@/features/types"
import { createSessionClient } from "@/lib/hono"
import { Account, Databases, Storage, Models } from "node-appwrite"

// Mock next/headers
vi.mock("next/headers", () => ({
	cookies: vi.fn().mockImplementation(() => ({
		get: vi.fn().mockReturnValue({ value: "mock-session-token" }),
	})),
}))

// Mock server-only
vi.mock("server-only", () => {
	return {
		// mock server-only module
	}
})

// Mock getMember function
vi.mock("../../utils", () => ({
	getMember: vi
		.fn()
		.mockImplementation(
			async ({
				workspaceId,
				userId,
			}: {
				workspaceId: string
				userId: string
			}) => {
				if (workspaceId === "test-workspace-id") {
					if (userId === "test-user-id") {
						return {
							$id: "test-member-id",
							userId: "test-user-id",
							workspaceId: "test-workspace-id",
							role: EMemberRole.ADMIN,
						}
					}
					// For non-admin tests
					if (userId === "non-admin-user-id") {
						return {
							$id: "test-member-id",
							userId: "non-admin-user-id",
							workspaceId: "test-workspace-id",
							role: EMemberRole.MEMBER,
						}
					}
				}
				// For unauthorized tests
				if (workspaceId === "unauthorized-workspace-id") {
					return null
				}
				return null
			}
		),
}))

// Create mock databases instance
const mockDatabases = {
	listDocuments: vi.fn().mockImplementation(async () => ({ documents: [], total: 0 })) as unknown as jest.Mock<Promise<Models.DocumentList<Models.Document>>>,
	getDocument: vi.fn().mockImplementation(async () => ({} as unknown as Models.Document)) as unknown as jest.Mock<Promise<Models.Document>>,
	createDocument: vi.fn().mockImplementation(async () => ({} as unknown as Models.Document)) as unknown as jest.Mock<Promise<Models.Document>>,
	updateDocument: vi.fn().mockImplementation(async () => ({} as unknown as Models.Document)) as unknown as jest.Mock<Promise<Models.Document>>,
	deleteDocument: vi.fn().mockImplementation(async () => ({} as unknown as Models.Document)) as unknown as jest.Mock<Promise<Models.Document>>,
} as unknown as Databases

// Create mock storage instance
const mockStorage = {
	listFiles: vi.fn().mockImplementation(async () => ({ files: [], total: 0 })) as unknown as jest.Mock<Promise<Models.FileList>>,
	getFile: vi.fn().mockImplementation(async () => ({} as unknown as Models.File)) as unknown as jest.Mock<Promise<Models.File>>,
	createFile: vi.fn().mockImplementation(async () => ({} as unknown as Models.File)) as unknown as jest.Mock<Promise<Models.File>>,
	updateFile: vi.fn().mockImplementation(async () => ({} as unknown as Models.File)) as unknown as jest.Mock<Promise<Models.File>>,
	deleteFile: vi.fn().mockImplementation(async () => ({} as unknown as Models.File)) as unknown as jest.Mock<Promise<Models.File>>,
} as unknown as Storage

// Create mock users instance
const mockUsers = {
	get: vi.fn(),
}

// Create mock member
const mockMember = {
	$id: "test-member-id",
	$collectionId: "members",
	$databaseId: "main",
	$createdAt: "2024-01-01T00:00:00.000Z",
	$updatedAt: "2024-01-01T00:00:00.000Z",
	$permissions: ["*"],
	userId: "test-user-id",
	workspaceId: "test-workspace-id",
	role: EMemberRole.ADMIN,
} as unknown as Models.Document

// Create mock user
const mockUser = {
	$id: "test-user-id",
	name: "Test User",
	email: "test@example.com",
}

// Create a function to get mock session client
const getMockSessionClient = (userId: string = "test-user-id") => ({
	account: {
		get: vi.fn().mockResolvedValue({
			$id: userId,
			name: "Test User",
			email: "test@example.com",
		}),
	} as unknown as Account,
	databases: mockDatabases,
	storage: mockStorage,
})

// Mock the hono lib
vi.mock("@/lib/hono", () => ({
	createSessionClient: vi.fn().mockImplementation(async () => getMockSessionClient()),
	createAdminClient: vi.fn().mockImplementation(async () => ({
		users: mockUsers,
	})),
}))

describe("Members API", () => {
	const client = testClient(app)

	beforeEach(() => {
		vi.clearAllMocks()
		// Reset to default mock implementation
		const mockSessionClient = getMockSessionClient()
		vi.mocked(createSessionClient).mockResolvedValue(mockSessionClient)
	})

	describe("GET /", () => {
		const queryParams = {
			workspaceId: "test-workspace-id",
		}

		it("should return members with populated data", async () => {
			const mockMembers = {
				documents: [mockMember],
				total: 1,
			}

			// all members
			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce(mockMembers)
			// get current member
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)

			mockUsers.get.mockResolvedValueOnce(mockUser)

			const res = await client.index.$get({
				query: queryParams,
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({
				data: {
					...mockMembers,
					documents: [
						{
							...mockMember,
							name: mockUser.name,
							email: mockUser.email,
						},
					],
				},
			})
		})

		it("should return 401 if user is not a member", async () => {
			// Mock unauthorized user
			const mockSessionClient = getMockSessionClient("unauthorized-user-id")
			vi.mocked(createSessionClient).mockResolvedValue(mockSessionClient)

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce({ documents: [], total: 0 })

			const res = await client.index.$get({
				query: {
					workspaceId: "unauthorized-workspace-id",
				},
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
		})
	})

	describe("DELETE /:memberId", () => {
		it("should delete member successfully", async () => {
			const mockMembers = {
				documents: [mockMember],
				total: 2,
			}

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce(mockMembers)
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)
			vi.mocked(mockDatabases.deleteDocument).mockResolvedValueOnce(mockMember)

			const res = await client[":memberId"].$delete({
				param: { memberId: "test-member-id" },
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ data: { $id: mockMember.$id } })
		})

		it("should return 401 if user is not a member", async () => {
			// Mock unauthorized user
			const mockSessionClient = getMockSessionClient("unauthorized-user-id")
			vi.mocked(createSessionClient).mockResolvedValue(mockSessionClient)

			// all member in workspace
			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce({ documents: [], total: 0 })

			// mock
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce({
				...mockMember,
				workspaceId: "unauthorized-workspace-id",
			})

			const res = await client[":memberId"].$delete({
				param: { memberId: "test-member-id" },
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
		})

		it("should return 401 if user is not admin", async () => {
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)

			const res = await client[":memberId"].$delete({
				param: { memberId: "test-member-id" },
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
		})

		it("should return 400 if trying to delete the only member", async () => {
			const mockMembers = {
				documents: [mockMember],
				total: 1,
			}

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce(mockMembers)
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)

			const res = await client[":memberId"].$delete({
				param: { memberId: "test-member-id" },
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "Cannot delete the only member" })
		})
	})

	describe("PATCH /:memberId", () => {
		const updateData = {
			role: EMemberRole.MEMBER,
		}

		it("should update member role successfully", async () => {
			const mockMembers = {
				documents: [mockMember],
				total: 2,
			}

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce(mockMembers)
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)
			vi.mocked(mockDatabases.updateDocument).mockResolvedValueOnce({
				...mockMember,
				...updateData,
			})

			const res = await client[":memberId"].$patch({
				param: { memberId: "test-member-id" },
				json: updateData,
			})

			expect(res.status).toBe(200)
			expect(await res.json()).toEqual({ data: { $id: mockMember.$id } })
		})

		it("should return 401 if user is not a member", async () => {
			// Mock unauthorized user
			const mockSessionClient = getMockSessionClient("unauthorized-user-id")
			vi.mocked(createSessionClient).mockResolvedValue(mockSessionClient)

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce({ documents: [], total: 0 })
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce({
				...mockMember,
				workspaceId: "unauthorized-workspace-id",
			})

			const res = await client[":memberId"].$patch({
				param: { memberId: "test-member-id" },
				json: updateData,
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
		})

		it("should return 401 if user is not admin", async () => {
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce({ ...mockMember, role: EMemberRole.MEMBER })

			const res = await client[":memberId"].$patch({
				param: { memberId: "test-member-id" },
				json: updateData,
			})

			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: "Unauthorized" })
		})

		it("should return 400 if trying to adjust the only member", async () => {
			const mockMembers = {
				documents: [mockMember],
				total: 1,
			}

			vi.mocked(mockDatabases.listDocuments).mockResolvedValueOnce(mockMembers)
			vi.mocked(mockDatabases.getDocument).mockResolvedValueOnce(mockMember)

			const res = await client[":memberId"].$patch({
				param: { memberId: "test-member-id" },
				json: updateData,
			})

			expect(res.status).toBe(400)
			expect(await res.json()).toEqual({ error: "Cannot adjust the only member" })
		})
	})
})
