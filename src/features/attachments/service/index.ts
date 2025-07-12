import "server-only"
/**
 * 附件 API 服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { isMemberOfWorkspace } from "@/features/members/utils"
import { createAttachment, getAttachments, deleteAttachment, checkAttachmentAccess } from "../utils"
import mongoose from "mongoose"

const app = new Hono<{ Variables: AppVariables }>()

// 创建附件
.post(
	"/",
	authSessionMiddleware,
	zValidator(
		"json",
		z.object({
			filename: z.string().min(1),
			originalName: z.string().min(1),
			mimeType: z.string().min(1),
			size: z.number().min(0),
			url: z.string().url(),
			entityType: z.enum(['TASK', 'COMMENT', 'PROJECT']),
			entityId: z.string().min(1),
			workspaceId: z.string().min(1),
		})
	),
	async (c) => {
		try {
			const user = c.get("user")
			const data = c.req.valid("json")

			// 验证ObjectId格式
			if (
				!mongoose.Types.ObjectId.isValid(data.entityId) ||
				!mongoose.Types.ObjectId.isValid(data.workspaceId)
			) {
				return c.json({ error: "无效的ID格式" }, 400)
			}

			// 检查用户是否为工作区成员
			const isMember = await isMemberOfWorkspace(data.workspaceId, user._id!.toString())
			if (!isMember) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const attachment = await createAttachment({
				...data,
				uploadedBy: user._id!.toString(),
			})

			return c.json({ data: attachment })
		} catch (error) {
			console.error("创建附件失败:", error)
			return c.json({ error: "创建附件失败" }, 500)
		}
	}
)

// 获取实体的附件列表
.get(
	"/",
	authSessionMiddleware,
	zValidator(
		"query",
		z.object({
			entityType: z.enum(['TASK', 'COMMENT', 'PROJECT']),
			entityId: z.string().min(1),
		})
	),
	async (c) => {
		try {
			const { entityType, entityId } = c.req.valid("query")

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(entityId)) {
				return c.json({ error: "无效的实体ID" }, 400)
			}

			// 这里应该检查用户对该实体的访问权限
			// 简化实现，实际应该根据entityType检查不同的权限

			const attachments = await getAttachments(entityType, entityId)

			return c.json({ data: attachments })
		} catch (error) {
			console.error("获取附件列表失败:", error)
			return c.json({ error: "获取附件列表失败" }, 500)
		}
	}
)

// 删除附件
.delete("/:attachmentId", authSessionMiddleware, async (c) => {
	try {
		const user = c.get("user")
		const { attachmentId } = c.req.param()

		// 验证ObjectId格式
		if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
			return c.json({ error: "无效的附件ID" }, 400)
		}

		// 检查用户权限
		const hasAccess = await checkAttachmentAccess(attachmentId, user._id!.toString())
		if (!hasAccess) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		const result = await deleteAttachment(attachmentId, user._id!.toString())
		if (!result) {
			return c.json({ error: "附件不存在" }, 404)
		}

		return c.json({ data: { _id: attachmentId } })
	} catch (error) {
		console.error("删除附件失败:", error)
		return c.json({ error: "删除附件失败" }, 500)
	}
})

export default app
