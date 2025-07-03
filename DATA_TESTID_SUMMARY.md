# Data-TestID 完成总结

本文档记录了为 E2E 测试添加的所有 `data-testid` 属性。

## 认证组件 (src/features/auth/components/)

### SigninCard.tsx
- `signin-card` - 登录卡片容器
- `signin-title` - 登录标题
- `signin-form` - 登录表单
- `signin-email-input` - 邮箱输入框
- `signin-password-input` - 密码输入框
- `signin-submit-button` - 登录提交按钮
- `signup-prompt` - 注册提示文本
- `signup-link` - 注册链接按钮

### SignupCard.tsx
- `signup-card` - 注册卡片容器
- `signup-title` - 注册标题
- `signup-form` - 注册表单
- `signup-name-input` - 用户名输入框
- `signup-email-input` - 邮箱输入框
- `signup-password-input` - 密码输入框
- `signup-confirm-password-input` - 确认密码输入框
- `signup-submit-button` - 注册提交按钮
- `signin-prompt` - 登录提示文本
- `signin-link` - 登录链接

### UserButton.tsx
- `user-button` - 用户按钮触发器
- `logout-button` - 退出登录按钮

### OAuthCard.tsx
- `oauth-card` - OAuth 卡片容器
- `google-oauth-button` - Google OAuth 按钮
- `github-oauth-button` - GitHub OAuth 按钮

## 支持组件 (src/components/)

### AuthJumpButton.tsx
- `auth-jump-button` - 认证跳转按钮（在注册/登录页面间切换）

### LocaleSwitcher.tsx
- `locale-switcher` - 语言切换器

### MobileSidebar.tsx
- `mobile-sidebar-trigger` - 移动端侧栏触发按钮

## 原则

只为有交互功能的控件和关键标签添加 `data-testid`，包括：
- 按钮 (Button)
- 输入框 (Input)
- 表单 (Form)
- 下拉菜单 (Select/Dropdown)
- 链接 (Link)
- 容器组件（如 Card、Modal）

不为纯展示性元素添加 `data-testid`，如：
- 静态文本
- 图标
- 装饰性容器
- 布局元素

## E2E 测试使用示例

```typescript
// 登录流程
await page.getByTestId('signin-email-input').fill('test@example.com')
await page.getByTestId('signin-password-input').fill('password123')
await page.getByTestId('signin-submit-button').click()

// 注册流程
await page.getByTestId('signup-name-input').fill('Test User')
await page.getByTestId('signup-email-input').fill('test@example.com')
await page.getByTestId('signup-password-input').fill('password123')
await page.getByTestId('signup-confirm-password-input').fill('password123')
await page.getByTestId('signup-submit-button').click()

// OAuth 登录
await page.getByTestId('google-oauth-button').click()
await page.getByTestId('github-oauth-button').click()

// 用户操作
await page.getByTestId('user-button').click()
await page.getByTestId('logout-button').click()

// 语言切换
await page.getByTestId('locale-switcher').click()

// 认证页面跳转
await page.getByTestId('auth-jump-button').click()
```

## 完成状态

✅ SigninCard.tsx - 已完成  
✅ SignupCard.tsx - 已完成  
✅ UserButton.tsx - 已完成  
✅ OAuthCard.tsx - 已完成  
✅ AuthJumpButton.tsx - 已完成  
✅ LocaleSwitcher.tsx - 已完成  
✅ MobileSidebar.tsx - 已完成  

✅ **E2E 测试文件已重建**:
- `e2e/signin-real-flow.spec.ts` - 登录流程测试
- `e2e/signup-real-flow.spec.ts` - 注册流程测试  
- `e2e/signout-real-flow.spec.ts` - 退出登录测试
- `e2e/full-user-journey.spec.ts` - 完整用户旅程测试
- `e2e/README.md` - 详细的测试指南

所有认证相关组件的交互元素都已添加 `data-testid` 属性，E2E 测试可以精准定位和操作这些元素。测试采用唯一数据策略，模拟真实用户行为，无需依赖特殊测试端点。
