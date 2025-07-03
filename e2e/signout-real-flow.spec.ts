/**
 * 真实用户退出登录流程 E2E 测试
 * 
 * 测试场景：
 * 1. 用户先注册并登录
 * 2. 访问仪表板确认已登录
 * 3. 执行退出登录操作
 * 4. 验证已重定向到登录页面
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

test.describe('真实用户退出登录流程', () => {
  let testUser: ReturnType<typeof generateUniqueUser>
  
  test.beforeEach(async () => {
    testUser = generateUniqueUser()
  })

  test('成功的退出登录流程', async ({ page }) => {
    // 1. 先注册一个新用户
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证登录成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 3. 执行退出登录
    await page.getByTestId('user-button').click()
    
    // 等待下拉菜单显示
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // 点击退出登录按钮
    await page.getByTestId('logout-button').click()
    
    // 4. 验证退出登录成功
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 验证用户按钮不再存在（已退出登录）
    await expect(page.getByTestId('user-button')).not.toBeVisible()
  })

  test('退出登录后无法访问受保护页面', async ({ page }) => {
    // 1. 先注册并登录
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证登录成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 3. 退出登录
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    // 4. 验证退出成功
    await expect(page).toHaveURL(/.*\/signin/)
    
    // 5. 尝试直接访问受保护的页面
    await page.goto('/workspace/create')
    
    // 应该被重定向到登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
  })

  test('用户下拉菜单功能', async ({ page }) => {
    // 1. 先注册并登录
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证登录成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 3. 点击用户按钮打开下拉菜单
    await page.getByTestId('user-button').click()
    
    // 4. 验证下拉菜单中的元素
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // 验证语言切换器在用户菜单中也存在
    await expect(page.getByTestId('locale-switcher')).toBeVisible()
    
    // 5. 点击其他地方关闭菜单（可选）
    await page.click('body')
    
    // 6. 重新打开菜单并执行退出登录
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    // 7. 验证退出成功
    await expect(page).toHaveURL(/.*\/signin/)
  })

  test('多次退出登录操作', async ({ page }) => {
    // 1. 先注册并登录
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证登录成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 3. 第一次退出登录
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    await expect(page).toHaveURL(/.*\/signin/)
    
    // 4. 重新登录
    await page.getByTestId('signin-email-input').fill(testUser.email)
    await page.getByTestId('signin-password-input').fill(testUser.password)
    await page.getByTestId('signin-submit-button').click()
    
    await expect(page).toHaveURL(/.*\/(workspace\/create|dashboard)/)
    
    // 5. 第二次退出登录
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
  })

  test('退出登录按钮状态验证', async ({ page }) => {
    // 在未登录状态，用户按钮应该不存在
    await page.goto('/signin')
    await expect(page.getByTestId('user-button')).not.toBeVisible()
    
    // 注册并登录
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 登录后用户按钮应该可见
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 点击用户按钮，退出按钮应该可见
    await page.getByTestId('user-button').click()
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // 退出登录后，用户按钮应该不再可见
    await page.getByTestId('logout-button').click()
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('user-button')).not.toBeVisible()
  })
})
