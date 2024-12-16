/**
 * middleware for hono client ONLY
 */
import { createMiddleware } from "hono/factory"
import { cookies } from "next/headers"
import {
	Account,
	Client,
	Databases,
	Storage,
} from "node-appwrite"
import { AUTH_COOKIE } from "../features/auth/constans"

export const authSessionMiddleware = createMiddleware(async (c, next) => {
	const client = new Client()
		.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
		.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)

	const session = await (await cookies()).get(AUTH_COOKIE)

	if (!session || !session.value) {
		return c.json(
			{
				message: "Unauthorized",
			},
			401
		)
	}

	client.setSession(session.value)

	const account = new Account(client)
	const databases = new Databases(client)
	const storage = new Storage(client)

	const user = await account.get()

	c.set("account", account)
	c.set("databases", databases)
	c.set("storage", storage)
	c.set("user", user)

	await next()
})
