import type { NextConfig } from "next"
import { loadEnv, getEnvironment } from "./lib/env-loader"

// 加载环境变量
const env = getEnvironment()
loadEnv(env, { silent: false })

const nextConfig: NextConfig = {
  env: {
    // 将加载的环境变量暴露给客户端（仅以 NEXT_PUBLIC_ 开头的）
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    )
  }
}

export default nextConfig
