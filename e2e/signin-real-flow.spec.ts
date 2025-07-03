/**
 * 真实用户登录流程 E2E 测试
 * 
 * 测试场景：
 * 1. 用户访问登录页面
 * 2. 填写有效的登录凭据
 * 3. 成功登录并重定向到仪表板
 * 4. 验证用户已登录状态
 * 
 * 使用唯一数据策略，避免测试间的数据冲突
 */

import { test, expect } from '@playwright/test'

// 生成唯一的测试用户数据
const generateUniqueUser = () => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  return {
    name: `Test User ${timestamp}`,
    email: `test.user.${timestamp}.${randomId}@example.com`,
    password: 'SecurePass123!',
  }
}

test.describe('真实用户登录流程', () => {
  let testUser: ReturnType<typeof generateUniqueUser>
  
  test.beforeEach(async () => {
    testUser = generateUniqueUser()
  })

  test('成功的登录流程 - 使用新注册用户', async ({ page }) => {
    // 1. 首先注册一个新用户
    await page.goto('/signup')
    
    // 等待注册页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    await expect(page.getByTestId('signup-title')).toBeVisible()
    
    // 填写注册表单
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    // 提交注册表单
    await page.getByTestId('signup-submit-button').click()
    
    // 等待注册成功并重定向到创建工作区页面（新用户没有工作区）
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 验证用户已登录 - 检查用户按钮是否存在
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 2. 现在测试登录流程 - 先退出登录
    await page.getByTestId('user-button').click()
    await expect(page.getByTestId('logout-button')).toBeVisible()
    await page.getByTestId('logout-button').click()
    
    // 等待重定向到登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    
    // 3. 使用相同凭据重新登录
    await expect(page.getByTestId('signin-card')).toBeVisible()
    await expect(page.getByTestId('signin-title')).toBeVisible()
    
    // 填写登录表单
    await page.getByTestId('signin-email-input').fill(testUser.email)
    await page.getByTestId('signin-password-input').fill(testUser.password)
    
    // 提交登录表单
    await page.getByTestId('signin-submit-button').click()
    
    // 验证登录成功 - 可能重定向到工作区创建页面或仪表板
    await expect(page).toHaveURL(/.*\/(workspace\/create|dashboard)/)
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('登录失败 - 错误的凭据', async ({ page }) => {
    // 访问登录页面
    await page.goto('/signin')
    
    // 等待页面加载
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 使用错误的凭据
    await page.getByTestId('signin-email-input').fill('nonexistent@example.com')
    await page.getByTestId('signin-password-input').fill('wrongpassword')
    
    // 提交表单
    await page.getByTestId('signin-submit-button').click()
    
    // 验证仍在登录页面（登录失败）
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 可以检查是否有错误消息显示
    // 注意：这里可能需要根据实际的错误处理机制调整
  })

  test('登录表单验证', async ({ page }) => {
    await page.goto('/signin')
    
    // 等待页面加载
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 测试空表单提交
    await page.getByTestId('signin-submit-button').click()
    
    // 验证仍在登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    
    // 测试无效邮箱格式
    await page.getByTestId('signin-email-input').fill('invalid-email')
    await page.getByTestId('signin-password-input').fill('somepassword')
    await page.getByTestId('signin-submit-button').click()
    
    // 验证仍在登录页面
    await expect(page).toHaveURL(/.*\/signin/)
  })

  test('登录页面跳转到注册页面', async ({ page }) => {
    await page.goto('/signin')
    
    // 等待页面加载
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 点击注册链接
    await page.getByTestId('signup-link').click()
    
    // 验证重定向到注册页面
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
  })

  test('OAuth 登录按钮存在', async ({ page }) => {
    await page.goto('/signin')
    
    // 等待页面加载
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 验证 OAuth 按钮存在
    await expect(page.getByTestId('oauth-card')).toBeVisible()
    await expect(page.getByTestId('google-oauth-button')).toBeVisible()
    await expect(page.getByTestId('github-oauth-button')).toBeVisible()
    
    // 注意：实际的 OAuth 流程测试需要特殊配置，这里只验证按钮存在
  })

  test('语言切换功能', async ({ page }) => {
    await page.goto('/signin')
    
    // 等待页面加载
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 验证语言切换器存在
    await expect(page.getByTestId('locale-switcher')).toBeVisible()
    
    // 可以测试语言切换功能
    await page.getByTestId('locale-switcher').click()
    
    // 这里可以添加更多语言切换的验证逻辑
  })

  test('认证跳转按钮功能', async ({ page }) => {
    await page.goto('/signin')
    
    // 验证认证跳转按钮存在并可点击
    await expect(page.getByTestId('auth-jump-button')).toBeVisible()
    
    // 点击跳转到注册页面
    await page.getByTestId('auth-jump-button').click()
    
    // 验证重定向到注册页面
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 在注册页面再次点击跳转按钮返回登录页面
    await page.getByTestId('auth-jump-button').click()
    
    // 验证返回登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
  })
})
