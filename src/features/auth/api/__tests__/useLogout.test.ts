import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, createElement } from "react"

// Mock RPC client
vi.mock("@/lib/rpc", () => {
	const mockPost = vi.fn()
	return {
		client: {
			api: {
				auth: {
					logout: {
						$post: mockPost,
					},
				},
			},
		},
	}
})

// Mock other dependencies
const mockRouterRefresh = vi.fn()
const mockRouterPush = vi.fn()

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockRouterPush,
		refresh: mockRouterRefresh,
	}),
}))

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}))

vi.mock("@/context/DictionaryProvider", () => ({
	useDictionary: () => ({
		auth: {
			successfulLogout: "Logout successful",
			failInLogout: "Failed to Logout",
		},
	}),
}))

import useLogout from "../useLogout"
import { client } from "@/lib/rpc"
import { toast } from "sonner"
import { testingQueryClientConfig } from "@/context/QueryProvider"

// 获取 mock 函数的引用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPost = (client as any).api.auth.logout.$post
const mockToastSuccess = vi.mocked(toast.success)
const mockToastError = vi.mocked(toast.error)

// Test wrapper with QueryClient
const createWrapper = () => {
	const queryClient = new QueryClient(testingQueryClientConfig)

	const TestWrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children)

	return TestWrapper
}

describe("useLogout Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("基本功能", () => {
		it("应该返回 mutation 对象", () => {
			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(),
			})

			expect(result.current).toBeDefined()
			expect(typeof result.current.mutate).toBe("function")
			expect(typeof result.current.mutateAsync).toBe("function")
			expect(result.current.isSuccess).toBe(false)
			expect(result.current.isError).toBe(false)
			expect(result.current.isPending).toBe(false)
		})
	})

	describe("成功场景", () => {
		it("应该成功登出并触发成功回调", async () => {
			const mockSuccessResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					success: true,
				}),
			}

			mockPost.mockResolvedValue(mockSuccessResponse)

			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(),
			})

			// 执行登出
			result.current.mutate()

			// 等待异步操作完成
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true)
			})

			// 验证 API 调用
			expect(mockPost).toHaveBeenCalledTimes(1)
			expect(mockPost).toHaveBeenCalledWith()

			// 验证业务逻辑回调
			expect(mockToastSuccess).toHaveBeenCalledWith("Logout successful")
			expect(mockRouterRefresh).toHaveBeenCalledTimes(1)
		})
	})

	describe("错误场景", () => {
		it("应该处理 HTTP 错误响应", async () => {
			const mockErrorResponse = {
				ok: false,
				status: 401,
			}

			mockPost.mockResolvedValue(mockErrorResponse)

			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(),
			})

			result.current.mutate()

			await waitFor(() => {
				expect(result.current.isError).toBe(true)
			})

			expect(result.current.error).toBeInstanceOf(Error)
			expect((result.current.error as Error).message).toBe("Failed to Logout")
			expect(mockToastError).toHaveBeenCalledWith("Failed to Logout")
			expect(mockToastSuccess).not.toHaveBeenCalled()
			expect(mockRouterRefresh).not.toHaveBeenCalled()
		})

		it("应该处理网络错误", async () => {
			const networkError = new Error("Network Error")
			mockPost.mockRejectedValue(networkError)

			const { result } = renderHook(() => useLogout(), {
				wrapper: createWrapper(),
			})

			result.current.mutate()

			await waitFor(() => {
				expect(result.current.isError).toBe(true)
			})

			expect(result.current.error).toEqual(networkError)
			expect(mockToastError).toHaveBeenCalledWith("Failed to Logout")
			expect(mockRouterRefresh).not.toHaveBeenCalled()
		})
	})
})
