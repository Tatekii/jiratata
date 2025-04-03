import { Hono } from "hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { setCookie, deleteCookie } from "hono/cookie"
import { AUTH_COOKIE } from "../constans"
import { createAdminClient } from "@/lib/hono"
import { ID } from "node-appwrite"

const app = new Hono<{ Variables: AppVariables }>()
	.get("/current", authSessionMiddleware, async (c) => {
		const user = c.get("user")

		return c.json({ data: user })
	})
	.post("/login", localeMiddleware, localeValidatorMiddleware("json", buildLoginSchema), async (c) => {
		const { email, password } = c.req.valid("json")

		const { account } = await createAdminClient()

		try {
			const session = await account.createEmailPasswordSession(email, password)

			setCookie(c, AUTH_COOKIE, session.secret, {
				path: "/",
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				maxAge: 60 * 60 * 24 * 30,
			})

			return c.json({ success: true })
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.response) {

				const { response } = error

				return c.json({ error: response.message }, response.code as ResponseInit)
			}

			// Handle other types of errors
			return c.json({ failed: "An unexpected error occurred" }, 401)
		}
	})
	.post("/register", localeMiddleware, localeValidatorMiddleware("json", buildRegisterSchema), async (c) => {
		const { email, password, name } = c.req.valid("json")

		const { account } = await createAdminClient()

		// try {
		await account.create(ID.unique(), email, password, name)

		const session = await account.createEmailPasswordSession(email, password)

		setCookie(c, AUTH_COOKIE, session.secret, {
			path: "/",
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 30,
		})

		console.log("print error", c.error)

		return c.json({ success: true })
		// } catch (error) {
		// 	// TODO 统一appwrite错误处理
		// 	return c.json({ success: false })
		// }
	})
	.post("/logout", authSessionMiddleware, async (c) => {
		const account = c.get("account")

		deleteCookie(c, AUTH_COOKIE)

		await account.deleteSession("current")

		return c.json({ success: true })
	})

export default app
