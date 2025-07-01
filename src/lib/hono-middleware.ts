/**
 * middleware for hono client ONLY - 使用新的数据库支持的token系统
 */
import { createMiddleware } from "hono/factory"
import { getCookie } from "hono/cookie"
import { verifyAccessToken } from "@/lib/hono-jwt"
import { User } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { AUTH_TOKEN } from "@/features/auth/constants"

export const authSessionMiddleware = createMiddleware(async (c, next) => {
	try {
		// 从cookie获取JWT token
		const token = getCookie(c, AUTH_TOKEN)
		
		if (!token) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		// 使用新的token服务验证JWT token
		const decoded = await verifyAccessToken(token)
		if (!decoded) {
			return c.json({ error: "Invalid token" }, 401)
		}

		// 连接数据库并获取用户信息
		await connectToDatabase()
		const user = await User.findById(decoded.userId)
		
		if (!user) {
			return c.json({ error: "User not found" }, 401)
		}

		// 将用户信息设置到上下文中
		c.set("user", {
			_id: user._id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})
		
		await next()
	} catch {
		return c.json({ error: "Unauthorized" }, 401)
	}
})
