import { defineConfig } from 'vitest/config'
import path from 'path'

// 前端应用测试配置 (JSDOM 环境)
export default defineConfig({
  test: {
    name: 'client',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup-client.ts'],
    globals: true,
    include: [
      '**/api/**/*.test.{ts,js}', // React Query hooks
      '**/components/**/*.test.{ts,js}', // React 组件
      '**/hooks/**/*.test.{ts,js}', // 自定义 hooks
      '**/*hook.test.{ts,js}',
      '**/*component.test.{ts,js}',
    ],
    exclude: [
      '**/service/**/*.test.{ts,js}', // 排除后端服务
      '**/lib/**/*.test.{ts,js}', // 排除服务端库
      '**/models/**/*.test.{ts,js}', // 排除数据模型
      '**/node_modules/**', // 排除 node_modules 中的测试
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/client',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.mjs',
        '**/service/**', // 排除后端代码
        '**/lib/mongodb.ts',
        '**/lib/hono-jwt.ts',
        '**/models/**',
      ],
    },
    testTimeout: 5000, // 前端测试通常更快
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
