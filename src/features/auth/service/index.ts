import { Hono } from "hono"
import { localeMiddleware } from "@/app/api/[[...route]]/middleware"
import { buildLoginSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
// import { localeValidator } from "@/app/api/[[...route]]/localeValidator"
import { localeValidator } from "@/app/api/[[...route]]/localeValidator"

const app = new Hono<{ Variables: AppVariables }>().get(
	"/login",
	localeMiddleware,
	localeValidator("json", buildLoginSchema),
	// validator("json", async (value, c) => {
	// 	const dic = c.get("dic")

	// 	const schema = buildLoginSchema(dic)

	// 	const result = await schema.safeParseAsync(value)

	// 	if (!result.success) {
	// 		return c.json(result, 400)
	// 	}

	// 	return result.data as z.infer<typeof schema>
	// })
)

export default app
