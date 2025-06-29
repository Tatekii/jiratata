import "server-only"
/**
 * MongoDB版本的工作区服务
 */
import { Hono } from "hono"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildCreateWorkspaceSchema, buildUpdateWorkspaceSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { Task, Workspace } from "@/models"
import {
	getUserWorkspaces,
	createWorkspace,
	getMemberByWorkspaceAndUser,
	getWorkspaceByInviteCode,
	updateWorkspace,
	deleteWorkspace,
	resetWorkspaceInviteCode,
	joinWorkspaceByInviteCode,
} from "../utils"
import mongoose from "mongoose"

const app = new Hono<{ Variables: AppVariables }>()
	// 获取用户的所有工作区
	.get("/", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const workspaces = (await getUserWorkspaces(String(user._id))) || []

			return c.json({
				data: {
					documents: workspaces,
					total: workspaces.length,
				},
			})
		} catch (error) {
			console.error("获取工作区失败:", error)
			return c.json({ error: "获取工作区失败" }, 500)
		}
	})

	// 获取特定工作区详情
	.get("/:workspaceId", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const { workspaceId } = c.req.param()

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
				return c.json({ error: "无效的工作区ID" }, 400)
			}

			const member = await getMemberByWorkspaceAndUser(workspaceId, user._id!.toString())

			if (!member) {
				return c.json({ error: "您不是该工作区的成员" }, 403)
			}

			// 使用Mongoose查询工作区详情
			const workspace = await Workspace.findById(workspaceId)

			if (!workspace) {
				return c.json({ error: "工作区不存在" }, 404)
			}

			return c.json({ data: workspace })

		} catch (error) {
			console.error("获取工作区详情失败:", error)
			return c.json({ error: "获取工作区详情失败" }, 500)
		}
	})

	// 创建新工作区
	.post(
		"/",
		authSessionMiddleware,
		localeMiddleware,
		localeValidatorMiddleware("json", buildCreateWorkspaceSchema),
		async (c) => {
			try {
				const user = c.get("user")
				const { name, image } = c.req.valid("json")

				// FIXME image上传
				const workspace = await createWorkspace({
					name,
					userId: user._id!.toString(),
					imageUrl: typeof image === "string" ? image : "",
				})

				return c.json({ data: workspace })
			} catch (error) {
				console.error("创建工作区失败:", error)
				return c.json({ error: "创建工作区失败" }, 500)
			}
		}
	)

	// 更新工作区
	.patch(
		"/:workspaceId",
		authSessionMiddleware,
		localeMiddleware,
		localeValidatorMiddleware("json", buildUpdateWorkspaceSchema),
		async (c) => {
			try {
				const user = c.get("user")
				const { workspaceId } = c.req.param()
				const updates = c.req.valid("json")

				// 验证ObjectId格式
				if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
					return c.json({ error: "无效的工作区ID" }, 400)
				}

				// 检查用户权限
				const member = await getMemberByWorkspaceAndUser(workspaceId, user._id!.toString())
				if (!member || member.role !== "ADMIN") {
					return c.json({ error: "无权限修改该工作区" }, 403)
				}

				const workspace = await updateWorkspace(workspaceId, updates)
				if (!workspace) {
					return c.json({ error: "工作区不存在" }, 404)
				}

				return c.json({ data: workspace })
			} catch (error) {
				console.error("更新工作区失败:", error)
				return c.json({ error: "更新工作区失败" }, 500)
			}
		}
	)

	// 删除工作区
	.delete("/:workspaceId", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const { workspaceId } = c.req.param()

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
				return c.json({ error: "无效的工作区ID" }, 400)
			}

			// 检查用户权限（只有管理员可以删除）
			const member = await getMemberByWorkspaceAndUser(workspaceId, user._id!.toString())
			if (!member || member.role !== "ADMIN") {
				return c.json({ error: "无权限删除该工作区" }, 403)
			}

			await deleteWorkspace(workspaceId)

			return c.json({ data: { _id: workspaceId } })
		} catch (error) {
			console.error("删除工作区失败:", error)
			return c.json({ error: "删除工作区失败" }, 500)
		}
	})

	// 重置邀请码
	.post("/:workspaceId/reset-invite-code", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const { workspaceId } = c.req.param()

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
				return c.json({ error: "无效的工作区ID" }, 400)
			}

			// 检查用户权限
			const member = await getMemberByWorkspaceAndUser(workspaceId, user._id!.toString())
			if (!member || member.role !== "ADMIN") {
				return c.json({ error: "无权限重置邀请码" }, 403)
			}

			const workspace = await resetWorkspaceInviteCode(workspaceId)
			if (!workspace) {
				return c.json({ error: "工作区不存在" }, 404)
			}

			return c.json({ data: workspace })
		} catch (error) {
			console.error("重置邀请码失败:", error)
			return c.json({ error: "重置邀请码失败" }, 500)
		}
	})

	// 通过邀请码加入工作区
	.post("/join", authSessionMiddleware, localeMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const { code } = await c.req.json()

			if (!code) {
				return c.json({ error: "邀请码不能为空" }, 400)
			}

			const workspace = await joinWorkspaceByInviteCode(code, user._id!.toString())

			return c.json({ data: workspace })
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "加入工作区失败"
			return c.json({ error: errorMessage }, 400)
		}
	})

	// 获取工作区信息（通过邀请码）
	.get("/join/:inviteCode", async (c) => {
		try {
			const { inviteCode } = c.req.param()

			const workspace = await getWorkspaceByInviteCode(inviteCode)
			if (!workspace) {
				return c.json({ error: "无效的邀请码" }, 404)
			}

			return c.json({
				data: {
					name: workspace.name,
					imageUrl: workspace.imageUrl,
				},
			})
		} catch (error) {
			console.error("获取邀请工作区信息失败:", error)
			return c.json({ error: "获取工作区信息失败" }, 500)
		}
	})

	// 获取工作区分析数据
	.get("/:workspaceId/analytics", authSessionMiddleware, async (c) => {
		try {
			const user = c.get("user")
			const { workspaceId } = c.req.param()

			// 验证ObjectId格式
			if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
				return c.json({ error: "无效的工作区ID" }, 400)
			}

			// 检查用户是否为工作区成员
			const member = await getMemberByWorkspaceAndUser(workspaceId, user._id!.toString())
			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const now = new Date()
			const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
			const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
			const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

			const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId)
			const memberObjectId = new mongoose.Types.ObjectId(member._id)

			// 使用Promise.all并行查询提高性能
			const [
				thisMonthTaskCount,
				lastMonthTaskCount,
				thisMonthAssignedTaskCount,
				lastMonthAssignedTaskCount,
				thisMonthCompletedTaskCount,
				lastMonthCompletedTaskCount,
				thisMonthIncompleteTaskCount,
				lastMonthIncompleteTaskCount,
				thisMonthOverdueTaskCount,
				lastMonthOverdueTaskCount,
			] = await Promise.all([
				// 本月任务总数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
				}),
				// 上月任务总数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
				}),
				// 本月分配给当前用户的任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					assigneeId: memberObjectId,
					createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
				}),
				// 上月分配给当前用户的任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					assigneeId: memberObjectId,
					createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
				}),
				// 本月已完成任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: "DONE",
					createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
				}),
				// 上月已完成任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: "DONE",
					createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
				}),
				// 本月未完成任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: { $ne: "DONE" },
					createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
				}),
				// 上月未完成任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: { $ne: "DONE" },
					createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
				}),
				// 本月逾期任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: { $ne: "DONE" },
					dueDate: { $lt: now },
					createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
				}),
				// 上月逾期任务数
				Task.countDocuments({
					workspaceId: workspaceObjectId,
					status: { $ne: "DONE" },
					dueDate: { $lt: now },
					createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
				}),
			])

			return c.json({
				data: {
					taskCount: thisMonthTaskCount,
					taskDifference: thisMonthTaskCount - lastMonthTaskCount,
					assignedTaskCount: thisMonthAssignedTaskCount,
					assignedTaskDifference: thisMonthAssignedTaskCount - lastMonthAssignedTaskCount,
					completedTaskCount: thisMonthCompletedTaskCount,
					completedTaskDifference: thisMonthCompletedTaskCount - lastMonthCompletedTaskCount,
					incompleteTaskCount: thisMonthIncompleteTaskCount,
					incompleteTaskDifference: thisMonthIncompleteTaskCount - lastMonthIncompleteTaskCount,
					overdueTaskCount: thisMonthOverdueTaskCount,
					overdueTaskDifference: thisMonthOverdueTaskCount - lastMonthOverdueTaskCount,
				},
			})
		} catch (error) {
			console.error("获取工作区分析数据失败:", error)
			return c.json({ error: "获取分析数据失败" }, 500)
		}
	})

export default app
