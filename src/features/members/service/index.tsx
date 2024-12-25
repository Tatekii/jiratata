import { z } from "zod"
import { Hono } from "hono"
import { Query } from "node-appwrite"
import { zValidator } from "@hono/zod-validator"

import { DATABASE_ID, MEMBERS_ID } from "@/config"

import { getMember } from "../utils"
import { TMember, EMemberRole } from "@/features/types"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { createAdminClient } from "@/lib/hono"
import { AppVariables } from "@/app/api/[[...route]]/route"

const app = new Hono<{ Variables: AppVariables }>()
	/**  
     * 获得workspace下的所有成员
     * @params {string} workspaceID
     */
	.get("/", authSessionMiddleware, zValidator("query", z.object({ workspaceId: z.string() })), async (c) => {
		const { users } = await createAdminClient()
		const databases = c.get("databases")
		const user = c.get("user")
		const { workspaceId } = c.req.valid("query")

		const member = await getMember({
            databases,
			workspaceId,
			userId: user.$id,
		})
        
        // 查询请求发起用户是否在该工作区
		if (!member) {
			return c.json({ error: "Unauthorized" }, 401)
		}

        // 列出该工作区所有成员
		const members = await databases.listDocuments<TMember>(DATABASE_ID, MEMBERS_ID, [
			Query.equal("workspaceId", workspaceId),
		])

		const populatedMembers = await Promise.all(
			members.documents.map(async (member) => {
				const user = await users.get(member.userId)

                // 补充用户名和邮箱信息
				return {
					...member,
					name: user.name || user.email,
					email: user.email,
				}
			})
		)

		return c.json({
			data: {
				...members,
				documents: populatedMembers,
			},
		})
	})
    // 工作区删除某成员
	.delete("/:memberId", authSessionMiddleware, async (c) => {
		const { memberId } = c.req.param()
		const user = c.get("user")
		const databases = c.get("databases")

        // memberId实际为member collection一条记录的的$id
		const memberToDelete = await databases.getDocument(DATABASE_ID, MEMBERS_ID, memberId)


        // 查询该工作区内所有成员
		const allMembersInWorkspace = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
			Query.equal("workspaceId", memberToDelete.workspaceId),
		])


		const member = await getMember({
			databases,
			workspaceId: memberToDelete.workspaceId,
			userId: user.$id,
		})

        // 查询请求发起用户是否在该工作区
		if (!member) {
			return c.json({ error: "Unauthorized" }, 401)
		}

        // 查询请求发起用户权限是否为管理员
		if (member.role !== EMemberRole.ADMIN) {
			return c.json({ error: "Unauthorized" }, 401)
		}

        // 不能删掉唯一成员
		if (allMembersInWorkspace.total === 1) {
			return c.json({ error: "Cannot delete the only member" }, 400)
		}

		await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId)

		return c.json({ data: { $id: memberToDelete.$id } })
	})
    // 调整某成员权限
	.patch(
		"/:memberId",
		authSessionMiddleware,
		zValidator("json", z.object({ role: z.nativeEnum(EMemberRole) })),
		async (c) => {
			const { memberId } = c.req.param()
			const { role } = c.req.valid("json")
			const user = c.get("user")
			const databases = c.get("databases")

			const memberToUpdate = await databases.getDocument(DATABASE_ID, MEMBERS_ID, memberId)

			const allMembersInWorkspace = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
				Query.equal("workspaceId", memberToUpdate.workspaceId),
			])

			const member = await getMember({
				databases,
				workspaceId: memberToUpdate.workspaceId,
				userId: user.$id,
			})

            // 查询请求发起用户是否在该工作区
			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

            // 查询请求发起用户权限是否为管理员
			if (member.role !== EMemberRole.ADMIN) {
				return c.json({ error: "Unauthorized" }, 401)
			}

            // 不能降级唯一成员
			if (allMembersInWorkspace.total === 1) {
				return c.json({ error: "Cannot adjust the only member" }, 400)
			}

			await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
				role,
			})

			return c.json({ data: { $id: memberToUpdate.$id } })
		}
	)

export default app
