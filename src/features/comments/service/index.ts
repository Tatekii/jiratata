import "server-only"
/**
 * 评论 API 服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware, localeMiddleware, localeValidatorMiddleware } from "@/lib/hono-middleware"
import { buildCreateCommentSchema, buildUpdateCommentSchema } from "../schemas"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { isMemberOfWorkspace } from "@/features/members/utils"
import { createComment, getComments, updateComment, deleteComment, checkCommentAccess } from "../utils"
import mongoose from "mongoose"

const app = new Hono<{ Variables: AppVariables }>()

// 创建评论
.post(
	"/",
	authSessionMiddleware,
	localeMiddleware,
	localeValidatorMiddleware("json", buildCreateCommentSchema),
	async (c) => {
		try {
			const user = c.get("user")
			const { content, taskId, parentCommentId, mentions } = c.req.valid("json")

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(taskId)) {
				return c.json({ error: "无效的任务ID" }, 400)
			}

			if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId)) {
				return c.json({ error: "无效的父评论ID" }, 400)
			}

			// 获取任务信息以检查权限
			const { Task } = await import('@/models')
			const task = await Task.findById(taskId)
			if (!task) {
				return c.json({ error: "任务不存在" }, 404)
			}

			// 检查用户是否为工作区成员
			const isMember = await isMemberOfWorkspace(task.workspaceId.toString(), user._id!.toString())
			if (!isMember) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const comment = await createComment({
				content,
				taskId,
				authorId: user._id!.toString(),
				workspaceId: task.workspaceId.toString(),
				parentCommentId,
				mentions,
			})

			return c.json({ data: comment })
		} catch (error) {
			console.error("创建评论失败:", error)
			return c.json({ error: "创建评论失败" }, 500)
		}
	}
)

// 获取任务的评论列表
.get(
	"/",
	authSessionMiddleware,
	zValidator(
		"query",
		z.object({
			taskId: z.string().min(1),
		})
	),
	async (c) => {
		try {
			const user = c.get("user")
			const { taskId } = c.req.valid("query")

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(taskId)) {
				return c.json({ error: "无效的任务ID" }, 400)
			}

			// 获取任务信息以检查权限
			const { Task } = await import('@/models')
			const task = await Task.findById(taskId)
			if (!task) {
				return c.json({ error: "任务不存在" }, 404)
			}

			// 检查用户是否为工作区成员
			const isMember = await isMemberOfWorkspace(task.workspaceId.toString(), user._id!.toString())
			if (!isMember) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const comments = await getComments(taskId)

			return c.json({ data: comments })
		} catch (error) {
			console.error("获取评论列表失败:", error)
			return c.json({ error: "获取评论列表失败" }, 500)
		}
	}
)

// 更新评论
.patch(
	"/:commentId",
	authSessionMiddleware,
	localeMiddleware,
	localeValidatorMiddleware("json", buildUpdateCommentSchema),
	async (c) => {
		try {
			const user = c.get("user")
			const { commentId } = c.req.param()
			const { content } = c.req.valid("json")

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(commentId)) {
				return c.json({ error: "无效的评论ID" }, 400)
			}

			// 检查用户权限
			const hasAccess = await checkCommentAccess(commentId, user._id!.toString())
			if (!hasAccess) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const comment = await updateComment(commentId, content, user._id!.toString())
			if (!comment) {
				return c.json({ error: "评论不存在" }, 404)
			}

			return c.json({ data: comment })
		} catch (error) {
			console.error("更新评论失败:", error)
			return c.json({ error: "更新评论失败" }, 500)
		}
	}
)

// 删除评论
.delete("/:commentId", authSessionMiddleware, async (c) => {
	try {
		const user = c.get("user")
		const { commentId } = c.req.param()

		// 验证ObjectId格式
		if (!mongoose.Types.ObjectId.isValid(commentId)) {
			return c.json({ error: "无效的评论ID" }, 400)
		}

		// 检查用户权限
		const hasAccess = await checkCommentAccess(commentId, user._id!.toString())
		if (!hasAccess) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		const result = await deleteComment(commentId, user._id!.toString())
		if (!result) {
			return c.json({ error: "评论不存在" }, 404)
		}

		return c.json({ data: { _id: commentId } })
	} catch (error) {
		console.error("删除评论失败:", error)
		return c.json({ error: "删除评论失败" }, 500)
	}
})

export default app
