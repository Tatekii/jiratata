import "server-only"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/hono-jwt"
import { User } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { AUTH_TOKEN } from "../constants"
import { IAuthUserInfo } from "@/app/api/[[...route]]/route"

export const getCurrent = async (): Promise<IAuthUserInfo | null> => {
	try {
		// 从cookie获取JWT token
		const cookieStore = await cookies()
		const token = cookieStore.get(AUTH_TOKEN)?.value

		if (!token) {
			return null
		}

		// 验证JWT token
		const decoded = await verifyAccessToken(token)
		if (!decoded) {
			return null
		}

		// 连接数据库并获取用户信息
		await connectToDatabase()
		const user = await User.findById(decoded.userId)

		if (!user) {
			return null
		}

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			avatar: user.avatar,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			oauthProvider: user.oauthAccounts?.map((o) => o.provider) || [],
		}
	} catch {
		return null
	}
}
