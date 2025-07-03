import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock dependencies
vi.mock('@/features/auth/api/useLogin')
vi.mock('@/context/DictionaryProvider')
vi.mock('@/features/auth/components/OAuthCard')
vi.mock('@/components/DottedSeparator')

import SigninCard from '../SigninCard'
import useLogin from '@/features/auth/api/useLogin'

const mockUseLogin = vi.mocked(useLogin)

const mockMutate = vi.fn()

// Mock Dictionary
const mockDictionary = {
  auth: {
    welcomeback: 'Welcome back',
    signin: 'Sign In',
    form: {
      enteremail: 'Enter your email',
      enterpassword: 'Enter your password',
      emailFormat: 'Please enter a valid email address',
    },
    donthaveaccount: "Don't have an account",
    signup: 'Sign Up',
  },
  form: {
    required: 'This field is required',
  },
}

vi.mock('@/context/DictionaryProvider', () => ({
  useDictionary: () => mockDictionary,
}))

// Mock OAuthCard component
vi.mock('@/features/auth/components/OAuthCard', () => ({
  default: () => (
    <div data-testid="oauth-card" className="flex flex-col gap-4 p-7">
      <button>Google Sign In</button>
      <button>Github Sign In</button>
    </div>
  ),
}))

// Mock DottedSeparator component
vi.mock('@/components/DottedSeparator', () => ({
  DottedSeparator: () => (
    <div data-testid="dotted-separator">Separator</div>
  ),
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return TestWrapper
}

describe('SigninCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error - simplifying mock for test purposes
    mockUseLogin.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: undefined,
    })
  })

  describe('基本渲染', () => {
    it('应该正确渲染登录表单的核心元素', () => {
      render(<SigninCard />, { wrapper: createWrapper() })

      // 检查标题
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()

      // 检查表单字段
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()

      // 检查提交按钮
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('应该正确设置表单字段类型', () => {
      render(<SigninCard />, { wrapper: createWrapper() })

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('表单交互', () => {
    it('应该允许用户输入', async () => {
      const user = userEvent.setup()
      render(<SigninCard />, { wrapper: createWrapper() })

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('应该在提交有效表单时调用 mutate', async () => {
      const user = userEvent.setup()
      render(<SigninCard />, { wrapper: createWrapper() })

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      // 填写有效数据
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // 提交表单
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          json: {
            email: 'test@example.com',
            password: 'password123',
          },
        })
      })
    })
  })

  describe('表单验证', () => {
    it('应该在提交空表单时触发验证', async () => {
      const user = userEvent.setup()
      render(<SigninCard />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)

      // 表单验证应该阻止 mutate 被调用
      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled()
      })
    })

    it('应该在提交无效邮箱时阻止提交', async () => {
      const user = userEvent.setup()
      render(<SigninCard />, { wrapper: createWrapper() })

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled()
      })
    })
  })

  describe('加载状态', () => {
    it('应该在 isPending 为 true 时禁用提交按钮', () => {
      // @ts-expect-error - simplifying mock for test purposes
      mockUseLogin.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      })

      render(<SigninCard />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      expect(submitButton).toBeDisabled()
    })

    it('应该在 isPending 为 false 时启用提交按钮', () => {
      // @ts-expect-error - simplifying mock for test purposes
      mockUseLogin.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
      })

      render(<SigninCard />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('组件集成', () => {
    it('应该渲染 OAuth 卡片组件', () => {
      render(<SigninCard />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('oauth-card')).toBeInTheDocument()
    })

    it('应该渲染分隔符组件', () => {
      render(<SigninCard />, { wrapper: createWrapper() })
      
      const separators = screen.getAllByTestId('dotted-separator')
      expect(separators.length).toBeGreaterThan(0)
    })

    it('应该包含注册链接', () => {
      render(<SigninCard />, { wrapper: createWrapper() })
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument()
    })
  })
})
