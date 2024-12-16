import { createSessionClient } from "@/lib/hono"

export const getCurrent = async () => {
	try {
		const { account } = await createSessionClient()

		return await account.get()
	} catch {
		return null
	}
}
