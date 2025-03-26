import { createWrapper } from "@/lib/test-utils"
import useCurrent from "../useCurrent"
import { client } from "@/lib/rpc"
import { renderHook } from "@testing-library/react"

jest.mock("@/lib/rpc", () => ({
	client: {
		api: {
			auth: {
				current: {
					$get: jest.fn(),
				},
			},
		},
	},
}))

describe("useCurrent", () => {
	const { wrapper, queryClient } = createWrapper()

	beforeEach(() => {
		jest.clearAllMocks()
		queryClient.clear()
	})

	it("should return user data on success", async () => {
		const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: { user: "testUser" } }) }

		;(client.api.auth.current["$get"] as jest.Mock).mockResolvedValue(mockResponse)

		const { result } = renderHook(() => useCurrent(), { wrapper })

		await result.current.isSuccess

		expect(result.current.data).toEqual({ user: "testUser" })
	})

	it("should return null on failure", async () => {
		const mockResponse = { ok: false, json: jest.fn().mockResolvedValue({}) }
		;(client.api.auth.current["$get"] as jest.Mock).mockResolvedValue(mockResponse)

		const { result } = renderHook(() => useCurrent(), { wrapper })

		await result.current.isSuccess

		expect(result.current.data).toBeNull()
	})
})
