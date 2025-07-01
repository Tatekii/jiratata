import "server-only"
import { Hono } from "hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { setCookie, deleteCookie, getCookie } from "hono/cookie"
import { AUTH_TOKEN, REFRESH_TOKEN } from "../constants"
import { loginUser, registerUser, refreshAccessToken } from "@/lib/auth-tokens"
import { JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from "@/config"

// 将JWT时间字符串转换为秒数
const parseJwtExpiry = (expiry: string): number => {
	const match = expiry.match(/^(\d+)([dhms])$/)
	if (!match) return 60 * 60 * 24 * 7 // 默认7天
	
	const [, num, unit] = match
	const value = parseInt(num)
	
	switch (unit) {
		case 's': return value
		case 'm': return value * 60
		case 'h': return value * 60 * 60
		case 'd': return value * 60 * 60 * 24
		default: return 60 * 60 * 24 * 7
	}
}

const app = new Hono<{ Variables: AppVariables }>()
	.get("/current", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		return c.json({ data: user })
	})
	.post("/login", localeMiddleware, localeValidatorMiddleware("json", buildLoginSchema), async (c) => {
		const { email, password } = c.req.valid("json")

		try {
			const { user, token, refreshToken } = await loginUser({ email, password })

			// 设置Access Token Cookie
			setCookie(c, AUTH_TOKEN, token, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_EXPIRES_IN),
			})

			// 设置Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_REFRESH_EXPIRES_IN),
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
			const { user, token, refreshToken } = await registerUser({ email, password, name })

			// 设置Access Token Cookie
			setCookie(c, AUTH_TOKEN, token, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_EXPIRES_IN),
			})

			// 设置Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_REFRESH_EXPIRES_IN),
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

			const result = await refreshAccessToken(refreshToken)
			
			if (!result) {
				return c.json({ error: "Invalid refresh token" }, 401)
			}

			// 设置新的Access Token Cookie
			setCookie(c, AUTH_TOKEN, result.token, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_EXPIRES_IN),
			})

			// 设置新的Refresh Token Cookie
			setCookie(c, REFRESH_TOKEN, result.refreshToken, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: parseJwtExpiry(JWT_REFRESH_EXPIRES_IN),
			})

			return c.json({ success: true })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Token refresh failed"
			return c.json({ error: errorMessage }, 401)
		}
	})
	.post("/logout", authSessionMiddleware, async (c) => {
		// 清除Access Token和Refresh Token
		deleteCookie(c, AUTH_TOKEN)
		deleteCookie(c, REFRESH_TOKEN)
		return c.json({ success: true })
	})

export default app
