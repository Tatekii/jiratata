import "server-only"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/hono-jwt"
import { IMongoUser, User } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { AUTH_TOKEN } from "../constants"

export const getCurrent = async (): Promise<IMongoUser | null> => {
	try {
		// 从cookie获取JWT token
		const cookieStore = await cookies()
		const token = cookieStore.get(AUTH_TOKEN)?.value

		if (!token) {
			return null
		}

		// 验证JWT token
		const decoded = verifyAccessToken(token)
		if (!decoded) {
			return null
		}

		// 连接数据库并获取用户信息
		await connectToDatabase()
		const user = await User.findById(decoded.userId)

		if (!user) {
			return null
		}

		return user
	} catch {
		return null
	}
}
