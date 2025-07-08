import "server-only"
/**
 * 服务端环境变量初始化
 * 只负责在应用启动时加载环境变量文件
 */
import { config as dotenvConfig } from "dotenv"
import { existsSync } from "fs"
import { join } from "path"

// 全局标记，确保只初始化一次
let isInitialized = false

// 只在服务端加载环境变量，且只初始化一次
if (typeof window === "undefined" && !isInitialized) {
	const environment = process.env.NODE_ENV || "development"
	const rootPath = process.cwd()

	try {
		// 按优先级倒序加载（后加载的会覆盖先加载的）
		const envFiles = [
			`.env`, // 最低优先级
			`.env.local`,
			`.env.${environment}`,
			`.env.${environment}.local`, // 最高优先级
		]

		const loadedFiles: string[] = []

		envFiles.forEach((file) => {
			const filePath = join(rootPath, file)
			if (existsSync(filePath)) {
				// 使用 override: true 来覆盖已存在的变量
				const result = dotenvConfig({
					path: filePath,
					override: true, // dotenv 支持这个属性
				})

				if (result.error) {
					console.warn(`⚠️ Error loading ${file}:`, result.error)
				} else {
					loadedFiles.push(file)
				}
			}
		})

		if (process.env.NODE_ENV !== "production") {
			console.log(`🔧 Environment: ${environment}`)
			console.log(`✅ Loaded files (in order): ${loadedFiles.join(" -> ")}`)
		}

		isInitialized = true
	} catch (error) {
		console.warn("⚠️ Failed to load environment variables:", error)
	}
}
