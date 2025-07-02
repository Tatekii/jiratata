import "server-only"
import { Hono } from "hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/lib/hono-middleware"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { setCookie, deleteCookie, getCookie } from "hono/cookie"
import { AUTH_TOKEN, REFRESH_TOKEN } from "../constants"
import { 
  loginUser, 
  registerUser, 
  refreshTokenPair,
  revokeAllUserTokens
} from "@/lib/hono-jwt"
import sessionsService from "./sessions.service"

const app = new Hono<{ Variables: AppVariables }>()
	.route("/", sessionsService)
	.get("/current", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		return c.json({ data: user })
	})
	.post("/login", localeMiddleware, localeValidatorMiddleware("json", buildLoginSchema), async (c) => {
		const { email, password } = c.req.valid("json")

		try {
			// 获取客户端信息用于token生成
			const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
			const userAgent = c.req.header('user-agent')
			
			const { user, tokens } = await loginUser({ email, password }, ipAddress, userAgent)

			// 设置Access Token Cookie
			setCookie(c, AUTH_TOKEN, tokens.accessToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.expiresIn,
			})

			// 设置Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, tokens.refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.refreshExpiresIn,
			})

			return c.json({ success: true, data: user })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "登录失败"
			return c.json({ error: errorMessage }, 401)
		}
	})
	.post("/register", localeMiddleware, localeValidatorMiddleware("json", buildRegisterSchema), async (c) => {
		const { email, password, name } = c.req.valid("json")

		try {
			// 获取客户端信息用于token生成
			const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
			const userAgent = c.req.header('user-agent')
			
			const { user, tokens } = await registerUser({ email, password, name }, ipAddress, userAgent)

			// 设置Access Token Cookie
			setCookie(c, AUTH_TOKEN, tokens.accessToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.expiresIn,
			})

			// 设置Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, tokens.refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.refreshExpiresIn,
			})

			return c.json({ success: true, data: user })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "注册失败"
			return c.json({ error: errorMessage }, 400)
		}
	})
	.post("/refresh", async (c) => {
		try {
			const refreshToken = getCookie(c, REFRESH_TOKEN)
			
			if (!refreshToken) {
				return c.json({ error: "Refresh token not found" }, 401)
			}

			// 获取客户端信息
			const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
			const userAgent = c.req.header('user-agent')

			const tokens = await refreshTokenPair(refreshToken, ipAddress, userAgent)
			
			if (!tokens) {
				return c.json({ error: "Invalid refresh token" }, 401)
			}

			// 设置新的Access Token Cookie
			setCookie(c, AUTH_TOKEN, tokens.accessToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.expiresIn,
			})

			// 设置新的Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, tokens.refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: tokens.refreshExpiresIn,
			})

			return c.json({ success: true })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Token refresh failed"
			return c.json({ error: errorMessage }, 401)
		}
	})
	.post("/logout", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			
			// 从数据库撤销用户的所有token
			await revokeAllUserTokens(user._id.toString(), 'user_logout')
			
			// 清除cookie
			deleteCookie(c, AUTH_TOKEN)
			deleteCookie(c, REFRESH_TOKEN)
			
			return c.json({ success: true })
		} catch (error) {
			// 即使撤销失败，也要清除cookie
			deleteCookie(c, AUTH_TOKEN)
			deleteCookie(c, REFRESH_TOKEN)
			
			const errorMessage = error instanceof Error ? error.message : "Logout failed"
			return c.json({ error: errorMessage }, 500)
		}
	})

export default app
