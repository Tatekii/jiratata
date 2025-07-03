/**
 * 工作区创建流程 E2E 测试
 * 
 * 测试场景：
 * 1. 用户注册成功后重定向到工作区创建页面
 * 2. 填写工作区信息并创建工作区
 * 3. 验证工作区创建成功并重定向到工作区页面
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
    workspaceName: `Test Workspace ${timestamp}`,
  }
}

test.describe('工作区创建流程', () => {
  let testUser: ReturnType<typeof generateUniqueUser>
  
  test.beforeEach(async () => {
    testUser = generateUniqueUser()
  })

  test('新用户注册后创建工作区的完整流程', async ({ page }) => {
    // 1. 注册新用户
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证重定向到工作区创建页面
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    await expect(page.getByTestId('create-workspace-title')).toBeVisible()
    
    // 3. 填写工作区信息
    await page.getByTestId('name-input').fill(testUser.workspaceName)
    
    // 4. 提交工作区创建表单
    await page.getByTestId('form-submit-button').click()
    
    // 5. 验证工作区创建成功并重定向到工作区页面
    await expect(page).toHaveURL(/.*\/workspaces\/[a-zA-Z0-9]+/)
    
    // 6. 验证用户仍在登录状态
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('工作区创建表单验证', async ({ page }) => {
    // 1. 先注册用户到达工作区创建页面
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 在工作区创建页面进行表单验证测试
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    
    // 3. 测试空表单提交
    await page.getByTestId('form-submit-button').click()
    
    // 应该仍在工作区创建页面（表单验证失败）
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    
    // 4. 填写有效数据
    await page.getByTestId('name-input').fill(testUser.workspaceName)
    
    // 5. 再次提交，应该成功
    await page.getByTestId('form-submit-button').click()
    
    // 验证成功重定向
    await expect(page).toHaveURL(/.*\/workspaces\/[a-zA-Z0-9]+/)
  })

  test('工作区创建页面图片上传功能', async ({ page }) => {
    // 1. 先注册用户到达工作区创建页面
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 在工作区创建页面测试图片上传
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    
    // 3. 验证图片上传按钮存在
    await expect(page.getByTestId('image-upload-button')).toBeVisible()
    
    // 4. 填写工作区名称
    await page.getByTestId('name-input').fill(testUser.workspaceName)
    
    // 5. 提交表单（不上传图片）
    await page.getByTestId('form-submit-button').click()
    
    // 验证成功创建
    await expect(page).toHaveURL(/.*\/workspaces\/[a-zA-Z0-9]+/)
  })

  test('工作区创建页面所有必需元素存在', async ({ page }) => {
    // 1. 先注册用户到达工作区创建页面
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 验证工作区创建页面的所有元素
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 验证所有必需元素存在
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    await expect(page.getByTestId('create-workspace-title')).toBeVisible()
    await expect(page.getByTestId('common-name-image-form')).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('image-upload-button')).toBeVisible()
    await expect(page.getByTestId('form-submit-button')).toBeVisible()
    
    // 验证用户按钮存在（表示已登录）
    await expect(page.getByTestId('user-button')).toBeVisible()
  })

  test('直接访问工作区创建页面（已登录用户）', async ({ page }) => {
    // 1. 先注册并完成首次工作区创建
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 创建第一个工作区
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    await page.getByTestId('name-input').fill(testUser.workspaceName)
    await page.getByTestId('form-submit-button').click()
    
    await expect(page).toHaveURL(/.*\/workspaces\/[a-zA-Z0-9]+/)
    
    // 3. 现在直接访问工作区创建页面
    await page.goto('/workspaces/create')
    
    // 4. 验证可以访问并创建新工作区
    await expect(page.getByTestId('create-workspace-card')).toBeVisible()
    
    // 填写新工作区信息
    const newWorkspaceName = `${testUser.workspaceName} 2`
    await page.getByTestId('name-input').fill(newWorkspaceName)
    await page.getByTestId('form-submit-button').click()
    
    // 验证新工作区创建成功
    await expect(page).toHaveURL(/.*\/workspaces\/[a-zA-Z0-9]+/)
  })

  test('取消工作区创建（如果有取消按钮）', async ({ page }) => {
    // 1. 先注册用户到达工作区创建页面
    await page.goto('/signup')
    
    await expect(page.getByTestId('signup-card')).toBeVisible()
    
    await page.getByTestId('signup-name-input').fill(testUser.name)
    await page.getByTestId('signup-email-input').fill(testUser.email)
    await page.getByTestId('signup-password-input').fill(testUser.password)
    await page.getByTestId('signup-confirm-password-input').fill(testUser.password)
    
    await page.getByTestId('signup-submit-button').click()
    
    // 2. 在工作区创建页面检查取消按钮
    await expect(page).toHaveURL(/.*\/workspace\/create/)
    
    // 注意：根据 CommonNameImageForm 的逻辑，如果没有 onCancel，取消按钮是隐藏的
    // 我们可以检查按钮是否存在
    const cancelButton = page.getByTestId('form-cancel-button')
    
    // 检查按钮元素是否存在于页面中
    const buttonCount = await cancelButton.count()
    expect(buttonCount).toBeGreaterThan(0)
    
    // 如果按钮可见，我们可以测试点击行为
    if (await cancelButton.isVisible()) {
      await cancelButton.click()
      // 验证取消行为（具体行为取决于实现）
    }
  })
})
