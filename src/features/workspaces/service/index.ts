import { Hono } from "hono"
import { ID, Query } from "node-appwrite"

import { authSessionMiddleware } from "@/lib/hono-middleware"
import { zValidator } from "@hono/zod-validator"

import { DATABASE_ID, WORKSPACES_ID, IMAGES_BUCKET_ID, MEMBERS_ID } from "@/config"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildCreateWorkspaceSchema, buildUpdateWorkspaceSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { EMemberRole, TWorkspace } from "@/features/types"
import { generateInviteCode } from "@/lib/utils"
import { getMember } from "@/features/members/utils"
import { z } from "zod"

const app = new Hono<{ Variables: AppVariables }>()
	.get("/", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		const databases = c.get("databases")

		const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [Query.equal("userId", user.$id)])

		// 只显示自己为成员的工作区

		if (members.total === 0) {
			return c.json({ data: { documents: [], total: 0 } })
		}

		const workspaceIds = members.documents.map((member) => member.workspaceId)

		const workspaces = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID, [
			Query.orderDesc("$createdAt"),
			Query.contains("$id", workspaceIds),
		])

		return c.json({ data: workspaces })
	})
	.get("/:workspaceId", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		const databases = c.get("databases")
		const { workspaceId } = c.req.param()

		const member = await getMember({
			databases,
			workspaceId,
			userId: user.$id,
		})

		if (!member) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		const workspace = await databases.getDocument<TWorkspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)

		return c.json({ data: workspace })
	})
	.get("/:workspaceId/info", authSessionMiddleware, async (c) => {
		const databases = c.get("databases")
		const { workspaceId } = c.req.param()

		const workspace = await databases.getDocument<TWorkspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)

		return c.json({
			data: {
				$id: workspace.$id,
				name: workspace.name,
				imageUrl: workspace.imageUrl,
			},
		})
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
				const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image)

				const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id)

				uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
			}

			const workspace = await databases.createDocument(DATABASE_ID, WORKSPACES_ID, ID.unique(), {
				name,
				userId: user.$id,
				imageUrl: uploadedImageUrl,
				inviteCode: generateInviteCode()(),
			})

			// member中也新建一条角色为admin的记录，并联上同一工作区
			await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
				userId: user.$id,
				workspaceId: workspace.$id,
				role: EMemberRole.ADMIN,
			})

			return c.json({ data: workspace })
		}
	)
	.patch(
		"/:workspaceId",
		authSessionMiddleware,
		localeMiddleware,

		localeValidatorMiddleware("form", buildUpdateWorkspaceSchema),
		async (c) => {
			const databases = c.get("databases")
			const storage = c.get("storage")
			const user = c.get("user")

			const { workspaceId } = c.req.param()
			const { name, image } = c.req.valid("form")

			const member = await getMember({
				databases,
				workspaceId,
				userId: user.$id,
			})

			if (!member || member.role !== EMemberRole.ADMIN) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			let uploadedImageUrl: string | undefined

			if (image instanceof File) {
				const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image)

				const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id)

				uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
			} else {
				uploadedImageUrl = image
			}

			const workspace = await databases.updateDocument(DATABASE_ID, WORKSPACES_ID, workspaceId, {
				name,
				imageUrl: uploadedImageUrl,
			})

			return c.json({ data: workspace })
		}
	)
	.delete("/:workspaceId", authSessionMiddleware, async (c) => {
		const databases = c.get("databases")
		const user = c.get("user")

		const { workspaceId } = c.req.param()

		const member = await getMember({
			databases,
			workspaceId,
			userId: user.$id,
		})

		if (!member || member.role !== EMemberRole.ADMIN) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		// TODO: Delete members, projects, and tasks

		await databases.deleteDocument(DATABASE_ID, WORKSPACES_ID, workspaceId)

		return c.json({ data: { $id: workspaceId } })
	})
	.post(
		"/:workspaceId/join",
		authSessionMiddleware,
		zValidator("json", z.object({ code: z.string(), role: z.nativeEnum(EMemberRole) })),
		async (c) => {
			const { workspaceId } = c.req.param()

			const { code, role } = c.req.valid("json")

			const databases = c.get("databases")

			const user = c.get("user")

			const member = await getMember({
				databases,
				workspaceId,
				userId: user.$id,
			})

			if (member) {
				return c.json({ error: "Already a member" }, 400)
			}

			const workspace = await databases.getDocument<TWorkspace>(DATABASE_ID, WORKSPACES_ID, workspaceId)

			if (workspace.inviteCode !== code) {
				return c.json({ error: "Invalid invite code" }, 400)
			}

			await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
				workspaceId,
				userId: user.$id,
				role,
			})

			return c.json({ data: workspace })
		}
	)

export default app
