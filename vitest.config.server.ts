import { defineConfig } from 'vitest/config'
import path from 'path'

// 后端服务测试配置 (Node.js 环境)
export default defineConfig({
  test: {
    name: 'server',
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: [
      '**/service/**/*.test.{ts,js}',
      '**/lib/**/*.test.{ts,js}',
      '**/models/**/*.test.{ts,js}',
      '**/*service.test.{ts,js}',
      '**/*queries.test.{ts,js}',
    ],
    exclude: [
      '**/api/**/*.test.{ts,js}', // 排除前端 API hooks
      '**/components/**/*.test.{ts,js}', // 排除组件测试
      '**/hooks/**/*.test.{ts,js}', // 排除 hooks 测试
      '**/node_modules/**', // 排除 node_modules 中的测试
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/server',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.mjs',
        '**/api/**', // 排除前端代码
        '**/components/**',
        '**/hooks/**',
      ],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
