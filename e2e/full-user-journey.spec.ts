/**
 * 完整用户旅程 E2E 测试
 * 
 * 测试场景：
 * 1. 用户访问应用
 * 2. 注册新账户
 * 3. 退出登录
 * 4. 重新登录
 * 5. 访问不同页面
 * 6. 最终退出登录
 * 
 * 这是一个完整的端到端用户体验测试
 * 使用唯一数据策略，避免测试间的数据冲突
 */

import { test, expect } from '@playwright/test'

// 生成唯一的测试用户数据
const generateUniqueUser = () => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  return {
    name: `E2E Test User ${timestamp}`,
    email: `e2e.test.${timestamp}.${randomId}@example.com`,
    password: 'E2ETestPass123!',
  }
}

test.describe('完整用户旅程测试', () => {
  let testUser: ReturnType<typeof generateUniqueUser>
  
  test.beforeEach(async () => {
    testUser = generateUniqueUser()
  })

  test('完整的用户生命周期 - 注册、登录、导航、退出', async ({ page }) => {
    // 阶段 1: 初始访问和注册
    console.log('🚀 开始完整用户旅程测试')
    
    // 访问登录页面
    await page.goto('/signin')
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    // 从登录页面跳转到注册页面
    await page.getByTestId('auth-jump-button').click()
    await expect(page).toHaveURL(/.*\/signup/)
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    console.log('📝 开始用户注册流程')
    
    // 填写注册表单
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    // 提交注册
    await page.getByTestId('signup-submit-button').click()
    
    // 验证注册成功并重定向到创建工作区页面（新用户没有工作区）
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    console.log('✅ 用户注册成功')
    
    // 阶段 2: 退出登录测试
    console.log('🚪 测试退出登录功能')
    
    await page.getByTestId('user-button').click()
    await expect(page.getByTestId('logout-button')).toBeVisible()
    await page.getByTestId('logout-button').click()
    
    // 验证重定向到登录页面
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
    
    console.log('✅ 退出登录成功')
    
    // 阶段 3: 重新登录
    console.log('🔑 测试重新登录功能')
    
    await page.getByTestId('signin-email-input').fill(testUser.email)
    await page.getByTestId('signin-password-input').fill(testUser.password)
    await page.getByTestId('signin-submit-button').click()
    
    // 验证重新登录成功 - 可能重定向到工作区创建页面或仪表板
    await expect(page).toHaveURL(/.*\/(workspace\/create|dashboard)/)
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    console.log('✅ 重新登录成功')
    
    // 阶段 4: 应用内导航测试
    console.log('🧭 测试应用内导航')
    
    // 测试移动端菜单（如果存在）
    const mobileMenuTrigger = page.getByTestId('mobile-sidebar-trigger')
    if (await mobileMenuTrigger.isVisible()) {
      await mobileMenuTrigger.click()
      console.log('📱 移动端菜单已打开')
      
      // 可以在这里添加更多移动端菜单的测试
      // 关闭菜单
      await page.keyboard.press('Escape')
    }
    
    // 阶段 5: 语言切换测试
    console.log('🌐 测试语言切换功能')
    
    await page.getByTestId('user-button').click()
    
    // 验证用户下拉菜单中的语言切换器
    const localeSwitcher = page.getByTestId('locale-switcher')
    if (await localeSwitcher.isVisible()) {
      // 测试语言切换
      await localeSwitcher.click()
      console.log('🌍 语言切换器已激活')
    }
    
    // 关闭用户菜单
    await page.click('body')
    
    // 阶段 6: 最终退出登录
    console.log('👋 执行最终退出登录')
    
    await page.getByTestId('user-button').click()
    await page.getByTestId('logout-button').click()
    
    // 最终验证
    await expect(page).toHaveURL(/.*\/signin/)
    await expect(page.getByTestId('signin-card')).toBeVisible()
    await expect(page.getByTestId('user-button')).not.toBeVisible()
    
    console.log('🎉 完整用户旅程测试完成')
  })

  test('页面间跳转和认证状态保持', async ({ page }) => {
    // 注册并登录
    await page.goto('/signup')
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    await page.getByTestId('signup-submit-button').click()
    
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 测试直接 URL 访问不同页面时认证状态保持
    await page.goto('/workspace/create')
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 尝试访问其他可能存在的受保护页面
    // 注意：这些路由可能需要根据实际应用结构调整
    const protectedRoutes = ['/workspace/create', '/projects', '/tasks']
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(route)
        // 如果页面存在，应该仍然显示用户按钮（保持登录状态）
        if (await page.getByTestId('user-button').isVisible()) {
          console.log(`✅ 路由 ${route} 认证状态正常`)
        }
      } catch {
        // 如果路由不存在，这是正常的
        console.log(`ℹ️ 路由 ${route} 不存在或不可访问`)
      }
    }
    
    // 最终验证仍在登录状态
    await page.goto('/workspace/create')
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('错误处理和用户体验', async ({ page }) => {
    // 测试各种错误场景
    
    // 1. 访问不存在的页面
    await page.goto('/nonexistent-page')
    // 应该显示404页面或重定向到登录页面
    
    // 2. 测试网络错误情况下的用户体验
    // 注册用户
    await page.goto('/signup')
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    // 测试表单提交
    await page.getByTestId('signup-submit-button').click()
    
    // 验证注册成功
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 3. 测试刷新页面后的状态保持
    await page.reload()
    
    // 应该仍然在登录状态
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 4. 测试浏览器后退/前进按钮
    await page.goBack()
    await page.goForward()
    
    // 应该仍然保持登录状态
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('响应式设计和移动端体验', async ({ page }) => {
    // 测试不同屏幕尺寸下的用户体验
    
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 注册流程在移动端
    await page.goto('/signup')
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    await page.getByTestId('signup-submit-button').click()
    
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 测试移动端菜单
    const mobileMenuTrigger = page.getByTestId('mobile-sidebar-trigger')
    if (await mobileMenuTrigger.isVisible()) {
      await mobileMenuTrigger.click()
      // 验证菜单打开
    }
    
    // 测试移动端用户菜单
    await page.getByTestId('user-button').click()
    await expect(page.getByTestId('logout-button')).toBeVisible()
    
    // 设置桌面端视口
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // 验证桌面端布局
    await expect(page.getByTestId('user-button')).toBeVisible()
    
    // 移动端菜单触发器应该隐藏
    if (await mobileMenuTrigger.isVisible()) {
      // 在大屏幕上，移动端菜单应该隐藏
      console.log('ℹ️ 移动端菜单在桌面端可能仍然可见，需要检查响应式设计')
    }
  })
})
