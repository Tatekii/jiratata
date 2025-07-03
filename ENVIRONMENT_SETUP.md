# 环境变量管理系统

本项目使用 `dotenv-flow` 实现多环境变量文件的自动加载和合并。

## 文件命名规范

环境变量文件按以下命名规范组织：

```
.env.base           # 基础环境变量（所有环境共享）
.env.dev            # 开发环境特定变量
.env.test           # 测试环境特定变量
.env.prod           # 生产环境特定变量
.env.base.local     # 本地基础环境变量（不提交到 Git）
.env.dev.local      # 本地开发环境变量（不提交到 Git）
.env.test.local     # 本地测试环境变量（不提交到 Git）
.env.prod.local     # 本地生产环境变量（不提交到 Git）
```

## 加载优先级

环境变量按以下优先级加载（后加载的会覆盖先加载的）：

1. `.env.base` - 基础配置
2. `.env.[environment]` - 环境特定配置
3. `.env.base.local` - 本地基础配置
4. `.env.[environment].local` - 本地环境特定配置

## 环境类型

- `dev` - 开发环境（默认）
- `test` - 测试环境
- `prod` - 生产环境

环境类型通过 `NODE_ENV` 自动推断：
- `NODE_ENV=production` → `prod`
- `NODE_ENV=test` → `test`
- 其他或未设置 → `dev`

## 使用方法

### 自动加载

在应用入口文件中导入：

```typescript
import "../lib/env" // 自动加载环境变量
```

### 手动加载

```typescript
import { loadEnv, getEnvironment } from "./lib/env-loader"

// 加载当前环境的环境变量
const env = getEnvironment()
loadEnv(env)

// 或者指定特定环境
loadEnv('test')
```

### 访问环境变量

```typescript
import { getEnv, requireEnv, getEnvNumber, getEnvBoolean } from "./lib/env-loader"

// 获取环境变量（可选的默认值）
const dbUri = getEnv('MONGODB_URI', 'mongodb://localhost:27017/default')

// 获取必需的环境变量（不存在时抛出错误）
const jwtSecret = requireEnv('JWT_SECRET')

// 获取数字类型环境变量
const port = getEnvNumber('PORT', 3000)

// 获取布尔类型环境变量
const debug = getEnvBoolean('DEBUG', false)
```

### 在配置文件中使用

```typescript
// src/config.ts
import { getEnv, requireEnv, getEnvNumber } from "../lib/env-loader"
import "../lib/env" // 自动加载

export const config = {
  mongodb: {
    uri: requireEnv("MONGODB_URI"),
  },
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
  },
  app: {
    port: getEnvNumber("PORT", 3000),
    debug: getEnv("DEBUG", "false") === "true",
  }
}
```

## 脚本命令

package.json 中的脚本已配置了正确的 NODE_ENV：

```bash
# 开发环境
npm run dev           # NODE_ENV=development

# 测试环境  
npm run test          # NODE_ENV=test
npm run test:run      # NODE_ENV=test

# 生产环境
npm run build         # NODE_ENV=production
npm run start         # NODE_ENV=production
```

## 示例环境变量文件

### .env.base
```bash
APP_NAME=Jiratata
APP_VERSION=1.1.0
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760
```

### .env.dev
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/jiratata_dev
DEBUG=true
LOG_LEVEL=debug
```

### .env.test
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/jiratata_test
DEBUG=false
LOG_LEVEL=error
JWT_EXPIRES_IN=1h
```

### .env.prod
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
MONGODB_URI=mongodb://your-production-host:27017/jiratata
DEBUG=false
LOG_LEVEL=warn
```

## Git 配置

确保本地环境变量文件不会被提交到版本控制：

```gitignore
# 环境变量文件
.env*.local
```

## 注意事项

1. **客户端变量**：只有以 `NEXT_PUBLIC_` 开头的变量会暴露给客户端
2. **敏感信息**：将敏感信息（如密钥、密码）放在 `.local` 文件中
3. **类型安全**：使用 `requireEnv`、`getEnvNumber` 等函数确保类型安全
4. **默认值**：为非必需变量提供合理的默认值

## 故障排除

### 调试环境变量加载

设置 `debug: true` 选项：

```typescript
loadEnv('dev', { debug: true })
```

### 查看加载的变量

```typescript
import { getAllEnv } from "./lib/env-loader"

console.log('Loaded environment variables:', getAllEnv())
```

### 验证特定变量

```typescript
import { hasEnv } from "./lib/env-loader"

if (!hasEnv('MONGODB_URI')) {
  console.error('MONGODB_URI is not set!')
}
```
