import "server-only"
import { MONGODB_PASSWORD, MONGODB_URI, MONGODB_USERNAME, MONGODB_DB } from "@/config"
import mongoose from "mongoose"

// 构建包含认证信息的MongoDB连接字符串（不包含数据库名）
function buildMongoURI(): string {
	if (!MONGODB_URI) {
		throw new Error("MONGO DB URL NOT DEFINED!")
	}

	if (MONGODB_USERNAME && MONGODB_PASSWORD) {
		// 如果提供了用户名和密码，构建带认证的连接字符串
		if (process.env.NODE_ENV !== "production") {
			console.log("MongoDB: Using authentication with username:", MONGODB_USERNAME)
		}

		// 支持 mongodb:// 和 mongodb+srv:// 格式
		const isMongodbSrv = MONGODB_URI.startsWith("mongodb+srv://")
		const prefix = isMongodbSrv ? "mongodb+srv://" : "mongodb://"
		const baseUri = MONGODB_URI.replace(/^mongodb(\+srv)?:\/\//, "")

		// 不在连接字符串中包含数据库名，连接后再选择
		return `${prefix}${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}@${baseUri}`
	}

	// 没有用户名密码时，直接返回服务器连接字符串
	return MONGODB_URI
}

const FINAL_MONGODB_URI = buildMongoURI()

// 在开发环境中显示连接信息（不显示密码）
if (process.env.NODE_ENV !== "production") {
	const uriForLog = FINAL_MONGODB_URI
	console.log("MongoDB URI:", uriForLog)
}

// 连接缓存 - 避免在开发环境中创建多个连接
declare global {
	// eslint-disable-next-line no-var
	var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null }
}

let cached = global.mongoose

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null }
}

/**
 * 连接到 MongoDB 数据库
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
	if (cached.conn) {
		return cached.conn
	}

	if (!cached.promise) {
		if (!MONGODB_DB) {
			throw new Error("MONGO DB DATABASE NAME NOT DEFINED!")
		}

		const options: mongoose.ConnectOptions = {
			// 连接选项
			bufferCommands: true,
			// 不指定默认数据库，连接后手动选择
			dbName: MONGODB_DB,
		}

		// 创建数据库连接（先连接到服务器）
		cached.promise = mongoose.connect(FINAL_MONGODB_URI, options).then((mongooseInstance) => {
			console.log("MongoDB服务器连接成功", FINAL_MONGODB_URI)
			console.log(`将使用数据库: ${MONGODB_DB}`)

			return mongooseInstance.connection
		})
	}

	try {
		cached.conn = await cached.promise
	} catch (e) {
		cached.promise = null
		console.error("MongoDB连接失败:", e)
		throw e
	}

	return cached.conn
}

// 监听连接事件
mongoose.connection.on("error", (err) => {
	console.error("MongoDB连接错误:", err)
})

mongoose.connection.on("disconnected", () => {
	console.warn("MongoDB断开连接")
})

// 优雅关闭连接
process.on("SIGINT", async () => {
	await mongoose.connection.close()
	process.exit(0)
})

export default mongoose
