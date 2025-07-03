# E2E 测试指南

本目录包含完整的端到端 (E2E) 测试，使用 Playwright 测试框架来验证应用的真实用户行为。

## 测试文件概览

### 核心测试文件

1. **`signin-real-flow.spec.ts`** - 用户登录流程测试
   - 成功登录流程（先注册再登录）
   - 登录失败处理
   - 表单验证
   - 页面跳转功能
   - OAuth 按钮验证
   - 语言切换功能

2. **`signup-real-flow.spec.ts`** - 用户注册流程测试
   - 成功注册流程
   - 表单验证（密码不匹配、空表单、无效邮箱）
   - 重复邮箱处理
   - 页面跳转功能
   - OAuth 按钮验证
   - 所有UI元素验证

3. **`signout-real-flow.spec.ts`** - 用户退出登录测试
   - 成功退出登录流程
   - 退出后页面访问权限验证
   - 用户下拉菜单功能
   - 多次登录/退出循环
   - 按钮状态验证

4. **`full-user-journey.spec.ts`** - 完整用户旅程测试
   - 端到端完整用户生命周期
   - 页面间跳转和认证状态保持
   - 错误处理和用户体验
   - 响应式设计和移动端体验

5. **`create-workspace-flow.spec.ts`** - 工作区创建流程测试
   - 新用户注册后创建工作区的完整流程
   - 工作区创建表单验证
   - 图片上传功能测试
   - 直接访问工作区创建页面
   - 取消工作区创建操作

### 配置文件

- **`global-setup.ts`** - 全局测试环境设置
- **`global-teardown.ts`** - 全局测试环境清理

## 测试策略

### 唯一数据策略
我们使用唯一数据策略来避免测试间的数据冲突：

```typescript
const generateUniqueUser = () => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  
  return {
    name: `Test User ${timestamp}`,
    email: `test.user.${timestamp}.${randomId}@example.com`,
    password: 'SecurePass123!',
  }
}
```

### 真实用户行为模拟
- 不依赖特殊的测试API端点
- 使用真实的注册/登录流程
- 模拟真实用户的操作序列
- 验证UI反馈和状态变化

## Data-TestID 使用

所有交互元素都配置了 `data-testid` 属性，用于精确的元素定位：

### 认证相关组件
```typescript
// 登录表单
page.getByTestId('signin-card')
page.getByTestId('signin-email-input')
page.getByTestId('signin-password-input')
page.getByTestId('signin-submit-button')

// 注册表单
page.getByTestId('signup-card')
page.getByTestId('signup-name-input')
page.getByTestId('signup-email-input')
page.getByTestId('signup-password-input')
page.getByTestId('signup-confirm-password-input')
page.getByTestId('signup-submit-button')

// 用户控制
page.getByTestId('user-button')
page.getByTestId('logout-button')

// OAuth 按钮
page.getByTestId('google-oauth-button')
page.getByTestId('github-oauth-button')

// 导航和控制
page.getByTestId('auth-jump-button')
page.getByTestId('locale-switcher')
page.getByTestId('mobile-sidebar-trigger')
```

## 运行测试

### 运行所有E2E测试
```bash
npm run test:e2e
```

### 运行特定测试文件
```bash
npx playwright test e2e/signin-real-flow.spec.ts
npx playwright test e2e/signup-real-flow.spec.ts
npx playwright test e2e/signout-real-flow.spec.ts
npx playwright test e2e/full-user-journey.spec.ts
```

### 以可视化模式运行
```bash
npx playwright test --headed
npx playwright test --ui
```

### 调试模式
```bash
npx playwright test --debug
```

### 运行特定浏览器
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 测试最佳实践

### 1. 独立性
每个测试都是独立的，不依赖其他测试的执行结果。

### 2. 数据隔离
使用唯一的测试数据，避免测试间的数据冲突。

### 3. 等待策略
使用 Playwright 的自动等待机制：
```typescript
await expect(page.getByTestId('signin-card')).toBeVisible()
```

### 4. 错误处理
测试包含各种错误场景和边界情况。

### 5. 清晰的测试描述
每个测试都有清晰的描述和注释，说明测试的目的和步骤。

## 调试指南

### 查看测试报告
```bash
npx playwright show-report
```

### 生成调试痕迹
```bash
npx playwright test --trace on
```

### 截图和视频
测试失败时会自动生成截图和视频，保存在 `test-results` 目录中。

## 持续集成

这些测试设计为在CI/CD环境中运行：
- 无头模式执行
- 并行执行支持
- 详细的测试报告
- 失败时的调试信息

## 注意事项

1. **环境依赖**: 测试需要完整的应用环境（数据库、API服务等）
2. **数据库状态**: 使用唯一数据策略，不需要在测试间清理数据库
3. **网络依赖**: OAuth 测试需要外部服务配置
4. **性能考虑**: 在大型数据集上可能需要调整超时设置

## 故障排除

### 常见问题

1. **元素找不到**: 检查 `data-testid` 是否正确配置
2. **超时错误**: 调整等待时间或检查页面加载状态
3. **数据冲突**: 确认使用了唯一数据生成策略
4. **认证失败**: 检查测试环境的认证配置

### 调试步骤

1. 运行单个测试文件
2. 使用 `--headed` 模式观察浏览器行为
3. 检查测试报告和截图
4. 启用调试模式进行步骤调试
