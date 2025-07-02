import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, createElement } from "react"

// Mock RPC client
vi.mock("@/lib/rpc", () => {
	const mockGet = vi.fn()
	return {
		client: {
			api: {
				auth: {
					current: {
						$get: mockGet,
					},
				},
			},
		},
	}
})

import useCurrent from "../useCurrent"
import { client } from "@/lib/rpc"
import { testingQueryClientConfig } from "@/context/QueryProvider"

// 获取 mock 函数的引用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGet = (client as any).api.auth.current.$get

// Test wrapper with QueryClient
const createWrapper = () => {
	const queryClient = new QueryClient(testingQueryClientConfig)

	const TestWrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children)

	return TestWrapper
}

describe("useCurrent Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("成功场景", () => {
		it("应该成功获取当前用户数据", async () => {
			const mockUserData = {
				id: "user123",
				name: "John Doe",
				email: "john@example.com",
			}

			mockGet.mockResolvedValueOnce({
				ok: true,
				json: vi.fn().mockResolvedValueOnce({
					data: mockUserData,
				}),
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			// 初始状态检查
			expect(result.current.isLoading).toBe(true)
			expect(result.current.data).toBeUndefined()
			expect(result.current.error).toBeNull()

			// 等待数据加载完成
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			// 验证最终状态
			expect(result.current.isSuccess).toBe(true)
			expect(result.current.data).toEqual(mockUserData)
			expect(result.current.error).toBeNull()
			expect(mockGet).toHaveBeenCalledTimes(1)
		})

		it("应该在响应不 ok 时返回 null", async () => {
			mockGet.mockResolvedValueOnce({
				ok: false,
				status: 401,
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isSuccess).toBe(true)
			expect(result.current.data).toBeNull()
			expect(result.current.error).toBeNull()
			expect(mockGet).toHaveBeenCalledTimes(1)
		})
	})

	describe("错误场景", () => {
		it("应该处理网络错误", async () => {
			const networkError = new Error("Network Error")
			mockGet.mockRejectedValueOnce(networkError)

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isError).toBe(true)
			expect(result.current.error).toEqual(networkError)
			expect(result.current.data).toBeUndefined()
			expect(mockGet).toHaveBeenCalledTimes(1)
		})

		it("应该处理 JSON 解析错误", async () => {
			const jsonError = new Error("Invalid JSON")
			mockGet.mockResolvedValueOnce({
				ok: true,
				json: vi.fn().mockRejectedValueOnce(jsonError),
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isError).toBe(true)
			expect(result.current.error).toEqual(jsonError)
			expect(result.current.data).toBeUndefined()
			expect(mockGet).toHaveBeenCalledTimes(1)
		})

		it("应该处理 fetch 超时错误", async () => {
			const timeoutError = new Error("Request timeout")
			mockGet.mockRejectedValueOnce(timeoutError)

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isError).toBe(true)
			expect(result.current.error).toEqual(timeoutError)
			expect(mockGet).toHaveBeenCalledTimes(1)
		})
	})

	describe("React Query 功能", () => {
		it("应该支持手动 refetch", async () => {
			const mockUserData = {
				id: "user123",
				name: "John Doe",
				email: "john@example.com",
			}

			mockGet.mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					data: mockUserData,
				}),
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			// 等待初始加载完成
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(mockGet).toHaveBeenCalledTimes(1)

			// 手动 refetch
			await result.current.refetch()

			expect(mockGet).toHaveBeenCalledTimes(2)
			expect(result.current.data).toEqual(mockUserData)
		})

		it("应该支持 invalidate 和重新获取", async () => {
			const initialData = {
				id: "user123",
				name: "John Doe",
				email: "john@example.com",
			}

			const updatedData = {
				id: "user123",
				name: "Jane Doe",
				email: "jane@example.com",
			}

			mockGet
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValueOnce({
						data: initialData,
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: vi.fn().mockResolvedValueOnce({
						data: updatedData,
					}),
				})

			const queryClient = new QueryClient({
				defaultOptions: {
					queries: { retry: false, gcTime: 0 },
				},
			})

			const TestWrapper = ({ children }: { children: ReactNode }) =>
				createElement(QueryClientProvider, { client: queryClient }, children)

			const { result } = renderHook(() => useCurrent(), { wrapper: TestWrapper })

			// 等待初始数据加载
			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.data).toEqual(initialData)
			expect(mockGet).toHaveBeenCalledTimes(1)

			// 模拟 invalidate queries
			await queryClient.invalidateQueries({ queryKey: ["current"] })

			// 等待重新获取完成
			await waitFor(() => {
				expect(result.current.data).toEqual(updatedData)
			})

			expect(mockGet).toHaveBeenCalledTimes(2)
		})
	})

	describe("边界情况", () => {
		it("应该处理空响应数据", async () => {
			mockGet.mockResolvedValueOnce({
				ok: true,
				json: vi.fn().mockResolvedValueOnce({
					data: null,
				}),
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isSuccess).toBe(true)
			expect(result.current.data).toBeNull()
			expect(result.current.error).toBeNull()
		})

		it("应该处理不完整的响应数据", async () => {
			mockGet.mockResolvedValueOnce({
				ok: true,
				json: vi.fn().mockResolvedValueOnce({
					data: {
						id: "user123",
						// 缺少其他字段
					},
				}),
			})

			const { result } = renderHook(() => useCurrent(), {
				wrapper: createWrapper(),
			})

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false)
			})

			expect(result.current.isSuccess).toBe(true)
			expect(result.current.data).toEqual({
				id: "user123",
			})
		})

		it("应该处理多次连续调用", async () => {
			const mockUserData = {
				id: "user123",
				name: "John Doe",
				email: "john@example.com",
			}

			mockGet.mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					data: mockUserData,
				}),
			})

			const wrapper = createWrapper()

			// 同时渲染多个相同的 hook
			const { result: result1 } = renderHook(() => useCurrent(), { wrapper })
			const { result: result2 } = renderHook(() => useCurrent(), { wrapper })

			await waitFor(() => {
				expect(result1.current.isLoading).toBe(false)
				expect(result2.current.isLoading).toBe(false)
			})

			// 应该只发起一次请求（因为 queryKey 相同，会共享缓存）
			expect(mockGet).toHaveBeenCalledTimes(1)
			expect(result1.current.data).toEqual(mockUserData)
			expect(result2.current.data).toEqual(mockUserData)
		})
	})
})
