/**
 * 真实用户注册流程 E2E 测试
 * 
 * 测试场景：
 * 1. 用户访问注册页面
 * 2. 填写有效的注册信息
 * 3. 成功注册并重定向到仪表板
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

test.describe('真实用户注册流程', () => {
  let testUser: ReturnType<typeof generateUniqueUser>
  
  test.beforeEach(async () => {
    testUser = generateUniqueUser()
  })

  test('成功的注册流程', async ({ page }) => {
    // 访问注册页面
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
    
    // 验证注册成功并重定向到创建工作区页面（新用户没有工作区）
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 验证用户已登录 - 检查用户按钮是否存在
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('注册表单验证 - 密码不匹配', async ({ page }) => {
    await page.goto('/signup')
    
    // 等待页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 填写不匹配的密码
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill('DifferentPassword123!')
    
    // 提交表单
    await page.getByTestId('signup-submit-button').click()
    
    // 验证仍在注册页面（验证失败）
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
  })

  test('注册表单验证 - 空表单', async ({ page }) => {
    await page.goto('/signup')
    
    // 等待页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 尝试提交空表单
    await page.getByTestId('signup-submit-button').click()
    
    // 验证仍在注册页面
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
  })

  test('注册表单验证 - 无效邮箱格式', async ({ page }) => {
    await page.goto('/signup')
    
    // 等待页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 填写无效邮箱
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill('invalid-email-format')
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    // 提交表单
    await page.getByTestId('signup-submit-button').click()
    
    // 验证仍在注册页面
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
  })

  test('注册页面跳转到登录页面', async ({ page }) => {
    await page.goto('/signup')
    
    // 等待页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 点击登录链接
    await page.getByTestId('signin-link').click()
    
    // 验证重定向到登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
  })

  test('OAuth 注册按钮存在', async ({ page }) => {
    await page.goto('/signup')
    
    // 等待页面加载
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    // 验证 OAuth 按钮存在
    await expect(page.getByTestId('oauth-card')).toBeVisible()
    await expect(page.getByTestId('google-oauth-button')).toBeVisible()
    await expect(page.getByTestId('github-oauth-button')).toBeVisible()
    
    // 注意：实际的 OAuth 流程测试需要特殊配置，这里只验证按钮存在
  })

  test('注册重复邮箱', async ({ page }) => {
    // 首先注册一个用户
    await page.goto('/signup')
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 验证首次注册成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 退出登录
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    // 尝试使用相同邮箱再次注册
    await page.goto('/signup')
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill('Another User')
    await page.getByTestId('signup-email-input').fill(testUser.email) // 相同邮箱
    await page.getByTestId('signup-password-input').fill('AnotherPassword123!')
    await page.getByTestId('signup-confirm-password-input').fill('AnotherPassword123!')
    
    await page.getByTestId('signup-submit-button').click()
    
    // 验证注册失败，仍在注册页面
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
  })

  test('注册页面所有必需元素存在', async ({ page }) => {
    await page.goto('/signup')
    
    // 验证所有必需元素存在
    await expect(page.getByTestId('signup-card')).toBeVisible()
    await expect(page.getByTestId('signup-title')).toBeVisible()
    await expect(page.getByTestId('signup-form')).toBeVisible()
    await expect(page.getByTestId('signup-name-input')).toBeVisible()
    await expect(page.getByTestId('signup-email-input')).toBeVisible()
    await expect(page.getByTestId('signup-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-submit-button')).toBeVisible()
    await expect(page.getByTestId('signin-prompt')).toBeVisible()
    await expect(page.getByTestId('signin-link')).toBeVisible()
    await expect(page.getByTestId('oauth-card')).toBeVisible()
    await expect(page.getByTestId('google-oauth-button')).toBeVisible()
    await expect(page.getByTestId('github-oauth-button')).toBeVisible()
  })
})
