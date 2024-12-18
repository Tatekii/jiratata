/**
 * middleware for hono client ONLY
 */
import { createMiddleware } from "hono/factory"
import { createSessionClient } from "./hono"

export const authSessionMiddleware = createMiddleware(async (c, next) => {
	try {
		const { account, storage, databases } = await createSessionClient()

		const user = await account.get()

		c.set("account", account)
		c.set("databases", databases)
		c.set("storage", storage)
		c.set("user", user)
		await next()
	} catch {
		return c.json(
			{
				error: "Unauthorized",
			},
			401
		)
	}
})
