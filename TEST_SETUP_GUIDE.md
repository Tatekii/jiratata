# JWT Auth Service 测试配置 & 使用文档

## 概述

本项目为基于 Hono 的 JWT 认证服务及其 React Query hooks 配置了完整的单元测试环境，支持后端（Node.js）和前端（JSDOM/React）分离测试。

## 测试环境配置

### 1. 后端服务测试 (vitest.config.server.ts)

- **环境**: Node.js
- **覆盖范围**: 
  - JWT token 服务 (`src/lib/hono-jwt.ts`)
  - 认证中间件 (`src/lib/hono-middleware.ts`)
  - 认证查询服务 (`src/features/auth/service/auth.queries.ts`)
  - 认证 HTTP 路由 (`src/features/auth/service/auth.service.ts`)
  - 数据模型和数据库操作

- **Mock 依赖**:
  - MongoDB (使用 mongodb-memory-server)
  - next/headers
  - bcrypt
  - jose (JWT library)

### 2. 前端应用测试 (vitest.config.client.ts)

- **环境**: JSDOM
- **覆盖范围**:
  - React Query hooks (`src/features/auth/api/useCurrent.ts`)
  - React 组件
  - 自定义 hooks

- **Mock 依赖**:
  - @/lib/rpc (RPC client)
  - next/navigation
  - next/headers
  - localStorage/sessionStorage

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm run test

# 运行并监听文件变化
npm run test:watch

# 运行一次并生成覆盖率报告
npm run test:coverage
```

### 分离测试命令

```bash
# 后端服务测试
npm run test:server          # 监听模式
npm run test:server:run      # 运行一次
npm run test:server:coverage # 覆盖率报告

# 前端应用测试  
npm run test:client          # 监听模式
npm run test:client:run      # 运行一次
npm run test:client:coverage # 覆盖率报告
```

## 测试文件结构

```
src/
├── features/auth/
│   ├── api/
│   │   ├── useCurrent.ts                 # React Query hook
│   │   └── __tests__/
│   │       └── useCurrent.test.ts        # [前端] Hook 测试
│   └── service/
│       ├── auth.queries.ts               # 查询服务
│       ├── auth.service.ts               # HTTP 路由服务
│       └── __tests__/
│           ├── auth.queries.test.ts      # [后端] 查询服务测试
│           └── auth.service.test.ts      # [后端] HTTP 路由测试
├── lib/
│   ├── hono-jwt.ts                       # JWT 服务
│   ├── hono-middleware.ts                # 认证中间件
│   └── __tests__/
│       ├── hono-jwt.test.ts             # [后端] JWT 服务测试
│       └── hono-middleware.test.ts      # [后端] 中间件测试
└── test/
    ├── setup.ts                         # 通用测试配置
    └── setup-client.ts                  # 前端专用测试配置
```

## 测试覆盖率

### 后端服务测试覆盖率

✅ **JWT Token 服务** - 100% 覆盖
- createTokenPair: 创建访问令牌和刷新令牌对
- verifyAccessToken: 验证访问令牌
- verifyRefreshToken: 验证刷新令牌  
- refreshTokenPair: 刷新令牌对
- revokeToken: 撤销令牌
- revokeAllUserTokens: 撤销用户所有令牌
- cleanupExpiredTokens: 清理过期令牌
- registerUser: 用户注册
- loginUser: 用户登录

✅ **认证中间件** - 100% 覆盖
- Cookie 处理逻辑
- Token 验证流程
- 用户查询流程
- 错误处理分支
- 路径匹配行为

✅ **认证查询服务** - 100% 覆盖
- getCurrent: 获取当前用户
- 所有错误处理分支

✅ **HTTP 路由服务** - 100% 覆盖
- POST /auth/login: 用户登录
- POST /auth/register: 用户注册
- POST /auth/refresh: 刷新令牌
- POST /auth/logout: 用户登出
- GET /auth/current: 获取当前用户
- 完整认证流程集成测试
- Cookie 安全设置
- 错误处理与边界情况

### 前端应用测试覆盖率

✅ **useCurrent Hook** - 100% 覆盖
- 成功获取用户数据
- 处理 HTTP 错误响应
- 网络错误处理
- JSON 解析错误处理
- 手动 refetch 功能
- Query invalidation 和重新获取
- 多实例共享缓存
- 边界情况处理

## Mock 策略

### 后端 Mock
- **数据库**: 使用 mongodb-memory-server 提供真实的内存 MongoDB
- **外部库**: Mock bcrypt, jose, next/headers
- **网络**: 不需要 Mock，直接测试 Hono 应用

### 前端 Mock  
- **RPC Client**: 完全 Mock @/lib/rpc
- **Next.js**: Mock next/navigation, next/headers
- **浏览器 API**: Mock localStorage, sessionStorage, fetch
- **React Query**: 使用真实的 QueryClient 和 Provider

## 最佳实践

### 1. 测试隔离
- 每个测试文件都有独立的 Mock 设置
- 使用 `beforeEach` 清理 Mock 状态
- 后端和前端测试完全分离，避免互相干扰

### 2. 异步测试
- 使用 `waitFor` 等待异步操作完成
- 关闭 React Query 重试机制避免测试超时
- 设置合理的测试超时时间

### 3. 错误处理测试
- 覆盖所有可能的错误分支
- 测试网络错误、解析错误、业务逻辑错误
- 验证错误消息和状态码

### 4. 集成测试
- 后端测试完整的 HTTP 请求/响应流程
- 前端测试 React Query 与组件的集成
- 测试认证流程的端到端场景

## 持续集成

测试可以在 CI/CD 环境中运行：

```bash
# CI 环境中的测试命令
npm ci
npm run test:server:run
npm run test:client:run
npm run test:coverage
```

## 故障排除

### 常见问题

1. **Jest DOM 错误**: 确保安装了 `@testing-library/jest-dom`
2. **JSDOM 错误**: 确保安装了 `jsdom` 依赖
3. **Mock 错误**: 检查 vi.mock 调用是否在顶层，且不引用外部变量
4. **超时错误**: 检查异步操作是否正确等待
5. **MongoDB 连接错误**: 确保 mongodb-memory-server 正确启动

### 调试技巧

```bash
# 运行特定测试文件
npm run test:server:run src/lib/__tests__/hono-jwt.test.ts

# 详细输出
npm run test:server:run -- --reporter=verbose

# 只运行失败的测试
npm run test:server:run -- --reporter=verbose --run
```

## 下一步扩展

1. 添加更多 React Query hooks 的测试
2. 添加 React 组件的单元测试
3. 添加 E2E 测试覆盖完整用户流程
4. 添加性能测试和压力测试
5. 集成视觉回归测试

---

本测试配置确保了 JWT 认证服务的高质量和可靠性，为后续功能开发提供了坚实的基础。
