import { renderHook } from "@testing-library/react-hooks"
import UseRegister from '../useRegister'
import { useRouter } from 'next/navigation'
import type { UseMutationResult } from '@tanstack/react-query'
import type { ResponseSuccessType, ResponseFailType, RequestType } from '../useRegister'
import { toast } from 'sonner'
import { client } from '@/lib/rpc'
import { createWrapper } from '@/lib/test-utils'

jest.mock('@/lib/rpc', () => ({
  client: {
    api: {
      auth: {
        register: {
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

describe('UseRegister', () => {
  const mockedToast = jest.mocked(toast)
  const mockPost = jest.mocked(client.api.auth.register.$post)
  const { wrapper, queryClient } = createWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
  })

  it('should call the mutation function with correct parameters', async () => {
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'success' }) }
    mockPost.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => UseRegister(), { wrapper })

    await result.current.mutateAsync({ json: { name: 'test', email: 'test', password: 'test', password2: 'test' } })

    expect(mockPost).toHaveBeenCalledWith({ json: { name: 'test', email: 'test', password: 'test', password2: 'test' } })
  })

  it('should show success toast, refresh page, and invalidate queries on success', async () => {
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'success' }) }
    mockPost.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => UseRegister(), { wrapper })
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync({ json: { name: 'test', email: 'test', password: 'test', password2: 'test' } })

    expect(mockedToast.success).toHaveBeenCalledWith(expect.any(String))
    expect(mockRouter.refresh).toHaveBeenCalled()
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['current'] })
  })

  it('should show error toast on error', async () => {
    const mockError = { ok: false, json: jest.fn().mockResolvedValue({ error: 'failed' }) }
    mockPost.mockResolvedValue(mockError)

    const { result } = renderHook(() => UseRegister(), { wrapper })

    await expect(
      result.current.mutateAsync({ json: { name: 'test', email: 'test', password: 'test', password2: 'test' } })
    ).rejects.toThrow()

    expect(mockedToast.error).toHaveBeenCalledWith(expect.any(String))
  })
})