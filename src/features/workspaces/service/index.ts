import { Hono } from "hono"
import { ID } from "node-appwrite"

import { authSessionMiddleware } from "@/lib/hono-middleware"

import { DATABASE_ID, WORKSPACES_ID, IMAGE_BUCKET_ID } from "@/config"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildCreateWorkspaceSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"

const app = new Hono<{ Variables: AppVariables }>()
	.get("/", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		const databases = c.get("databases")

		// const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [Query.equal("userId", user.$id)])

		// if (members.total === 0) {
		// 	return c.json({ data: { documents: [], total: 0 } })
		// }

		// const workspaceIds = members.documents.map((member) => member.workspaceId)

		const workspaces = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID)

		return c.json({ data: workspaces })
	})
	.post(
		"/",
		localeMiddleware,
		localeValidatorMiddleware("form", buildCreateWorkspaceSchema),
		authSessionMiddleware,
		async (c) => {
			const databases = c.get("databases")
			const storage = c.get("storage")
			const user = c.get("user")

			const { name, image } = c.req.valid("form")

			let uploadedImageUrl: string | undefined

			if (image instanceof File) {
				const file = await storage.createFile(IMAGE_BUCKET_ID, ID.unique(), image)

				const arrayBuffer = await storage.getFilePreview(IMAGE_BUCKET_ID, file.$id)

				uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
			}

			const workspace = await databases.createDocument(DATABASE_ID, WORKSPACES_ID, ID.unique(), {
				name,
				userId: user.$id,
				imageUrl: uploadedImageUrl,
			})

			// await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
			// 	userId: user.$id,
			// 	workspaceId: workspace.$id,
			// 	role: MemberRole.ADMIN,
			// })

			return c.json({ data: workspace })
		}
	)

export default app
