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
					register: {
						$post: mockPost,
					},
				},
			},
		},
	}
})

// Mock other dependencies
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		refresh: vi.fn(),
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
			successfulRegister: "Register successful",
			failInRegister: "Failed to Register",
		},
	}),
}))

vi.mock("@/lib/utils", () => ({
	handleOnError: vi.fn(),
}))

import UseRegister from "../useRegister"
import { client } from "@/lib/rpc"
import { toast } from "sonner"
import { testingQueryClientConfig } from "@/context/QueryProvider"

// 获取 mock 函数的引用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPost = (client as any).api.auth.register.$post
const mockToastSuccess = vi.mocked(toast.success)

// Test wrapper with QueryClient
const createWrapper = () => {
	const queryClient = new QueryClient(testingQueryClientConfig)

	const TestWrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children)

	return TestWrapper
}

describe("useRegister Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("基本功能", () => {
		it("应该返回 mutation 对象", () => {
			const { result } = renderHook(() => UseRegister(), {
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
		it("应该成功注册用户并处理成功回调", async () => {
			const mockSuccessResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					data: { user: { id: "user123", email: "test@example.com" } },
				}),
			}

			mockPost.mockResolvedValue(mockSuccessResponse)

			const { result } = renderHook(() => UseRegister(), {
				wrapper: createWrapper(),
			})

			// 执行注册 - 包含所有必需字段包括 password2
			const registerData = {
				json: {
					name: "Test User",
					email: "test@example.com",
					password: "password123",
					password2: "password123",
				},
			}

			result.current.mutate(registerData)

			// 等待异步操作完成
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true)
			})

			// 验证请求调用
			expect(mockPost).toHaveBeenCalledTimes(1)
			expect(mockPost).toHaveBeenCalledWith({ json: registerData.json })

			// 验证成功回调
			expect(mockToastSuccess).toHaveBeenCalledWith("Register successful")
		})
	})

	describe("错误场景", () => {
		it("应该处理 HTTP 错误响应", async () => {
			const mockErrorResponse = {
				ok: false,
				status: 400,
			}

			mockPost.mockResolvedValue(mockErrorResponse)

			const { result } = renderHook(() => UseRegister(), {
				wrapper: createWrapper(),
			})

			const registerData = {
				json: {
					name: "Test User",
					email: "test@example.com",
					password: "password123",
					password2: "password123",
				},
			}

			result.current.mutate(registerData)

			await waitFor(() => {
				expect(result.current.isError).toBe(true)
			})

			expect(result.current.error).toBeInstanceOf(Error)
			expect(mockToastSuccess).not.toHaveBeenCalled()
		})

		it("应该处理网络错误", async () => {
			const networkError = new Error("Network Error")
			mockPost.mockRejectedValue(networkError)

			const { result } = renderHook(() => UseRegister(), {
				wrapper: createWrapper(),
			})

			const registerData = {
				json: {
					name: "Test User",
					email: "test@example.com",
					password: "password123",
					password2: "password123",
				},
			}

			result.current.mutate(registerData)

			await waitFor(() => {
				expect(result.current.isError).toBe(true)
			})

			expect(result.current.error).toEqual(networkError)
		})
	})
})
