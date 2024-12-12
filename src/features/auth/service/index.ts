import { Hono } from "hono"
import { localeMiddleware } from "@/app/api/[[...route]]/middleware"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
// import { localeValidator } from "@/app/api/[[...route]]/localeValidator"
import { localeValidator } from "@/app/api/[[...route]]/localeValidator"

const app = new Hono<{ Variables: AppVariables }>()
	.post(
		"/login",
		localeMiddleware,
		localeValidator("json", buildLoginSchema),
		(c) => {
			const { email, password } = c.req.valid("json")
			console.log("signin", { email, password })

			return c.json({ success: 666 })
		}
	)
	.post("/register", localeMiddleware, localeValidator("json", buildRegisterSchema), (c) => {
		const { email, password } = c.req.valid("json")
		console.log("register", { email, password })
		return c.json({ success: 777 })
	})

export default app
