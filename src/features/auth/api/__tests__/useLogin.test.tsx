import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import UseLogin from "../useLogin"
import { client } from "@/lib/rpc"

jest.mock('@/lib/rpc', () => ({
  client: {
    api: {
      auth: {
        login: {
          $post: jest.fn()
        }
      }
    }
  }
}))
jest.mock('sonner')
jest.mock('next/navigation')

const mockRouter = { refresh: jest.fn() }
;(useRouter as jest.Mock).mockReturnValue(mockRouter)

describe('UseLogin', () => {
  const queryClient = new QueryClient()
  const mockPost = client.api.auth.login.$post as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
  })

  it('should call the mutation function with correct parameters', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }
    mockPost.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => UseLogin(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await result.current.mutateAsync({
      json: { email: 'test@example.com', password: 'password123' },
    })

    expect(mockPost).toHaveBeenCalledWith({
      json: { email: 'test@example.com', password: 'password123' },
    })
  })

  it('should show success toast and refresh page on success', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    }
    mockPost.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => UseLogin(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await result.current.mutateAsync({
      json: { email: 'test@example.com', password: 'password123' },
    })

    expect(toast.success).toHaveBeenCalled()
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it('should show error toast on error', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    }
    mockPost.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => UseLogin(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    try {
      await result.current.mutateAsync({
        json: { email: 'test@example.com', password: 'wrong-password' },
      })
    } catch {
      // Expected error
    }

    expect(toast.error).toHaveBeenCalled()
    expect(mockRouter.refresh).not.toHaveBeenCalled()
  })
})