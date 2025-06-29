import "server-only"
import { Hono } from "hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { setCookie, deleteCookie } from "hono/cookie"
import { AUTH_COOKIE } from "../constans"
import { loginUser, registerUser } from "@/lib/auth"

const app = new Hono<{ Variables: AppVariables }>()
	.get("/current", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		return c.json({ data: user })
	})
	.post("/login", localeMiddleware, localeValidatorMiddleware("json", buildLoginSchema), async (c) => {
		const { email, password } = c.req.valid("json")

		try {
			const { user, token } = await loginUser({ email, password })

			setCookie(c, AUTH_COOKIE, token, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 30, // 30天
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
			const { user, token } = await registerUser({ email, password, name })

			setCookie(c, AUTH_COOKIE, token, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 30, // 30天
			})

			return c.json({ success: true, data: user })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "注册失败"
			return c.json({ error: errorMessage }, 400)
		}
	})
	.post("/logout", authSessionMiddleware, async (c) => {
		deleteCookie(c, AUTH_COOKIE)
		return c.json({ success: true })
	})

export default app
